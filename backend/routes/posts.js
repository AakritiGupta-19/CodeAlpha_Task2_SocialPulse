const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'post-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) {
      cb(null, true);
    } else {
      cb(new Error('Only media files (JPEG, PNG, WEBP, GIF, MP4) are allowed'));
    }
  }
});

// GET /api/posts/feed - Retrieve feed with tab support ('for_you' vs 'following')
router.get('/feed', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const tab = req.query.tab || 'for_you';

    let postsQuery = `
      SELECT 
        p.id,
        p.caption,
        p.image_url,
        p.views_count,
        p.music_title,
        p.location,
        p.filter_style,
        p.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) 
          THEN 1 ELSE 0 
        END AS has_liked,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.id AND user_id = ?) 
          THEN 1 ELSE 0 
        END AS has_saved,
        CASE 
          WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM follows WHERE following_id = u.id AND follower_id = ?) 
          THEN 1 ELSE 0 
        END AS is_following
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;

    const params = [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId];

    if (tab === 'following' && currentUserId) {
      postsQuery += ` WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) OR p.user_id = ? `;
      params.push(currentUserId, currentUserId);
    }

    postsQuery += ` ORDER BY p.created_at DESC LIMIT 50`;

    const posts = db.prepare(postsQuery).all(...params);

    // Fetch top 3 latest comments for each post
    const commentsStmt = db.prepare(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.username,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      LIMIT 3
    `);

    const enrichedPosts = posts.map(post => ({
      ...post,
      has_liked: Boolean(post.has_liked),
      has_saved: Boolean(post.has_saved),
      is_following: Boolean(post.is_following),
      recent_comments: commentsStmt.all(post.id)
    }));

    res.json({ posts: enrichedPosts, tab });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Failed to retrieve feed' });
  }
});

// GET /api/posts/saved - Retrieve saved/bookmarked posts for current user
router.get('/saved', requireAuth, (req, res) => {
  try {
    const currentUserId = req.user.id;

    const savedPosts = db.prepare(`
      SELECT 
        p.id,
        p.caption,
        p.image_url,
        p.created_at,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
    `).all(currentUserId);

    res.json({ posts: savedPosts });
  } catch (err) {
    console.error('Saved posts error:', err);
    res.status(500).json({ error: 'Failed to retrieve saved posts' });
  }
});

// POST /api/posts - Create new post
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  try {
    const { caption, imageUrl, music_title, location, filter_style } = req.body;
    let finalImageUrl = '';

    if (req.file) {
      finalImageUrl = '/uploads/' + req.file.filename;
    } else if (imageUrl && imageUrl.trim()) {
      finalImageUrl = imageUrl.trim();
    } else {
      return res.status(400).json({ error: 'An image file or valid image URL is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO posts (user_id, caption, image_url, views_count, music_title, location, filter_style)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id, 
      caption ? caption.trim() : '', 
      finalImageUrl,
      music_title ? music_title.trim() : '',
      location ? location.trim() : '',
      filter_style ? filter_style.trim() : 'normal'
    );
    const post = db.prepare(`
      SELECT 
        p.id,
        p.caption,
        p.image_url,
        p.music_title,
        p.location,
        p.filter_style,
        p.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url,
        0 AS likes_count,
        0 AS comments_count,
        0 AS has_liked,
        0 AS has_saved
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        ...post,
        has_liked: false,
        has_saved: false,
        recent_comments: []
      }
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /api/posts/:id/save - Toggle bookmark/save post
router.post('/:id/save', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = db.prepare('SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?').get(userId, postId);
    let saved = false;

    if (existing) {
      db.prepare('DELETE FROM saved_posts WHERE id = ?').run(existing.id);
      saved = false;
    } else {
      db.prepare('INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)').run(userId, postId);
      saved = true;
    }

    res.json({ saved });
  } catch (err) {
    console.error('Save post error:', err);
    res.status(500).json({ error: 'Failed to toggle save post' });
  }
});

// POST /api/posts/:id/view - Register post view/impression
router.post('/:id/view', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    db.prepare('UPDATE posts SET views_count = views_count + 1 WHERE id = ?').run(postId);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this post' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ message: 'Post deleted successfully', id: postId });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/posts/:id/like - Toggle like on post
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(postId, userId);

    let liked = false;
    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
      liked = true;

      // Create notification if not self
      if (post.user_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (user_id, actor_id, type, post_id, content)
          VALUES (?, ?, 'like', ?, 'liked your post')
        `).run(post.user_id, userId, postId);
      }
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId);

    res.json({
      liked,
      likes_count: count.count
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// GET /api/posts/:id/comments - Get all comments for a post
router.get('/:id/comments', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const comments = db.prepare(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.id AS user_id,
        u.username,
        u.avatar_url,
        u.full_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// POST /api/posts/:id/comments - Add comment to post
router.post('/:id/comments', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { comment_text } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const stmt = db.prepare('INSERT INTO comments (post_id, user_id, comment_text) VALUES (?, ?, ?)');
    const result = stmt.run(postId, req.user.id, comment_text.trim());

    // Create notification if commenter is not author
    if (post.user_id !== req.user.id) {
      db.prepare(`
        INSERT INTO notifications (user_id, actor_id, type, post_id, content)
        VALUES (?, ?, 'comment', ?, ?)
      `).run(post.user_id, req.user.id, postId, comment_text.trim().slice(0, 80));
    }

    const newComment = db.prepare(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.id AS user_id,
        u.username,
        u.avatar_url,
        u.full_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    const count = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(postId);

    res.status(201).json({
      comment: newComment,
      comments_count: count.count
    });
  } catch (err) {
    console.error('Post comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
