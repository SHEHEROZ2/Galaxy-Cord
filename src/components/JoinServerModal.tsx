import React, { useState, useId } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle,
  Compass,
  ExternalLink,
  Flame,
  Globe,
  HardDrive,
  Headphones,
  Lock,
  Plus,
  Radio,
  Server as ServerIcon,
  Sparkles,
  Terminal,
  Tv,
  Users,
  Wifi,
  X,
  Zap
} from 'lucide-react';

interface JoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinServer: (serverData: {
    id?: string;
    name: string;
    url: string;
    password?: string;
  }) => void;
  onOpenHostModal: (tab?: 'download' | 'connect' | 'browser' | 'pterodactyl') => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({
  isOpen,
  onClose,
  onJoinServer,
  onOpenHostModal,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [customName, setCustomName] = useState('');
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  if (!isOpen) return null;

  // Smart parser for anything a user might paste:
  // - Pterodactyl allocation: "142.250.190.46:25565"
  // - Domain with port: "play.mycommunity.com:8080"
  // - Raw port: "8080"
  // - URL with query params: "https://site.com/?join=NX-4821" or "http://localhost:3000?server=ws://..."
  // - Short invite code: "NX-8821" or "COMMUNITY-1"
  // - Full WebSocket: "ws://..." or "wss://..."
  const parseServerInput = (raw: string): { id?: string; url: string; inferredName: string; note: string } => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { url: '', inferredName: '', note: '' };
    }

    // 1. Full URL with query params
    if (trimmed.includes('?join=') || trimmed.includes('&join=')) {
      const match = trimmed.match(/[?&]join=([^&]+)/);
      const code = match ? decodeURIComponent(match[1]) : 'room';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return {
        id: `room-${code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
        url: `${protocol}//${window.location.host}/ws`,
        inferredName: `Community Room (${code})`,
        note: `Joined via Invite Link code "${code}"`,
      };
    }

    if (trimmed.includes('?server=')) {
      const match = trimmed.match(/[?&]server=([^&]+)/);
      const srvUrl = match ? decodeURIComponent(match[1]) : '';
      return {
        id: `srv-${srvUrl.replace(/^wss?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        url: srvUrl,
        inferredName: 'Shared Server',
        note: 'Server address extracted from link',
      };
    }

    // 2. Short invite code like NX-7821 or NEXUS-1234
    if (/^[A-Za-z0-9_-]{3,16}$/.test(trimmed) && !trimmed.includes('.') && !trimmed.includes(':')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return {
        id: `room-${trimmed.toLowerCase()}`,
        url: `${protocol}//${window.location.host}/ws`,
        inferredName: `Server #${trimmed}`,
        note: `Direct Room Code: "${trimmed}"`,
      };
    }

    // 3. Just a port number like 8080 or 3000
    if (/^\d{3,5}$/.test(trimmed)) {
      return {
        id: `srv-localhost-${trimmed}`,
        url: `ws://localhost:${trimmed}`,
        inferredName: `Localhost :${trimmed}`,
        note: `Connecting to local port ${trimmed}`,
      };
    }

    // 4. Already starts with ws:// or wss://
    if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
      let inferred = 'Custom Server';
      try {
        const u = new URL(trimmed);
        inferred = u.host;
      } catch (e) {}
      return {
        url: trimmed,
        inferredName: inferred,
        note: 'Direct WebSocket server protocol detected',
      };
    }

    // 5. Starts with http:// or https://
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const wsUrl = trimmed.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
      let inferred = 'Remote Server';
      try {
        const u = new URL(trimmed);
        inferred = u.host;
      } catch (e) {}
      return {
        url: wsUrl,
        inferredName: inferred,
        note: 'Web address automatically converted to secure WebSocket',
      };
    }

    // 6. Plain IP:Port (common in Pterodactyl!) like 142.250.190.46:25565 or localhost:8080
    if (trimmed.includes(':') || trimmed.includes('.')) {
      const hasPort = trimmed.includes(':');
      const formatted = `ws://${trimmed}${hasPort ? '' : ':8080'}`;
      return {
        url: formatted,
        inferredName: `Server (${trimmed})`,
        note: 'Pterodactyl / VPS allocation detected & formatted',
      };
    }

    return {
      url: `ws://${trimmed}`,
      inferredName: trimmed,
      note: 'Connecting to server',
    };
  };

  const parsed = parseServerInput(inputVal);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsed.url) return;

    onJoinServer({
      id: parsed.id,
      name: customName.trim() || parsed.inferredName || 'Nexus Server',
      url: parsed.url,
      password: password.trim() || undefined,
    });
    onClose();
  };

  const handleQuickJoinPreset = (name: string, url: string, description?: string) => {
    const isGlobal = url.includes('/ws') && name.toLowerCase().includes('global');
    onJoinServer({
      id: isGlobal ? 'nexus-global-community' : undefined,
      name,
      url,
      password: '',
    });
    onClose();
  };

  const handleTestPing = () => {
    if (!parsed.url) return;
    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    try {
      const ws = new WebSocket(parsed.url);
      const timer = setTimeout(() => {
        ws.close();
        setIsTesting(false);
        setTestResult({
          success: false,
          message: 'Connection timed out. Server may be offline or unreachable.',
        });
      }, 3500);

      ws.onopen = () => {
        const latency = Date.now() - startTime;
        clearTimeout(timer);
        ws.close();
        setIsTesting(false);
        setTestResult({
          success: true,
          message: 'Server is reachable & ready!',
          latency,
        });
      };

      ws.onerror = () => {
        clearTimeout(timer);
        setIsTesting(false);
        setTestResult({
          success: false,
          message: `Unable to connect to ${parsed.url}. Ensure the server is online.`,
        });
      };
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: err.message || 'Invalid address format',
      });
    }
  };

  // Current server URL for preset hubs
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultWsUrl = `${protocol}//${window.location.host}/ws`;

  const FEATURED_COMMUNITIES = [
    {
      id: 'featured-global',
      name: 'NexusCord Global Hub',
      badge: 'Official',
      desc: 'General chats, announcements, and active voice hangouts.',
      icon: <Radio className="w-5 h-5 text-indigo-400" />,
      url: defaultWsUrl,
      bg: 'from-indigo-950/40 to-[#2b2d31]',
    },
    {
      id: 'featured-gaming',
      name: 'Gaming & Stream Squad',
      badge: 'Popular',
      desc: '60fps screen share rooms, squad voice, and gaming clips.',
      icon: <Tv className="w-5 h-5 text-emerald-400" />,
      url: defaultWsUrl,
      bg: 'from-emerald-950/40 to-[#2b2d31]',
    },
    {
      id: 'featured-ptero',
      name: 'Pterodactyl & Self-Host Devs',
      badge: 'Active',
      desc: 'Discuss Pterodactyl eggs, VPS nodes, and server scripts.',
      icon: <Terminal className="w-5 h-5 text-amber-400" />,
      url: defaultWsUrl,
      bg: 'from-amber-950/40 to-[#2b2d31]',
    },
    {
      id: 'featured-music',
      name: 'Lo-Fi Chill & Hangout',
      badge: 'Casual',
      desc: 'Casual voice lounge, study sessions, and ambient audio.',
      icon: <Headphones className="w-5 h-5 text-purple-400" />,
      url: defaultWsUrl,
      bg: 'from-purple-950/40 to-[#2b2d31]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900/30 via-[#2b2d31] to-[#1e1f22] border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Join a Server</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Instant
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Paste any Pterodactyl IP, invite code, or select a community below.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#35373c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-sm no-scrollbar">
          {/* Main Simple Join Box */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Enter Server Address or Invite Code
            </label>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setTestResult(null);
                }}
                placeholder="e.g. 142.250.190.46:25565 or NX-7821 or localhost:8080"
                className="w-full bg-[#111214] border border-[#3f4147] focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors pr-24 font-mono placeholder:font-sans placeholder:text-zinc-500"
              />
              {inputVal.trim() && (
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isTesting ? 'Ping...' : 'Ping'}</span>
                </button>
              )}
            </div>

            {/* Smart detection feedback */}
            {parsed.url && (
              <div className="flex items-center justify-between text-xs px-1 text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{parsed.note}:</span>
                  <code className="text-zinc-200 bg-[#111214] px-1.5 py-0.5 rounded font-mono">
                    {parsed.url}
                  </code>
                </div>
              </div>
            )}

            {/* Ping Test Result */}
            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                    : 'bg-red-950/40 text-red-300 border-red-600/40'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>
                  {testResult.message}{' '}
                  {testResult.latency !== undefined && <strong>({testResult.latency}ms)</strong>}
                </span>
              </div>
            )}

            {/* Collapsible Advanced Settings (Optional Name & Password) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <span>{showAdvanced ? '− Hide' : '+ Need a password or custom nickname?'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 bg-[#2b2d31] border border-[#35373c] rounded-xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                      Custom Nickname for this Server (Optional)
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={parsed.inferredName || 'My Pterodactyl Node'}
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Server Password (If Protected)</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty if server is public"
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!parsed.url}
              className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                parsed.url
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99]'
                  : 'bg-[#2b2d31] text-zinc-500 cursor-not-allowed border border-[#35373c]'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Join Server Now</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#35373c]" />
            <span className="flex-shrink mx-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Or Quick Join Featured Communities
            </span>
            <div className="flex-grow border-t border-[#35373c]" />
          </div>

          {/* Quick Join Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURED_COMMUNITIES.map((community) => (
              <div
                key={community.id}
                className={`p-3.5 rounded-xl border border-[#35373c] bg-gradient-to-br ${community.bg} flex flex-col justify-between hover:border-zinc-500 transition-all group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#111214] border border-[#35373c]">
                        {community.icon}
                      </div>
                      <span className="font-bold text-white text-xs">{community.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-[#111214] text-zinc-300 px-1.5 py-0.5 rounded border border-[#35373c]">
                      {community.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                    {community.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleQuickJoinPreset(community.name, community.url, community.desc)}
                  className="w-full py-1.5 bg-[#111214] hover:bg-emerald-600 text-zinc-200 hover:text-white font-semibold text-xs rounded-lg border border-[#35373c] hover:border-emerald-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Connect</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          {/* Host Server Link Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-950/30 to-[#2b2d31] rounded-xl border border-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Want to host your own server instead?</h4>
                <p className="text-[11px] text-zinc-400">
                  Deploy on <strong>Pterodactyl Panel</strong>, Docker, or your own PC in seconds.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenHostModal('pterodactyl');
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors shrink-0 shadow flex items-center gap-1"
            >
              <span>Host Guide</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
