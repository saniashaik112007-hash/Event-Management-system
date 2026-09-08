const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'college-event-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Allow x-user-id header for rapid demo role switching without re-authenticating
  const demoUserId = req.headers['x-user-id'];
  if (demoUserId) {
    req.user = { id: parseInt(demoUserId) };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
