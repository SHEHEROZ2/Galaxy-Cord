import React, { useState } from 'react';
import { Channel, Server, User, VoicePeer } from '../types';
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Hash,
  Headphones,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Plus,
  Radio,
  Settings,
  Share2,
  Tv,
  UserPlus,
  Video,
  VideoOff,
  Volume2,
  X,
  Zap
} from 'lucide-react';

interface ChannelSidebarProps {
  server: Server;
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (channel: Channel) => void;
  currentUser: User;
  voicePeers: VoicePeer[];
  currentVoiceChannelId: string | null;
  onJoinVoice: (channelId: string) => void;
  onLeaveVoice: () => void;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare: () => void;
  onToggleCamera: () => void;
  onOpenCreateChannel: (category: string, type: 'text' | 'voice') => void;
  onOpenUserSettings: () => void;
  onOpenServerSettings: () => void;
  onOpenHostModal: () => void;
  onOpenInvite: () => void;
  onOpenAuthModal?: () => void;
  latency: number;
  onNavigateToCommunity?: (channelId?: string) => void;
  onCloseMobileNav?: () => void;
  members?: User[];
  isConnected?: boolean;
  connectionError?: string | null;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  server,
  channels,
  activeChannelId,
  onSelectChannel,
  currentUser,
  voicePeers,
  currentVoiceChannelId,
  onJoinVoice,
  onLeaveVoice,
  isMuted,
  isDeafened,
  isScreenSharing,
  isCameraOn,
  isSpeaking,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onToggleCamera,
  onOpenCreateChannel,
  onOpenUserSettings,
  onOpenServerSettings,
  onOpenHostModal,
  onOpenInvite,
  onOpenAuthModal,
  latency,
  onNavigateToCommunity,
  onCloseMobileNav,
  members = [],
  isConnected = true,
  connectionError = null,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Group channels by category
  const categories = Array.from(new Set(channels.map((c) => c.category || 'CHANNELS')));

  const currentVoiceChannel = channels.find((c) => c.id === currentVoiceChannelId);

  // Get all members in a given voice channel (both local peer connections and server presence)
  const getPeersInChannel = (channelId: string) => {
    const list: VoicePeer[] = [];

    // Current user in this channel
    if (currentVoiceChannelId === channelId) {
      list.push({
        id: currentUser.id,
        name: `${currentUser.name} (You)`,
        avatar: currentUser.avatar,
        status: currentUser.status,
        isMuted,
        isDeafened,
        isScreenSharing,
        isCameraOn,
        isSpeaking,
      });

      // Voice peers from direct WebRTC room
      voicePeers.forEach((p) => {
        if (p.id !== currentUser.id && !list.some((existing) => existing.id === p.id)) {
          list.push(p);
        }
      });
    }

    // Also include any server members known to be in this voice channel from server presence
    if (Array.isArray(members)) {
      members.forEach((m) => {
        if (m.currentVoiceChannelId === channelId && m.id !== currentUser.id && !list.some((existing) => existing.id === m.id)) {
          list.push({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            status: m.status,
            isMuted: m.isMuted ?? false,
            isDeafened: m.isDeafened ?? false,
            isScreenSharing: m.isScreenSharing ?? false,
            isCameraOn: m.isCameraOn ?? false,
            isSpeaking: m.isSpeaking ?? false,
          });
        }
      });
    }

    return list;
  };

  return (
    <div className="flex-1 lg:w-60 lg:flex-initial lg:shrink-0 bg-[#2b2d31] flex flex-col border-r border-[#1f2023] z-10 h-full min-w-0">
      {/* Server Header Dropdown & Mobile Close */}
      <div className="relative">
        <div className="flex items-center border-b border-[#1f2023] shadow-sm">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex-1 h-12 px-3 sm:px-4 flex items-center justify-between font-bold text-white hover:bg-[#35373c] transition-colors truncate cursor-pointer touch-manipulation"
          >
            <div className="flex items-center gap-1.5 truncate">
              {server.isSelfHosted && (
                <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 shrink-0">
                  Self-Hosted
                </span>
              )}
              <span className="truncate text-sm sm:text-base">{server.name}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-300 transition-transform duration-200 shrink-0 ml-1 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {onCloseMobileNav && (
            <button
              onClick={onCloseMobileNav}
              className="lg:hidden h-12 px-3 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white flex items-center gap-1.5 shrink-0 border-l border-[#1f2023] text-xs font-bold transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Open Current Channel"
              aria-label="Open Current Channel"
            >
              <span>Chat</span>
              <ChevronRight className="w-4 h-4 text-indigo-300" />
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute top-13 left-2 right-2 bg-[#111214] border border-[#2b2d31] rounded-lg p-1.5 shadow-2xl z-40 space-y-1 text-sm font-medium">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenHostModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Host on Pterodactyl / PC</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenInvite();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Friends / Server Link</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenCreateChannel('TEXT CHANNELS', 'text');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-zinc-300 hover:bg-[#35373c] hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4 text-zinc-400" />
                <span>Create Channel</span>
              </button>
              <div className="h-[1px] bg-[#2b2d31] my-1" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenServerSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-zinc-300 hover:bg-[#35373c] hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Server Diagnostics & Info</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Self-hosted connection status badge & error banner */}
      {server.isSelfHosted && (
        <div className="px-3 py-2 border-b border-[#1f2023] space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isConnected && !connectionError
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : connectionError
                    ? 'bg-red-400'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className={`truncate font-medium ${connectionError ? 'text-red-400' : 'text-zinc-300'}`}>
                {isConnected && !connectionError
                  ? 'Secure Bridge Active'
                  : connectionError
                  ? 'Node Unreachable'
                  : 'Connecting to Node...'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-1">
              {isConnected && !connectionError ? (latency > 0 ? `${latency}ms` : 'Online') : connectionError ? 'Offline' : 'Syncing'}
            </span>
          </div>

          {connectionError && (
            <div className="p-2 rounded bg-red-950/40 border border-red-800/40 text-red-200 text-[11px] space-y-1.5">
              <p className="line-clamp-2 text-[10px] text-red-300">{connectionError}</p>
              <div className="flex items-center gap-1.5 pt-1">
                {onNavigateToCommunity && (
                  <button
                    onClick={() => onNavigateToCommunity()}
                    className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded text-[10px] transition-colors cursor-pointer"
                  >
                    Go to Global Hub
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-2 py-1 bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 font-medium rounded text-[10px] transition-colors border border-zinc-700 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigate to Community Server Banner (if on self-hosted or other server) */}
      {server.id !== 'nexus-global-community' && onNavigateToCommunity && (
        <div className="px-2 pt-2 pb-1">
          <button
            onClick={() => onNavigateToCommunity(activeChannelId)}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-gradient-to-r from-indigo-600/30 to-indigo-500/20 hover:from-indigo-600 hover:to-indigo-500 text-indigo-300 hover:text-white rounded-lg text-xs font-bold border border-indigo-500/30 transition-all shadow-md group"
            title="Navigate back to Community Server"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400 group-hover:text-white transition-transform group-hover:rotate-45" />
              <span>Navigate to Community</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-white" />
          </button>
        </div>
      )}

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar touch-pan-y overscroll-contain">
        {categories.map((category) => {
          const categoryChannels = channels.filter(
            (c) => (c.category || 'CHANNELS') === category
          );

          return (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold tracking-wider text-zinc-400 uppercase group">
                <span className="truncate">{category}</span>
                <button
                  onClick={() =>
                    onOpenCreateChannel(
                      category,
                      category.toLowerCase().includes('voice') ? 'voice' : 'text'
                    )
                  }
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity p-1 cursor-pointer touch-manipulation"
                  title="Create Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Channels */}
              {categoryChannels.map((channel) => {
                const isText = channel.type === 'text';
                const isVoice = channel.type === 'voice';
                const isActive = activeChannelId === channel.id;
                const isCurrentVoice = currentVoiceChannelId === channel.id;
                const peersInChannel = isVoice ? getPeersInChannel(channel.id) : [];

                return (
                  <div key={channel.id} className="space-y-1">
                    <button
                      onClick={() => {
                        onSelectChannel(channel);
                        if (isVoice) {
                          onJoinVoice(channel.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer active:scale-[0.99] touch-manipulation ${
                        isActive
                          ? 'bg-[#35373c] text-white font-bold shadow-sm'
                          : 'text-zinc-400 hover:bg-[#35373c]/50 hover:text-zinc-200'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r-full" />
                      )}
                      <div className="flex items-center gap-2 truncate">
                        {isText ? (
                          <Hash
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'
                            }`}
                          />
                        ) : (
                          <Volume2
                            className={`w-4 h-4 shrink-0 ${
                              isCurrentVoice || isActive
                                ? 'text-emerald-400'
                                : 'text-zinc-400 group-hover:text-zinc-300'
                            }`}
                          />
                        )}
                        <span className="truncate">{channel.name}</span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/40">
                            Active
                          </span>
                        )}
                        {isVoice && peersInChannel.length > 0 && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-[#1e1f22] text-zinc-300">
                            {peersInChannel.length}
                          </span>
                        )}
                        {channel.unreadCount && channel.unreadCount > 0 ? (
                          <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {channel.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>

                    {/* Voice Members List under voice channel */}
                    {isVoice && peersInChannel.length > 0 && (
                      <div className="pl-6 pr-1 space-y-1 pb-1">
                        {peersInChannel.map((peer) => (
                          <div
                            key={peer.id}
                            className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-[#35373c]/30 text-xs text-zinc-300"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {/* Avatar with speaking ring */}
                              <div className="relative shrink-0">
                                <img
                                  src={peer.avatar}
                                  alt={peer.name}
                                  className={`w-6 h-6 rounded-full bg-zinc-700 object-cover transition-all ${
                                    peer.isSpeaking
                                      ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#2b2d31]'
                                      : ''
                                  }`}
                                />
                                {peer.isSpeaking && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                              </div>
                              <span className="truncate font-medium">{peer.name}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {peer.isScreenSharing && (
                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-1 rounded flex items-center gap-0.5">
                                  <Tv className="w-2.5 h-2.5" /> LIVE
                                </span>
                              )}
                              {peer.isCameraOn && (
                                <Video className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                              {peer.isMuted && (
                                <MicOff className="w-3.5 h-3.5 text-red-400" />
                              )}
                              {peer.isDeafened && (
                                <Headphones className="w-3.5 h-3.5 text-red-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Connected Voice Channel Status Panel */}
      {currentVoiceChannelId && currentVoiceChannel && (
        <div className="p-3 bg-[#111214] border-t border-[#1f2023] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <div className="truncate">
                <div className="text-xs font-bold text-emerald-400 truncate leading-tight">
                  Voice Connected
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {currentVoiceChannel.name} {latency > 0 ? `(${latency}ms)` : ''}
                </div>
              </div>
            </div>
            <button
              onClick={onLeaveVoice}
              className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
              title="Disconnect from Voice"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Voice Controls */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onToggleScreenShare}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                isScreenSharing
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-[#2b2d31] text-zinc-300 border-[#35373c] hover:bg-[#35373c] hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>
            <button
              onClick={onToggleCamera}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                isCameraOn
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/30'
                  : 'bg-[#2b2d31] text-zinc-300 border-[#35373c] hover:bg-[#35373c] hover:text-white'
              }`}
            >
              {isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              <span>{isCameraOn ? 'Camera On' : 'Camera'}</span>
            </button>
          </div>
        </div>
      )}

      {/* User Controls Footer */}
      <div className="h-14 bg-[#232428] px-2 flex items-center justify-between border-t border-[#1f2023]">
        {/* User Card */}
        <div
          onClick={onOpenAuthModal || onOpenUserSettings}
          className="flex items-center gap-2 p-1 rounded-md hover:bg-[#35373c] transition-colors cursor-pointer truncate max-w-[130px] group"
          title="Account & User Settings"
        >
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className={`w-8 h-8 rounded-full bg-zinc-700 object-cover ${
                isSpeaking && currentVoiceChannelId
                  ? 'ring-2 ring-emerald-400'
                  : ''
              }`}
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
            className={`p-2 rounded-lg hover:bg-[#35373c] hover:text-zinc-200 transition-all cursor-pointer active:scale-95 touch-manipulation ${
              isMuted ? 'text-red-400 bg-red-500/10 hover:text-red-300' : ''
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleDeafen}
            className={`p-2 rounded-lg hover:bg-[#35373c] hover:text-zinc-200 transition-all cursor-pointer active:scale-95 touch-manipulation ${
              isDeafened ? 'text-red-400 bg-red-500/10 hover:text-red-300' : ''
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
            aria-label={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenUserSettings}
            className="p-2 rounded-lg hover:bg-[#35373c] hover:text-zinc-200 transition-all cursor-pointer active:scale-95 touch-manipulation"
            title="User Settings"
            aria-label="User Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
