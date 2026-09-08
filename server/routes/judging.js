const express = require('express');
const router = express.Router();
const { dbQuery, dbGet, dbRun } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/judging/assigned - Get competitions assigned to judge
router.get('/assigned', authenticateToken, async (req, res) => {
  try {
    const judgeUserId = req.query.user_id || req.user.id;

    const sql = `
      SELECT c.*, e.title as event_title, e.venue as event_venue
      FROM competitions c
      JOIN judges j ON c.id = j.competition_id
      JOIN events e ON c.event_id = e.id
      WHERE j.user_id = ?
    `;

    const comps = await dbQuery(sql, [judgeUserId]);

    for (const comp of comps) {
      comp.criteria = await dbQuery(`SELECT * FROM scoring_criteria WHERE competition_id = ?`, [comp.id]);
      comp.participants = await dbQuery(
        `SELECT p.*, u.name as participant_name, u.email as participant_email 
         FROM participants p JOIN users u ON p.user_id = u.id 
         WHERE p.competition_id = ?`,
        [comp.id]
      );
      // Fetch submitted scores by this judge
      comp.submitted_scores = await dbQuery(
        `SELECT * FROM scores WHERE competition_id = ? AND judge_user_id = ?`,
        [comp.id, judgeUserId]
      );
    }

    res.json(comps);
  } catch (err) {
    console.error('Fetch assigned competitions error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned competitions' });
  }
});

// POST /api/judging/scores - Judge submits score matrix for participants
router.post('/scores', authenticateToken, async (req, res) => {
  try {
    const { competition_id, scores_list } = req.body;
    const judgeUserId = req.body.judge_user_id || req.user.id;

    if (!competition_id || !scores_list || !Array.isArray(scores_list)) {
      return res.status(400).json({ error: 'Competition ID and score entries array required' });
    }

    for (const entry of scores_list) {
      const { participant_id, criteria_id, score_value, comments } = entry;

      // Upsert score
      const existing = await dbGet(
        `SELECT id FROM scores WHERE competition_id = ? AND participant_id = ? AND judge_user_id = ? AND criteria_id = ?`,
        [competition_id, participant_id, judgeUserId, criteria_id]
      );

      if (existing) {
        await dbRun(
          `UPDATE scores SET score_value = ?, comments = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [score_value, comments || '', existing.id]
        );
      } else {
        await dbRun(
          `INSERT INTO scores (competition_id, participant_id, judge_user_id, criteria_id, score_value, comments)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [competition_id, participant_id, judgeUserId, criteria_id, score_value, comments || '']
        );
      }
    }

    // Auto calculate ranks and store in results (Status = DRAFT / LOCKED)
    const participants = await dbQuery(
      `SELECT DISTINCT participant_id FROM scores WHERE competition_id = ?`,
      [competition_id]
    );

    const participantScores = [];
    for (const p of participants) {
      const totalObj = await dbGet(
        `SELECT SUM(score_value) as total FROM scores WHERE competition_id = ? AND participant_id = ?`,
        [competition_id, p.participant_id]
      );
      participantScores.push({
        participant_id: p.participant_id,
        total: totalObj ? totalObj.total : 0
      });
    }

    // Sort descending by total score
    participantScores.sort((a, b) => b.total - a.total);

    // Save rank results
    for (let index = 0; index < participantScores.length; index++) {
      const item = participantScores[index];
      const rank = index + 1;

      const existingRes = await dbGet(
        `SELECT id FROM results WHERE competition_id = ? AND participant_id = ?`,
        [competition_id, item.participant_id]
      );

      if (existingRes) {
        await dbRun(
          `UPDATE results SET total_score = ?, rank = ?, status = 'LOCKED' WHERE id = ?`,
          [item.total, rank, existingRes.id]
        );
      } else {
        await dbRun(
          `INSERT INTO results (competition_id, participant_id, total_score, rank, status) VALUES (?, ?, ?, ?, ?)`,
          [competition_id, item.participant_id, item.total, rank, 'LOCKED']
        );
      }
    }

    // Notify Faculty & Admin that results are locked & pending verification
    const facultyUser = await dbGet(`SELECT id FROM users WHERE role_id = 3 LIMIT 1`);
    if (facultyUser) {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [facultyUser.id, 'Judge Scorecard Submitted', `Scores submitted and results locked for Competition #${competition_id}. Pending verification.`, 'INFO']
      );
    }

    res.json({ message: 'Scores submitted & results calculated successfully!' });
  } catch (err) {
    console.error('Submit scores error:', err);
    res.status(500).json({ error: 'Failed to submit scores' });
  }
});

// GET /api/judging/results/:competitionId - View results leaderboard
router.get('/results/:competitionId', async (req, res) => {
  try {
    const results = await dbQuery(
      `SELECT r.*, p.team_name, u.name as participant_name, u.email as participant_email, u.department
       FROM results r
       JOIN participants p ON r.participant_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE r.competition_id = ?
       ORDER BY r.rank ASC`,
      [req.params.competitionId]
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// POST /api/judging/verify/:competitionId - Faculty/Admin verification
router.post('/verify/:competitionId', authenticateToken, async (req, res) => {
  try {
    const compId = req.params.competitionId;

    await dbRun(
      `UPDATE results SET status = 'VERIFIED', verified_by_user_id = ? WHERE competition_id = ?`,
      [req.user.id, compId]
    );

    res.json({ message: 'Results verified successfully by Faculty/Admin' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify results' });
  }
});

// POST /api/judging/publish/:competitionId - Official Winner Declaration & Auto Certificates
router.post('/publish/:competitionId', authenticateToken, async (req, res) => {
  try {
    const compId = req.params.competitionId;

    await dbRun(`UPDATE results SET status = 'PUBLISHED' WHERE competition_id = ?`, [compId]);

    const comp = await dbGet(`SELECT * FROM competitions WHERE id = ?`, [compId]);
    const results = await dbQuery(`SELECT * FROM results WHERE competition_id = ? ORDER BY rank ASC`, [compId]);

    // Issue certificates for all participants & winners
    for (const resItem of results) {
      let certType = 'PARTICIPATION';
      if (resItem.rank === 1) certType = 'WINNER_1ST';
      else if (resItem.rank === 2) certType = 'WINNER_2ND';
      else if (resItem.rank === 3) certType = 'WINNER_3RD';

      const certCode = `CERT-${comp ? comp.name.substring(0, 4).toUpperCase() : 'EVENT'}-2026-${resItem.rank}-${resItem.participant_id}`;

      // Insert certificate if not existing
      const existingCert = await dbGet(
        `SELECT id FROM certificates WHERE event_id = ? AND participant_id = ?`,
        [comp.event_id, resItem.participant_id]
      );

      if (!existingCert) {
        await dbRun(
          `INSERT INTO certificates (event_id, participant_id, certificate_code, issue_date, type, pdf_url)
           VALUES (?, ?, ?, DATE('now'), ?, ?)`,
          [comp.event_id, resItem.participant_id, certCode, certType, `/certificates/view/${certCode}`]
        );
      }

      // Notify participant
      const part = await dbGet(`SELECT user_id FROM participants WHERE id = ?`, [resItem.participant_id]);
      if (part) {
        await dbRun(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
          [
            part.user_id,
            `Official Results Published! 🎉`,
            `Results published for ${comp ? comp.name : 'Competition'}. You secured Rank #${resItem.rank}! Download your certificate now.`,
            'SUCCESS'
          ]
        );
      }
    }

    // Advance event status to "Winners Published"
    if (comp) {
      await dbRun(`UPDATE events SET status = 'Winners Published' WHERE id = ?`, [comp.event_id]);
      await dbRun(
        `UPDATE event_timeline SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE event_id = ? AND stage_order <= 9`,
        [comp.event_id]
      );
    }

    res.json({ message: 'Winners officially published & certificates auto-generated!' });
  } catch (err) {
    console.error('Publish results error:', err);
    res.status(500).json({ error: 'Failed to publish results' });
  }
});

module.exports = router;
