import React, { useState, useEffect } from 'react';
import { 
  Award, Calendar, Trophy, Download, CheckCircle2, FileText, 
  Sparkles, Heart, Clock, User, CheckSquare, Image as ImageIcon 
} from 'lucide-react';
import { api } from '../utils/api';
import CertificateModal from '../components/CertificateModal';

export default function StudentDashboard({ currentUser, onNavigateEvents, onNavigateGallery }) {
  const [certificates, setCertificates] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) loadStudentData();
  }, [currentUser]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const userId = currentUser ? currentUser.id : 1;
      const [certs, notifs, allEvents] = await Promise.all([
        api.getUserCertificates(userId),
        api.getNotifications(userId),
        api.getEvents({ role_name: 'Student', only_published: 'true' })
      ]);

      setCertificates(certs);
      setNotifications(notifs);

      // Filter events where user is registered
      const regList = [];
      for (const ev of allEvents) {
        if (ev.competitions) {
          for (const comp of ev.competitions) {
            const isReg = comp.participants?.some(p => p.user_id === userId);
            if (isReg) {
              regList.push({ event: ev, competition: comp });
            }
          }
        }
      }
      setRegisteredEvents(regList);
    } catch (err) {
      console.error('Fetch student data error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Student Profile Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            alt={currentUser?.name}
            className="w-16 h-16 rounded-2xl ring-4 ring-emerald-500/30 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{currentUser?.name || 'Student Participant'}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                STUDENT ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Department of {currentUser?.department || 'Computer Science'}</p>
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5">{currentUser?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className="px-4 py-2 bg-slate-900 rounded-2xl border border-slate-800">
            <span className="block text-xl font-extrabold text-indigo-400">{registeredEvents.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Registered Events</span>
          </div>
          <div className="px-4 py-2 bg-slate-900 rounded-2xl border border-slate-800">
            <span className="block text-xl font-extrabold text-amber-400">{certificates.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Certificates</span>
          </div>
        </div>
      </div>

      {/* My Registered Events & Registration Confirmation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" /> My Registered Events & Status
          </h2>
          <button
            onClick={onNavigateEvents}
            className="text-xs text-indigo-400 font-semibold hover:underline"
          >
            Explore More Approved Events ➔
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading registered events...</div>
        ) : registeredEvents.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl text-center text-slate-400 text-xs space-y-3">
            <p>You haven't registered for any events yet.</p>
            <button
              onClick={onNavigateEvents}
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Browse Published Events & Register
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registeredEvents.map((item, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    Registration Confirmed
                  </span>
                  <span className="text-xs text-slate-400">{item.event.start_date}</span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-lg">{item.event.title}</h3>
                  <p className="text-xs text-indigo-300 font-semibold mt-1">Contest: {item.competition.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Venue: {item.event.venue}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Attendance Status:</span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-[11px]">
                    REGISTERED / CHECKED-IN
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earned Certificates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> My Official Verified Certificates
          </h2>
        </div>

        {certificates.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
            Certificates will be issued automatically after event judging and official winner declaration!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
                    {cert.type.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-white text-base mt-2">{cert.competition_name || cert.event_title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Issued: {cert.issue_date}</p>
                </div>

                <button
                  onClick={() => setSelectedCert(cert)}
                  className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> View & Print Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Celebration Memories Quick Section */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-400" /> Campus Celebration Memories
          </h3>
          <p className="text-xs text-slate-400 mt-1">Participating students can upload event photos & captions to share campus memories.</p>
        </div>
        <button
          onClick={onNavigateGallery}
          className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md"
        >
          Go to Memories Gallery
        </button>
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}

    </div>
  );
}
