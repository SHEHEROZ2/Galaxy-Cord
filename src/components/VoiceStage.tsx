import React, { useEffect, useRef, useState } from 'react';
import { Channel, User, VoicePeer } from '../types';
import {
  Compass,
  Grid,
  Headphones,
  Maximize2,
  Menu,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  PhoneOff,
  Pipette,
  Radio,
  Tv,
  Users,
  Video,
  VideoOff,
  Volume2
} from 'lucide-react';

interface VoiceStageProps {
  channel: Channel;
  currentUser: User;
  voicePeers: VoicePeer[];
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  localScreenStream: MediaStream | null;
  localCameraStream: MediaStream | null;
  remoteStreams: Map<string, { audio?: MediaStream; screen?: MediaStream; camera?: MediaStream }>;
  members?: User[];
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare: () => void;
  onToggleCamera: () => void;
  onLeaveVoice: () => void;
  onToggleMobileNav?: () => void;
  onNavigateToCommunity?: (channelId?: string) => void;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channel,
  currentUser,
  voicePeers,
  members = [],
  isMuted,
  isDeafened,
  isScreenSharing,
  isCameraOn,
  isSpeaking,
  localScreenStream,
  localCameraStream,
  remoteStreams,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onToggleCamera,
  onLeaveVoice,
  onToggleMobileNav,
  onNavigateToCommunity,
}) => {
  const [viewMode, setViewMode] = useState<'stage' | 'grid'>('stage');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  // Combine self, active WebRTC voice peers, and members connected via server presence
  const allPeers: VoicePeer[] = [
    {
      id: currentUser.id,
      name: `${currentUser.name} (You)`,
      avatar: currentUser.avatar,
      status: currentUser.status,
      isMuted,
      isDeafened,
      isScreenSharing,
      isCameraOn,
      isSpeaking,
      screenStream: localScreenStream || undefined,
      videoStream: localCameraStream || undefined,
    },
    ...voicePeers.map((p) => {
      const streams = remoteStreams.get(p.id);
      return {
        ...p,
        screenStream: streams?.screen,
        videoStream: streams?.camera,
      };
    }),
  ];

  // Include any server members who are in this channel from server presence
  if (Array.isArray(members)) {
    members.forEach((m) => {
      if (
        m.currentVoiceChannelId === channel.id &&
        m.id !== currentUser.id &&
        !allPeers.some((existing) => existing.id === m.id)
      ) {
        const streams = remoteStreams.get(m.id);
        allPeers.push({
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          status: m.status,
          isMuted: m.isMuted ?? false,
          isDeafened: m.isDeafened ?? false,
          isScreenSharing: m.isScreenSharing ?? false,
          isCameraOn: m.isCameraOn ?? false,
          isSpeaking: m.isSpeaking ?? false,
          screenStream: streams?.screen,
          videoStream: streams?.camera,
        });
      }
    });
  }

  // Find active screen share or camera stream to highlight in stage mode
  const activeStreamPeer = allPeers.find((p) => p.isScreenSharing || p.screenStream) ||
    allPeers.find((p) => p.isCameraOn || p.videoStream) ||
    allPeers[0];

  const mainStream = activeStreamPeer?.screenStream || activeStreamPeer?.videoStream;

  // Attach main stream to video element
  useEffect(() => {
    if (mainVideoRef.current && mainStream) {
      mainVideoRef.current.srcObject = mainStream;
      mainVideoRef.current.play().catch(() => {});
    }
  }, [mainStream]);

  const toggleFullscreen = () => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      stageContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePip = async () => {
    if (mainVideoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (mainVideoRef.current !== document.pictureInPictureElement) {
          await mainVideoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP failed:', err);
      }
    }
  };

  return (
    <div
      ref={stageContainerRef}
      className="flex-1 bg-[#111214] flex flex-col relative overflow-hidden"
    >
      {/* Top Bar with Channel Title and Participant count */}
      <div className="h-12 px-2.5 sm:px-6 bg-[#1e1f22]/90 backdrop-blur border-b border-[#2b2d31] flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 lg:hidden shrink-0 shadow-md transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Open Server & Channels"
              aria-label="Open Channels"
            >
              <Menu className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white">Channels</span>
            </button>
          )}
          <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{channel.name}</span>
              <span className="hidden sm:inline-block text-[11px] font-normal text-zinc-400 bg-[#2b2d31] px-2 py-0.5 rounded-full shrink-0">
                {allPeers.length} Connected
              </span>
            </h2>
          </div>
        </div>

        {/* View mode toggle & Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onNavigateToCommunity && (
            <button
              onClick={() => onNavigateToCommunity(channel.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all shadow-sm group cursor-pointer active:scale-95 touch-manipulation"
              title="Navigate back to Community Server"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white transition-transform group-hover:rotate-45" />
              <span>Navigate<span className="hidden sm:inline"> to Community</span></span>
            </button>
          )}

          <button
            onClick={() => setViewMode(viewMode === 'stage' ? 'grid' : 'stage')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2b2d31] text-xs font-medium text-zinc-200 hover:bg-[#35373c] hover:text-white transition-colors"
          >
            {viewMode === 'stage' ? <Grid className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
            <span>{viewMode === 'stage' ? 'Grid View' : 'Stage View'}</span>
          </button>

          {mainStream && (
            <button
              onClick={togglePip}
              className="p-1.5 rounded-md bg-[#2b2d31] text-zinc-300 hover:bg-[#35373c] hover:text-white transition-colors"
              title="Picture in Picture"
            >
              <Pipette className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-[#2b2d31] text-zinc-300 hover:bg-[#35373c] hover:text-white transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
        {viewMode === 'stage' && mainStream ? (
          /* Spotlight / Theater Mode */
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Spotlight Video */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-[#2b2d31] shadow-2xl group">
              <video
                ref={mainVideoRef}
                autoPlay
                playsInline
                muted={activeStreamPeer?.id === currentUser.id}
                className="w-full h-full object-contain"
              />

              {/* Presenter Banner Overlay */}
              <div className="absolute top-4 left-4 bg-[#1e1f22]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-zinc-700/50 flex items-center gap-2 text-white text-xs font-semibold shadow-lg">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{activeStreamPeer?.name}'s Screen</span>
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded uppercase">
                  LIVE 1080p
                </span>
              </div>
            </div>

            {/* Bottom Strip of Participants */}
            <div className="h-28 flex gap-3 overflow-x-auto pb-1 no-scrollbar shrink-0">
              {allPeers.map((peer) => (
                <PeerCard key={peer.id} peer={peer} isMini />
              ))}
            </div>
          </div>
        ) : (
          /* Grid View Mode */
          <div
            className={`flex-1 grid gap-4 items-center justify-center overflow-y-auto no-scrollbar ${
              allPeers.length === 1
                ? 'grid-cols-1 max-w-2xl mx-auto w-full'
                : allPeers.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto w-full'
                : allPeers.length <= 4
                ? 'grid-cols-2 max-w-5xl mx-auto w-full'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full'
            }`}
          >
            {allPeers.map((peer) => (
              <PeerCard key={peer.id} peer={peer} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="p-4 flex items-center justify-center z-20">
        <div className="bg-[#1e1f22]/95 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#313338] shadow-2xl flex items-center gap-3">
          {/* Mic Mute / Unmute */}
          <button
            onClick={onToggleMute}
            className={`p-3.5 rounded-xl flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
                : 'bg-[#2b2d31] text-white hover:bg-[#35373c]'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen */}
          <button
            onClick={onToggleDeafen}
            className={`p-3.5 rounded-xl flex items-center justify-center transition-all ${
              isDeafened
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
                : 'bg-[#2b2d31] text-white hover:bg-[#35373c]'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones className="w-5 h-5" />
          </button>

          {/* Camera */}
          <button
            onClick={onToggleCamera}
            className={`p-3.5 rounded-xl flex items-center justify-center transition-all ${
              isCameraOn
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25'
                : 'bg-[#2b2d31] text-white hover:bg-[#35373c]'
            }`}
            title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={onToggleScreenShare}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all ${
              isScreenSharing
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>

          <div className="w-[1px] h-6 bg-[#35373c] mx-1" />

          {/* Disconnect Button */}
          <button
            onClick={onLeaveVoice}
            className="p-3.5 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-md"
            title="Disconnect Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual participant cards
interface PeerCardProps {
  peer: VoicePeer;
  isMini?: boolean;
}

const PeerCard: React.FC<PeerCardProps> = ({ peer, isMini = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = peer.screenStream || peer.videoStream;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div
      className={`bg-[#2b2d31] rounded-xl relative overflow-hidden flex flex-col items-center justify-center border transition-all duration-200 ${
        peer.isSpeaking
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
          : 'border-[#35373c]'
      } ${isMini ? 'w-44 h-full shrink-0' : 'w-full h-full min-h-[160px]'}`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={peer.avatar}
              alt={peer.name}
              className={`rounded-full bg-zinc-800 object-cover ${
                isMini ? 'w-12 h-12' : 'w-20 h-20'
              } ${peer.isSpeaking ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#2b2d31]' : ''}`}
            />
            {peer.isSpeaking && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
        </div>
      )}

      {/* Name and Status Bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-[#111214]/80 backdrop-blur px-2.5 py-1 rounded-md text-xs font-semibold text-white">
        <span className="truncate">{peer.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {peer.isScreenSharing && (
            <span className="text-[10px] bg-red-500 px-1 rounded text-white font-bold">
              LIVE
            </span>
          )}
          {peer.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
          {peer.isDeafened && <Headphones className="w-3.5 h-3.5 text-red-400" />}
        </div>
      </div>
    </div>
  );
};
