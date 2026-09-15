const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbQuery, dbGet, dbRun } = require('../db/database');

const DEMO_ACCOUNTS = [
  { name: 'krupa vennela', email: 'student1@college.edu', role: 'Student', department: 'Computer Science' },
  { name: 'Ananya Roy', email: 'student2@college.edu', role: 'Student', department: 'Electronics' },
  { name: 'Divya Kumar', email: 'student3@college.edu', role: 'Student', department: 'Mechanical' },
  { name: 'afsheen patnam (vice captain)', email: 'organizer1@college.edu', role: 'Organizing Committee', department: 'Information Technology' },
  { name: 'Dr.C.sailusha', email: 'management1@college.edu', role: 'Management', department: 'Campus Administration' }
];

async function ensureDemoAccounts() {
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const account of DEMO_ACCOUNTS) {
    let role = await dbGet('SELECT id FROM roles WHERE name = ?', [account.role]);
    if (!role) {
      const createdRole = await dbRun(
        'INSERT INTO roles (name, description) VALUES (?, ?)',
        [account.role, `${account.role} portal access`]
      );
      role = { id: createdRole.lastID };
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [account.email]);
    if (!existingUser) {
      await dbRun(
        'INSERT INTO users (name, email, password_hash, role_id, department) VALUES (?, ?, ?, ?, ?)',
        [account.name, account.email, passwordHash, role.id, account.department]
      );
    }
  }
}
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    await ensureDemoAccounts();

    const user = await dbGet(
      `SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE lower(u.email) = ?`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id, role_name: user.role_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/users - list all demo users
router.get('/users', async (req, res) => {
  try {
    const users = await dbQuery(
      `SELECT u.id, u.name, u.email, u.role_id, u.department, u.avatar, r.name as role_name 
       FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.role_id, u.id`
    );
    res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT u.id, u.name, u.email, u.role_id, u.department, u.avatar, r.name as role_name 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
