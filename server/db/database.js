const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'events.db');
const db = new sqlite3.Database(dbPath);

// Promisified helper functions for SQLite
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Initialize schema
const initDB = async () => {
  db.serialize(async () => {
    // Roles
    await dbRun(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )`);

    // Users
    await dbRun(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      department TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )`);

    // Event Categories
    await dbRun(`CREATE TABLE IF NOT EXISTS event_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      icon TEXT,
      description TEXT
    )`);

    // Events (with budget, resources, modification feedback, published status)
    await dbRun(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      venue TEXT,
      start_date TEXT,
      end_date TEXT,
      registration_deadline TEXT,
      banner_url TEXT,
      status TEXT DEFAULT 'PROPOSAL',
      published INTEGER DEFAULT 0,
      budget REAL DEFAULT 0,
      required_resources TEXT,
      modification_feedback TEXT,
      resubmitted_at DATETIME,
      created_by_user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES event_categories(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    )`);

    // Event Timeline
    await dbRun(`CREATE TABLE IF NOT EXISTS event_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      stage_order INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      updated_by_user_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`);

    // Approvals Workflow
    await dbRun(`CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      approver_role TEXT NOT NULL,
      approver_user_id INTEGER,
      status TEXT DEFAULT 'PENDING',
      comments TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`);

    // Documents Management
    await dbRun(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      uploaded_by_user_id INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`);

    // Teams
    await dbRun(`CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      member_user_id INTEGER NOT NULL,
      role_title TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (member_user_id) REFERENCES users(id)
    )`);

    // Tasks
    await dbRun(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to_user_id INTEGER NOT NULL,
      deadline TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      status TEXT DEFAULT 'TODO',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
    )`);

    // Competitions
    await dbRun(`CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      rules TEXT,
      max_participants INTEGER DEFAULT 50,
      venue TEXT,
      schedule_time TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`);

    // Competition Participants
    await dbRun(`CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      team_name TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'REGISTERED',
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Attendance Management
    await dbRun(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      competition_id INTEGER,
      participant_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'PRESENT',
      marked_by_user_id INTEGER,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Competition Judges
    await dbRun(`CREATE TABLE IF NOT EXISTS judges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Scoring Criteria
    await dbRun(`CREATE TABLE IF NOT EXISTS scoring_criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      criteria_name TEXT NOT NULL,
      max_score INTEGER DEFAULT 10,
      weightage INTEGER DEFAULT 1,
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
    )`);

    // Judge Scores
    await dbRun(`CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      judge_user_id INTEGER NOT NULL,
      criteria_id INTEGER NOT NULL,
      score_value REAL NOT NULL,
      comments TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (criteria_id) REFERENCES scoring_criteria(id) ON DELETE CASCADE
    )`);

    // Results Workflow
    await dbRun(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      total_score REAL NOT NULL,
      rank INTEGER,
      status TEXT DEFAULT 'DRAFT',
      verified_by_user_id INTEGER,
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    )`);

    // Certificates
    await dbRun(`CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      certificate_code TEXT UNIQUE NOT NULL,
      issue_date TEXT NOT NULL,
      type TEXT NOT NULL,
      pdf_url TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    )`);

    // Celebration Photo Gallery
    await dbRun(`CREATE TABLE IF NOT EXISTS photo_gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      user_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      category TEXT NOT NULL,
      caption TEXT,
      image_url TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Photo Gallery Comments
    await dbRun(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (photo_id) REFERENCES photo_gallery(id) ON DELETE CASCADE
    )`);

    // Photo Gallery Likes
    await dbRun(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(photo_id, user_id),
      FOREIGN KEY (photo_id) REFERENCES photo_gallery(id) ON DELETE CASCADE
    )`);

    // Notifications
    await dbRun(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  });
};

module.exports = {
  db,
  dbQuery,
  dbGet,
  dbRun,
  initDB
};
