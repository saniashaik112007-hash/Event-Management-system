const express = require('express');
const router = express.Router();
const { dbQuery, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications/:userId - Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await dbQuery(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.params.userId]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await dbRun(`UPDATE notifications SET read_status = 1 WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
