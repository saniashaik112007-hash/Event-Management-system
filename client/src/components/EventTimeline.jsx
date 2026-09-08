import React from 'react';
import { 
  FileText, CheckSquare, Users, FileCode, UserPlus, 
  Calendar, Award, ShieldCheck, Trophy, BadgeCheck, 
  FileSpreadsheet, Archive, Check, Clock
} from 'lucide-react';

const STAGE_ICONS = [
  FileText,        // Proposal
  CheckSquare,     // Approval Workflow
  Users,           // Team Formation
  FileCode,        // Planning & Docs
  UserPlus,        // Registration Open
  Calendar,        // Event Day
  Award,           // Judging
  ShieldCheck,     // Result Verification
  Trophy,          // Winners Published
  BadgeCheck,      // Certificates Issued
  FileSpreadsheet, // Final Report
  Archive          // Archived
];

export default function EventTimeline({ timeline = [], currentStageOrder = 1, onUpdateStage, isOrganizerOrAdmin = false }) {
  const STAGES_LIST = [
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

  return (
    <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Event Lifecycle Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-1">12-Stage Automated Workflow & Progress Tracker</p>
        </div>
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full">
          Stage {currentStageOrder} of 12
        </span>
      </div>

      {/* Horizontal Scrollable Timeline Bar */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center min-w-[900px] justify-between relative px-4">
          
          {/* Connector Line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-slate-800 -z-0"></div>

          {STAGES_LIST.map((stageName, idx) => {
            const stageNum = idx + 1;
            const stageData = timeline.find(t => t.stage_order === stageNum) || {};
            const Icon = STAGE_ICONS[idx] || Clock;

            const isDone = stageNum < currentStageOrder || stageData.status === 'COMPLETED';
            const isCurrent = stageNum === currentStageOrder || stageData.status === 'IN_PROGRESS';

            return (
              <div key={idx} className="flex flex-col items-center relative z-10 group">
                <button
                  disabled={!isOrganizerOrAdmin}
                  onClick={() => onUpdateStage && onUpdateStage(stageNum, isDone ? 'IN_PROGRESS' : 'COMPLETED')}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500'
                  } ${isOrganizerOrAdmin ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                  title={`${stageName}: ${stageData.status || 'PENDING'}`}
                >
                  {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                </button>

                <span className={`text-[11px] font-medium mt-2 text-center max-w-[85px] leading-tight ${
                  isCurrent ? 'text-indigo-400 font-bold' : isDone ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                }`}>
                  {stageName}
                </span>

                <span className="text-[9px] text-slate-500 mt-0.5 font-mono">
                  Stage {stageNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
