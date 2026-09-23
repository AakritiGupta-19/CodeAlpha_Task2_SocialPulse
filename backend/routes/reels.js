const express = require('express');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reels - List reels stream
router.get('/', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;

    const reels = db.prepare(`
      SELECT 
        r.id,
        r.video_url,
        r.thumbnail_url,
        r.caption,
        r.audio_title,
        r.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url,
        (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) AS likes_count,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM reel_likes WHERE reel_id = r.id AND user_id = ?) 
          THEN 1 ELSE 0 
        END AS has_liked,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows WHERE following_id = u.id AND follower_id = ?) 
          THEN 1 ELSE 0 
        END AS is_following
      FROM reels r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 30
    `).all(currentUserId, currentUserId, currentUserId, currentUserId);

    res.json({
      reels: reels.map(r => ({
        ...r,
        has_liked: Boolean(r.has_liked),
        is_following: Boolean(r.is_following)
      }))
    });
  } catch (err) {
    console.error('Reels fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve reels' });
  }
});

// POST /api/reels/:id/like - Toggle like on reel
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const reelId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const reel = db.prepare('SELECT id, user_id FROM reels WHERE id = ?').get(reelId);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const existingLike = db.prepare('SELECT id FROM reel_likes WHERE reel_id = ? AND user_id = ?').get(reelId, userId);

    let liked = false;
    if (existingLike) {
      db.prepare('DELETE FROM reel_likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      db.prepare('INSERT INTO reel_likes (user_id, reel_id) VALUES (?, ?)').run(userId, reelId);
      liked = true;

      // Notify author if not self
      if (reel.user_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (user_id, actor_id, type, content)
          VALUES (?, ?, 'like', 'liked your reel')
        `).run(reel.user_id, userId);
      }
    }

    const count = db.prepare('SELECT COUNT(*) AS count FROM reel_likes WHERE reel_id = ?').get(reelId);

    res.json({
      liked,
      likes_count: count.count
    });
  } catch (err) {
    console.error('Reel like error:', err);
    res.status(500).json({ error: 'Failed to toggle like on reel' });
  }
});

// POST /api/reels - Create new reel
router.post('/', requireAuth, (req, res) => {
  try {
    const { video_url, caption, audio_title } = req.body;

    if (!video_url || !video_url.trim()) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO reels (user_id, video_url, caption, audio_title)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      video_url.trim(),
      caption ? caption.trim() : '',
      audio_title ? audio_title.trim() : 'Original Audio'
    );

    const newReel = db.prepare('SELECT * FROM reels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ reel: newReel });
  } catch (err) {
    console.error('Create reel error:', err);
    res.status(500).json({ error: 'Failed to create reel' });
  }
});

module.exports = router;
