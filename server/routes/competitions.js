const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/competitions - List all competitions
router.get('/', async (req, res) => {
  try {
    const { event_id } = req.query;
    let sql = `
      SELECT c.*, e.title as event_title, e.status as event_status
      FROM competitions c
      JOIN events e ON c.event_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      sql += ` AND c.event_id = ?`;
      params.push(event_id);
    }

    sql += ` ORDER BY c.id DESC`;

    const competitions = await dbQuery(sql, params);

    for (const comp of competitions) {
      comp.criteria = await dbQuery(`SELECT * FROM scoring_criteria WHERE competition_id = ?`, [comp.id]);
      comp.participants = await dbQuery(
        `SELECT p.*, u.name as participant_name, u.email as participant_email 
         FROM participants p JOIN users u ON p.user_id = u.id 
         WHERE p.competition_id = ?`,
        [comp.id]
      );
      comp.judges = await dbQuery(
        `SELECT j.*, u.name as judge_name, u.email as judge_email 
         FROM judges j JOIN users u ON j.user_id = u.id 
         WHERE j.competition_id = ?`,
        [comp.id]
      );
    }

    res.json(competitions);
  } catch (err) {
    console.error('Fetch competitions error:', err);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// POST /api/competitions - Create competition with criteria
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, name, category, rules, max_participants, venue, schedule_time, criteria } = req.body;
    if (!event_id || !name) {
      return res.status(400).json({ error: 'Event ID and competition name are required' });
    }

    const result = await dbRun(
      `INSERT INTO competitions (event_id, name, category, rules, max_participants, venue, schedule_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_id, name, category || 'General', rules || '', max_participants || 50, venue || 'TBD', schedule_time || 'TBD']
    );

    const compId = result.lastID;

    // Add criteria
    if (criteria && Array.isArray(criteria) && criteria.length > 0) {
      for (const cr of criteria) {
        await dbRun(
          `INSERT INTO scoring_criteria (competition_id, criteria_name, max_score, weightage) VALUES (?, ?, ?, ?)`,
          [compId, cr.criteria_name, cr.max_score || 10, cr.weightage || 1]
        );
      }
    } else {
      // Default criteria set
      const defaultCriteria = [
        'Creativity & Execution',
        'Technical Skill / Precision',
        'Presentation & Expression',
        'Overall Impact'
      ];
      for (const cName of defaultCriteria) {
        await dbRun(
          `INSERT INTO scoring_criteria (competition_id, criteria_name, max_score, weightage) VALUES (?, ?, ?, ?)`,
          [compId, cName, 10, 1]
        );
      }
    }

    res.status(201).json({ id: compId, message: 'Competition created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// POST /api/competitions/:id/register - Student registration
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const competitionId = req.params.id;
    const userId = req.body.user_id || req.user.id;
    const teamName = req.body.team_name || 'Individual';

    // Check existing registration
    const existing = await dbGet(
      `SELECT * FROM participants WHERE competition_id = ? AND user_id = ?`,
      [competitionId, userId]
    );

    if (existing) {
      return res.status(400).json({ error: 'You are already registered for this competition!' });
    }

    const result = await dbRun(
      `INSERT INTO participants (competition_id, user_id, team_name, status) VALUES (?, ?, ?, ?)`,
      [competitionId, userId, teamName, 'REGISTERED']
    );

    const comp = await dbGet(`SELECT name FROM competitions WHERE id = ?`, [competitionId]);

    // Send notification
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'Registration Confirmed', `You are registered for "${comp ? comp.name : 'Competition'}"`, 'SUCCESS']
    );

    res.status(201).json({ id: result.lastID, message: 'Registration successful!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register for competition' });
  }
});

// POST /api/competitions/:id/assign-judge
router.post('/:id/assign-judge', authenticateToken, async (req, res) => {
  try {
    const { judge_user_id } = req.body;
    const competitionId = req.params.id;

    if (!judge_user_id) return res.status(400).json({ error: 'Judge user ID required' });

    const existing = await dbGet(
      `SELECT * FROM judges WHERE competition_id = ? AND user_id = ?`,
      [competitionId, judge_user_id]
    );
    if (existing) return res.status(400).json({ error: 'Judge is already assigned to this competition' });

    await dbRun(`INSERT INTO judges (competition_id, user_id) VALUES (?, ?)`, [competitionId, judge_user_id]);

    const comp = await dbGet(`SELECT name FROM competitions WHERE id = ?`, [competitionId]);

    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [judge_user_id, 'New Judging Assignment', `You were assigned as judge for "${comp ? comp.name : 'Competition'}"`, 'INFO']
    );

    res.json({ message: 'Judge assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign judge' });
  }
});

module.exports = router;
