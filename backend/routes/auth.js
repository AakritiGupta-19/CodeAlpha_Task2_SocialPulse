const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to format user object safe for client
function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = (full_name && full_name.trim()) ? full_name.trim() : 'user';

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Username or Email is already registered' });
    }

    // Default neutral avatar placeholder - no auto profile picture
    const defaultAvatar = '/uploads/default-avatar.svg';

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, bio, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(cleanUsername, cleanEmail, password_hash, cleanFullName, '', defaultAvatar);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const counts = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following_count
    `).get(user.id, user.id, user.id);

    res.json({
      user: sanitizeUser(user),
      stats: counts
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error fetching user session' });
  }
});

// GET /api/auth/demo-users (helpful for instant one-click switching during testing)
router.get('/demo-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, full_name, avatar_url, bio FROM users LIMIT 5').all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

module.exports = router;
