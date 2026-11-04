import React, { useState } from 'react';
import { User, VoicePeer } from '../types';
import { Bot, Crown, MessageSquare, Radio, Shield, Tv, Volume2, X } from 'lucide-react';

interface MemberListProps {
  members: User[];
  voicePeers: VoicePeer[];
  currentUser: User;
  onClose?: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  voicePeers,
  currentUser,
  onClose,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Group members
  const onlineMembers = members.filter((m) => m.status !== 'offline');
  const hosts = onlineMembers.filter((m) => m.role === 'host' || m.id === 'sys-nexus');
  const regularMembers = onlineMembers.filter(
    (m) => m.role !== 'host' && m.id !== 'sys-nexus' && m.role !== 'bot'
  );

  return (
    <div className="w-60 bg-[#2b2d31] border-l border-[#1f2023] flex flex-col shrink-0 select-none overflow-hidden relative">
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between font-bold text-xs uppercase tracking-wider text-zinc-400">
        <span>Members — {onlineMembers.length}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#35373c] text-zinc-400 hover:text-white"
            title="Close Member List"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar">
        {/* Host Section */}
        {hosts.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase px-2">
              Server Host & Admins — {hosts.length}
            </div>
            {hosts.map((user) => (
              <MemberItem
                key={user.id}
                user={user}
                isVoiceActive={voicePeers.some((p) => p.id === user.id)}
                isScreenSharing={voicePeers.some((p) => p.id === user.id && p.isScreenSharing)}
                onClick={() => setSelectedUser(user)}
              />
            ))}
          </div>
        )}

        {/* Online Members Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase px-2">
            Online — {regularMembers.length}
          </div>
          {regularMembers.map((user) => (
            <MemberItem
              key={user.id}
              user={user}
              isVoiceActive={voicePeers.some((p) => p.id === user.id)}
              isScreenSharing={voicePeers.some((p) => p.id === user.id && p.isScreenSharing)}
              onClick={() => setSelectedUser(user)}
            />
          ))}
        </div>
      </div>

      {/* User Profile Card Modal / Popover */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-80 bg-[#1e1f22] border border-[#35373c] rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner Header */}
            <div className="h-20 bg-gradient-to-r from-indigo-600 to-emerald-600 relative">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar and Details */}
            <div className="px-5 pb-5 pt-0 relative">
              <div className="relative -mt-10 mb-3 w-20 h-20">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-20 h-20 rounded-full border-4 border-[#1e1f22] bg-zinc-800 object-cover shadow-xl"
                />
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e1f22] ${
                    selectedUser.status === 'online'
                      ? 'bg-emerald-500'
                      : selectedUser.status === 'idle'
                      ? 'bg-amber-500'
                      : selectedUser.status === 'dnd'
                      ? 'bg-red-500'
                      : 'bg-zinc-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">{selectedUser.name}</h3>
                  {selectedUser.role === 'host' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Crown className="w-3 h-3" /> HOST
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono">@{selectedUser.id}</p>
                {selectedUser.customStatus && (
                  <p className="text-xs text-zinc-300 italic pt-1">
                    "{selectedUser.customStatus}"
                  </p>
                )}
              </div>

              <div className="h-[1px] bg-[#313338] my-4" />

              {/* Roles */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Roles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#2b2d31] text-indigo-300 border border-indigo-500/20 font-medium">
                    {selectedUser.role === 'host' ? 'Server Host' : 'Verified Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MemberItemProps {
  user: User;
  isVoiceActive: boolean;
  isScreenSharing: boolean;
  onClick: () => void;
}

const MemberItem: React.FC<MemberItemProps> = ({
  user,
  isVoiceActive,
  isScreenSharing,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#35373c]/50 text-left transition-colors group"
    >
      <div className="flex items-center gap-2.5 truncate">
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${
              user.status === 'online'
                ? 'bg-emerald-500'
                : user.status === 'idle'
                ? 'bg-amber-500'
                : user.status === 'dnd'
                ? 'bg-red-500'
                : 'bg-zinc-500'
            }`}
          />
        </div>

        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
              {user.name}
            </span>
            {user.role === 'host' && (
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            {user.id === 'sys-nexus' && (
              <span className="bg-indigo-600 text-white text-[9px] font-bold px-1 rounded uppercase">
                BOT
              </span>
            )}
          </div>
          {user.customStatus && (
            <p className="text-[11px] text-zinc-400 truncate">{user.customStatus}</p>
          )}
        </div>
      </div>

      {/* Voice / Screen Share Indicator */}
      <div className="flex items-center gap-1 shrink-0">
        {isScreenSharing && (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-1 rounded flex items-center gap-0.5">
            <Tv className="w-2.5 h-2.5" /> LIVE
          </span>
        )}
        {isVoiceActive && !isScreenSharing && (
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>
    </button>
  );
};
