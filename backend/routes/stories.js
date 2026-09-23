const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'story-' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

// GET /api/stories - Retrieve all active stories grouped by user
router.get('/', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;

    // Retrieve stories from last 48 hours for rich demo visibility
    const stories = db.prepare(`
      SELECT 
        s.id,
        s.media_url,
        s.text_overlay,
        s.font_style,
        s.text_color,
        s.font_size,
        s.filter_style,
        s.music_title,
        s.sticker_type,
        s.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url
      FROM stories s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all();

    // Group stories by user
    const groupedMap = new Map();
    stories.forEach(s => {
      if (!groupedMap.has(s.author_id)) {
        groupedMap.set(s.author_id, {
          user_id: s.author_id,
          username: s.author_username,
          full_name: s.author_full_name,
          avatar_url: s.author_avatar_url,
          is_self: currentUserId === s.author_id,
          stories: []
        });
      }
      groupedMap.get(s.author_id).stories.push({
        id: s.id,
        media_url: s.media_url,
        text_overlay: s.text_overlay,
        font_style: s.font_style,
        text_color: s.text_color,
        font_size: s.font_size,
        filter_style: s.filter_style,
        music_title: s.music_title,
        sticker_type: s.sticker_type,
        created_at: s.created_at
      });
    });

    // Normalize flat list for story tray display
    const flatStories = stories.map(s => ({
      id: s.id,
      user_id: s.author_id,
      username: s.author_username,
      full_name: s.author_full_name,
      avatar_url: s.author_avatar_url,
      media_url: s.media_url,
      text_overlay: s.text_overlay,
      font_style: s.font_style,
      text_color: s.text_color,
      font_size: s.font_size,
      filter_style: s.filter_style,
      music_title: s.music_title,
      sticker_type: s.sticker_type,
      created_at: s.created_at
    }));

    res.json({ 
      stories: flatStories,
      storyGroups: Array.from(groupedMap.values()) 
    });
  } catch (err) {
    console.error('Stories fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve stories' });
  }
});

// POST /api/stories - Create new story with custom text, filter, music, sticker
router.post('/', requireAuth, upload.single('media'), (req, res) => {
  try {
    const { 
      mediaUrl, 
      text_overlay, 
      font_style, 
      text_color, 
      font_size, 
      filter_style, 
      music_title, 
      sticker_type 
    } = req.body;

    let finalMediaUrl = '';
    if (req.file) {
      finalMediaUrl = '/uploads/' + req.file.filename;
    } else if (mediaUrl && mediaUrl.trim()) {
      finalMediaUrl = mediaUrl.trim();
    } else {
      return res.status(400).json({ error: 'An image file or valid media URL is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO stories (
        user_id, media_url, text_overlay, font_style, text_color, font_size, filter_style, music_title, sticker_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      finalMediaUrl,
      text_overlay ? text_overlay.trim() : '',
      font_style || 'modern',
      text_color || '#ffffff',
      parseInt(font_size, 10) || 24,
      filter_style || 'normal',
      music_title ? music_title.trim() : '',
      sticker_type ? sticker_type.trim() : ''
    );

    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Story published successfully! ✨',
      story
    });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ error: 'Failed to publish story' });
  }
});

module.exports = router;
