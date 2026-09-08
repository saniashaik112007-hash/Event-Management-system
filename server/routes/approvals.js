const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/approvals/pending - Get pending proposals for Management review
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT a.*, e.title as event_title, e.description as event_description, 
             e.start_date, e.banner_url, e.budget, e.required_resources, e.status as event_status,
             e.modification_feedback, c.name as category_name, u.name as organizer_name, u.email as organizer_email
      FROM approvals a
      JOIN events e ON a.event_id = e.id
      JOIN event_categories c ON e.category_id = c.id
      JOIN users u ON e.created_by_user_id = u.id
      WHERE a.status = 'PENDING' OR e.status = 'PENDING'
      ORDER BY a.id DESC
    `;

    const approvals = await dbQuery(sql);

    for (const app of approvals) {
      app.documents = await dbQuery(
        `SELECT * FROM documents WHERE event_id = ? ORDER BY uploaded_at DESC`,
        [app.event_id]
      );
    }

    res.json(approvals);
  } catch (err) {
    console.error('Fetch pending approvals error:', err);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// POST /api/approvals/:id - Management decision (APPROVED / REJECTED / MODIFICATION_REQUESTED)
router.post('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, comments } = req.body;
    const approvalId = req.params.id;

    if (!['APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const approval = await dbGet(`SELECT * FROM approvals WHERE id = ?`, [approvalId]);
    if (!approval) return res.status(404).json({ error: 'Approval record not found' });

    const event = await dbGet(`SELECT * FROM events WHERE id = ?`, [approval.event_id]);
    if (!event) return res.status(404).json({ error: 'Associated event not found' });

    // Update approval record
    await dbRun(
      `UPDATE approvals SET status = ?, approver_user_id = ?, comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, req.user.id, comments || '', approvalId]
    );

    if (status === 'APPROVED') {
      // Approve and Publish Event!
      await dbRun(
        `UPDATE events SET status = 'APPROVED', published = 1 WHERE id = ?`,
        [event.id]
      );
      await dbRun(
        `UPDATE event_timeline SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE event_id = ? AND stage_order <= 2`,
        [event.id]
      );
      await dbRun(
        `UPDATE event_timeline SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE event_id = ? AND stage_order = 3`,
        [event.id]
      );

      // Notify Organizing Committee
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [event.created_by_user_id, 'Proposal Approved & Published! 🎉', `Management approved your proposal "${event.title}". Event is now published for student registrations!`, 'SUCCESS']
      );
    } else if (status === 'MODIFICATION_REQUESTED') {
      // Save feedback notes and set status to MODIFICATION_REQUESTED
      await dbRun(
        `UPDATE events SET status = 'MODIFICATION_REQUESTED', modification_feedback = ? WHERE id = ?`,
        [comments || 'Please revise proposal details or budget.', event.id]
      );

      // Notify Organizing Committee
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [event.created_by_user_id, 'Proposal Modification Requested ⚠️', `Management requested changes on "${event.title}". Remarks: ${comments}`, 'WARNING']
      );
    } else if (status === 'REJECTED') {
      await dbRun(
        `UPDATE events SET status = 'REJECTED', published = 0 WHERE id = ?`,
        [event.id]
      );

      // Notify Organizing Committee
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [event.created_by_user_id, 'Proposal Rejected ❌', `Management rejected proposal "${event.title}". Remarks: ${comments}`, 'ERROR']
      );
    }

    res.json({ message: `Proposal updated to ${status}` });
  } catch (err) {
    console.error('Submit approval error:', err);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

module.exports = router;
