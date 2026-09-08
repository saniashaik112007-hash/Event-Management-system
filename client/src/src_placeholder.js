import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, Search, Filter, Trophy, Image as ImageIcon, 
  ArrowRight, Award, ShieldCheck, Heart, MessageSquare, CheckCircle2 
} from 'lucide-react';
import { api } from '../utils/api';
import EventCard from '../components/EventCard';

export default function Home({ onSelectEvent, onNavigateGallery, currentUser }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentMemories, setRecentMemories] = useState([]);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, catData, galleryData] = await Promise.all([
        api.getEvents({ category_id: selectedCategory }),
        api.getEventCategories(),
        api.getGallery()
      ]);
      setEvents(eventsData);
      setCategories(catData);
      setRecentMemories(galleryData.slice(0, 4));
    } catch (err) {
      console.error('Error loading home data:', err);
    } fontFinally: {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = filteredEvents.filter(e => e.status !== 'Archived' && e.status !== 'Rejected');
  const completedEvents = filteredEvents.filter(e => e.status === 'Winners Published' || e.status === 'Archived');

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-card p-8 sm:p-12 border border-slate-800 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/60 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Campus Cultural & Non-Technical Event Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Celebrate Talent, Music, Arts & Campus <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Memories</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            The complete platform for Cultural Fests, Teachers' Day, Engineers' Day, Freshers, Farewell, Music, Dance & Arts competitions. Register, track 12-stage event timelines, compete, view live judging, and download verified certificates!
          </p>

          {/* Quick Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events, festivals, dance, music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>
            <button
              onClick={onNavigateGallery}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-pink-300" />
              <span>Explore Celebration Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" /> Browse Event Categories
          </h2>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory('')}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.toString())}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === cat.id.toString()
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming & Active Events Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-400" /> Upcoming & Active College Celebrations
            </h2>
            <p className="text-xs text-slate-400 mt-1">Register for competitions, view stage status and event schedules</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Showing {upcomingEvents.length} events</span>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-3xl border border-slate-800 text-slate-400 text-sm">
            No events found matching your category filter or search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
            ))}
          </div>
        )}
      </div>

      {/* Campus Memories Teaser Section */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-6 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 text-xs font-bold mb-2">
              <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" /> Celebration Gallery & Memories
            </div>
            <h2 className="text-2xl font-extrabold text-white">Campus Culture & Festival Highlights</h2>
            <p className="text-xs text-slate-400 mt-1">Explore photos uploaded by students from recent college fests, concerts, and celebrations</p>
          </div>

          <button
            onClick={onNavigateGallery}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold border border-slate-700 transition-all"
          >
            <span>View All Memories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentMemories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No approved memory photos yet. Be the first student to upload!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentMemories.map(photo => (
              <div key={photo.id} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-56 cursor-pointer" onClick={onNavigateGallery}>
                <img src={photo.image_url} alt={photo.event_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">{photo.category}</span>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{photo.event_name}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
