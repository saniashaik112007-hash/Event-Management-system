const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const approvalRoutes = require('./routes/approvals');
const taskRoutes = require('./routes/tasks');
const competitionRoutes = require('./routes/competitions');
const judgingRoutes = require('./routes/judging');
const certificateRoutes = require('./routes/certificates');
const galleryRoutes = require('./routes/gallery');
const notificationRoutes = require('./routes/notifications');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length === 0 ? true : allowedOrigins,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/judging', judgingRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'College Event Management API', timestamp: new Date() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Event Management Server running on port ${PORT}`);
    console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
