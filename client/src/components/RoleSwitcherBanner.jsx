import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Shield, Users, GraduationCap } from 'lucide-react';
import { api } from '../utils/api';

export default function RoleSwitcherBanner({ currentUser, onUserSwitch }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
      if (!currentUser && data.length > 0) {
        onUserSwitch(data[0]);
      }
    } catch (err) {
      console.error('Failed to load demo users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'Student': 
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Organizing Committee':
      case 'Student Organizer': 
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Management':
      case 'Faculty Coordinator':
      case 'HOD/Admin':
      case 'Principal/Final Admin': 
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: 
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/90 border-b border-indigo-500/20 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
      <div className="flex items-center gap-2 text-indigo-300 font-medium">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
        <span>Role Switcher (3 Primary Access Levels):</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-1">
        {loading ? (
          <span className="text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Loading roles...
          </span>
        ) : (
          users.map((u) => {
            const isSelected = currentUser && currentUser.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onUserSwitch(u)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 scale-105 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                <span>{u.role_name}</span>
                <span className="text-[10px] opacity-75">({u.name.split(' ')[0]})</span>
              </button>
            );
          })
        )}
      </div>

      {currentUser && (
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Current Role:</span>
          <span className={`px-2.5 py-0.5 rounded border text-[11px] font-bold ${getRoleBadgeColor(currentUser.role_name)}`}>
            {currentUser.role_name}
          </span>
        </div>
      )}
    </div>
  );
}
