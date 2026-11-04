import React, { useState } from 'react';
import { FriendUser, User } from '../types';
import {
  Compass,
  Headphones,
  KeyRound,
  Mic,
  MicOff,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface DirectMessagesSidebarProps {
  currentUser: User;
  friends: FriendUser[];
  activeDmUserId: string | null;
  onSelectFriendsHub: () => void;
  onSelectDmUser: (friendId: string) => void;
  onOpenUserSettings: () => void;
  onOpenAuthModal: () => void;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  pendingRequestsCount: number;
  onNavigateToCommunity?: () => void;
  onCloseMobileNav?: () => void;
}

export const DirectMessagesSidebar: React.FC<DirectMessagesSidebarProps> = ({
  currentUser,
  friends,
  activeDmUserId,
  onSelectFriendsHub,
  onSelectDmUser,
  onOpenUserSettings,
  onOpenAuthModal,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  pendingRequestsCount,
  onNavigateToCommunity,
  onCloseMobileNav,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Active friends with whom we can DM
  const dmFriends = friends.filter((f) => f.relationship === 'friends');
  const filteredDmFriends = dmFriends.filter((f) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.tag.includes(q);
  });

  return (
    <div className="w-60 sm:w-64 bg-[#2b2d31] flex flex-col h-full z-20 shrink-0 select-none border-r border-[#1f2023]">
      {/* Search Header */}
      <div className="h-12 border-b border-[#1f2023] px-3 flex items-center justify-between shadow-sm">
        <div className="relative w-full">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Find or start a conversation"
            className="w-full bg-[#1e1f22] text-xs text-white placeholder-zinc-400 px-2.5 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Main navigation list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 no-scrollbar">
        {/* Friends Hub Button */}
        <div>
          <button
            onClick={() => {
              onSelectFriendsHub();
              if (onCloseMobileNav) onCloseMobileNav();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeDmUserId === null
                ? 'bg-[#35373c] text-white font-bold shadow-sm'
                : 'text-zinc-300 hover:bg-[#35373c]/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Friends</span>
            </div>

            {pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Return to Community Server button */}
        {onNavigateToCommunity && (
          <div>
            <button
              onClick={() => {
                onNavigateToCommunity();
                if (onCloseMobileNav) onCloseMobileNav();
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 hover:text-white rounded-lg text-xs font-bold border border-indigo-700/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Global Community</span>
              </div>
              <span className="text-[10px] bg-indigo-800/60 px-1.5 py-0.2 rounded text-indigo-200">
                Servers
              </span>
            </button>
          </div>
        )}

        {/* Direct Messages Section Header */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
            <span>Direct Messages</span>
            <button
              onClick={() => {
                onSelectFriendsHub();
              }}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#35373c]"
              title="Create DM / Add Friend"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* DMs list */}
          <div className="space-y-0.5 mt-1">
            {filteredDmFriends.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-500">
                {filterQuery ? 'No match found' : 'No friends yet. Add friends to start chatting!'}
              </div>
            ) : (
              filteredDmFriends.map((friend) => {
                const isActive = activeDmUserId === friend.id;

                return (
                  <button
                    key={friend.id}
                    onClick={() => {
                      onSelectDmUser(friend.id);
                      if (onCloseMobileNav) onCloseMobileNav();
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-[#35373c] text-white font-bold'
                        : 'text-zinc-400 hover:bg-[#35373c]/50 hover:text-zinc-200'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r-full" />
                    )}

                    <div className="flex items-center gap-2.5 truncate">
                      <div className="relative shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-8 h-8 rounded-full object-cover bg-zinc-800"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${
                            friend.status === 'online'
                              ? 'bg-emerald-500'
                              : friend.status === 'idle'
                              ? 'bg-amber-500'
                              : friend.status === 'dnd'
                              ? 'bg-red-500'
                              : 'bg-zinc-500'
                          }`}
                        />
                      </div>
                      <div className="truncate text-left">
                        <div className="text-sm font-semibold text-white truncate flex items-center gap-1">
                          <span>{friend.name}</span>
                          <span className="text-zinc-500 text-[10px] font-mono">#{friend.tag}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {friend.customStatus || friend.bio || (friend.status === 'online' ? 'Online' : 'Offline')}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Account System Banner (if not registered) */}
      {!currentUser.isRegistered && (
        <div className="p-2.5 mx-2 mb-2 bg-gradient-to-r from-indigo-900/40 to-indigo-800/30 border border-indigo-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Guest Account</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">#{currentUser.tag || 'temp'}</span>
          </div>
          <p className="text-[10px] text-zinc-300 leading-tight mb-2">
            Create an account to keep your friends, tag, and DMs across devices!
          </p>
          <button
            onClick={onOpenAuthModal}
            className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3 h-3" />
            <span>Create Account / Login</span>
          </button>
        </div>
      )}

      {/* Bottom User Controls Footer */}
      <div className="h-14 bg-[#232428] px-2 flex items-center justify-between border-t border-[#1f2023]">
        {/* User Card */}
        <div
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 p-1 rounded-md hover:bg-[#35373c] transition-colors cursor-pointer truncate max-w-[130px] group"
          title="Account Settings & Profile"
        >
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full bg-zinc-700 object-cover ring-1 ring-zinc-700"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${
                currentUser.status === 'online'
                  ? 'bg-emerald-500'
                  : currentUser.status === 'idle'
                  ? 'bg-amber-500'
                  : currentUser.status === 'dnd'
                  ? 'bg-red-500'
                  : 'bg-zinc-500'
              }`}
            />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate leading-tight group-hover:text-indigo-300 flex items-center gap-1">
              <span className="truncate">{currentUser.name}</span>
              {(currentUser.role === 'admin' || currentUser.name.toLowerCase() === 'galaxy505g') && (
                <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-1 rounded border border-purple-800/40 shrink-0">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400 truncate font-mono">
              #{currentUser.tag || '1234'}
            </div>
          </div>
        </div>

        {/* Action Buttons: Mic, Deafen, Settings */}
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg hover:bg-[#35373c] hover:text-zinc-200 transition-all cursor-pointer active:scale-95 ${
              isMuted ? 'text-red-400 bg-red-500/10 hover:text-red-300' : ''
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleDeafen}
            className={`p-2 rounded-lg hover:bg-[#35373c] hover:text-zinc-200 transition-all cursor-pointer active:scale-95 ${
              isDeafened ? 'text-red-400 bg-red-500/10 hover:text-red-300' : ''
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenUserSettings}
            className="p-2 rounded-lg hover:bg-[#35373c] hover:text-zinc-200 transition-all cursor-pointer active:scale-95"
            title="User Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
