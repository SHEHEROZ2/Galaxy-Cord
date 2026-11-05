import React from 'react';
import { Server } from '../types';
import { Compass, Globe, HardDrive, Plus, Radio, Server as ServerIcon, Shield, Zap } from 'lucide-react';

interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string;
  onSelectServer: (server: Server) => void;
  onSelectDirectMessages: () => void;
  pendingRequestsCount?: number;
  onOpenJoinModal: () => void;
  onOpenHostModal: (defaultTab?: 'pterodactyl' | 'download' | 'connect' | 'browser') => void;
  onOpenDiscovery: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
  latency: number;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onSelectDirectMessages,
  pendingRequestsCount = 0,
  onOpenJoinModal,
  onOpenHostModal,
  onOpenDiscovery,
  onOpenAdminPanel,
  isAdmin = false,
  latency,
}) => {
  const isDirectMessagesActive = activeServerId === '@me';

  return (
    <aside className="w-14 sm:w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 z-20 shrink-0 border-r border-[#111214]">
      {/* Direct Messages / Friends Home Button (@me) */}
      <div className="relative group mb-1 flex items-center justify-center w-full">
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            isDirectMessagesActive ? 'h-10' : 'h-0 group-hover:h-5'
          }`}
        />
        <button
          onClick={onSelectDirectMessages}
          className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center shadow-lg relative cursor-pointer active:scale-95 touch-manipulation ${
            isDirectMessagesActive
              ? 'rounded-[16px] bg-indigo-500 text-white shadow-indigo-500/30'
              : 'bg-[#313338] text-indigo-400 hover:bg-indigo-500 hover:text-white'
          }`}
          title="Direct Messages & Friends"
        >
          {/* Discord style home icon */}
          <div className="relative">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07f 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.077.077 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-[#1e1f22] animate-bounce">
                {pendingRequestsCount}
              </span>
            )}
          </div>
        </button>

        {/* Tooltip */}
        <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5">
          <span>Direct Messages & Friends</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </div>
      </div>

      {/* Global Community Hub Server Icon */}
      <div className="relative group mb-2 flex items-center justify-center w-full">
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            activeServerId === 'nexus-global-community'
              ? 'h-10'
              : 'h-0 group-hover:h-5'
          }`}
        />
        <button
          onClick={() => {
            const globalServer = servers.find((s) => s.id === 'nexus-global-community');
            if (globalServer) onSelectServer(globalServer);
          }}
          className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center shadow-lg relative cursor-pointer active:scale-95 touch-manipulation ${
            activeServerId === 'nexus-global-community'
              ? 'rounded-[16px] bg-emerald-600 text-white shadow-emerald-500/25'
              : 'bg-[#313338] text-emerald-400 hover:bg-emerald-600 hover:text-white'
          }`}
          title="Galaxy Cord Global Community Hub"
        >
          <Radio className="w-6 h-6 transition-transform group-hover:scale-110" />
          {latency > 0 && activeServerId === 'nexus-global-community' && (
            <span className="absolute -bottom-1 -right-1 text-[9px] bg-emerald-500 text-black font-bold px-1 rounded-full shadow">
              {latency}ms
            </span>
          )}
        </button>

        {/* Tooltip */}
        <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          Galaxy Cord Global Hub
        </div>
      </div>

      {/* Divider */}
      <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-1" />

      {/* Server List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden space-y-2 no-scrollbar flex flex-col items-center touch-pan-y overscroll-contain">
        {servers
          .filter((s, idx, arr) => s.id !== 'nexus-global-community' && arr.findIndex((item) => item.id === s.id) === idx)
          .map((server) => {
            const isActive = server.id === activeServerId;
            const initials = server.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 3)
              .toUpperCase();

            return (
              <div key={server.id} className="relative group flex items-center justify-center w-full">
                {/* Active Indicator Pill */}
                <div
                  className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                    isActive ? 'h-10' : 'h-0 group-hover:h-5'
                  }`}
                />
                <button
                  onClick={() => onSelectServer(server)}
                  className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-sm font-bold relative shadow-md ${
                    isActive
                      ? 'rounded-[16px] bg-emerald-600 text-white shadow-emerald-500/30'
                      : 'bg-[#313338] text-zinc-200 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  {server.icon && server.icon.length <= 2 ? (
                    <span className="text-xl">{server.icon}</span>
                  ) : server.isSelfHosted ? (
                    <HardDrive className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                  ) : (
                    <span>{initials}</span>
                  )}

                  {server.isSelfHosted && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#1e1f22]"></span>
                    </span>
                  )}
                </button>

                {/* Tooltip */}
                <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5">
                  <span>{server.name}</span>
                  {server.isSelfHosted && (
                    <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-700/50">
                      Self-Hosted
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        {/* Join Server Button (Simple & Fast) */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 bg-white rounded-r-full h-0 group-hover:h-5 transition-all duration-200" />
          <button
            onClick={onOpenJoinModal}
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#313338] hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all duration-200 flex items-center justify-center group-hover:shadow-lg"
            title="Join a Server (Code / IP / Pterodactyl)"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
          </button>
          <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5 border border-emerald-500/30">
            <span className="text-emerald-400 font-bold">Join Server</span>
            <span className="text-zinc-400 text-[11px]">(Code / IP / Pterodactyl)</span>
          </div>
        </div>

        {/* Host Your Own Server Special Button (Pterodactyl Egg & Script) */}
        <div className="relative group flex items-center justify-center w-full pt-1">
          <div className="absolute left-0 w-1 bg-amber-400 rounded-r-full h-0 group-hover:h-5 transition-all duration-200" />
          <button
            onClick={() => onOpenHostModal('pterodactyl')}
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-gradient-to-tr from-amber-600/30 to-amber-500/20 hover:from-amber-500 hover:to-orange-500 text-amber-400 hover:text-black border border-amber-500/40 hover:border-amber-400 transition-all duration-200 flex flex-col items-center justify-center shadow-lg relative group"
            title="Host Your Own Server (Pterodactyl Egg & Server File)"
          >
            <Zap className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-black tracking-tight leading-none mt-0.5">HOST</span>
          </button>
          <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5 border border-amber-500/30">
            <span className="text-amber-400 font-bold">⚡ Host Server</span>
            <span className="text-zinc-400 text-[11px]">(Pterodactyl / PC)</span>
          </div>
        </div>

        {/* Admin Control Center Button - Only visible to authenticated admins (e.g. galaxy505g) */}
        {isAdmin && (
          <div className="relative group flex items-center justify-center w-full pt-1">
            <div className="absolute left-0 w-1 bg-purple-500 rounded-r-full transition-all duration-200 h-6" />
            <button
              onClick={onOpenAdminPanel}
              className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex flex-col items-center justify-center shadow-lg relative cursor-pointer active:scale-95 touch-manipulation bg-gradient-to-tr from-purple-700 to-indigo-600 text-white border border-purple-400/50 shadow-purple-500/30"
              title="Galaxy Cord Admin Control Panel (galaxy505g)"
            >
              <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-[8px] font-black tracking-wider leading-none mt-0.5">ADMIN</span>
            </button>
            <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5 border border-purple-500/40">
              <span className="text-purple-300 font-bold">🛡️ Admin Panel</span>
              <span className="text-zinc-400 text-[10px]">(galaxy505g)</span>
            </div>
          </div>
        )}
      </div>

      {/* Discovery / Help */}
      <div className="pt-2 flex flex-col items-center space-y-2 border-t border-[#313338] w-full">
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenDiscovery}
            className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#313338] hover:bg-indigo-600 text-zinc-400 hover:text-white transition-all duration-200 flex items-center justify-center"
            title="Explore Communities & Guides"
          >
            <Compass className="w-5 h-5" />
          </button>
          <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Server Hub & Docs
          </div>
        </div>
      </div>
    </aside>
  );
};
