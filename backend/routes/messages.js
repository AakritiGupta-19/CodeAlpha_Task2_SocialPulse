const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations - List active conversation threads
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all distinct conversational partners
    const partnersQuery = `
      SELECT DISTINCT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `;

    const partners = db.prepare(partnersQuery).all(currentUserId, currentUserId, currentUserId);

    const conversations = partners.map(p => {
      const partner = db.prepare('SELECT id, username, full_name, avatar_url FROM users WHERE id = ?').get(p.partner_id);
      if (!partner) return null;

      // Get last message in conversation
      const lastMessage = db.prepare(`
        SELECT id, sender_id, message_text, created_at, is_read
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT 1
      `).get(currentUserId, p.partner_id, p.partner_id, currentUserId);

      // Unread messages count sent to current user
      const unread = db.prepare(`
        SELECT COUNT(*) AS count
        FROM messages
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).get(p.partner_id, currentUserId);

      return {
        partner,
        lastMessage,
        unread_count: unread ? unread.count : 0
      };
    }).filter(Boolean);

    // Sort by last message time
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });

    res.json({ conversations });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// GET /api/messages/:userId - Chat history with target user
router.get('/:userId', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    const targetUser = db.prepare('SELECT id, username, full_name, avatar_url FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark messages from targetUser as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(targetUserId, currentUserId);

    const messages = db.prepare(`
      SELECT 
        id, sender_id, receiver_id, message_text, is_read, created_at
      FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(currentUserId, targetUserId, targetUserId, currentUserId);

    res.json({
      targetUser,
      messages
    });
  } catch (err) {
    console.error('Messages history error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// POST /api/messages/:userId - Send a direct message
router.post('/:userId', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);
    const { message_text } = req.body;

    if (!message_text || !message_text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, message_text)
      VALUES (?, ?, ?)
    `);

    const result = insertStmt.run(currentUserId, targetUserId, message_text.trim());

    // Create notification for recipient
    db.prepare(`
      INSERT INTO notifications (user_id, actor_id, type, content)
      VALUES (?, ?, 'message', ?)
    `).run(targetUserId, currentUserId, message_text.trim().slice(0, 80));

    const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: newMessage
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
