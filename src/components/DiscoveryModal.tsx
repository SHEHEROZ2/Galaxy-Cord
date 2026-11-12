import React, { useState } from 'react';
import { Server } from '../types';
import { ALL_ONLINE_SERVERS } from '../utils/onlineServers';
import {
  Compass,
  Download,
  HardDrive,
  Radio,
  Search,
  Server as ServerIcon,
  Sparkles,
  Terminal,
  Tv,
  Users,
  Volume2,
  X,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHostModal: (tab?: 'pterodactyl' | 'download' | 'connect' | 'browser') => void;
  onSelectServer?: (server: Server) => void;
  activeServerId?: string;
  servers?: Server[];
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  isOpen,
  onClose,
  onOpenHostModal,
  onSelectServer,
  activeServerId,
  servers,
}) => {
  const [activeTab, setActiveTab] = useState<'servers' | 'guide'>('servers');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'official' | 'custom'>('all');

  if (!isOpen) return null;

  const onlineServersList = servers && servers.length > 0 ? servers : ALL_ONLINE_SERVERS;

  const seenIds = new Set<string>();
  const filteredServers = onlineServersList.filter((srv) => {
    if (!srv.id || seenIds.has(srv.id)) return false;
    seenIds.add(srv.id);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      srv.name.toLowerCase().includes(q) ||
      (srv.description && srv.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (categoryFilter === 'official') return srv.isDefault === true;
    if (categoryFilter === 'custom') return !srv.isDefault;

    return true;
  });


  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-100 font-sans">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-[#2b2d31] to-emerald-950 border-b border-[#35373c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Galaxy Cord Server Discovery</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineServersList.length} Online Realms
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Explore, jump into, and chat in all active servers across the Galaxy Cord network.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2.5 bg-[#232428] border-b border-[#313338] shrink-0">
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'servers'
                ? 'bg-[#1e1f22] text-white border-t-2 border-indigo-500'
                : 'text-zinc-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <ServerIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Online Servers ({onlineServersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-[#1e1f22] text-white border-t-2 border-amber-500'
                : 'text-zinc-400 hover:text-white hover:bg-[#2b2d31]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Host Your Own Server</span>
          </button>
        </div>

        {/* TAB 1: ALL ONLINE SERVERS EXPLORER */}
        {activeTab === 'servers' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
            {/* Search & Categories Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between bg-[#2b2d31] p-3 rounded-xl border border-[#383a40]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search servers by name..."
                  className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                {(['all', 'official', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-colors cursor-pointer shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1e1f22] text-zinc-400 hover:text-white border border-[#35373c]'
                    }`}
                  >
                    {cat === 'all' ? 'All Realms' : cat === 'official' ? 'Official Hub' : 'Custom Nodes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Server Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredServers.map((srv, idx) => {
                const isCurrentActive = srv.id === activeServerId;
                const simulatedMembers = 12 + ((idx * 7) % 18);
                const simulatedVoice = 2 + (idx % 5);

                return (
                  <div
                    key={srv.id}
                    className="p-4 bg-[#2b2d31] hover:bg-[#2f3136] border border-[#383a40] rounded-xl flex flex-col justify-between transition-all group shadow-sm hover:border-indigo-500/40"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1e1f22] to-[#383a40] border border-[#44464d] flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform overflow-hidden p-1.5">
                            {srv.icon && (srv.icon.startsWith('/') || srv.icon.startsWith('http')) ? (
                              <img src={srv.icon} alt={srv.name} className="w-full h-full object-contain" />
                            ) : (
                              <span>{srv.icon || '🌌'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                              <span className="truncate">{srv.name}</span>
                              {srv.isDefault && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700 shrink-0">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">
                              {srv.description}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ONLINE</span>
                        </span>
                      </div>

                      {/* Channels & Info badges */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1 bg-[#1e1f22] px-2 py-0.5 rounded border border-[#35373c] text-zinc-300 font-medium">
                          <Users className="w-3 h-3 text-indigo-400" />
                          <span>{simulatedMembers} members online</span>
                        </div>
                        {simulatedVoice > 0 && (
                          <div className="flex items-center gap-1 bg-[#1e1f22] px-2 py-0.5 rounded border border-[#35373c] text-emerald-400 font-medium">
                            <Radio className="w-3 h-3" />
                            <span>{simulatedVoice} in voice</span>
                          </div>
                        )}
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {srv.channels.length} channels
                        </span>
                      </div>
                    </div>

                    {/* Footer: Join Button */}
                    <div className="mt-4 pt-3 border-t border-[#383a40] flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]">
                        {srv.url}
                      </span>

                      {isCurrentActive ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Currently Connected</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (onSelectServer) {
                              onSelectServer(srv);
                              onClose();
                            }
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                        >
                          <span>Join Server</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SELF-HOSTING GUIDE */}
        {activeTab === 'guide' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-zinc-300 text-sm no-scrollbar">
            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#35373c] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Ultra Low-Latency Voice</h4>
                <p className="text-xs text-zinc-400">
                  Direct WebRTC peer-to-peer audio mesh with real-time volume detection, speaking glow rings, and mute controls.
                </p>
              </div>

              <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#35373c] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                  <Tv className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">1080p 60fps Screen Share</h4>
                <p className="text-xs text-zinc-400">
                  Share games, windows, or full desktops in HD. Features Theater / Spotlight mode, Grid view, and Fullscreen.
                </p>
              </div>

              <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#35373c] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Self-Hosted Servers</h4>
                <p className="text-xs text-zinc-400">
                  Anyone can host their own server with a single lightweight Node.js script or Docker container. Zero corporate spying.
                </p>
              </div>
            </div>

            {/* How Hosting Works */}
            <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <span>How To Host Your Own Server</span>
              </h3>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Download the Standalone Server Engine:</strong>
                    <p className="text-xs text-zinc-400">
                      Get the <code>nexus-server.mjs</code> file. It contains the complete WebSocket signaling server, channel manager, and persistent chat database.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Run Node.js:</strong>
                    <div className="bg-[#111214] p-2 rounded font-mono text-xs text-emerald-400 my-1 border border-[#35373c]">
                      npm install ws && node server.js
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Connect & Chat:</strong>
                    <p className="text-xs text-zinc-400">
                      Click <strong>"+ Add Server"</strong> in Galaxy Cord and enter <code>ws://localhost:3000/ws</code>. You are now the host of your own private realm!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenHostModal('pterodactyl');
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🦖 Host on Pterodactyl Panel (Egg)</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenHostModal('download');
                  }}
                  className="py-3 px-4 bg-[#111214] hover:bg-[#1a1b1e] text-zinc-300 hover:text-white font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>PC & Docker</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
