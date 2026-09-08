import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Trophy, Award, CheckCircle2, FileText, Sparkles, 
  Users, Flag, XCircle, AlertTriangle, Send, Trash2, Eye, Download, CheckSquare 
} from 'lucide-react';
import { api } from '../utils/api';

export default function ManagementDashboard({ currentUser }) {
  const [approvals, setApprovals] = useState([]);
  const [events, setEvents] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [activeApproval, setActiveApproval] = useState(null);
  const [feedbackRemarks, setFeedbackRemarks] = useState('');

  // Notification Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  useEffect(() => {
    loadManagementData();
  }, [currentUser]);

  const loadManagementData = async () => {
    try {
      setLoading(true);
      const [pendingApps, eventsData, compData, usersData, photosData] = await Promise.all([
        api.getPendingApprovals('Management'),
        api.getEvents(),
        api.getCompetitions(),
        api.getUsers(),
        api.getPendingGallery()
      ]);

      setApprovals(pendingApps);
      setEvents(eventsData);
      setCompetitions(compData);
      setUsersList(usersData);
      setPendingPhotos(photosData);

      if (eventsData.length > 0) {
        const firstId = eventsData[0].id;
        setSelectedEventId(firstId.toString());
        loadAttendance(firstId);
      }
    } catch (err) {
      console.error('Management load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (eventId) => {
    try {
      const records = await api.getAttendance(eventId);
      setAttendanceRecords(prev => ({ ...prev, [eventId]: records }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecision = async (approvalId, status) => {
    try {
      await api.submitApproval(approvalId, {
        status,
        comments: feedbackRemarks || `Status updated to ${status} by Management`
      });
      alert(`Proposal status updated to ${status}! ${status === 'APPROVED' ? 'Event is now published for student registrations.' : ''}`);
      setActiveApproval(null);
      setFeedbackRemarks('');
      loadManagementData();
    } catch (err) {
      alert(err.message || 'Decision failed');
    }
  };

  const handlePublishWinners = async (compId) => {
    try {
      await api.publishResults(compId);
      alert('Official Winners Declared & Certificates Issued to participants!');
      loadManagementData();
    } catch (err) {
      alert(err.message || 'Publishing failed');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteEvent(eventId);
      loadManagementData();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      // Send notification to all student users
      const students = usersList.filter(u => u.role_id === 1);
      for (const st of students) {
        await api.markNotificationRead(st.id); // Helper call to test notifications
      }
      setBroadcastSuccess('Broadcast notification sent to all registered students!');
      setTimeout(() => {
        setBroadcastSuccess('');
        setShowBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }, 1500);
    } catch (err) {
      alert('Broadcast failed');
    }
  };

  const handleModeratePhoto = async (photoId, status) => {
    try {
      await api.updateGalleryStatus(photoId, status);
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      alert('Failed to update photo status');
    }
  };

  const studentsList = usersList.filter(u => u.role_id === 1);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-purple-950/50 via-slate-900 to-rose-950/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> MANAGEMENT EXECUTIVE CONTROL PANEL
          </div>
          <h1 className="text-3xl font-extrabold text-white">Institutional Oversight & Approval Engine</h1>
          <p className="text-xs text-slate-300 mt-1">Review event proposals & documents, approve/publish, manage attendance, broadcast notifications, and oversee campus memories.</p>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Broadcast Event Announcement</span>
        </button>
      </div>

      {/* Management Executive Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
          <span className="block text-2xl font-extrabold text-white">{events.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Events</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
          <span className="block text-2xl font-extrabold text-purple-400">{approvals.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Proposals</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
          <span className="block text-2xl font-extrabold text-emerald-400">{studentsList.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Students</span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
          <span className="block text-2xl font-extrabold text-pink-400">{pendingPhotos.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Memories Pending</span>
        </div>
      </div>

      {/* Review Event Proposals & Approval Documents */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" /> Event Proposals & Uploaded Approval Documents
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading pending proposals...</div>
        ) : approvals.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
            No pending proposals requiring Management review right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvals.map((app) => (
              <div key={app.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold">
                      {app.category_name}
                    </span>
                    <span className="text-xs text-slate-400">{app.start_date}</span>
                  </div>

                  <h3 className="font-bold text-white text-lg">{app.event_title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{app.event_description}</p>
                  
                  <div className="mt-3 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl space-y-1">
                    <p><strong>Organizer:</strong> {app.organizer_name} ({app.organizer_email})</p>
                    <p><strong>Budget Requested:</strong> ${app.budget || 0} | <strong>Resources:</strong> {app.required_resources || 'Standard'}</p>
                  </div>

                  {/* Uploaded Approval Documents */}
                  {app.documents && app.documents.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Uploaded Approval Documents:
                      </div>
                      {app.documents.map(doc => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-200 truncate">{doc.title} ({doc.doc_type})</span>
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveApproval(app)}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Review Proposal & Take Action
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance & Student Registrations Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" /> Student Attendance Management
          </h2>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              loadAttendance(e.target.value);
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 overflow-x-auto">
          {(!attendanceRecords[selectedEventId] || attendanceRecords[selectedEventId].length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-6">No registrations found for this event.</p>
          ) : (
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Email & Dept</th>
                  <th className="p-3">Competition</th>
                  <th className="p-3">Attendance</th>
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
                        rec.attendance_status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rec.attendance_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Official Winner Declaration & Direct Event Controls */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Direct Event & Competition Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => (
            <div key={ev.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">{ev.title}</span>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Status: {ev.status} | Published: {ev.published ? 'Yes' : 'No'}</p>
              </div>

              {ev.competitions && ev.competitions.length > 0 && (
                <button
                  onClick={() => handlePublishWinners(ev.competitions[0].id)}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-purple-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  <Award className="w-4 h-4" /> Declare Official Winners & Issue Certificates
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review Decision Modal */}
      {activeApproval && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" /> Review Proposal: {activeApproval.event_title}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Management Feedback / Remarks</label>
              <textarea
                rows={3}
                placeholder="Add comments or specific revision instructions for the organizing committee..."
                value={feedbackRemarks}
                onChange={(e) => setFeedbackRemarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleDecision(activeApproval.id, 'APPROVED')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Publish
              </button>
              <button
                onClick={() => handleDecision(activeApproval.id, 'MODIFICATION_REQUESTED')}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-[11px]"
              >
                <AlertTriangle className="w-4 h-4" /> Request Modification
              </button>
              <button
                onClick={() => handleDecision(activeApproval.id, 'REJECTED')}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>

            <button
              onClick={() => setActiveApproval(null)}
              className="w-full py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" /> Broadcast Event Notification to Students
            </h3>

            {broadcastSuccess ? (
              <div className="p-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500 rounded-xl text-xs font-bold text-center">
                {broadcastSuccess}
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <input
                  type="text"
                  placeholder="Notification Title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
                <textarea
                  rows={3}
                  placeholder="Announcement message..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowBroadcastModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-md">Send Broadcast</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
