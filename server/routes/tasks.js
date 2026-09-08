const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/tasks - Get tasks by event_id or assigned user
router.get('/', async (req, res) => {
  try {
    const { event_id, user_id } = req.query;
    let sql = `
      SELECT t.*, e.title as event_title, u.name as assignee_name, u.avatar as assignee_avatar
      FROM tasks t
      JOIN events e ON t.event_id = e.id
      JOIN users u ON t.assigned_to_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      sql += ` AND t.event_id = ?`;
      params.push(event_id);
    }
    if (user_id) {
      sql += ` AND t.assigned_to_user_id = ?`;
      params.push(user_id);
    }

    sql += ` ORDER BY t.id DESC`;

    const tasks = await dbQuery(sql, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, title, description, assigned_to_user_id, deadline, priority } = req.body;
    if (!event_id || !title || !assigned_to_user_id) {
      return res.status(400).json({ error: 'Event ID, title, and assigned user are required' });
    }

    const result = await dbRun(
      `INSERT INTO tasks (event_id, title, description, assigned_to_user_id, deadline, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_id, title, description || '', assigned_to_user_id, deadline || '', priority || 'MEDIUM', 'TODO']
    );

    // Notify assigned user
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [assigned_to_user_id, 'New Task Assigned', `You were assigned task: "${title}". Deadline: ${deadline || 'TBD'}`, 'INFO']
    );

    res.status(201).json({ id: result.lastID, message: 'Task created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task status / priority
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, title, description } = req.body;
    const taskId = req.params.id;

    const task = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await dbRun(
      `UPDATE tasks SET 
       status = COALESCE(?, status), 
       priority = COALESCE(?, priority),
       title = COALESCE(?, title),
       description = COALESCE(?, description)
       WHERE id = ?`,
      [status, priority, title, description, taskId]
    );

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun(`DELETE FROM tasks WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
