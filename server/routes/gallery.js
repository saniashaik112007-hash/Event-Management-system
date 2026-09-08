const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/gallery - Fetch approved public celebration photos
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = `
      SELECT g.*, u.name as uploader_name, u.avatar as uploader_avatar,
             (SELECT COUNT(*) FROM likes l WHERE l.photo_id = g.id) as likes_count
      FROM photo_gallery g
      JOIN users u ON g.user_id = u.id
      WHERE g.status = 'APPROVED'
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ` AND g.category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY g.created_at DESC`;

    const photos = await dbQuery(sql, params);

    for (const photo of photos) {
      photo.comments = await dbQuery(
        `SELECT * FROM comments WHERE photo_id = ? ORDER BY created_at ASC`,
        [photo.id]
      );
    }

    res.json(photos);
  } catch (err) {
    console.error('Fetch gallery error:', err);
    res.status(500).json({ error: 'Failed to fetch photo gallery' });
  }
});

// GET /api/gallery/pending - Fetch pending photos for Organizer/Admin moderation
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const photos = await dbQuery(
      `SELECT g.*, u.name as uploader_name, u.email as uploader_email, u.avatar as uploader_avatar 
       FROM photo_gallery g JOIN users u ON g.user_id = u.id 
       WHERE g.status = 'PENDING' ORDER BY g.id DESC`
    );
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending photo submissions' });
  }
});

// POST /api/gallery/upload - Submit celebration photo memory
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { event_name, category, caption, image_url, event_id } = req.body;
    const userId = req.user.id;

    if (!event_name || !image_url) {
      return res.status(400).json({ error: 'Event name and image URL are required' });
    }

    const result = await dbRun(
      `INSERT INTO photo_gallery (event_id, user_id, event_name, category, caption, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_id || null, userId, event_name, category || 'Cultural Fest', caption || '', image_url, 'PENDING']
    );

    // Notify organizers/admins
    const organizers = await dbQuery(`SELECT id FROM users WHERE role_id IN (2, 3, 4) LIMIT 3`);
    for (const org of organizers) {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [org.id, 'New Celebration Photo Pending Approval', `Student submitted photo for "${event_name}". Requires moderation.`, 'INFO']
      );
    }

    res.status(201).json({ id: result.lastID, message: 'Photo uploaded! Pending approval before becoming public.' });
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// POST /api/gallery/:id/status - Moderator approves or rejects photo
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const photoId = req.params.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await dbRun(`UPDATE photo_gallery SET status = ? WHERE id = ?`, [status, photoId]);

    const photo = await dbGet(`SELECT * FROM photo_gallery WHERE id = ?`, [photoId]);
    if (photo) {
      const msg = status === 'APPROVED' ? 'Your celebration photo memory is now live on the public gallery! 🎉' : 'Your photo submission was not approved.';
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [photo.user_id, `Photo Submission ${status}`, msg, status === 'APPROVED' ? 'SUCCESS' : 'WARNING']
      );
    }

    res.json({ message: `Photo status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update photo status' });
  }
});

// POST /api/gallery/:id/like - Toggle like on photo
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    const existing = await dbGet(`SELECT * FROM likes WHERE photo_id = ? AND user_id = ?`, [photoId, userId]);
    if (existing) {
      await dbRun(`DELETE FROM likes WHERE photo_id = ? AND user_id = ?`, [photoId, userId]);
      res.json({ liked: false });
    } else {
      await dbRun(`INSERT INTO likes (photo_id, user_id) VALUES (?, ?)`, [photoId, userId]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Like toggle failed' });
  }
});

// POST /api/gallery/:id/comment - Post comment on photo
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const photoId = req.params.id;
    const { comment_text } = req.body;
    const userId = req.user.id;

    if (!comment_text || comment_text.trim() === '') {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const user = await dbGet(`SELECT name FROM users WHERE id = ?`, [userId]);

    const result = await dbRun(
      `INSERT INTO comments (photo_id, user_id, user_name, comment_text) VALUES (?, ?, ?, ?)`,
      [photoId, userId, user ? user.name : 'Student', comment_text.trim()]
    );

    res.status(201).json({ id: result.lastID, user_name: user ? user.name : 'Student', comment_text: comment_text.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

module.exports = router;
