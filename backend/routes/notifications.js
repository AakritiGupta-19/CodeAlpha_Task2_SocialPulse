const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - List user's notifications
router.get('/', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;

    const notifications = db.prepare(`
      SELECT 
        n.id,
        n.type,
        n.post_id,
        n.content,
        n.is_read,
        n.created_at,
        u.id AS actor_id,
        u.username AS actor_username,
        u.full_name AS actor_full_name,
        u.avatar_url AS actor_avatar_url,
        p.image_url AS post_image_url
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      LEFT JOIN posts p ON n.post_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 40
    `).all(currentUserId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) AS count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(currentUserId);

    res.json({
      notifications: notifications.map(n => ({
        ...n,
        is_read: Boolean(n.is_read)
      })),
      unread_count: unreadCount ? unreadCount.count : 0
    });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PUT /api/notifications/read - Mark all as read
router.put('/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read', unread_count: 0 });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
