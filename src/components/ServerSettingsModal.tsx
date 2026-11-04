import React from 'react';
import { Channel, Server } from '../types';
import {
  Activity,
  HardDrive,
  Hash,
  Info,
  Radio,
  Server as ServerIcon,
  Trash2,
  Volume2,
  Wifi,
  X
} from 'lucide-react';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
  channels: Channel[];
  latency: number;
  onDeleteChannel: (channelId: string) => void;
  onRemoveServer?: (serverId: string) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  server,
  channels,
  latency,
  onDeleteChannel,
  onRemoveServer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#35373c] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Server Overview & Diagnostics</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-sm no-scrollbar">
          {/* Server Info Card */}
          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">{server.name}</h4>
                <p className="text-xs text-zinc-400">{server.description || 'NexusCord Server'}</p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  server.isSelfHosted
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                    : 'bg-indigo-950/60 text-indigo-300 border-indigo-600/40'
                }`}
              >
                {server.isSelfHosted ? 'Self-Hosted Server' : 'Global Hub'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#1e1f22] rounded-lg border border-[#35373c]">
                <div className="text-[11px] text-zinc-400 uppercase font-semibold">Address</div>
                <div className="text-xs font-mono text-white truncate mt-0.5">{server.url}</div>
              </div>
              <div className="p-3 bg-[#1e1f22] rounded-lg border border-[#35373c]">
                <div className="text-[11px] text-zinc-400 uppercase font-semibold">Latency</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {latency > 0 ? `${latency}ms` : 'Connected'}
                </div>
              </div>
              <div className="p-3 bg-[#1e1f22] rounded-lg border border-[#35373c]">
                <div className="text-[11px] text-zinc-400 uppercase font-semibold">Channels</div>
                <div className="text-xs font-bold text-white mt-0.5">{channels.length}</div>
              </div>
            </div>
          </div>

          {/* Channels Management */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Channel Management</h4>
            <div className="bg-[#2b2d31] rounded-xl border border-[#35373c] divide-y divide-[#35373c] overflow-hidden">
              {channels.map((chan) => (
                <div
                  key={chan.id}
                  className="p-3 flex items-center justify-between hover:bg-[#35373c]/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {chan.type === 'text' ? (
                      <Hash className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white">{chan.name}</div>
                      <div className="text-[11px] text-zinc-400">{chan.category}</div>
                    </div>
                  </div>

                  {channels.length > 2 && (
                    <button
                      onClick={() => onDeleteChannel(chan.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete Channel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remove custom server if added */}
          {server.isSelfHosted && onRemoveServer && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onRemoveServer(server.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold text-xs transition-colors border border-red-500/30"
              >
                Disconnect & Remove This Server from Sidebar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
