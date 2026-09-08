import React, { useState, useEffect } from 'react';
import { LogIn, Key, Mail, Sparkles, X, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';

export default function LoginModal({ presetRole, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { name: 'Student (Aarav)', email: 'student1@college.edu', role: 'Student' },
    { name: 'Committee Head (Rohan)', email: 'organizer1@college.edu', role: 'Organizing Committee' },
    { name: 'Management Dean (Dr. Rao)', email: 'management1@college.edu', role: 'Management' }
  ];

  useEffect(() => {
    if (presetRole) {
      const acc = demoAccounts.find(a => a.role === presetRole.roleName || a.role === presetRole);
      if (acc) {
        setEmail(acc.email);
        setPassword('password123');
      } else {
        setEmail('student1@college.edu');
      }
    } else {
      setEmail('student1@college.edu');
    }
  }, [presetRole]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await api.login(email, password || 'password123');
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (acc) => {
    setEmail(acc.email);
    setPassword('password123');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {presetRole?.title || 'CampusVibe Login'}
          </h2>
          <p className="text-xs text-slate-400">Sign in to access your role-based dashboard</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In & Enter Dashboard'}</span>
          </button>
        </form>

        {/* 3 Core Roles Preset Quick Select */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Switch Account Preset</p>
          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handlePresetSelect(acc)}
                className={`w-full p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                  email === acc.email
                    ? 'bg-indigo-950/60 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <span className="font-bold text-indigo-300">{acc.role}</span>
                  <span className="text-slate-400 ml-2">({acc.name})</span>
                </div>
                {email === acc.email && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
