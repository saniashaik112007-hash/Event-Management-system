const express = require('express');
const router = express.Router();
const { dbQuery, dbGet } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/certificates/user/:userId - Get user's earned certificates
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const sql = `
      SELECT cert.*, e.title as event_title, e.start_date as event_date, 
             c.name as competition_name, u.name as student_name, u.department
      FROM certificates cert
      JOIN events e ON cert.event_id = e.id
      JOIN participants p ON cert.participant_id = p.id
      JOIN competitions c ON p.competition_id = c.id
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY cert.id DESC
    `;

    const certs = await dbQuery(sql, [userId]);
    res.json(certs);
  } catch (err) {
    console.error('Fetch certificates error:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// GET /api/certificates/verify/:code - Verify public certificate
router.get('/verify/:code', async (req, res) => {
  try {
    const certCode = req.params.code;
    const cert = await dbGet(
      `SELECT cert.*, e.title as event_title, e.start_date as event_date, 
              c.name as competition_name, u.name as student_name, u.department
       FROM certificates cert
       JOIN events e ON cert.event_id = e.id
       JOIN participants p ON cert.participant_id = p.id
       JOIN competitions c ON p.competition_id = c.id
       JOIN users u ON p.user_id = u.id
       WHERE cert.certificate_code = ?`,
      [certCode]
    );

    if (!cert) return res.status(404).json({ valid: false, error: 'Certificate code invalid or not found' });
    res.json({ valid: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
