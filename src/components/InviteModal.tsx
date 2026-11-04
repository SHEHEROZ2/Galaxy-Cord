import React, { useState } from 'react';
import { Server } from '../types';
import { Check, Copy, Share2, UserPlus, X } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  server,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Short code derived from server ID or name
  const isHubRoom = server.id.startsWith('room-');
  const shortCode = server.id === 'nexus-global-community'
    ? 'GLOBAL'
    : isHubRoom
    ? server.id.replace(/^room-/, '').toUpperCase()
    : server.id.replace(/^(srv-|room-)/, 'NX-').slice(0, 10).toUpperCase();

  // Full shareable URL that will auto-join
  const inviteUrl = server.isSelfHosted && !isHubRoom
    ? `${window.location.origin}?server=${encodeURIComponent(server.url)}`
    : `${window.location.origin}?join=${shortCode}`;

  const rawAddress = server.url.replace(/^ws:\/\//, '').replace(/^wss:\/\//, '');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(server.isSelfHosted ? rawAddress : shortCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#35373c] flex items-center justify-between bg-gradient-to-r from-indigo-900/40 via-[#2b2d31] to-[#1e1f22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Invite Friends</h3>
              <p className="text-[11px] text-zinc-400">Share your server with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Join Code Card */}
          <div className="p-4 bg-[#111214] rounded-xl border border-[#35373c] space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {server.isSelfHosted ? 'Server Direct IP / Address' : 'Server Join Code'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                Simple Join
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-black text-white font-mono tracking-wider">
                {server.isSelfHosted ? rawAddress : shortCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Friends can click <strong>"+" (Join Server)</strong> and paste this directly!
            </p>
          </div>

          {/* Full Link */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Or Send 1-Click Join Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-[#111214] border border-[#3f4147] rounded-lg px-3 py-2 text-white font-mono text-xs select-all outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {server.isSelfHosted && (
            <p className="text-[11px] text-zinc-400 bg-[#2b2d31] p-3 rounded-lg border border-[#35373c] leading-relaxed">
              💡 <strong>Pterodactyl / VPS tip:</strong> Share the allocated IP and Port from your Pterodactyl console (e.g. <code>142.250.190.46:25565</code>).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
