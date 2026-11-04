import React, { useState, useEffect } from 'react';
import {
  generateDockerCompose,
  generateDockerfile,
  generatePackageJson,
  generatePterodactylEgg,
  generatePterodactylPackageJson,
  generatePterodactylReadme,
  generateReadme,
  generateServerScript,
  generateStartBat,
  generateStartSh,
  triggerFileDownload
} from '../utils/serverPackage';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FolderArchive,
  Globe,
  HardDrive,
  Info,
  Layers,
  Play,
  Radio,
  Server,
  Shield,
  Terminal,
  Wifi,
  X,
  Zap
} from 'lucide-react';

interface HostServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'pterodactyl' | 'download' | 'connect' | 'browser';
  onConnectServer: (serverData: {
    id?: string;
    name: string;
    url: string;
    password?: string;
  }) => void;
}

export const HostServerModal: React.FC<HostServerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'pterodactyl',
  onConnectServer,
}) => {
  const [activeTab, setActiveTab] = useState<'pterodactyl' | 'download' | 'connect' | 'browser'>(defaultTab);

  // Configuration options for download
  const [serverName, setServerName] = useState('My Custom Nexus Server');
  const [serverDesc, setServerDesc] = useState('Private community server for voice, screen share, and chat');
  const [port, setPort] = useState(8080);
  const [password, setPassword] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Connect to server state
  const [connectName, setConnectName] = useState('My Local Server');
  const [connectUrl, setConnectUrl] = useState('ws://localhost:8080');
  const [connectPassword, setConnectPassword] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Browser Host Mode state
  const [browserHostStarted, setBrowserHostStarted] = useState(false);
  const [browserRoomCode, setBrowserRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPkg, setCopiedPkg] = useState(false);

  // Sync activeTab with defaultTab when modal opens
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const serverScript = generateServerScript({
    serverName,
    serverDescription: serverDesc,
    port,
    password,
  });

  const handleDownloadPackageJson = () => {
    triggerFileDownload('package.json', generatePterodactylPackageJson(serverName), 'application/json');
  };

  const handleDownloadPterodactylServerFile = () => {
    triggerFileDownload('nexus-server.mjs', serverScript, 'text/javascript');
  };

  const handleDownloadNodeJsServerFile = () => {
    triggerFileDownload('server.js', serverScript, 'text/javascript');
  };

  const handleDownloadPterodactylBundle = () => {
    handleDownloadPackageJson();
    setTimeout(() => {
      triggerFileDownload('server.js', serverScript, 'text/javascript');
    }, 200);
    setTimeout(() => {
      triggerFileDownload('nexus-server.mjs', serverScript, 'text/javascript');
    }, 400);
    setTimeout(() => {
      triggerFileDownload('PTERODACTYL_GUIDE.md', generatePterodactylReadme(serverName, port), 'text/markdown');
    }, 600);
  };

  const handleCopyPackageJson = () => {
    navigator.clipboard.writeText(generatePterodactylPackageJson(serverName));
    setCopiedPkg(true);
    setTimeout(() => setCopiedPkg(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    triggerFileDownload('server.js', serverScript, 'text/javascript');
  };

  const handleDownloadFullBundle = () => {
    // Download script and supporting config files
    triggerFileDownload('nexus-server.mjs', serverScript, 'text/javascript');
    setTimeout(() => {
      triggerFileDownload('package.json', generatePackageJson(serverName), 'application/json');
    }, 200);
    setTimeout(() => {
      triggerFileDownload('Dockerfile', generateDockerfile(port), 'text/plain');
    }, 400);
    setTimeout(() => {
      triggerFileDownload('docker-compose.yml', generateDockerCompose(serverName, port), 'text/plain');
    }, 600);
    setTimeout(() => {
      triggerFileDownload('README.md', generateReadme(serverName, port), 'text/markdown');
    }, 800);
    setTimeout(() => {
      triggerFileDownload('start.sh', generateStartSh(), 'application/x-sh');
    }, 1000);
    setTimeout(() => {
      triggerFileDownload('start.bat', generateStartBat(), 'application/bat');
    }, 1200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(serverScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    try {
      const testWs = new WebSocket(connectUrl);
      const timer = setTimeout(() => {
        testWs.close();
        setIsTesting(false);
        setTestResult({
          success: false,
          message: 'Connection timed out. Make sure your server is running on ' + connectUrl,
        });
      }, 3500);

      testWs.onopen = () => {
        const latency = Date.now() - startTime;
        clearTimeout(timer);
        testWs.close();
        setIsTesting(false);
        setTestResult({
          success: true,
          message: 'Successfully reached server!',
          latency,
        });
      };

      testWs.onerror = () => {
        clearTimeout(timer);
        setIsTesting(false);
        setTestResult({
          success: false,
          message: `Unable to connect to ${connectUrl}. Check that "node nexus-server.mjs" is running.`,
        });
      };
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: err.message || 'Invalid WebSocket URL format',
      });
    }
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectUrl.trim()) return;

    onConnectServer({
      name: connectName.trim() || 'Custom Server',
      url: connectUrl.trim(),
      password: connectPassword.trim() || undefined,
    });
    onClose();
  };

  const handleStartBrowserHost = () => {
    const code = 'NEXUS-' + Math.floor(1000 + Math.random() * 9000);
    setBrowserRoomCode(code);
    setBrowserHostStarted(true);
  };

  const handleJoinBrowserHost = () => {
    // Current dev/prod server URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const serverWsUrl = `${protocol}//${window.location.host}/ws`;

    onConnectServer({
      id: `room-${browserRoomCode.toLowerCase()}`,
      name: `Host Room (${browserRoomCode})`,
      url: serverWsUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#1e1f22] border border-[#35373c] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#2b2d31] to-[#1e1f22] border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Host Your Own Server</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Decentralized
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                In Galaxy Cord, anyone who wants to create a server hosts it. You have 100% data sovereignty!
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#35373c] bg-[#17181a] px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('pterodactyl')}
            className={`py-3.5 px-3.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'pterodactyl'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">🦖</span>
            <span>Pterodactyl Panel</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              Server Files
            </span>
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3.5 px-3.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'download'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>PC & VPS Script</span>
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`py-3.5 px-3.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'browser'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>In-Browser Host</span>
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3.5 px-3.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'connect'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Direct IP / Manual</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar text-zinc-300 text-sm">
          {activeTab === 'pterodactyl' && (
            <div className="space-y-6">
              {/* Pterodactyl Banner */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-[#2b2d31] to-[#1e1f22] p-5 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shrink-0">
                      🦖
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Pterodactyl Panel Server Deployment</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Direct File Drop-in
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-300">
                        Host your private Galaxy Cord voice, screen sharing, and chat server on any Pterodactyl Panel, PebbleHost, Bisect, Shockbyte, FalixNodes, or Wings container!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Server Settings Customizer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Server Name (Shown in Pterodactyl)
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="My Galaxy Cord Server"
                      className="w-full bg-[#111214] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Default Port (Mapped to Allocation)
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(parseInt(e.target.value, 10) || 8080)}
                      className="w-full bg-[#111214] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Download Buttons Section */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-base">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">
                      1
                    </span>
                    <span>Download Server Files for Pterodactyl</span>
                  </div>
                  <span className="text-xs text-zinc-400">Put package.json next to server.js in File Manager</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    onClick={handleDownloadPackageJson}
                    className="flex flex-col items-center justify-center text-center p-3.5 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-700/20 transition-all hover:scale-[1.02] border border-emerald-400/30"
                  >
                    <Download className="w-5 h-5 mb-1" />
                    <span className="font-bold text-xs sm:text-sm">Download package.json</span>
                    <span className="text-[10px] text-emerald-100 font-mono">Dependencies & start</span>
                  </button>

                  <button
                    onClick={handleDownloadNodeJsServerFile}
                    className="flex flex-col items-center justify-center text-center p-3.5 bg-[#1e1f22] hover:bg-[#25272a] text-white rounded-xl border border-emerald-500/50 transition-all hover:scale-[1.02]"
                  >
                    <Terminal className="w-5 h-5 mb-1 text-emerald-400" />
                    <span className="font-bold text-xs sm:text-sm">Download server.js</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Node.js server</span>
                  </button>

                  <button
                    onClick={handleDownloadPterodactylServerFile}
                    className="flex flex-col items-center justify-center text-center p-3.5 bg-[#1e1f22] hover:bg-[#25272a] text-white rounded-xl border border-[#3f4147] transition-all hover:scale-[1.02]"
                  >
                    <Terminal className="w-5 h-5 mb-1 text-amber-400" />
                    <span className="font-bold text-xs sm:text-sm">Download .mjs</span>
                    <span className="text-[10px] text-zinc-400 font-mono">nexus-server.mjs</span>
                  </button>

                  <button
                    onClick={handleDownloadPterodactylBundle}
                    className="flex flex-col items-center justify-center text-center p-3.5 bg-[#1e1f22] hover:bg-[#25272a] text-white rounded-xl border border-[#3f4147] transition-all hover:scale-[1.02]"
                  >
                    <FolderArchive className="w-5 h-5 mb-1 text-indigo-400" />
                    <span className="font-bold text-xs sm:text-sm">Download All Files</span>
                    <span className="text-[10px] text-zinc-400 font-mono">package.json + js + mjs</span>
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleCopyPackageJson}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedPkg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPkg ? 'package.json Copied to Clipboard!' : 'Copy package.json directly'}</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Visual Guide */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <span>How to Host on Pterodactyl (No Egg Required!)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 bg-[#17181a] rounded-xl border border-[#35373c] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center font-mono text-[11px]">
                        1
                      </span>
                      <span>Open File Manager</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      In your Pterodactyl server panel, open the <strong>File Manager</strong> tab to view your server's root directory.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#17181a] rounded-xl border border-[#35373c] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-indigo-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center font-mono text-[11px]">
                        2
                      </span>
                      <span>Upload package.json Next to server.js</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      Upload <code>package.json</code> right next to <code>server.js</code> in the root directory.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#17181a] rounded-xl border border-[#35373c] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center font-mono text-[11px]">
                        3
                      </span>
                      <span>Start the Server</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      Go to the <strong>Console</strong> tab and click <strong>"Start"</strong>. Once it prints <code>✅ Server ready!</code>, the status turns green.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#17181a] rounded-xl border border-[#35373c] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-green-400">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center font-mono text-[11px]">
                        4
                      </span>
                      <span>Simple Connect!</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      Copy your server IP & Port (e.g. <code>node1.host.net:8080</code>) and paste it into Galaxy Cord's <strong>"+" (Join Server)</strong> box!
                    </p>
                  </div>
                </div>
              </div>

              {/* Startup & Spec Details */}
              <div className="bg-[#17181a] p-4 rounded-xl border border-[#2b2d31] space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Pterodactyl Startup Commands & Files</span>
                </h4>
                <div className="bg-[#111214] p-3 rounded-lg font-mono text-xs text-zinc-300 space-y-1 border border-[#2b2d31]">
                  <div><span className="text-zinc-500">Startup Command:</span> node server.js</div>
                  <div><span className="text-zinc-500">File Placement:</span> package.json + server.js in same directory</div>
                  <div><span className="text-zinc-500">Auto Dependency:</span> npm install ws runs automatically via package.json</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'download' && (
            <div className="space-y-6">
              {/* Step 1: Configuration */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Configure Your Server Settings</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="e.g. Neon Squad Hub"
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Port Number
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(parseInt(e.target.value, 10) || 8080)}
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Optional Password Protection
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank for public open access"
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Download Package */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-base">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono">
                      2
                    </span>
                    <span>Download Server Engine</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  The standalone server is a single file with built-in WebRTC signaling, screen share routing, text channels, and persistent chat state.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadNodeJsServerFile}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download server.js (Node.js)</span>
                  </button>

                  <button
                    onClick={handleDownloadSingleFile}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download nexus-server.mjs</span>
                  </button>

                  <button
                    onClick={handleDownloadFullBundle}
                    className="flex items-center justify-center gap-2 bg-[#35373c] hover:bg-[#3f4147] text-white font-semibold py-3 px-4 rounded-xl border border-zinc-600 transition-colors"
                    title="Includes Dockerfile, docker-compose.yml, package.json, and launch scripts"
                  >
                    <FolderArchive className="w-5 h-5 text-indigo-400" />
                    <span>Full Bundle</span>
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center justify-center gap-2 bg-[#1e1f22] hover:bg-[#25272a] text-zinc-300 font-semibold py-3 px-4 rounded-xl border border-zinc-700 transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Run the Server */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-3">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  <span>Run with Node.js in 10 Seconds</span>
                </div>

                <div className="bg-[#111214] p-4 rounded-lg font-mono text-xs text-emerald-400 space-y-1.5 border border-[#2b2d31]">
                  <p className="text-zinc-500"># 1. Install the standard WebSocket module</p>
                  <p className="text-white">npm install ws</p>
                  <p className="text-zinc-500 mt-2"># 2. Start your server in Node.js</p>
                  <p className="text-emerald-400 font-bold">node server.js</p>
                  <p className="text-zinc-500 text-[11px]"># or: node nexus-server.mjs</p>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs text-zinc-400">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Once running, go to the <strong>Connect to Server</strong> tab and connect to <code>ws://localhost:{port}</code>!
                  </span>
                </div>
              </div>

              {/* Advanced: Tunnels & Playing with friends */}
              <div className="bg-[#17181a] p-4 rounded-xl border border-[#2b2d31] space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Playing with Friends Worldwide?
                </h4>
                <p className="text-xs text-zinc-400">
                  You don't need port forwarding! Use a free <strong>Cloudflare Tunnel</strong> with one command:
                </p>
                <div className="bg-[#111214] p-2.5 rounded font-mono text-xs text-indigo-300 select-all border border-[#2b2d31]">
                  cloudflared tunnel --url ws://localhost:{port}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Send the generated <code>wss://...trycloudflare.com</code> URL to your friends to join from anywhere!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <form onSubmit={handleConnectSubmit} className="space-y-5">
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <span>Add a Self-Hosted Server</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server Display Name
                    </label>
                    <input
                      type="text"
                      value={connectName}
                      onChange={(e) => setConnectName(e.target.value)}
                      placeholder="e.g. My Home Gaming Server"
                      required
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server WebSocket Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={connectUrl}
                        onChange={(e) => setConnectUrl(e.target.value)}
                        placeholder="ws://localhost:8080 or wss://my-server.com"
                        required
                        className="flex-1 bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="px-4 py-2 bg-[#35373c] hover:bg-[#3f4147] text-white text-xs font-bold rounded-lg border border-zinc-600 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Pinging...' : 'Test Ping'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                      Server Password (if required)
                    </label>
                    <input
                      type="password"
                      value={connectPassword}
                      onChange={(e) => setConnectPassword(e.target.value)}
                      placeholder="Optional server password"
                      className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
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
                      {testResult.latency !== undefined && (
                        <strong>({testResult.latency}ms latency)</strong>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-zinc-300 hover:bg-[#2b2d31]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  Connect & Join Server
                </button>
              </div>
            </form>
          )}

          {activeTab === 'browser' && (
            <div className="space-y-6">
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-4">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <span>Instant In-Browser Host (Zero Setup)</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Don't have Node.js or a terminal available? You can host a temporary private room directly from your browser session! A unique host room code is generated and peers can connect directly.
                </p>

                {!browserHostStarted ? (
                  <button
                    onClick={handleStartBrowserHost}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Spin Up In-Browser Host Room Now</span>
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-[#111214] rounded-xl border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Your Generated Server Code:</span>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                          Active Host
                        </span>
                      </div>
                      <div className="text-2xl font-black text-white font-mono tracking-widest text-center py-2 bg-[#1e1f22] rounded-lg border border-[#35373c]">
                        {browserRoomCode}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}?join=${browserRoomCode}`
                            );
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="flex-1 py-2 px-3 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable Invite Link'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleJoinBrowserHost}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                      Enter Your Browser Server
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
