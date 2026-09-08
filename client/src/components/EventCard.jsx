import React from 'react';
import { Calendar, MapPin, Users, ChevronRight, Sparkles, Clock } from 'lucide-react';

export default function EventCard({ event, onSelect }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Registration Open':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Judging':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Winners Published':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Proposal Submitted':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  };

  return (
    <div 
      onClick={() => onSelect(event)}
      className="group glass-card rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col h-full"
    >
      {/* Banner & Overlay */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{event.category_name}</span>
        </div>

        {/* Status Pill */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full border text-[11px] font-bold shadow-md ${getStatusBadge(event.status)}`}>
          {event.status}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Meta Info */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{event.start_date} {event.end_date && `to ${event.end_date}`}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="truncate max-w-[160px]">{event.venue || 'Campus Auditorium'}</span>
            </div>

            {event.participant_count > 0 && (
              <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                <Users className="w-3.5 h-3.5" />
                <span>{event.participant_count} Registered</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Button */}
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
          <span>View Details & Timeline</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
