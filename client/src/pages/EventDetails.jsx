import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Users, Award, ShieldCheck, 
  CheckCircle2, Trophy, Sparkles, AlertCircle, Plus 
} from 'lucide-react';
import { api } from '../utils/api';
import EventTimeline from '../components/EventTimeline';

export default function EventDetails({ eventId, onBack, currentUser, onSelectCertificate }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerModalComp, setRegisterModalComp] = useState(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [leaderboards, setLeaderboards] = useState({});
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState('');

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      const data = await api.getEventById(eventId);
      setEvent(data);

      // Load leaderboards for competitions
      const boardObj = {};
      for (const comp of data.competitions || []) {
        const res = await api.getResultsLeaderboard(comp.id);
        boardObj[comp.id] = res;
      }
      setLeaderboards(boardObj);
    } catch (err) {
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerModalComp) return;
    try {
      await api.registerParticipant(registerModalComp.id, {
        user_id: currentUser ? currentUser.id : 1,
        team_name: teamNameInput || 'Individual'
      });
      setRegisterSuccessMsg(`Successfully registered for ${registerModalComp.name}!`);
      setTimeout(() => {
        setRegisterSuccessMsg('');
        setRegisterModalComp(null);
        loadEventDetail();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 animate-pulse">
        Loading event details & timeline...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Event not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Events
        </button>
      </div>
    );
  }

  const currentStageOrder = event.timeline?.find(t => t.status === 'IN_PROGRESS')?.stage_order || 
                           (event.timeline?.filter(t => t.status === 'COMPLETED').length + 1) || 1;

  const isOrganizerOrAdmin = currentUser && ['Student Organizer', 'Faculty Coordinator', 'HOD/Admin', 'Principal/Final Admin'].includes(currentUser.role_name);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events List
      </button>

      {/* Event Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800">
        <div className="h-64 sm:h-80 relative">
          <img
            src={event.banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        </div>

        <div className="p-6 sm:p-10 -mt-20 relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {event.category_name}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              {event.status}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {event.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Dates: <strong className="text-white">{event.start_date} to {event.end_date}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>Venue: <strong className="text-white">{event.venue}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Proposed by: <strong className="text-white">{event.creator_name}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Stage Visual Event Timeline */}
      <EventTimeline
        timeline={event.timeline}
        currentStageOrder={currentStageOrder}
        isOrganizerOrAdmin={isOrganizerOrAdmin}
      />

      {/* Approvals Workflow Status Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" /> Multi-Tier Approval Workflow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {event.approvals?.map((app, idx) => (
            <div key={app.id || idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{app.approver_role}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  app.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                }`}>
                  {app.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic">"{app.comments || 'No remarks yet'}"</p>
              {app.approver_name && (
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                  By: {app.approver_name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Student Registration CTA Banner */}
      {currentUser?.role_name === 'Student' && event.competitions && event.competitions.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">Join This Event!</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {event.competitions.length} competition{event.competitions.length !== 1 ? 's' : ''} open for registration. Pick one below and sign up!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Registration Open
            </span>
            <button
              onClick={() => document.getElementById('competitions-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Register Now
            </button>
          </div>
        </div>
      )}

      {/* Sub-Competitions & Registration Section */}
      <div id="competitions-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Competitions &amp; Contests
          </h2>
          <span className="text-xs text-slate-400">{event.competitions?.length || 0} competitions</span>
        </div>

        {(!event.competitions || event.competitions.length === 0) ? (
          <p className="text-xs text-slate-400 glass-card p-6 rounded-2xl text-center">No sub-competitions listed yet for this fest.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.competitions.map((comp) => {
              const compResults = leaderboards[comp.id] || [];
              return (
                <div key={comp.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase">
                        {comp.category}
                      </span>
                      <span className="text-xs text-slate-400">{comp.schedule_time || 'Schedule TBA'}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{comp.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{comp.rules}</p>
                    
                    <div className="mt-3 text-xs text-slate-400">
                      Venue: <span className="text-slate-200 font-semibold">{comp.venue}</span> | Max Participants: <span className="text-slate-200 font-semibold">{comp.max_participants}</span>
                    </div>
                  </div>

                  {/* Leaderboard preview if results published */}
                  {compResults.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> Official Winner Leaderboard:
                      </div>
                      <div className="space-y-1">
                        {compResults.slice(0, 3).map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                r.rank === 1 ? 'bg-amber-400 text-slate-950 font-black' :
                                r.rank === 2 ? 'bg-slate-300 text-slate-950 font-black' :
                                'bg-amber-700 text-white font-bold'
                              }`}>
                                #{r.rank}
                              </span>
                              <span className="font-semibold text-slate-200">{r.participant_name} ({r.team_name})</span>
                            </div>
                            <span className="font-mono text-amber-400 font-bold text-xs">{r.total_score} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    onClick={() => setRegisterModalComp(comp)}
                    className="mt-4 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register for Competition</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Registration Modal */}
      {registerModalComp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Register for {registerModalComp.name}
            </h3>

            {registerSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs text-center font-bold">
                {registerSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Participant / Team Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Soloist Aarav or Thunder Dance Crew"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="text-xs text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl">
                  <p><strong>Rules:</strong> {registerModalComp.rules}</p>
                  <p><strong>Schedule:</strong> {registerModalComp.schedule_time}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterModalComp(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                  >
                    Confirm Registration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
