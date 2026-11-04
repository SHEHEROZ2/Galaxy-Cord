import React from 'react';
import {
  BookOpen,
  Cloud,
  Code2,
  Cpu,
  Download,
  ExternalLink,
  Globe,
  HardDrive,
  Lock,
  Radio,
  Server,
  Shield,
  Terminal,
  Tv,
  Users,
  Volume2,
  X,
  Zap
} from 'lucide-react';

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHostModal: (tab?: 'pterodactyl' | 'download' | 'connect' | 'browser') => void;
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  isOpen,
  onClose,
  onOpenHostModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900/40 via-[#2b2d31] to-emerald-900/40 border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Galaxy Cord Architecture & Hosting Guide</h2>
              <p className="text-xs text-zinc-300">
                A Discord-like decentralized platform where everyone can host their own servers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-sm no-scrollbar">
          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Get the <code>nexus-server.mjs</code> file. It contains the complete WebSocket signaling server, channel manager, and persistent chat database in under 300 lines of code.
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
                    npm install ws && node nexus-server.mjs
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
                    Click <strong>"+ Add Server"</strong> in Galaxy Cord and enter <code>ws://localhost:8080</code>. You are now the host of your own private realm!
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
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <span>🦖 Host on Pterodactyl Panel (Egg)</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenHostModal('download');
                }}
                className="py-3 px-4 bg-[#111214] hover:bg-[#1a1b1e] text-zinc-300 hover:text-white font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>PC & Docker</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
