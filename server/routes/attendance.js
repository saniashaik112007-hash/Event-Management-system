const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/attendance/event/:eventId - Fetch attendance list for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const sql = `
      SELECT p.id as participant_id, p.team_name, p.registration_date,
             u.id as user_id, u.name as student_name, u.email as student_email, u.department,
             c.name as competition_name,
             att.id as attendance_id, COALESCE(att.status, 'NOT_MARKED') as attendance_status, att.marked_at
      FROM participants p
      JOIN competitions c ON p.competition_id = c.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN attendance att ON p.id = att.participant_id
      WHERE c.event_id = ?
      ORDER BY p.id DESC
    `;

    const records = await dbQuery(sql, [eventId]);
    res.json(records);
  } catch (err) {
    console.error('Fetch attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance list' });
  }
});

// GET /api/attendance/event/:eventId/registrations - All registered students for an event
router.get('/event/:eventId/registrations', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const sql = `
      SELECT 
        p.id as participant_id,
        p.team_name,
        p.status as registration_status,
        p.registration_date,
        u.id as user_id,
        u.name as student_name,
        u.email as student_email,
        u.department,
        u.avatar,
        u.roll_number,
        c.id as competition_id,
        c.name as competition_name,
        c.category as competition_category,
        COALESCE(att.status, 'NOT_MARKED') as attendance_status
      FROM participants p
      JOIN competitions c ON p.competition_id = c.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN attendance att ON p.id = att.participant_id
      WHERE c.event_id = ?
      ORDER BY p.registration_date DESC, u.name ASC
    `;

    const records = await dbQuery(sql, [eventId]);
    res.json(records);
  } catch (err) {
    console.error('Fetch registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registered students' });
  }
});

// POST /api/attendance/mark - Mark student attendance
router.post('/mark', authenticateToken, async (req, res) => {
  try {
    const { event_id, competition_id, participant_id, user_id, status } = req.body;

    if (!event_id || !participant_id || !user_id) {
      return res.status(400).json({ error: 'Event ID, participant ID, and user ID are required' });
    }

    const validStatus = ['PRESENT', 'ABSENT', 'CHECKED_IN'].includes(status) ? status : 'PRESENT';

    const existing = await dbGet(`SELECT id FROM attendance WHERE participant_id = ?`, [participant_id]);

    if (existing) {
      await dbRun(
        `UPDATE attendance SET status = ?, marked_by_user_id = ?, marked_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [validStatus, req.user.id, existing.id]
      );
    } else {
      await dbRun(
        `INSERT INTO attendance (event_id, competition_id, participant_id, user_id, status, marked_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [event_id, competition_id || null, participant_id, user_id, validStatus, req.user.id]
      );
    }

    // Send notification to student
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [user_id, 'Attendance Updated', `Your attendance status for the event has been marked as ${validStatus}.`, 'INFO']
    );

    res.json({ message: `Attendance marked as ${validStatus}` });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

module.exports = router;
