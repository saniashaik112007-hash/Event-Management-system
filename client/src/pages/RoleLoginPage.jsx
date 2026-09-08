import React from 'react';
import { 
  GraduationCap, CheckSquare, ShieldAlert, Sparkles, 
  ArrowRight, ShieldCheck, Calendar, Lock, Users 
} from 'lucide-react';
import { api } from '../utils/api';

export default function RoleLoginPage({ onSelectRoleLogin, onGuestBrowse }) {
  const rolePortals = [
    {
      id: 'Student',
      title: 'Student Portal',
      roleName: 'Student',
      demoEmail: 'student1@college.edu',
      icon: GraduationCap,
      badge: 'STUDENT ACCESS',
      accentColor: 'emerald',
      bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-900 hover:border-emerald-500/50',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
      description: 'Browse approved campus festivals, 1-click register for competitions, view registration confirmations, track attendance, download official certificates, and share celebration photo memories.',
      features: ['View Published Events', '1-Click Registration', 'Attendance Confirmation', 'Download Certificates', 'Celebration Photo Memories']
    },
    {
      id: 'Organizing Committee',
      title: 'Organizing Committee Portal',
      roleName: 'Organizing Committee',
      demoEmail: 'organizer1@college.edu',
      icon: CheckSquare,
      badge: 'COMMITTEE WORKSPACE',
      accentColor: 'indigo',
      bgGradient: 'from-indigo-950/40 via-slate-900 to-slate-900 hover:border-indigo-500/50',
      btnColor: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30',
      description: 'Propose new campus celebrations, upload budget & approval documents, track Management proposal review, edit & resubmit modified proposals, manage team task board, and mark student attendance.',
      features: ['Propose Events + Budget', 'Upload Approval Docs', 'Track & Resubmit Proposals', 'Mark Student Attendance', 'Team Task Delegation']
    },
    {
      id: 'Management',
      title: 'Management Executive Portal',
      roleName: 'Management',
      demoEmail: 'management1@college.edu',
      icon: ShieldAlert,
      badge: 'INSTITUTIONAL OVERVIEW',
      accentColor: 'purple',
      bgGradient: 'from-purple-950/40 via-slate-900 to-slate-900 hover:border-purple-500/50',
      btnColor: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30',
      description: 'Review event proposals & uploaded approval documents, approve & publish events for student registration, request modifications with feedback remarks, direct event controls, attendance oversight, and broadcast notifications.',
      features: ['Review Proposals & Docs', 'Approve & Publish Events', 'Request Proposal Modifications', 'Broadcast Announcements', 'Attendance & Memory Moderation']
    }
  ];

  return (
    <div className="space-y-12 pb-16 pt-4">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold shadow-md">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Role-Based Portal Access & Authentication</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Select Your Campus <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Login Portal</span>
        </h1>

        <p className="text-base text-slate-300 leading-relaxed">
          Access your dedicated workspace. Choose between Student Portal, Organizing Committee Workspace, or Management Executive Controls.
        </p>
      </div>

      {/* 3 Portal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {rolePortals.map((portal) => {
          const Icon = portal.icon;
          return (
            <div
              key={portal.id}
              className={`glass-card rounded-3xl p-8 border border-slate-800 transition-all duration-300 hover:-translate-y-2 shadow-2xl flex flex-col justify-between group bg-gradient-to-b ${portal.bgGradient}`}
            >
              <div className="space-y-6">
                
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                    portal.accentColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    portal.accentColor === 'indigo' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' :
                    'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  }`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    portal.accentColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                    portal.accentColor === 'indigo' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                    'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  }`}>
                    {portal.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-2xl font-extrabold text-white group-hover:text-indigo-200 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                {/* Key Features Bullet List */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Capabilities:</span>
                  <ul className="space-y-1.5">
                    {portal.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${
                          portal.accentColor === 'emerald' ? 'text-emerald-400' :
                          portal.accentColor === 'indigo' ? 'text-indigo-400' :
                          'text-purple-400'
                        }`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-6">
                <button
                  onClick={() => onSelectRoleLogin(portal)}
                  className={`w-full py-3.5 ${portal.btnColor} text-white font-extrabold rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:scale-105`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Login to {portal.title}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guest / Public Event Browsing Shortcut */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
        <div className="text-left">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Explore Public Published Events
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">Want to browse upcoming campus festivals without logging in first?</p>
        </div>

        <button
          onClick={onGuestBrowse}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-xs border border-slate-700 transition-all shrink-0 cursor-pointer"
        >
          View Published Events List
        </button>
      </div>

    </div>
  );
}
