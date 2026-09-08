const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const STAGES = [
  'Proposal',
  'Approval Workflow',
  'Team Formation',
  'Planning & Docs',
  'Registration Open',
  'Event Day',
  'Judging',
  'Result Verification',
  'Winners Published',
  'Certificates Issued',
  'Final Report',
  'Archived'
];

// GET /api/events - List events (Filtered for students vs committee/management)
router.get('/', async (req, res) => {
  try {
    const { category_id, status, role_name, only_published } = req.query;

    let sql = `
      SELECT e.*, c.name as category_name, c.icon as category_icon, u.name as creator_name 
      FROM events e 
      JOIN event_categories c ON e.category_id = c.id
      JOIN users u ON e.created_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // If query is for students or explicitly requested only published events:
    if (only_published === 'true' || role_name === 'Student') {
      sql += ` AND (e.published = 1 OR e.status = 'APPROVED' OR e.status = 'Registration Open' OR e.status = 'Winners Published')`;
    }

    if (category_id) {
      sql += ` AND e.category_id = ?`;
      params.push(category_id);
    }
    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY e.id DESC`;

    const events = await dbQuery(sql, params);

    for (const event of events) {
      const timeline = await dbQuery(
        `SELECT * FROM event_timeline WHERE event_id = ? ORDER BY stage_order ASC`,
        [event.id]
      );
      event.timeline = timeline;

      const regCount = await dbGet(
        `SELECT COUNT(*) as count FROM participants p 
         JOIN competitions comp ON p.competition_id = comp.id 
         WHERE comp.event_id = ?`,
        [event.id]
      );
      event.participant_count = regCount ? regCount.count : 0;
    }

    res.json(events);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await dbQuery(`SELECT * FROM event_categories ORDER BY name ASC`);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await dbGet(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, u.name as creator_name, u.email as creator_email
       FROM events e 
       JOIN event_categories c ON e.category_id = c.id
       JOIN users u ON e.created_by_user_id = u.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.timeline = await dbQuery(
      `SELECT t.*, u.name as updated_by_name 
       FROM event_timeline t 
       LEFT JOIN users u ON t.updated_by_user_id = u.id 
       WHERE t.event_id = ? ORDER BY t.stage_order ASC`,
      [event.id]
    );

    event.approvals = await dbQuery(
      `SELECT a.*, u.name as approver_name 
       FROM approvals a 
       LEFT JOIN users u ON a.approver_user_id = u.id 
       WHERE a.event_id = ? ORDER BY a.id ASC`,
      [event.id]
    );

    event.documents = await dbQuery(
      `SELECT d.*, u.name as uploader_name 
       FROM documents d 
       JOIN users u ON d.uploaded_by_user_id = u.id 
       WHERE d.event_id = ? ORDER BY d.uploaded_at DESC`,
      [event.id]
    );

    event.team = await dbQuery(
      `SELECT tm.*, u.name as member_name, u.email as member_email, u.avatar as member_avatar 
       FROM teams tm 
       JOIN users u ON tm.member_user_id = u.id 
       WHERE tm.event_id = ?`,
      [event.id]
    );

    event.tasks = await dbQuery(
      `SELECT tk.*, u.name as assignee_name 
       FROM tasks tk 
       LEFT JOIN users u ON tk.assigned_to_user_id = u.id 
       WHERE tk.event_id = ? ORDER BY tk.id DESC`,
      [event.id]
    );

    event.competitions = await dbQuery(
      `SELECT * FROM competitions WHERE event_id = ?`,
      [event.id]
    );

    res.json(event);
  } catch (err) {
    console.error('Fetch event detail error:', err);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// POST /api/events - Propose new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, category_id, description, venue, start_date, end_date, registration_deadline, banner_url, budget, required_resources, document_title, document_url } = req.body;

    if (!title || !category_id || !start_date) {
      return res.status(400).json({ error: 'Title, category, and start date are required' });
    }

    const defaultBanner = banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800';

    const result = await dbRun(
      `INSERT INTO events (title, category_id, description, venue, start_date, end_date, registration_deadline, banner_url, status, published, budget, required_resources, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category_id,
        description || '',
        venue || 'Main Auditorium',
        start_date,
        end_date || start_date,
        registration_deadline || start_date,
        defaultBanner,
        'PENDING',
        0, // Published = 0 until Management approves!
        budget || 0,
        required_resources || '',
        req.user.id
      ]
    );

    const eventId = result.lastID;

    // Attach proposal document if provided
    if (document_title && document_url) {
      await dbRun(
        `INSERT INTO documents (event_id, title, doc_type, file_url, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)`,
        [eventId, document_title, 'PROPOSAL', document_url, req.user.id]
      );
    }

    // 12-stage timeline entries
    for (let i = 0; i < STAGES.length; i++) {
      const status = i === 0 ? 'IN_PROGRESS' : 'PENDING';
      await dbRun(
        `INSERT INTO event_timeline (event_id, stage_name, stage_order, status, updated_by_user_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, STAGES[i], i + 1, status, req.user.id, `Stage ${i + 1}: ${STAGES[i]}`]
      );
    }

    // Approval record for Management
    await dbRun(
      `INSERT INTO approvals (event_id, approver_role, status, comments) VALUES (?, ?, ?, ?)`,
      [eventId, 'Management', 'PENDING', 'Awaiting Management Review']
    );

    // Notify Management
    const mgmtUsers = await dbQuery(`SELECT id FROM users WHERE role_id = 3`);
    for (const m of mgmtUsers) {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [m.id, 'New Event Proposal Submitted', `Proposal "${title}" requires your Management review and approval.`, 'INFO']
      );
    }

    res.status(201).json({ id: eventId, message: 'Event proposal created and submitted to Management!' });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event proposal' });
  }
});

// PUT /api/events/:id/resubmit - Organizing Committee resubmits modified proposal
router.put('/:id/resubmit', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, description, venue, start_date, budget, required_resources, document_title, document_url } = req.body;

    const event = await dbGet(`SELECT * FROM events WHERE id = ?`, [eventId]);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Update event record and reset status to PENDING
    await dbRun(
      `UPDATE events SET 
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       venue = COALESCE(?, venue),
       start_date = COALESCE(?, start_date),
       budget = COALESCE(?, budget),
       required_resources = COALESCE(?, required_resources),
       status = 'PENDING',
       resubmitted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, venue, start_date, budget, required_resources, eventId]
    );

    // Upload new document if provided
    if (document_title && document_url) {
      await dbRun(
        `INSERT INTO documents (event_id, title, doc_type, file_url, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)`,
        [eventId, document_title, 'REVISED_PROPOSAL', document_url, req.user.id]
      );
    }

    // Reset approval record to PENDING
    await dbRun(
      `UPDATE approvals SET status = 'PENDING', comments = 'Resubmitted by Organizing Committee' WHERE event_id = ?`,
      [eventId]
    );

    // Notify Management
    const mgmtUsers = await dbQuery(`SELECT id FROM users WHERE role_id = 3`);
    for (const m of mgmtUsers) {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [m.id, 'Resubmitted Event Proposal', `Modified proposal "${title || event.title}" resubmitted for Management review.`, 'INFO']
      );
    }

    res.json({ message: 'Proposal resubmitted to Management for review!' });
  } catch (err) {
    console.error('Resubmit proposal error:', err);
    res.status(500).json({ error: 'Failed to resubmit proposal' });
  }
});

// DELETE /api/events/:id - Management delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun(`DELETE FROM events WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
