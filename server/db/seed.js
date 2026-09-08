const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDB, dbRun, dbGet, dbQuery } = require('./database');

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

async function seed() {
  console.log('Clearing old SQLite database file for schema migration...');
  const dbFile = path.resolve(__dirname, 'events.db');
  if (fs.existsSync(dbFile)) {
    try {
      fs.unlinkSync(dbFile);
    } catch (e) {
      console.log('Database locked, clearing tables via SQL...');
    }
  }

  console.log('Initializing updated database schema...');
  await initDB();

  await new Promise(r => setTimeout(r, 600));

  console.log('Seeding updated 3-role data...');

  const tables = [
    'notifications', 'likes', 'comments', 'photo_gallery', 'certificates',
    'results', 'scores', 'scoring_criteria', 'judges', 'attendance', 'participants',
    'competitions', 'tasks', 'teams', 'documents', 'approvals',
    'event_timeline', 'events', 'event_categories', 'users', 'roles'
  ];
  for (const table of tables) {
    try {
      await dbRun(`DROP TABLE IF EXISTS ${table}`);
    } catch (e) {}
  }

  // Re-init schema cleanly
  await initDB();
  await new Promise(r => setTimeout(r, 600));

  // 1. Seed 3 Core Roles
  const roles = [
    { name: 'Student', desc: 'Participate in published events, view schedule, track registrations, upload memories' },
    { name: 'Organizing Committee', desc: 'Propose events, upload documents, edit & resubmit, manage team & attendance' },
    { name: 'Management', desc: 'Full executive approval, direct event controls, attendance reports, student management' }
  ];

  for (const r of roles) {
    await dbRun(`INSERT INTO roles (name, description) VALUES (?, ?)`, [r.name, r.desc]);
  }

  // 2. Seed Demo Users for the 3 Access Levels
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { name: 'Aarav Sharma', email: 'student1@college.edu', role_id: 1, dept: 'Computer Science', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
    { name: 'Ananya Roy', email: 'student2@college.edu', role_id: 1, dept: 'Electronics', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { name: 'Rohan Mehta (Committee Head)', email: 'organizer1@college.edu', role_id: 2, dept: 'Information Technology', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Priya Verma (Committee Member)', email: 'organizer2@college.edu', role_id: 2, dept: 'Mechanical', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
    { name: 'Dr. K. S. Rao (Management Dean)', email: 'management1@college.edu', role_id: 3, dept: 'Campus Administration', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { name: 'Prof. Sunita Reddy (Management HOD)', email: 'management2@college.edu', role_id: 3, dept: 'Academic Operations', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' }
  ];

  for (const u of users) {
    await dbRun(
      `INSERT INTO users (name, email, password_hash, role_id, department, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.name, u.email, passwordHash, u.role_id, u.dept, u.avatar]
    );
  }

  // 3. Seed Event Categories
  const categories = [
    { name: 'Cultural Fest', icon: 'Sparkles', desc: 'Annual grand festival with music, dance & arts' },
    { name: 'Music', icon: 'Music', desc: 'Solo, duet, acoustic bands & fusion beats' },
    { name: 'Dance', icon: 'Activity', desc: 'Classical, western, folk, and street battles' },
    { name: 'Arts & Creative', icon: 'Palette', desc: 'Canvas painting, photography, rangoli' },
    { name: 'Teachers Day', icon: 'Award', desc: 'Student-led celebration honoring faculty' },
    { name: 'Freshers Gala', icon: 'PartyPopper', desc: 'Welcome celebration for new batch' }
  ];

  for (const c of categories) {
    await dbRun(`INSERT INTO event_categories (name, icon, description) VALUES (?, ?, ?)`, [c.name, c.icon, c.desc]);
  }

  async function createTimeline(eventId, currentStageOrder, updatedByUserId) {
    for (let i = 0; i < STAGES.length; i++) {
      let status = 'PENDING';
      if (i < currentStageOrder) status = 'COMPLETED';
      else if (i === currentStageOrder) status = 'IN_PROGRESS';

      await dbRun(
        `INSERT INTO event_timeline (event_id, stage_name, stage_order, status, updated_by_user_id, notes) VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, STAGES[i], i + 1, status, updatedByUserId, `Stage ${i + 1}: ${STAGES[i]}`]
      );
    }
  }

  // 4. Seed Events
  // Ev1: Kalakriti 2026 (APPROVED & PUBLISHED)
  const ev1 = await dbRun(
    `INSERT INTO events (title, category_id, description, venue, start_date, end_date, registration_deadline, banner_url, status, published, budget, required_resources, created_by_user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Kalakriti 2026 - Annual Cultural Fest',
      1,
      'The grand intra-college non-technical cultural fest featuring music, dance, theater, and fine arts competitions.',
      'Main College Auditorium',
      '2026-10-15',
      '2026-10-17',
      '2026-10-10',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      'APPROVED',
      1, // Published = 1 (Visible to Students!)
      2500,
      'JBL Sound System, Stage Lighting, Security Guard Support',
      3
    ]
  );
  const ev1Id = ev1.lastID;
  await createTimeline(ev1Id, 4, 3);

  // Ev2: Symphony 2026 - Music Fest (APPROVED & PUBLISHED)
  const ev2 = await dbRun(
    `INSERT INTO events (title, category_id, description, venue, start_date, end_date, registration_deadline, banner_url, status, published, budget, required_resources, created_by_user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Symphony 2026 - Inter-Department Music Fest',
      2,
      'Showcasing vocalists, acoustic guitarists, and fusion bands across Indian and Western music genres.',
      'Acoustic Hall B',
      '2026-09-20',
      '2026-09-21',
      '2026-09-15',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      'APPROVED',
      1, // Published
      1200,
      'Microphones, Drum Kit, Sound Engineer',
      3
    ]
  );
  const ev2Id = ev2.lastID;
  await createTimeline(ev2Id, 5, 3);

  // Ev3: Teachers' Day Cultural Gala 2026 (MODIFICATION_REQUESTED state for testing resubmit flow!)
  const ev3 = await dbRun(
    `INSERT INTO events (title, category_id, description, venue, start_date, end_date, registration_deadline, banner_url, status, published, budget, required_resources, modification_feedback, created_by_user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Teachers' Day Cultural Tribute 2026",
      5,
      'Special student-led evening with poetry recitations, acoustic choir, and faculty awards.',
      'Seminar Hall 1',
      '2026-09-28',
      '2026-09-28',
      '2026-09-25',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
      'MODIFICATION_REQUESTED',
      0, // Not published
      800,
      'Projector, Refreshments for 50 faculty members',
      'Please adjust timing from evening 6 PM to 4 PM and provide an itemized budget split.',
      3
    ]
  );
  const ev3Id = ev3.lastID;
  await createTimeline(ev3Id, 0, 3);

  // Ev4: Freshers Night 2026 (PENDING approval)
  const ev4 = await dbRun(
    `INSERT INTO events (title, category_id, description, venue, start_date, end_date, registration_deadline, banner_url, status, published, budget, required_resources, created_by_user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Freshers Carnival & Talent Night 2026',
      6,
      'Welcome party and talent showcase for the new batch of college students.',
      'Campus Open Grounds',
      '2026-10-05',
      '2026-10-05',
      '2026-10-01',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'PENDING',
      0,
      1500,
      'DJ Sound Console, Outdoor Lighting, Entry Gate Badges',
      4
    ]
  );
  const ev4Id = ev4.lastID;
  await createTimeline(ev4Id, 0, 4);

  // 5. Seed Approvals Workflow Records
  await dbRun(`INSERT INTO approvals (event_id, approver_role, approver_user_id, status, comments) VALUES (?, ?, ?, ?, ?)`,
    [ev1Id, 'Management', 5, 'APPROVED', 'Proposal and budget approved for campus fest.']);
  await dbRun(`INSERT INTO approvals (event_id, approver_role, approver_user_id, status, comments) VALUES (?, ?, ?, ?, ?)`,
    [ev2Id, 'Management', 5, 'APPROVED', 'Acoustic hall venue confirmed.']);
  await dbRun(`INSERT INTO approvals (event_id, approver_role, approver_user_id, status, comments) VALUES (?, ?, ?, ?, ?)`,
    [ev3Id, 'Management', 5, 'MODIFICATION_REQUESTED', 'Please adjust timing from evening 6 PM to 4 PM and provide an itemized budget split.']);
  await dbRun(`INSERT INTO approvals (event_id, approver_role, approver_user_id, status, comments) VALUES (?, ?, ?, ?, ?)`,
    [ev4Id, 'Management', null, 'PENDING', 'Under review by Management.']);

  // 6. Documents
  await dbRun(`INSERT INTO documents (event_id, title, doc_type, file_url, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)`,
    [ev1Id, 'Kalakriti_Official_Proposal_2026.pdf', 'PROPOSAL', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 3]);
  await dbRun(`INSERT INTO documents (event_id, title, doc_type, file_url, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)`,
    [ev1Id, 'Budget_Breakdown_V2.pdf', 'BUDGET', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 3]);
  await dbRun(`INSERT INTO documents (event_id, title, doc_type, file_url, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)`,
    [ev3Id, 'TeachersDay_Proposal_Draft.pdf', 'PROPOSAL', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 3]);

  // 7. Tasks
  await dbRun(`INSERT INTO tasks (event_id, title, description, assigned_to_user_id, deadline, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ev1Id, 'Finalize Audio & Lighting Vendor', 'Contact StageCraft Ltd for JBL setup', 3, '2026-09-30', 'HIGH', 'IN_PROGRESS']);
  await dbRun(`INSERT INTO tasks (event_id, title, description, assigned_to_user_id, deadline, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ev1Id, 'Design Digital Banners', 'Create Instagram & poster graphics', 4, '2026-10-01', 'MEDIUM', 'COMPLETED']);

  // 8. Competitions & Registrations
  const comp1 = await dbRun(
    `INSERT INTO competitions (event_id, name, category, rules, max_participants, venue, schedule_time) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ev2Id, 'Solo Vocal Showdown', 'Music', 'Time limit: 4 mins. Acoustic guitar accompaniment allowed.', 25, 'Acoustic Hall B', '2026-09-20 14:00']
  );
  const comp1Id = comp1.lastID;

  const p1 = await dbRun(`INSERT INTO participants (competition_id, user_id, team_name, status) VALUES (?, ?, ?, ?)`, [comp1Id, 1, 'Soloist Aarav', 'REGISTERED']);
  const p2 = await dbRun(`INSERT INTO participants (competition_id, user_id, team_name, status) VALUES (?, ?, ?, ?)`, [comp1Id, 2, 'Melody Ananya', 'REGISTERED']);
  const p1Id = p1.lastID;
  const p2Id = p2.lastID;

  // 9. Seed Attendance Records
  await dbRun(`INSERT INTO attendance (event_id, competition_id, participant_id, user_id, status, marked_by_user_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [ev2Id, comp1Id, p1Id, 1, 'PRESENT', 3]);
  await dbRun(`INSERT INTO attendance (event_id, competition_id, participant_id, user_id, status, marked_by_user_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [ev2Id, comp1Id, p2Id, 2, 'CHECKED_IN', 3]);

  // 10. Photo Gallery Memories
  const photo1 = await dbRun(
    `INSERT INTO photo_gallery (event_id, user_id, event_name, category, caption, image_url, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      ev2Id,
      1,
      'Symphony Acoustic Battle',
      'Music',
      'Unforgettable vocal acoustic session with fellow students!',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
      'APPROVED'
    ]
  );
  const photo1Id = photo1.lastID;

  await dbRun(`INSERT INTO comments (photo_id, user_id, user_name, comment_text) VALUES (?, ?, ?, ?)`,
    [photo1Id, 2, 'Ananya Roy', 'Awesome performance! Loved the guitar chords! 🔥']);

  // 11. Notifications
  await dbRun(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [1, 'Registration Confirmed', 'You are registered for Solo Vocal Showdown in Symphony 2026.', 'SUCCESS']);
  await dbRun(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [3, 'Modification Requested', 'Management requested changes on "Teachers Day Tribute". Check feedback notes.', 'WARNING']);
  await dbRun(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [5, 'New Proposal Pending', 'Freshers Carnival proposal submitted by Committee. Review required.', 'INFO']);

  console.log('Database successfully seeded with 3-role schema and resubmission workflow!');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
