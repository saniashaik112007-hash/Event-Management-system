import React, { useState, useEffect } from 'react';
import {
  Plus, CheckSquare, FileText, Trophy, Users,
  AlertTriangle, RefreshCw, Edit, Send,
  ChevronDown, ChevronUp, Search, UserPlus, GraduationCap
} from 'lucide-react';
import { api } from '../utils/api';

export default function OrganizerDashboard({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedEventId, setSelectedEventId] = useState('');

  // Registered Students state
  const [registrations, setRegistrations] = useState([]);
  const [regEventId, setRegEventId] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [expandedComp, setExpandedComp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);

  // Propose Event Modal State
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [budget, setBudget] = useState('');
  const [requiredResources, setRequiredResources] = useState('');
  const [docTitle, setDocTitle] = useState('Event_Proposal_Approval_Doc.pdf');
  const [docUrl, setDocUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  // Edit / Resubmit Proposal Modal State
  const [editingProposal, setEditingProposal] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editResources, setEditResources] = useState('');

  // Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');

  useEffect(() => {
    loadOrganizerData();
  }, []);

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      const [eventsData, catData, tasksData, usersData] = await Promise.all([
        api.getEvents(),
        api.getEventCategories(),
        api.getTasks(),
        api.getUsers()
      ]);
      setEvents(eventsData);
      setCategories(catData);
      setTasks(tasksData);
      setUsersList(usersData);

      if (eventsData.length > 0) {
        const firstId = eventsData[0].id;
        setSelectedEventId(firstId.toString());
        setRegEventId(firstId.toString());
        loadAttendance(firstId);
        loadRegistrations(firstId);
      }
      if (catData.length > 0) setCategoryId(catData[0].id.toString());
      if (usersData.length > 0) setAssignedUserId(usersData[0].id.toString());
    } catch (err) {
      console.error('Organizer load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async (eventId) => {
    if (!eventId) return;
    try {
      setRegLoading(true);
      const data = await api.getRegistrations(eventId);
      setRegistrations(data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setRegistrations([]);
    } finally {
      setRegLoading(false);
    }
  };

  const loadAttendance = async (eventId) => {
    try {
      const records = await api.getAttendance(eventId);
      setAttendanceRecords(prev => ({ ...prev, [eventId]: records }));
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      await api.createEvent({
        title,
        category_id: parseInt(categoryId),
        description,
        venue,
        start_date: startDate,
        budget: parseFloat(budget) || 0,
        required_resources: requiredResources,
        document_title: docTitle,
        document_url: docUrl
      });
      alert('Event proposal and approval document submitted to Management!');
      setShowProposalModal(false);
      setTitle(''); setDescription(''); setBudget('');
      loadOrganizerData();
    } catch (err) {
      alert(err.message || 'Failed to submit proposal');
    }
  };

  const handleResubmitProposal = async (e) => {
    e.preventDefault();
    if (!editingProposal) return;
    try {
      await api.resubmitEvent(editingProposal.id, {
        title: editTitle, description: editDesc, venue: editVenue,
        budget: parseFloat(editBudget) || 0, required_resources: editResources,
        document_title: 'Revised_Proposal_Doc.pdf',
        document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      });
      alert('Modified proposal successfully resubmitted to Management for review!');
      setEditingProposal(null);
      loadOrganizerData();
    } catch (err) {
      alert(err.message || 'Resubmission failed');
    }
  };

  const handleMarkAttendance = async (eventId, participantId, userId, newStatus) => {
    try {
      await api.markAttendance({ event_id: eventId, participant_id: participantId, user_id: userId, status: newStatus });
      loadAttendance(eventId);
    } catch (err) {
      alert(err.message || 'Failed to mark attendance');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.createTask({
        event_id: parseInt(selectedEventId), title: taskTitle, description: taskDesc,
        assigned_to_user_id: parseInt(assignedUserId), deadline: taskDeadline, priority: taskPriority
      });
      setShowTaskModal(false); setTaskTitle('');
      loadOrganizerData();
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleTaskStatusToggle = async (task) => {
    const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadOrganizerData();
    } catch (err) { console.error(err); }
  };

  // Group registrations by competition
  const groupedRegistrations = registrations.reduce((acc, rec) => {
    const key = rec.competition_id;
    if (!acc[key]) acc[key] = { name: rec.competition_name, category: rec.competition_category, students: [] };
    acc[key].students.push(rec);
    return acc;
  }, {});

  const filteredGroups = Object.entries(groupedRegistrations).map(([compId, compData]) => ({
    compId,
    ...compData,
    students: compData.students.filter(s =>
      !searchQuery ||
      s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(g => g.students.length > 0);

  return (
    <div className="space-y-8 pb-16">

      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> ORGANIZING COMMITTEE DASHBOARD
          </div>
          <h1 className="text-3xl font-extrabold text-white">Event Proposals &amp; Operational Hub</h1>
          <p className="text-xs text-slate-300 mt-1">Submit proposals with budget/docs, track Management approval, edit &amp; resubmit, and manage attendance.</p>
        </div>
        <button
          onClick={() => setShowProposalModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /><span>Propose New Event + Upload Doc</span>
        </button>
      </div>

      {/* Proposals Tracker */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Event Proposals &amp; Management Feedback
        </h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading proposals...</div>
        ) : events.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
            No proposals created yet. Click "Propose New Event" to submit your first proposal!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((ev) => (
              <div key={ev.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10px] font-bold">{ev.category_name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      ev.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      ev.status === 'MODIFICATION_REQUESTED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' :
                      ev.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}>
                      {ev.status === 'MODIFICATION_REQUESTED' ? 'MODIFICATION REQUESTED' : ev.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg">{ev.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{ev.description}</p>
                  <div className="mt-3 text-xs text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl">
                    <p><strong>Venue:</strong> {ev.venue} | <strong>Start Date:</strong> {ev.start_date}</p>
                    <p><strong>Budget Requested:</strong> ${ev.budget || 0} | <strong>Resources:</strong> {ev.required_resources || 'Standard'}</p>
                  </div>
                  {ev.status === 'MODIFICATION_REQUESTED' && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-300">
                      <div className="font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-400" /> Management Feedback:</div>
                      <p className="italic">"{ev.modification_feedback || 'Please update budget/timing.'}"</p>
                    </div>
                  )}
                </div>
                {ev.status === 'MODIFICATION_REQUESTED' && (
                  <button
                    onClick={() => { setEditingProposal(ev); setEditTitle(ev.title); setEditDesc(ev.description); setEditVenue(ev.venue); setEditBudget(ev.budget); setEditResources(ev.required_resources); }}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit &amp; Resubmit Proposal to Management
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGISTERED STUDENTS PANEL */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" /> Student Registrations
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              {registrations.length} registered
            </span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={regEventId}
              onChange={(e) => { setRegEventId(e.target.value); setExpandedComp(null); setSearchQuery(''); loadRegistrations(e.target.value); }}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">-- Select Event --</option>
              {events.map(ev => (<option key={ev.id} value={ev.id}>{ev.title}</option>))}
            </select>
            <button onClick={() => loadRegistrations(regEventId)} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {registrations.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {regLoading ? (
          <div className="glass-card p-10 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-3 text-slate-400 text-sm animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin" /> Loading registrations...
            </div>
          </div>
        ) : !regEventId ? (
          <div className="glass-card p-10 rounded-2xl text-center text-slate-400 text-xs">Select an event above to view registered students.</div>
        ) : registrations.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-700 text-center space-y-2">
            <UserPlus className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">No students registered for this event yet.</p>
            <p className="text-slate-500 text-[11px]">Students who register via the portal will appear here in real-time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Registered', value: registrations.length, color: 'text-emerald-400' },
                { label: 'Competitions', value: Object.keys(groupedRegistrations).length, color: 'text-indigo-400' },
                { label: 'Present', value: registrations.filter(r => r.attendance_status === 'PRESENT' || r.attendance_status === 'CHECKED_IN').length, color: 'text-cyan-400' },
                { label: 'Pending Check-in', value: registrations.filter(r => r.attendance_status === 'NOT_MARKED').length, color: 'text-amber-400' },
              ].map(stat => (
                <div key={stat.label} className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
                  <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Per-competition expandable tables */}
            {filteredGroups.map(({ compId, name, category, students }) => (
              <div key={compId} className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setExpandedComp(expandedComp === compId ? null : compId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-sm">{name}</div>
                      <div className="text-[11px] text-slate-400">{category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      {students.length} student{students.length !== 1 ? 's' : ''}
                    </span>
                    {expandedComp === compId ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedComp === compId && (
                  <div className="border-t border-slate-800 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Student</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Registered On</th>
                          <th className="p-3">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {students.map((s, idx) => (
                          <tr key={s.participant_id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                  {s.student_name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-white">{s.student_name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">{s.student_email}</td>
                            <td className="p-3 text-slate-300">{s.department || '—'}</td>
                            <td className="p-3 text-slate-400">{s.registration_date ? new Date(s.registration_date).toLocaleDateString() : '—'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.attendance_status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                s.attendance_status === 'CHECKED_IN' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                s.attendance_status === 'ABSENT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {s.attendance_status === 'NOT_MARKED' ? 'Pending' : s.attendance_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Tracking Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Event Attendance &amp; Mark Presence
          </h2>
          <select
            value={selectedEventId}
            onChange={(e) => { setSelectedEventId(e.target.value); loadAttendance(e.target.value); }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          >
            {events.map(ev => (<option key={ev.id} value={ev.id}>{ev.title}</option>))}
          </select>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-slate-800 overflow-x-auto">
          {(!attendanceRecords[selectedEventId] || attendanceRecords[selectedEventId].length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-6">No student registrations recorded for this event yet.</p>
          ) : (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Email / Dept</th>
                  <th className="p-3">Competition</th>
                  <th className="p-3">Attendance Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attendanceRecords[selectedEventId].map(rec => (
                  <tr key={rec.participant_id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-white">{rec.student_name}</td>
                    <td className="p-3 text-slate-400">{rec.student_email} ({rec.department})</td>
                    <td className="p-3 text-indigo-300 font-semibold">{rec.competition_name}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        rec.attendance_status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        rec.attendance_status === 'CHECKED_IN' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>{rec.attendance_status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleMarkAttendance(selectedEventId, rec.participant_id, rec.user_id, rec.attendance_status === 'PRESENT' ? 'ABSENT' : 'PRESENT')}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold"
                      >Toggle Attendance</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Task Board Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" /> Organizing Team Task Board
          </h2>
          <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold border border-slate-700">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((colStatus) => {
            const colTasks = tasks.filter(t => t.status === colStatus);
            return (
              <div key={colStatus} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                  <span>{colStatus.replace('_', ' ')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(t => (
                    <div key={t.id} onClick={() => handleTaskStatusToggle(t)} className="p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/40 text-xs cursor-pointer space-y-1">
                      <div className="font-bold text-white">{t.title}</div>
                      <div className="text-[10px] text-slate-400">Assignee: {t.assignee_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proposal Create Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> Propose New Event &amp; Upload Document</h3>
            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                <input type="text" placeholder="e.g. Kalakriti 2026 Cultural Fest" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none">
                    {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Budget ($)</label>
                  <input type="number" placeholder="1500" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Venue &amp; Required Resources</label>
                <input type="text" placeholder="Main Auditorium - Sound System..." value={requiredResources} onChange={(e) => setRequiredResources(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Approval Document Name</label>
                  <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description &amp; Scope</label>
                <textarea rows={3} placeholder="Outline the festival objective..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowProposalModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md">Submit Proposal to Management</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposal Resubmit Modal */}
      {editingProposal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Edit className="w-5 h-5 text-amber-400" /> Edit &amp; Resubmit: {editingProposal.title}</h3>
            <form onSubmit={handleResubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Revised Budget ($)</label>
                  <input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Venue</label>
                  <input type="text" value={editVenue} onChange={(e) => setEditVenue(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description &amp; Modifications Made</label>
                <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingProposal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Resubmit to Management
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5 text-indigo-400" /> Assign Team Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <input type="text" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}