import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { createAudioLevelMeter, isSoundEffectsEnabled, setSoundEffectsEnabled } from '../utils/audio';
import {
  Bell,
  Check,
  Headphones,
  Mic,
  Moon,
  Radio,
  Sliders,
  Sparkles,
  User as UserIcon,
  Volume2,
  X
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onOpenAuthModal?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo',
  'https://api.dicebear.com/7.x/identicon/svg?seed=NexusAlpha',
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenAuthModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'voice'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [status, setStatus] = useState(currentUser.status);
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [soundsOn, setSoundsOn] = useState(isSoundEffectsEnabled());

  // Mic test
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const testStreamRef = useRef<MediaStream | null>(null);
  const stopMeterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setName(currentUser.name);
    setAvatar(currentUser.avatar);
    setStatus(currentUser.status);
    setCustomStatus(currentUser.customStatus || '');
  }, [currentUser]);

  // Clean up mic test when modal closes
  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const toggleMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStreamRef.current = stream;
        setIsTestingMic(true);

        stopMeterRef.current = createAudioLevelMeter(stream, (volume) => {
          setMicLevel(volume);
        });
      } catch (err) {
        console.warn('Mic access denied:', err);
      }
    }
  };

  const stopMicTest = () => {
    if (stopMeterRef.current) {
      stopMeterRef.current();
      stopMeterRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    setIsTestingMic(false);
    setMicLevel(0);
  };

  const handleSave = () => {
    stopMicTest();
    onUpdateUser({
      name: name.trim() || currentUser.name,
      avatar,
      status,
      customStatus: customStatus.trim(),
    });
    setSoundEffectsEnabled(soundsOn);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-[#35373c] flex items-center justify-between bg-[#2b2d31]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-400" />
            <span>User Settings</span>
          </h2>
          <button
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#35373c] bg-[#17181a] px-5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'voice'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice & Audio</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-sm no-scrollbar">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Account Status & Tag Banner */}
              <div className="p-4 bg-[#2b2d31] border border-[#3f4147] rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Tag:</span>
                    <span className="text-sm font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700/50">
                      {currentUser.name}#{currentUser.tag || '1234'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {currentUser.isRegistered
                      ? `Registered Account (${currentUser.email || 'Email linked'})`
                      : 'Temporary Guest Account'}
                  </div>
                </div>

                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                  >
                    {currentUser.isRegistered ? 'Manage Account' : 'Register / Login'}
                  </button>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-[#3f4147] rounded-lg px-3.5 py-2 text-white font-medium outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Online Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                    { id: 'idle', label: 'Idle', color: 'bg-amber-500' },
                    { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500' },
                    { id: 'offline', label: 'Invisible', color: 'bg-zinc-500' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        status === s.id
                          ? 'bg-[#2b2d31] border-indigo-500 text-white'
                          : 'bg-[#1e1f22] border-[#35373c] text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${s.color}`} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Status Message */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                  Custom Status Note
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="e.g. Hosting a private server | Playing CS2"
                  className="w-full bg-[#2b2d31] border border-[#3f4147] rounded-lg px-3.5 py-2 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Choose Avatar
                </label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_PRESETS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`relative rounded-full overflow-hidden p-0.5 border-2 transition-transform hover:scale-110 ${
                        avatar === presetUrl ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={presetUrl}
                        alt="Preset"
                        className="w-12 h-12 rounded-full object-cover bg-zinc-800"
                      />
                      {avatar === presetUrl && (
                        <span className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center rounded-full text-white">
                          <Check className="w-5 h-5 font-bold" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Mic Test Section */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Microphone Test</span>
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Speak into your microphone to verify input levels and voice activity.
                    </p>
                  </div>
                  <button
                    onClick={toggleMicTest}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                      isTestingMic
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                    }`}
                  >
                    {isTestingMic ? 'Stop Test' : "Let's Check"}
                  </button>
                </div>

                {/* Level Meter Bar */}
                <div className="w-full bg-[#1e1f22] h-4 rounded-full overflow-hidden p-0.5 border border-[#35373c]">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(100, micLevel * 100 * 2.5)}%` }}
                  />
                </div>
                {isTestingMic && (
                  <p className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                    Listening to microphone... Say something!
                  </p>
                )}
              </div>

              {/* Sound Effects Toggle */}
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Sound Effects & Audio Chimes</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Play synthesized tones when joining voice, muting, or receiving messages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundsOn(!soundsOn)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    soundsOn ? 'bg-indigo-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      soundsOn ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#2b2d31] border-t border-[#35373c] flex justify-end gap-3">
          <button
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-[#35373c]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
