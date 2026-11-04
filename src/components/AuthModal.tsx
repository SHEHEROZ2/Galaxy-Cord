import React, { useState } from 'react';
import { User } from '../types';
import {
  Check,
  Copy,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAuthSuccess: (user: User) => void;
  onLogout: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowPilot',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNova',
  'https://api.dicebear.com/7.x/bottts/svg?seed=QuantumSky',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NexusGhost',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
}) => {
  // Always declare hooks at the top level
  const [mode, setMode] = useState<'register' | 'login' | 'profile'>(
    currentUser.isRegistered ? 'profile' : 'register'
  );

  // Register form state
  const [regUsername, setRegUsername] = useState(currentUser.name || '');
  const [regEmail, setRegEmail] = useState(currentUser.email || '');
  const [regPassword, setRegPassword] = useState('');
  const [regBio, setRegBio] = useState(currentUser.bio || 'Exploring Galaxy Cord');
  const [regAvatar, setRegAvatar] = useState(currentUser.avatar || AVATAR_PRESETS[0]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedTag, setCopiedTag] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regUsername.trim()) {
      setError('Please choose a username');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          avatar: regAvatar,
          bio: regBio.trim(),
          guestId: currentUser.id, // Upgrades current guest account smoothly
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccessMsg(`Welcome, ${data.user.name}#${data.user.tag}! Account created successfully.`);
      onAuthSuccess(data.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Please enter your username/email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setSuccessMsg(`Logged in as ${data.user.name}#${data.user.tag}!`);
      onAuthSuccess(data.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click login for test demo accounts
  const handleQuickDemoLogin = async (identifier: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password: 'password123',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      setSuccessMsg(`Switched to ${data.user.name}#${data.user.tag}!`);
      onAuthSuccess(data.user);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyUserTag = () => {
    const fullTag = `${currentUser.name}#${currentUser.tag || '0000'}`;
    navigator.clipboard.writeText(fullTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-[#313338] border border-[#3f4147] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 bg-[#2b2d31] border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Galaxy Cord Account</h2>
              <p className="text-[11px] text-zinc-400">Save your identity and connect with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#232428] bg-[#1e1f22] p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>

          {currentUser.isRegistered && (
            <button
              type="button"
              onClick={() => {
                setMode('profile');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'profile'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-[#2b2d31]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          )}
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 font-medium">
            {successMsg}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* REGISTER TAB */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. NeonPilot"
                    required
                    className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm font-medium"
                  />
                  {regUsername.trim() && (
                    <span className="absolute right-3 top-2.5 text-zinc-500 text-xs font-mono">
                      #{currentUser.tag || '1234'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  You will get a unique tag like <strong className="text-indigo-300">@{regUsername || 'Username'}#1234</strong> for adding friends.
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                  Email <span className="text-zinc-500 lowercase">(optional for recovery)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@nexuscord.io"
                    className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                  Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  required
                  className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                  About Me / Bio
                </label>
                <input
                  type="text"
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Hey there! I am using Galaxy Cord."
                  className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1.5 text-[11px]">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.map((pUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRegAvatar(pUrl)}
                      className={`relative rounded-xl overflow-hidden p-0.5 border-2 transition-all ${
                        regAvatar === pUrl
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105'
                          : 'border-transparent hover:border-zinc-500'
                      }`}
                    >
                      <img src={pUrl} alt="Avatar" className="w-full h-11 object-cover rounded-lg bg-zinc-800" />
                      {regAvatar === pUrl && (
                        <span className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 font-bold" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* LOGIN TAB */}
          {mode === 'login' && (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                    Username, Tag, or Email
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Elena#1001 or elena@nexus.io"
                    required
                    className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>
              </form>

              {/* Quick Demo Switcher */}
              <div className="pt-2 border-t border-[#232428]">
                <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[11px] uppercase tracking-wider mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Demo Account Logins (1-Click)</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'user-elena', name: 'Elena Rostova', tag: '1001', role: 'Online / Voice host' },
                    { id: 'user-marcus', name: 'Marcus Vance', tag: '2048', role: 'VPS Server Host' },
                    { id: 'user-cybernova', name: 'CyberNova', tag: '7777', role: 'Gamer / Streamer' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(acc.id)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] border border-[#383a40] text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {acc.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs group-hover:text-indigo-300">
                            {acc.name}
                            <span className="text-zinc-500 text-[10px] ml-1">#{acc.tag}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">{acc.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700/40">
                        Switch
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE / LOGGED IN TAB */}
          {mode === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-xl flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/50 bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white truncate">{currentUser.name}</span>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      #{currentUser.tag || '0000'}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-xs truncate mt-0.5">
                    {currentUser.email || 'Registered Nexus User'}
                  </div>
                  {currentUser.bio && (
                    <div className="text-zinc-300 text-[11px] italic mt-1 bg-[#1e1f22] p-1.5 rounded border border-[#35373c]">
                      "{currentUser.bio}"
                    </div>
                  )}
                </div>
              </div>

              {/* Tag share card */}
              <div className="p-3 bg-[#1e1f22] border border-[#35373c] rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-zinc-400">Your Friend Tag:</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {currentUser.name}#{currentUser.tag || '0000'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyUserTag}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow"
                >
                  {copiedTag ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTag ? 'Copied!' : 'Copy Tag'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out (Switch to Guest)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
