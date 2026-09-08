import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trophy, Award, CheckCircle2, FileText, Sparkles, Users, Flag } from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard({ currentUser }) {
  const [approvals, setApprovals] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const isPrincipal = currentUser && currentUser.role_name === 'Principal/Final Admin';
  const targetRole = isPrincipal ? 'Principal/Final Admin' : 'HOD/Admin';

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [pendingApps, compData, eventsData] = await Promise.all([
        api.getPendingApprovals(targetRole),
        api.getCompetitions(),
        api.getEvents()
      ]);
      setApprovals(pendingApps);
      setCompetitions(compData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Admin dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId, status) => {
    try {
      await api.submitApproval(approvalId, {
        status,
        comments: `Approved by ${targetRole}`
      });
      alert(`Approval decision recorded for ${targetRole}!`);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handlePublishWinners = async (compId) => {
    try {
      await api.publishResults(compId);
      alert('Official Winners Declared & Certificates Auto-Generated for all winners and participants!');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Publishing failed');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-purple-950/50 via-slate-900 to-rose-950/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> {targetRole} Executive Hub
          </div>
          <h1 className="text-3xl font-extrabold text-white">Campus Festival Administration</h1>
          <p className="text-xs text-slate-300 mt-1">Tier 2/3 approvals, official winner declarations, certificate verification, and institutional oversight.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 rounded-2xl border border-slate-800 text-center">
            <span className="block text-xl font-bold text-purple-400">{events.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Campus Events</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" /> Pending Approvals ({targetRole})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading pending approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
            No pending proposals awaiting {targetRole} approval right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvals.map((app) => (
              <div key={app.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold">
                      {app.category_name}
                    </span>
                    <span className="text-xs text-slate-400">{app.start_date}</span>
                  </div>

                  <h3 className="font-bold text-white text-lg">{app.event_title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{app.event_description}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleDecision(app.id, 'APPROVED')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Grant Approval
                  </button>
                  <button
                    onClick={() => handleDecision(app.id, 'REJECTED')}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Winner Declaration & Auto Certificates */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Official Winner Declaration & Certificates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitions.map((comp) => (
            <div key={comp.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-base">{comp.name}</h3>
              <p className="text-xs text-slate-400">Event: {comp.event_title}</p>
              
              <button
                onClick={() => handlePublishWinners(comp.id)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" /> Declare Official Winners & Issue Certificates
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
