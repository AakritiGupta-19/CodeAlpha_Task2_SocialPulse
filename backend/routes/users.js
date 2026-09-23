const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'avatar-' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/users/suggestions - Suggested users to follow
router.get('/suggestions', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;

    let query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.bio,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
      FROM users u
    `;

    let params = [];
    if (currentUserId) {
      query += `
        WHERE u.id != ? 
        AND NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id)
      `;
      params = [currentUserId, currentUserId];
    }
    query += ` ORDER BY followers_count DESC LIMIT 5`;

    const suggestions = db.prepare(query).all(...params);
    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Failed to retrieve suggestions' });
  }
});

// GET /api/users/search - Live search users
router.get('/search', optionalAuth, (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q) {
      return res.json({ users: [] });
    }

    const currentUserId = req.user ? req.user.id : null;
    const searchTerm = `%${q}%`;

    const query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) 
          THEN 1 ELSE 0 
        END AS is_following
      FROM users u
      WHERE u.username LIKE ? OR u.full_name LIKE ?
      LIMIT 10
    `;

    const users = db.prepare(query).all(currentUserId, currentUserId, searchTerm, searchTerm);
    res.json({
      users: users.map(u => ({ ...u, is_following: Boolean(u.is_following) }))
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/users/analytics/overview - Creator analytics
router.get('/analytics/overview', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const stats = db.prepare(`
      SELECT 
        COUNT(p.id) AS total_posts,
        COALESCE(SUM(p.views_count), 0) AS total_views,
        COALESCE((SELECT COUNT(*) FROM likes l JOIN posts p2 ON l.post_id = p2.id WHERE p2.user_id = ?), 0) AS total_likes,
        COALESCE((SELECT COUNT(*) FROM comments c JOIN posts p3 ON c.post_id = p3.id WHERE p3.user_id = ?), 0) AS total_comments,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS total_followers
      FROM posts p
      WHERE p.user_id = ?
    `).get(userId, userId, userId, userId);

    const totalImpressions = Math.max(1, stats.total_views + stats.total_likes * 3);
    const engagementRate = (((stats.total_likes + stats.total_comments) / totalImpressions) * 100).toFixed(1);

    // Top post by likes
    const topPost = db.prepare(`
      SELECT 
        p.id, p.caption, p.image_url, p.views_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY likes_count DESC, views_count DESC
      LIMIT 1
    `).get(userId);

    res.json({
      analytics: {
        total_posts: stats.total_posts,
        total_views: stats.total_views,
        total_likes: stats.total_likes,
        total_comments: stats.total_comments,
        total_followers: stats.total_followers,
        engagement_rate: `${engagementRate}%`,
        top_post: topPost || null
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// GET /api/users/profile/:username - Profile details + 3x3 post grid
router.get('/profile/:username', optionalAuth, (req, res) => {
  try {
    const targetUsername = req.params.username.toLowerCase();
    const user = db.prepare('SELECT id, username, full_name, bio, website, location, avatar_url, is_private, created_at FROM users WHERE username = ?').get(targetUsername);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserId = req.user ? req.user.id : null;

    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following_count
    `).get(user.id, user.id, user.id);

    let isFollowing = false;
    let isSelf = false;

    if (currentUserId) {
      if (currentUserId === user.id) {
        isSelf = true;
      } else {
        const followCheck = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, user.id);
        isFollowing = Boolean(followCheck);
      }
    }

    // Get user's posts for grid display
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.caption,
        p.image_url,
        p.views_count,
        p.created_at,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(user.id);

    res.json({
      user,
      stats,
      isFollowing,
      isSelf,
      posts
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// GET /api/users/:username/followers - List followers
router.get('/:username/followers', optionalAuth, (req, res) => {
  try {
    const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!target) return res.status(404).json({ error: 'User not found' });

    const currentUserId = req.user ? req.user.id : null;

    const followers = db.prepare(`
      SELECT 
        u.id, u.username, u.full_name, u.avatar_url,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id)
          THEN 1 ELSE 0
        END AS is_following
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `).all(currentUserId, currentUserId, target.id);

    res.json({ followers: followers.map(u => ({ ...u, is_following: Boolean(u.is_following) })) });
  } catch (err) {
    console.error('Followers list error:', err);
    res.status(500).json({ error: 'Failed to retrieve followers' });
  }
});

// GET /api/users/:username/following - List following accounts
router.get('/:username/following', optionalAuth, (req, res) => {
  try {
    const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!target) return res.status(404).json({ error: 'User not found' });

    const currentUserId = req.user ? req.user.id : null;

    const following = db.prepare(`
      SELECT 
        u.id, u.username, u.full_name, u.avatar_url,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id)
          THEN 1 ELSE 0
        END AS is_following
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
    `).all(currentUserId, currentUserId, target.id);

    res.json({ following: following.map(u => ({ ...u, is_following: Boolean(u.is_following) })) });
  } catch (err) {
    console.error('Following list error:', err);
    res.status(500).json({ error: 'Failed to retrieve following' });
  }
});

// POST /api/users/:id/follow - Toggle follow/unfollow with notification
router.post('/:id/follow', requireAuth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User does not exist' });
    }

    const existingFollow = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, targetUserId);

    let following = false;
    if (existingFollow) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, targetUserId);
      following = false;
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(currentUserId, targetUserId);
      following = true;

      // Create notification
      db.prepare(`
        INSERT INTO notifications (user_id, actor_id, type, content)
        VALUES (?, ?, 'follow', 'started following you')
      `).run(targetUserId, currentUserId);
    }

    const followerCount = db.prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?').get(targetUserId);

    res.json({
      following,
      followers_count: followerCount.count
    });
  } catch (err) {
    console.error('Follow toggle error:', err);
    res.status(500).json({ error: 'Failed to update follow status' });
  }
});

// PUT /api/users/profile - Update profile details
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { username, full_name, bio, website, location, is_private, avatar_url } = req.body;
    const userId = req.user.id;

    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updatedUsername = currentUser.username;
    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(cleanUsername, userId);
      if (existing) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
      updatedUsername = cleanUsername;
    }

    const updatedFullName = full_name !== undefined ? full_name.trim() : currentUser.full_name;
    const updatedBio = bio !== undefined ? bio.trim() : currentUser.bio;
    const updatedWebsite = website !== undefined ? website.trim() : (currentUser.website || '');
    const updatedLocation = location !== undefined ? location.trim() : (currentUser.location || '');
    const updatedPrivacy = is_private !== undefined ? (is_private ? 1 : 0) : currentUser.is_private;
    const updatedAvatar = avatar_url !== undefined ? avatar_url.trim() : currentUser.avatar_url;

    db.prepare(`
      UPDATE users 
      SET username = ?, full_name = ?, bio = ?, website = ?, location = ?, is_private = ?, avatar_url = ?
      WHERE id = ?
    `).run(updatedUsername, updatedFullName, updatedBio, updatedWebsite, updatedLocation, updatedPrivacy, updatedAvatar, userId);

    const updatedUser = db.prepare('SELECT id, username, email, full_name, bio, website, location, avatar_url, is_private, created_at FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/avatar - Upload avatar image
router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar image uploaded' });
    }

    const avatarUrl = '/uploads/' + req.file.filename;
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);

    res.json({
      message: 'Avatar updated successfully',
      avatar_url: avatarUrl
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// GET /api/users/activity/likes - All posts and reels liked by user
router.get('/activity/likes', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const likedPosts = db.prepare(`
      SELECT 
        p.id, p.caption, p.image_url, p.created_at,
        u.username AS author_username, u.avatar_url AS author_avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        'post' AS type
      FROM likes l
      JOIN posts p ON l.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `).all(userId);

    const likedReels = db.prepare(`
      SELECT 
        r.id, r.caption, r.video_url, r.thumbnail_url, r.created_at,
        u.username AS author_username, u.avatar_url AS author_avatar_url,
        (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) AS likes_count,
        'reel' AS type
      FROM reel_likes rl
      JOIN reels r ON rl.reel_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE rl.user_id = ?
      ORDER BY rl.created_at DESC
    `).all(userId);

    res.json({ liked_posts: likedPosts, liked_reels: likedReels });
  } catch (err) {
    console.error('Activity likes error:', err);
    res.status(500).json({ error: 'Failed to retrieve liked content' });
  }
});

// GET /api/users/activity/comments - All comments written by user
router.get('/activity/comments', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const comments = db.prepare(`
      SELECT 
        c.id, c.post_id, c.comment_text, c.created_at,
        p.image_url AS post_image_url, p.caption AS post_caption
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);

    res.json({ comments });
  } catch (err) {
    console.error('Activity comments error:', err);
    res.status(500).json({ error: 'Failed to retrieve comments activity' });
  }
});

// GET /api/users/activity/deleted - Recently deleted posts
router.get('/activity/deleted', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS deleted_posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          caption TEXT DEFAULT '',
          image_url TEXT NOT NULL,
          deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();
    } catch (e) {}

    const deletedPosts = db.prepare(`
      SELECT id, user_id, caption, image_url, deleted_at
      FROM deleted_posts
      WHERE user_id = ?
      ORDER BY deleted_at DESC
    `).all(userId);

    res.json({ deleted_posts: deletedPosts });
  } catch (err) {
    console.error('Activity deleted error:', err);
    res.status(500).json({ error: 'Failed to retrieve deleted content' });
  }
});

// POST /api/users/activity/restore/:id - Restore deleted post
router.post('/activity/restore/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const deleted = db.prepare('SELECT * FROM deleted_posts WHERE id = ? AND user_id = ?').get(postId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Item not found in recently deleted' });
    }

    db.prepare(`
      INSERT INTO posts (user_id, caption, image_url, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(deleted.user_id, deleted.caption, deleted.image_url);

    db.prepare('DELETE FROM deleted_posts WHERE id = ?').run(postId);

    res.json({ message: 'Post restored successfully' });
  } catch (err) {
    console.error('Restore post error:', err);
    res.status(500).json({ error: 'Failed to restore post' });
  }
});

// DELETE /api/users/activity/deleted/:id - Permanently delete
router.delete('/activity/deleted/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    db.prepare('DELETE FROM deleted_posts WHERE id = ? AND user_id = ?').run(postId, userId);
    res.json({ message: 'Permanently deleted' });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ error: 'Failed to permanently delete item' });
  }
});

// GET /api/users/settings - Get settings
router.get('/settings', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT is_private FROM users WHERE id = ?').get(req.user.id);
    res.json({
      settings: {
        is_private: Boolean(user ? user.is_private : 0),
        hide_likes: false,
        pause_notifications: false,
        close_friends_count: 2
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// PUT /api/users/settings - Update settings
router.put('/settings', requireAuth, (req, res) => {
  try {
    const { is_private } = req.body;
    if (is_private !== undefined) {
      db.prepare('UPDATE users SET is_private = ? WHERE id = ?').run(is_private ? 1 : 0, req.user.id);
    }
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
