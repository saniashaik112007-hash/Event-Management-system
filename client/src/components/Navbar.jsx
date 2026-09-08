import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Image, LayoutDashboard, Bell, LogIn, LogOut, Lock, User } from 'lucide-react';
import { api } from '../utils/api';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenLogin, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      if (!currentUser) return;
      const data = await api.getNotifications(currentUser.id);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const unreadCount = notifications.filter(n => n.read_status === 0).length;

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getDashboardTabName = () => {
    if (!currentUser) return 'Dashboard';
    switch (currentUser.role_name) {
      case 'Student': return 'Student Dashboard';
      case 'Organizing Committee':
      case 'Student Organizer': return 'Organizer Dashboard';
      case 'Management':
      case 'Faculty Coordinator':
      case 'HOD/Admin':
      case 'Principal/Final Admin': return 'Management Dashboard';
      default: return 'Dashboard';
    }
  };

  return (
    <nav className="sticky top-0 z-40 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab(currentUser ? 'dashboard' : 'portal')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                CampusVibe
              </span>
              <span className="block text-[10px] text-indigo-400 font-semibold tracking-wider uppercase -mt-1">
                Event Management
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800">
            {!currentUser && (
              <button
                onClick={() => setActiveTab('portal')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'portal'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lock className="w-4 h-4 text-purple-300" />
                <span>Login Portals</span>
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>{getDashboardTabName()}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Published Events</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Image className="w-4 h-4 text-pink-400" />
              <span>Memories Gallery</span>
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Drawer */}
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-400" /> Notifications & Feedback
                      </h3>
                      <span className="text-xs text-indigo-400 font-semibold">{unreadCount} new</span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`p-3 rounded-xl text-xs transition-all cursor-pointer border ${
                              n.read_status === 0
                                ? 'bg-indigo-950/40 border-indigo-500/40 text-slate-100'
                                : 'bg-slate-900/50 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-indigo-300">{n.title}</span>
                              {n.read_status === 0 && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                            </div>
                            <p className="mt-1 text-slate-300 leading-relaxed">{n.message}</p>
                            <span className="mt-1 block text-[10px] text-slate-500">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active User Summary & Logout Button */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full ring-2 ring-indigo-500/50 object-cover"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-slate-200">{currentUser.name}</div>
                    <div className="text-[10px] text-indigo-400 font-semibold">{currentUser.role_name}</div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer"
                  title="Log out and return to Portal Selection"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Switch Portal</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
