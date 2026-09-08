import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText, Award } from 'lucide-react';
import { api } from '../utils/api';

export default function FacultyDashboard({ currentUser }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeApproval, setActiveApproval] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    loadFacultyData();
  }, [currentUser]);

  const loadFacultyData = async () => {
    try {
      setLoading(true);
      const [pendingApps, compData] = await Promise.all([
        api.getPendingApprovals('Faculty Coordinator'),
        api.getCompetitions()
      ]);
      setApprovals(pendingApps);
      setCompetitions(compData);
    } catch (err) {
      console.error('Faculty dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId, status) => {
    try {
      await api.submitApproval(approvalId, {
        status,
        comments: remarks || `Status set to ${status} by Faculty Coordinator`
      });
      alert(`Proposal status updated to ${status}!`);
      setActiveApproval(null);
      setRemarks('');
      loadFacultyData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleVerifyResults = async (compId) => {
    try {
      await api.verifyResults(compId);
      alert('Competition results verified cleanly by Faculty Coordinator!');
      loadFacultyData();
    } catch (err) {
      alert(err.message || 'Verification failed');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Faculty Coordinator Control Panel
          </div>
          <h1 className="text-3xl font-extrabold text-white">Event Approval & Judging Oversight</h1>
          <p className="text-xs text-slate-300 mt-1">Review proposals from student organizers, verify budget alignment, and validate judge results.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 rounded-2xl border border-slate-800 text-center">
            <span className="block text-xl font-bold text-amber-400">{approvals.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Proposals</span>
          </div>
        </div>
      </div>

      {/* Pending Event Proposals Queue */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" /> Pending Event Proposals (Tier 1 Approval)
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading pending approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
            No pending proposals requiring faculty review right now!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvals.map((app) => (
              <div key={app.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold">
                      {app.category_name}
                    </span>
                    <span className="text-xs text-slate-400">{app.start_date}</span>
                  </div>

                  <h3 className="font-bold text-white text-lg">{app.event_title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{app.event_description}</p>
                  <p className="text-[11px] text-slate-400 mt-2">Proposed by: <strong className="text-slate-200">{app.organizer_name}</strong></p>
                </div>

                <button
                  onClick={() => setActiveApproval(app)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Review & Submit Decision
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verify Judging Results Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" /> Verify Competition Leaderboards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitions.map((comp) => (
            <div key={comp.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-base">{comp.name}</h3>
              <p className="text-xs text-slate-400">Event: {comp.event_title} | Category: {comp.category}</p>
              
              <button
                onClick={() => handleVerifyResults(comp.id)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify Scores & Lock Leaderboard
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Review & Decision Modal */}
      {activeApproval && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Review Proposal: {activeApproval.event_title}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Faculty Remarks & Instructions</label>
              <textarea
                rows={3}
                placeholder="Enter remarks or required revisions for the student organizing committee..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleDecision(activeApproval.id, 'APPROVED')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleDecision(activeApproval.id, 'CHANGES_REQUESTED')}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-4 h-4" /> Revision
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

    </div>
  );
}
