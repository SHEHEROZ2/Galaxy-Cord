/**
 * Galaxy Cord - Decentralized Voice, Screen Share & Chat Platform
 * Discord-inspired interface with self-hostable standalone server engine.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { CreateChannelModal } from './components/CreateChannelModal';
import { DirectMessageArea } from './components/DirectMessageArea';
import { DirectMessagesSidebar } from './components/DirectMessagesSidebar';
import { DiscoveryModal } from './components/DiscoveryModal';
import { FriendsHub } from './components/FriendsHub';
import { HostServerModal } from './components/HostServerModal';
import { InviteModal } from './components/InviteModal';
import { JoinServerModal } from './components/JoinServerModal';
import { MemberList } from './components/MemberList';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { ServerSidebar } from './components/ServerSidebar';
import { UserSettingsModal } from './components/UserSettingsModal';
import { VoiceStage } from './components/VoiceStage';
import { socketService } from './services/socketService';
import { Channel, DirectMessage, FriendUser, Message, MessageAttachment, Server, User, VoicePeer } from './types';
import { getInitialServers, ALL_ONLINE_SERVERS } from './utils/onlineServers';
import { Compass, Hash, Radio, Shield, Tv, Users, Volume2 } from 'lucide-react';

// User account retriever - strictly requires authentic login/registration
function getInitialUser(): User | null {
  const saved = localStorage.getItem('nexus_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Only keep registered accounts or the superadmin, not legacy auto-generated guests
      if (
        parsed &&
        parsed.id &&
        parsed.name &&
        (parsed.isRegistered || parsed.email || parsed.role === 'admin' || parsed.name.toLowerCase() === 'galaxy505g')
      ) {
        if (!parsed.tag) {
          parsed.tag = Math.floor(1000 + Math.random() * 9000).toString();
          localStorage.setItem('nexus_user', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {}
  }
  return null;
}

// Built-in Default Community Hub Server
function getDefaultServer(): Server {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultWsUrl = `${protocol}//${window.location.host}/ws`;

  return {
    id: 'nexus-global-community',
    name: 'Galaxy Cord Global Hub',
    description: 'Official community hub for chatting, voice hangouts, and screensharing.',
    icon: '🌌',
    url: defaultWsUrl,
    isDefault: true,
    isSelfHosted: false,
    createdAt: Date.now() - 86400000 * 30,
    channels: [
      { id: 'c-general', name: 'general', type: 'text', topic: 'General discussion for all Galaxy Cord users', category: 'TEXT CHANNELS' },
      { id: 'c-announcements', name: 'announcements', type: 'text', topic: 'Galaxy Cord updates and self-hosting guides', category: 'TEXT CHANNELS' },
      { id: 'c-gaming', name: 'gaming', type: 'text', topic: 'Games, clips, and screen share party', category: 'TEXT CHANNELS' },
      { id: 'c-dev-hub', name: 'dev-and-self-host', type: 'text', topic: 'Discuss custom server setups and scripting', category: 'TEXT CHANNELS' },
      { id: 'v-lounge', name: 'Lounge Talk', type: 'voice', topic: 'Casual voice chat', category: 'VOICE & VIDEO' },
      { id: 'v-screenshare', name: 'Screen Share & Streams', type: 'voice', topic: 'Share your screen, games, or work', category: 'VOICE & VIDEO' },
      { id: 'v-gaming', name: 'Gaming Squad', type: 'voice', topic: 'Low-latency gaming voice channel', category: 'VOICE & VIDEO' },
    ],
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
  const [servers, setServers] = useState<Server[]>(getInitialServers);

  const [activeServerId, setActiveServerId] = useState<string>(() => {
    const saved = localStorage.getItem('nexus_active_server_id');
    const removedIds = ['server-community-alpha', 'server-dev-cluster', 'server-chill-synth', 'server-anime-realm', 'server-esports-arena'];
    if (!saved || removedIds.includes(saved)) {
      return 'nexus-global-community';
    }
    return saved;
  });
  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];

  const [channels, setChannels] = useState<Channel[]>(activeServer.channels);
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    return localStorage.getItem('nexus_active_channel_id') || 'c-general';
  });
  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0] || {
    id: 'c-general',
    name: 'general',
    type: 'text' as const,
    category: 'TEXT CHANNELS',
  };

  useEffect(() => {
    if (activeServerId) localStorage.setItem('nexus_active_server_id', activeServerId);
  }, [activeServerId]);

  useEffect(() => {
    if (activeChannelId) localStorage.setItem('nexus_active_channel_id', activeChannelId);
  }, [activeChannelId]);

  // Friends & Direct Messaging State
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [dmConversations, setDmConversations] = useState<Record<string, DirectMessage[]>>({});
  const [dmTyping, setDmTyping] = useState<Record<string, boolean>>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pendingRequestsCount = friends.filter((f) => f.relationship === 'pending_incoming').length;

  const DEFAULT_MESSAGES: Message[] = [
    {
      id: 'm-welcome-1',
      serverId: 'nexus-global-community',
      channelId: 'c-general',
      senderId: 'sys-nexus',
      senderName: 'Galaxy Bot',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      text: '👋 Welcome to **Galaxy Cord**! You can chat with rich markdown, jump into voice channels to talk with low-latency WebRTC, and stream your screen.\n\nWant to host your own dedicated server? Click the **⚡ HOST** button on the left sidebar to download the single-file server package!',
      timestamp: Date.now() - 3600000 * 4,
      system: true,
    },
    {
      id: 'm-welcome-2',
      serverId: 'nexus-global-community',
      channelId: 'c-general',
      senderId: 'user-elena',
      senderName: 'Elena Rostova',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      text: 'Hey everyone! Testing the screen sharing quality in #Screen Share & Streams — 60fps crystal clear! 🚀',
      timestamp: Date.now() - 1800000,
      reactions: { '🔥': ['sys-nexus', 'user-marcus'], '✨': ['sys-nexus'] },
    },
    {
      id: 'm-welcome-3',
      serverId: 'nexus-global-community',
      channelId: 'c-announcements',
      senderId: 'sys-nexus',
      senderName: 'Galaxy Core',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      text: '📢 **Self-Hosting Guide Available!**\nYou can now run your own private Galaxy Cord server in 10 seconds:\n```bash\nnode server.js\n```\nAll client signaling, voice WebRTC, screen share relay, and text channels are completely decentralized and independent.',
      timestamp: Date.now() - 86400000,
    },
  ];

  const DEFAULT_MEMBERS: User[] = [
    ...(currentUser ? [currentUser] : []),
    {
      id: 'sys-nexus',
      name: 'Nexus Bot',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      status: 'online',
      customStatus: 'Guiding new server hosts ⚡',
      role: 'bot',
    },
    {
      id: 'user-elena',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      status: 'online',
      customStatus: 'Screen sharing gameplay 🎮',
      role: 'member',
    },
    {
      id: 'user-marcus',
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      status: 'idle',
      customStatus: 'Self-hosting node on VPS',
      role: 'member',
    },
  ];

  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [members, setMembers] = useState<User[]>(DEFAULT_MEMBERS);
  const [latency, setLatency] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([]);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  // Responsive layout & compact screen detection
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });
  // In compact mode: 'channels' = show navigation; 'chat' = totally open the channel full width!
  const [mobileView, setMobileView] = useState<'channels' | 'chat'>('chat');

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Voice & WebRTC state
  const [currentVoiceChannelId, setCurrentVoiceChannelId] = useState<string | null>(null);
  const currentVoiceChannelIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentVoiceChannelIdRef.current = currentVoiceChannelId;
  }, [currentVoiceChannelId]);
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [localCameraStream, setLocalCameraStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { audio?: MediaStream; screen?: MediaStream; camera?: MediaStream }>>(new Map());

  // Force viewing voice stage if desired
  const [forceVoiceStage, setForceVoiceStage] = useState(false);

  // Modals state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [hostModalTab, setHostModalTab] = useState<'pterodactyl' | 'download' | 'connect' | 'browser'>('pterodactyl');
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelCategory, setCreateChannelCategory] = useState('TEXT CHANNELS');
  const [createChannelType, setCreateChannelType] = useState<'text' | 'voice'>('text');
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Auto-detect invite link parameters (?join=... or ?server=...) to auto-connect easily
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const serverParam = searchParams.get('server');
      const joinParam = searchParams.get('join');

      if (joinParam) {
        const clean = joinParam.trim().toUpperCase();
        if (clean === 'GLOBAL') {
          setActiveServerId('nexus-global-community');
          return;
        }
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const roomId = `room-${clean.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
        handleConnectServer({
          id: roomId,
          name: `Room (${clean})`,
          url: wsUrl,
        });
        return;
      }

      if (serverParam) {
        let wsUrl = serverParam.trim();
        let srvName = 'Invited Server';

        if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
          try {
            srvName = `Server (${new URL(wsUrl).host})`;
          } catch (e) {}
        } else if (wsUrl.includes(':') || wsUrl.includes('.')) {
          wsUrl = `ws://${wsUrl}`;
          srvName = `Server (${serverParam})`;
        }

        if (wsUrl.startsWith('ws')) {
          handleConnectServer({
            name: srvName,
            url: wsUrl,
          });
        }
      }
    } catch (e) {
      console.warn('Could not parse invite url param:', e);
    }
  }, []);

  // Fetch initial friends list via REST
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/friends?userId=${encodeURIComponent(currentUser.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFriends(data);
        })
        .catch((err) => console.warn('Could not load initial friends:', err));
    }
  }, [currentUser?.id]);

  // Fetch all registered community members from Neon database
  useEffect(() => {
    if (!currentUser) return;
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMembers((prev) => {
            const map = new Map<string, User>();
            map.set(currentUser.id, currentUser);
            prev.forEach((m) => map.set(m.id, m));
            data.forEach((m: User) => {
              if (m.id === currentUser.id) return;
              if (map.has(m.id)) {
                map.set(m.id, { ...map.get(m.id)!, ...m });
              } else {
                map.set(m.id, m);
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => console.warn('Could not load members from Neon:', err));
  }, [currentUser?.id]);

  // Fetch all online & registered servers from Neon database
  useEffect(() => {
    fetch('/api/servers/public')
      .then((res) => res.json())
      .then((data) => {
        const serverList = Array.isArray(data) ? data : data?.servers;
        if (Array.isArray(serverList) && serverList.length > 0) {
          setServers((prev) => {
            const map = new Map<string, Server>();
            // Keep default server first
            const defaultHub = prev.find((s) => s.id === 'nexus-global-community') || serverList.find((s: Server) => s.id === 'nexus-global-community');
            if (defaultHub) map.set(defaultHub.id, defaultHub);

            // Add local servers
            prev.forEach((s) => {
              if (s.id && !map.has(s.id)) map.set(s.id, s);
            });

            // Merge servers from Neon
            serverList.forEach((s: any) => {
              if (!s.id) return;
              if (s.id === 'nexus-global-community') {
                const existing = map.get(s.id);
                if (existing) {
                  map.set(s.id, { ...existing, ...s, channels: existing.channels || s.channels });
                }
              } else if (!map.has(s.id)) {
                map.set(s.id, {
                  id: s.id,
                  name: s.name,
                  description: s.description || 'Community Server',
                  icon: s.icon || '🚀',
                  url: s.url || defaultHub?.url || '',
                  isSelfHosted: s.isSelfHosted ?? true,
                  password: s.password,
                  createdAt: Number(s.createdAt || Date.now()),
                  channels: s.channels && s.channels.length > 0 ? s.channels : [
                    { id: 'c-general', name: 'general', type: 'text', category: 'TEXT CHANNELS' },
                    { id: 'c-gaming', name: 'gaming', type: 'text', category: 'TEXT CHANNELS' },
                    { id: 'v-lounge', name: 'General Voice', type: 'voice', category: 'VOICE & VIDEO' },
                  ],
                });
              }
            });

            return Array.from(map.values());
          });
        }
      })
      .catch((err) => console.warn('Could not load servers from Neon:', err));
  }, []);


  // Connect WebSocket to active server or default community hub
  useEffect(() => {
    if (!currentUser) return;
    const targetUrl =
      activeServerId === '@me'
        ? (servers.find((s) => s.id === 'nexus-global-community')?.url || servers[0]?.url)
        : activeServer.url;
    const targetServerId = activeServerId === '@me' ? 'nexus-global-community' : activeServer.id;
    const targetPassword = activeServerId === '@me' ? undefined : activeServer.password;

    setIsConnected(false);
    setConnectionError(null);
    socketService.connect(targetUrl, currentUser, targetServerId, targetPassword);

    const unsubStatus = socketService.on('connection:status', (data) => {
      setIsConnected(!!data.connected);
      if (data.connected) {
        setConnectionError(null);
        console.log('Connected to server:', data.url);
        // Request latest friends on socket connection
        socketService.getFriends();
      }
    });

    const unsubError = socketService.on('connection:error', (data) => {
      setIsConnected(false);
      const friendlyErr =
        data?.error ||
        (activeServer.isSelfHosted
          ? `Unable to reach ${activeServer.name || 'server'} (${activeServer.url}). Please verify that your Pterodactyl container or server process is running.`
          : 'Connection failed');
      setConnectionError(friendlyErr);
    });

    const unsubLatency = socketService.on('latency', (ms) => {
      setLatency(ms);
    });

    const unsubIdentified = socketService.on('server:identified', (data) => {
      if (data.channels && Array.isArray(data.channels) && data.channels.length > 0) {
        setChannels(data.channels);
        // Default to first channel if current active doesn't exist
        if (!data.channels.some((c: Channel) => c.id === activeChannelId)) {
          setActiveChannelId(data.channels[0].id);
        }
      }
      if (data.messages && Array.isArray(data.messages)) {
        setMessages((prev) => {
          const map = new Map<string, Message>();
          data.messages.forEach((m: Message) => {
            const enriched = { ...m, serverId: m.serverId || activeServerId };
            map.set(enriched.id, enriched);
          });
          prev.forEach((m) => {
            if (!map.has(m.id)) map.set(m.id, m);
          });
          return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
        });
      }
      if (data.members && Array.isArray(data.members)) {
        setMembers(data.members);
        // If current user is already in a voice channel, populate voicePeers from identified members
        const activeVoiceChan = currentVoiceChannelIdRef.current;
        if (activeVoiceChan) {
          const peersInVoice = data.members.filter(
            (m: any) => m.currentVoiceChannelId === activeVoiceChan && m.id !== currentUser.id
          );
          if (peersInVoice.length > 0) {
            setVoicePeers((prev) => {
              const pMap = new Map<string, VoicePeer>();
              prev.forEach((p) => pMap.set(p.id, p));
              peersInVoice.forEach((m: any) => {
                if (!pMap.has(m.id)) {
                  pMap.set(m.id, {
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
              return Array.from(pMap.values());
            });
          }
        }
      }
      // Re-query friends
      socketService.getFriends();
    });

    const unsubMsg = socketService.on('chat:message', (msg: Message) => {
      setMessages((prev) => {
        const enriched = { ...msg, serverId: msg.serverId || activeServerId };
        if (prev.some((m) => m.id === enriched.id)) {
          return prev.map((m) => (m.id === enriched.id ? enriched : m));
        }
        return [...prev, enriched];
      });
    });

    const unsubTyping = socketService.on('chat:typing', (data) => {
      if (data.channelId === activeChannelId) {
        if (data.isTyping) {
          setTypingUsers((prev) => {
            if (prev.some((u) => u.id === data.userId)) return prev;
            return [...prev, { id: data.userId, name: data.userName }];
          });
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
        }
      }
    });

    const unsubReaction = socketService.on('chat:reaction_updated', (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        )
      );
    });

    const unsubChanCreated = socketService.on('channel:created', (channel: Channel) => {
      setChannels((prev) => [...prev, channel]);
    });

    const unsubChanDeleted = socketService.on('channel:deleted', (channelId: string) => {
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      if (activeChannelId === channelId) {
        setActiveChannelId('c-general');
      }
    });

    // Voice events
    const unsubVoiceSelfJoined = socketService.on('voice:self_joined', (data) => {
      setCurrentVoiceChannelId(data.channelId);
      currentVoiceChannelIdRef.current = data.channelId;
      setMembers((prev) =>
        prev.map((m) => (m.id === currentUser.id ? { ...m, currentVoiceChannelId: data.channelId } : m))
      );
    });

    const unsubVoiceSelfLeft = socketService.on('voice:self_left', () => {
      setCurrentVoiceChannelId(null);
      currentVoiceChannelIdRef.current = null;
      setVoicePeers([]);
      setIsScreenSharing(false);
      setIsCameraOn(false);
      setLocalScreenStream(null);
      setLocalCameraStream(null);
      setRemoteStreams(new Map());
      setMembers((prev) =>
        prev.map((m) => (m.id === currentUser.id ? { ...m, currentVoiceChannelId: null } : m))
      );
    });

    const unsubVoiceJoined = socketService.on('voice:joined', (data) => {
      setCurrentVoiceChannelId(data.channelId);
      currentVoiceChannelIdRef.current = data.channelId;
      if (Array.isArray(data.peers)) {
        setVoicePeers(data.peers);
        setMembers((prev) => {
          const updated = [...prev];
          data.peers.forEach((peer: VoicePeer) => {
            const idx = updated.findIndex((m) => m.id === peer.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], currentVoiceChannelId: data.channelId, ...peer };
            } else {
              updated.push({
                ...peer,
                currentVoiceChannelId: data.channelId,
              });
            }
          });
          return updated;
        });
      }
    });

    const unsubPeerJoined = socketService.on('voice:peer_joined', (data) => {
      setVoicePeers((prev) => {
        if (prev.some((p) => p.id === data.peer.id)) return prev;
        return [...prev, data.peer];
      });
      setMembers((prev) => {
        const exists = prev.some((m) => m.id === data.peer.id);
        if (exists) {
          return prev.map((m) =>
            m.id === data.peer.id ? { ...m, currentVoiceChannelId: data.channelId, ...data.peer } : m
          );
        }
        return [
          ...prev,
          {
            id: data.peer.id,
            name: data.peer.name,
            avatar: data.peer.avatar,
            status: data.peer.status || 'online',
            currentVoiceChannelId: data.channelId,
            isMuted: data.peer.isMuted ?? false,
            isDeafened: data.peer.isDeafened ?? false,
            isScreenSharing: data.peer.isScreenSharing ?? false,
            isCameraOn: data.peer.isCameraOn ?? false,
            isSpeaking: data.peer.isSpeaking ?? false,
          },
        ];
      });
    });

    const unsubPeerLeft = socketService.on('voice:peer_left', (data) => {
      setVoicePeers((prev) => prev.filter((p) => p.id !== data.userId));
      setMembers((prev) =>
        prev.map((m) => (m.id === data.userId ? { ...m, currentVoiceChannelId: null } : m))
      );
    });

    const unsubPeerState = socketService.on('voice:peer_state', (data) => {
      setVoicePeers((prev) =>
        prev.map((p) =>
          p.id === data.userId
            ? {
                ...p,
                isMuted: data.isMuted ?? p.isMuted,
                isDeafened: data.isDeafened ?? p.isDeafened,
                isScreenSharing: data.isScreenSharing ?? p.isScreenSharing,
                isCameraOn: data.isCameraOn ?? p.isCameraOn,
                isSpeaking: data.isSpeaking ?? p.isSpeaking,
              }
            : p
        )
      );
    });

    const unsubMemberVoiceState = socketService.on('member:voice_state', (data) => {
      setMembers((prev) => {
        const exists = prev.some((m) => m.id === data.userId);
        if (exists) {
          return prev.map((m) =>
            m.id === data.userId
              ? {
                  ...m,
                  name: data.userName || m.name,
                  avatar: data.userAvatar || m.avatar,
                  currentVoiceChannelId: data.channelId,
                  isMuted: data.isMuted ?? m.isMuted,
                  isDeafened: data.isDeafened ?? m.isDeafened,
                  isScreenSharing: data.isScreenSharing ?? m.isScreenSharing,
                  isCameraOn: data.isCameraOn ?? m.isCameraOn,
                  isSpeaking: data.isSpeaking ?? m.isSpeaking,
                }
              : m
          );
        } else {
          return [
            ...prev,
            {
              id: data.userId,
              name: data.userName || 'Member',
              avatar: data.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userId}`,
              status: 'online',
              currentVoiceChannelId: data.channelId,
              isMuted: data.isMuted ?? false,
              isDeafened: data.isDeafened ?? false,
              isScreenSharing: data.isScreenSharing ?? false,
              isCameraOn: data.isCameraOn ?? false,
              isSpeaking: data.isSpeaking ?? false,
            },
          ];
        }
      });

      // Synchronize voicePeers using currentVoiceChannelIdRef to avoid stale closures
      const activeVoiceChan = currentVoiceChannelIdRef.current;
      if (activeVoiceChan && data.channelId === activeVoiceChan && data.userId !== currentUser.id) {
        setVoicePeers((prev) => {
          if (prev.some((p) => p.id === data.userId)) {
            return prev.map((p) =>
              p.id === data.userId
                ? {
                    ...p,
                    name: data.userName || p.name,
                    avatar: data.userAvatar || p.avatar,
                    isMuted: data.isMuted ?? p.isMuted,
                    isDeafened: data.isDeafened ?? p.isDeafened,
                    isScreenSharing: data.isScreenSharing ?? p.isScreenSharing,
                    isCameraOn: data.isCameraOn ?? p.isCameraOn,
                    isSpeaking: data.isSpeaking ?? p.isSpeaking,
                  }
                : p
            );
          }
          return [
            ...prev,
            {
              id: data.userId,
              name: data.userName || 'Member',
              avatar: data.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.userId}`,
              status: 'online',
              isMuted: data.isMuted ?? false,
              isDeafened: data.isDeafened ?? false,
              isScreenSharing: data.isScreenSharing ?? false,
              isCameraOn: data.isCameraOn ?? false,
              isSpeaking: data.isSpeaking ?? false,
            },
          ];
        });
      } else if (data.userId !== currentUser.id && activeVoiceChan && data.channelId !== activeVoiceChan) {
        setVoicePeers((prev) => prev.filter((p) => p.id !== data.userId));
      }
    });

    const unsubVoiceSelfSpeaking = socketService.on('voice:self_speaking', (data) => {
      setIsSpeaking(data.isSpeaking);
    });

    const unsubRemoteStream = socketService.on('voice:remote_stream', (data) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        const cur = next.get(data.peerId) || {};
        if (data.kind === 'audio') cur.audio = data.stream;
        if (data.kind === 'video') cur.screen = data.stream;
        next.set(data.peerId, cur);
        return next;
      });
    });

    const unsubScreenState = socketService.on('screenshare:state', (data) => {
      setIsScreenSharing(data.active);
      setLocalScreenStream(data.stream || null);
    });

    const unsubCameraState = socketService.on('camera:state', (data) => {
      setIsCameraOn(data.active);
      setLocalCameraStream(data.stream || null);
    });

    // Member presence events
    const unsubMemberJoined = socketService.on('member:joined', (member: User) => {
      setMembers((prev) => {
        if (prev.some((m) => m.id === member.id)) return prev;
        return [...prev, member];
      });
    });

    const unsubMemberLeft = socketService.on('member:left', (userId: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    });

    const unsubMemberUpdated = socketService.on('member:updated', (member: User) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, ...member } : m))
      );
    });

    // Friends and Direct Messages WebSocket Listeners
    const unsubFriendsList = socketService.on('friends:list', (list: FriendUser[]) => {
      if (Array.isArray(list)) setFriends(list);
    });

    const unsubFriendReqRecv = socketService.on('friend:request_received', (friend: FriendUser) => {
      setFriends((prev) => [friend, ...prev.filter((f) => f.id !== friend.id)]);
    });

    const unsubFriendReqSent = socketService.on('friend:request_sent', (data: any) => {
      if (data.friend) {
        setFriends((prev) => [data.friend, ...prev.filter((f) => f.id !== data.friend.id)]);
      }
    });

    const unsubFriendUpdated = socketService.on('friend:updated', (friend: FriendUser) => {
      setFriends((prev) => prev.map((f) => (f.id === friend.id ? friend : f)));
    });

    const unsubFriendRemoved = socketService.on('friend:removed', (friendId: string) => {
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    });

    const unsubFriendStatus = socketService.on('friend:status_change', (data: any) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === data.userId
            ? {
                ...f,
                status: data.status,
                customStatus: data.customStatus !== undefined ? data.customStatus : f.customStatus,
              }
            : f
        )
      );
    });

    const unsubDmMessage = socketService.on('dm:message', (data: any) => {
      const msg: DirectMessage = data.message;
      if (!msg) return;
      const partnerId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
      setDmConversations((prev) => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), msg],
      }));
    });

    const unsubDmTyping = socketService.on('dm:typing', (data: any) => {
      if (data.senderId) {
        setDmTyping((prev) => ({
          ...prev,
          [data.senderId]: !!data.isTyping,
        }));
      }
    });

    const unsubDmHistory = socketService.on('dm:history', (data: any) => {
      if (data.recipientId && Array.isArray(data.messages)) {
        setDmConversations((prev) => ({
          ...prev,
          [data.recipientId]: data.messages,
        }));
      }
    });

    return () => {
      unsubStatus();
      unsubError();
      unsubLatency();
      unsubIdentified();
      unsubMsg();
      unsubTyping();
      unsubReaction();
      unsubChanCreated();
      unsubChanDeleted();
      unsubVoiceSelfJoined();
      unsubVoiceSelfLeft();
      unsubVoiceJoined();
      unsubPeerJoined();
      unsubPeerLeft();
      unsubPeerState();
      unsubVoiceSelfSpeaking();
      unsubRemoteStream();
      unsubScreenState();
      unsubCameraState();
      unsubMemberVoiceState();
      unsubMemberJoined();
      unsubMemberLeft();
      unsubMemberUpdated();
      unsubFriendsList();
      unsubFriendReqRecv();
      unsubFriendReqSent();
      unsubFriendUpdated();
      unsubFriendRemoved();
      unsubFriendStatus();
      unsubDmMessage();
      unsubDmTyping();
      unsubDmHistory();
    };
  }, [activeServerId, currentUser?.id]);

  // Fetch persisted messages from server API whenever server or channel changes
  useEffect(() => {
    if (activeServerId === '@me') return;
    const targetServerId = activeServerId;
    const targetChannelId = activeChannelId;

    let apiUrl = `/api/messages?serverId=${encodeURIComponent(targetServerId)}&channelId=${encodeURIComponent(targetChannelId)}`;
    if (activeServer.isSelfHosted && activeServer.url && !activeServer.url.includes('/ws')) {
      try {
        const isCurrentHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const parsed = new URL(activeServer.url);
        // Only use direct remote HTTP if not blocked by mixed content policies
        if (!isCurrentHttps || parsed.protocol === 'https:' || parsed.protocol === 'wss:') {
          const httpProto = parsed.protocol === 'wss:' ? 'https:' : 'http:';
          apiUrl = `${httpProto}//${parsed.host}/api/messages?channelId=${encodeURIComponent(targetChannelId)}`;
        }
      } catch (e) {}
    }

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((apiMsgs) => {
        if (Array.isArray(apiMsgs) && apiMsgs.length > 0) {
          setMessages((prev) => {
            const map = new Map<string, Message>();
            // Add server API messages
            apiMsgs.forEach((m: Message) => {
              const enriched = { ...m, serverId: m.serverId || targetServerId };
              map.set(enriched.id, enriched);
            });
            // Keep local unsent or recent messages
            prev.forEach((m) => {
              if (!map.has(m.id)) map.set(m.id, m);
            });
            return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
          });
        }
      })
      .catch((err) => console.warn('Could not load channel messages from API:', err));
  }, [activeServerId, activeChannelId, activeServer.url, activeServer.isSelfHosted]);

  // Handle adding custom self-hosted server or room
  const handleConnectServer = (serverData: { id?: string; name: string; url: string; password?: string }) => {
    // Generate or use deterministic server ID so all participants in the same server share the identical serverId
    let canonicalId = serverData.id;
    if (!canonicalId) {
      const trimmedUrl = serverData.url.trim();
      if (trimmedUrl.includes('/ws')) {
        // Room code extraction (e.g. from "Host Room (NX-1234)" or "Server #NX-1234")
        const match = serverData.name.match(/[\(#]([A-Za-z0-9_-]+)[\)]?/);
        if (match) {
          canonicalId = 'room-' + match[1].toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        } else {
          canonicalId = 'room-' + serverData.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        }
      } else {
        canonicalId = 'srv-' + trimmedUrl.replace(/^wss?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      }
    }

    // Check if already in servers list
    const existing = servers.find((s) => s.id === canonicalId || s.url === serverData.url);
    if (existing) {
      setActiveServerId(existing.id);
      setChannels(existing.channels);
      setActiveChannelId(existing.channels[0]?.id || 'c-general');
      return;
    }

    const newServer: Server = {
      id: canonicalId,
      name: serverData.name,
      description: `Server at ${serverData.url}`,
      icon: '⚡',
      url: serverData.url,
      isSelfHosted: true,
      password: serverData.password,
      createdAt: Date.now(),
      channels: [
        { id: 'c-general', name: 'general', type: 'text', category: 'TEXT CHANNELS' },
        { id: 'c-gaming', name: 'gaming', type: 'text', category: 'TEXT CHANNELS' },
        { id: 'v-lounge', name: 'General Voice', type: 'voice', category: 'VOICE & VIDEO' },
        { id: 'v-screenshare', name: 'Screen Share & Streams', type: 'voice', category: 'VOICE & VIDEO' },
      ],
    };

    const updated = [...servers, newServer];
    setServers(updated);
    setActiveServerId(canonicalId);
    setActiveChannelId('c-general');

    const customOnly = updated.filter((s) => s.id !== 'nexus-global-community');
    localStorage.setItem('nexus_custom_servers', JSON.stringify(customOnly));

    // Persist server to Neon Lakebase Postgres
    fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newServer),
    }).catch(() => {});
  };

  const handleRemoveServer = (serverId: string) => {
    const updated = servers.filter((s) => s.id !== serverId);
    setServers(updated);
    setActiveServerId('nexus-global-community');
    const customOnly = updated.filter((s) => s.id !== 'nexus-global-community');
    localStorage.setItem('nexus_custom_servers', JSON.stringify(customOnly));

    // Delete server from Neon Lakebase Postgres
    fetch(`/api/servers/${encodeURIComponent(serverId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('nexus_user', JSON.stringify(updated));
    socketService.updateUserProfile(updates);

    const token = localStorage.getItem('nexus_token');
    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId: currentUser.id,
        name: updates.name,
        avatar: updates.avatar,
        bio: updates.bio,
        status: updates.status,
        customStatus: updates.customStatus,
      }),
    }).catch(() => {});
  };

  const handleSendMessage = (text: string, attachments: MessageAttachment[] = []) => {
    if (!currentUser) return;
    const msgId = 'm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newMsg: Message = {
      id: msgId,
      serverId: activeServerId,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      attachments,
      reactions: {},
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [...prev, newMsg];
    });
    socketService.sendMessage(activeChannelId, text, attachments, msgId);

    // REST fallback persistence to Neon Lakebase Postgres
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});
  };

  const handleSendTyping = (isTyping: boolean) => {
    socketService.sendTyping(activeChannelId, isTyping);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        if (!currentReactions[emoji]) currentReactions[emoji] = [];
        const idx = currentReactions[emoji].indexOf(currentUser.id);
        if (idx > -1) {
          currentReactions[emoji] = currentReactions[emoji].filter((uid) => uid !== currentUser.id);
          if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
        } else {
          currentReactions[emoji] = [...currentReactions[emoji], currentUser.id];
        }
        return { ...m, reactions: currentReactions };
      })
    );
    socketService.toggleReaction(activeChannelId, messageId, emoji);
  };

  const handleCreateChannel = (name: string, type: 'text' | 'voice', topic: string, category: string) => {
    const newChan: Channel = {
      id: 'c-' + Date.now().toString(36),
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type,
      topic,
      category,
    };
    setChannels((prev) => [...prev, newChan]);
    socketService.createChannel(name, type, topic, category);
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
    if (activeChannelId === channelId) {
      setActiveChannelId('c-general');
    }
    socketService.deleteChannel(channelId);
  };

  // Voice actions
  const handleJoinVoice = (channelId: string) => {
    setCurrentVoiceChannelId(channelId);
    setForceVoiceStage(true);
    socketService.joinVoiceChannel(channelId);
  };

  const handleLeaveVoice = () => {
    socketService.leaveVoiceChannel();
    setForceVoiceStage(false);
  };

  const handleToggleMute = () => {
    socketService.toggleMute();
    setIsMuted(socketService.isMuted);
  };

  const handleToggleDeafen = () => {
    socketService.toggleDeafen();
    setIsDeafened(socketService.isDeafened);
    setIsMuted(socketService.isMuted);
  };

  const handleToggleScreenShare = () => {
    socketService.toggleScreenShare();
  };

  const handleToggleCamera = () => {
    socketService.toggleCamera();
  };

  // Dedicated Navigate handler to jump back to community server and target channel
  const handleNavigateToCommunity = (targetChannelId?: string) => {
    const communityServer = servers.find((s) => s.id === 'nexus-global-community') || servers[0];
    setActiveServerId('nexus-global-community');
    setConnectionError(null);
    setChannels(communityServer.channels);

    let targetChannel = targetChannelId
      ? communityServer.channels.find((c) => c.id === targetChannelId)
      : null;

    if (!targetChannel && targetChannelId) {
      const currentCh = channels.find((c) => c.id === targetChannelId);
      const nameToMatch = (currentCh?.name || targetChannelId).toLowerCase().replace(/^#/, '');
      targetChannel = communityServer.channels.find(
        (c) => c.name.toLowerCase() === nameToMatch || c.id.toLowerCase() === nameToMatch
      );
    }

    const chosen = targetChannel || communityServer.channels[0];
    setActiveChannelId(chosen.id);
    setMobileView('chat'); // Immediately totally opens the community channel!

    if (chosen.type === 'voice') {
      setForceVoiceStage(true);
      handleJoinVoice(chosen.id);
    } else {
      setForceVoiceStage(false);
    }
  };

  // --- Account & Friends Handlers ---
  const handleSelectDirectMessages = () => {
    setActiveServerId('@me');
    setActiveDmUserId(null);
    setMobileView('chat');
    setForceVoiceStage(false);
  };

  const handleSelectDmUser = (friendId: string) => {
    setActiveServerId('@me');
    if (!currentUser) return;
    setActiveDmUserId(friendId);
    setMobileView('chat');
    setForceVoiceStage(false);

    // Fetch conversation history
    socketService.getDMs(friendId);
    fetch(`/api/dms?userId=${encodeURIComponent(currentUser.id)}&recipientId=${encodeURIComponent(friendId)}`)
      .then((res) => res.json())
      .then((msgs) => {
        if (Array.isArray(msgs)) {
          setDmConversations((prev) => ({
            ...prev,
            [friendId]: msgs,
          }));
        }
      })
      .catch((e) => console.warn('Could not load DM history:', e));
  };

  const handleSendDm = (text: string, attachments: MessageAttachment[] = []) => {
    if (!currentUser || !activeDmUserId) return;
    const newDm: DirectMessage = {
      id: 'dm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      conversationId: 'dm-conv',
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: activeDmUserId,
      text,
      attachments,
      timestamp: Date.now(),
    };

    setDmConversations((prev) => ({
      ...prev,
      [activeDmUserId]: [...(prev[activeDmUserId] || []), newDm],
    }));

    socketService.sendDM(activeDmUserId, text, attachments);
  };

  const handleSendDmTyping = (isTyping: boolean) => {
    if (activeDmUserId) {
      socketService.sendDMTyping(activeDmUserId, isTyping);
    }
  };

  const handleSendFriendRequest = (targetTag: string) => {
    if (!currentUser) return;
    socketService.sendFriendRequest(targetTag);
    fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        targetTag,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.friend) {
          setFriends((prev) => [data.friend, ...prev.filter((f) => f.id !== data.friend.id)]);
        }
      })
      .catch((e) => console.warn('Could not send friend request:', e));
  };

  const handleRespondFriendRequest = (friendId: string, action: 'accept' | 'decline') => {
    if (!currentUser) return;
    socketService.respondFriendRequest(friendId, action);
    fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        friendId,
        action,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.action === 'accepted' && data.friend) {
          setFriends((prev) => prev.map((f) => (f.id === friendId ? data.friend : f)));
        } else if (data.action === 'declined') {
          setFriends((prev) => prev.filter((f) => f.id !== friendId));
        }
      })
      .catch((e) => console.warn('Could not respond to friend request:', e));
  };

  const handleRemoveFriend = (friendId: string) => {
    if (!currentUser) return;
    socketService.removeFriend(friendId);
    fetch('/api/friends', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        friendId,
      }),
    }).catch((e) => console.warn('Could not remove friend:', e));

    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (activeDmUserId === friendId) {
      setActiveDmUserId(null);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));

    socketService.updateUserProfile(user);
    socketService.getFriends();
    fetch(`/api/friends?userId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) setFriends(list);
      })
      .catch(() => {});
  };

  const handleLogout = () => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    socketService.disconnect();
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('galaxycord_local_accounts');
    setCurrentUser(null);
    setFriends([]);
    setDmConversations({});
    setActiveDmUserId(null);
    setIsUserSettingsOpen(false);
    setIsAuthModalOpen(false);
  };

  const handleStartVoiceCallWithFriend = (_friendId: string) => {
    const community = servers.find((s) => s.id === 'nexus-global-community') || servers[0];
    const voiceChan = community.channels.find((c) => c.type === 'voice') || community.channels[0];
    setActiveServerId('nexus-global-community');
    setChannels(community.channels);
    setActiveChannelId(voiceChan.id);
    setForceVoiceStage(true);
    handleJoinVoice(voiceChan.id);
    setMobileView('chat');
  };

  // If user is not authenticated, display the Sign In / Sign Up page
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // Check if active channel is voice or if user wants to view voice stage
  const isViewingVoiceStage = activeServerId !== '@me' && (activeChannel.type === 'voice' || forceVoiceStage);
  const activeDmRecipient = activeDmUserId ? friends.find((f) => f.id === activeDmUserId) : null;

  return (
    <div className="flex flex-col h-full h-[100dvh] w-full bg-[#1e1f22] overflow-hidden text-zinc-100 font-sans antialiased fixed inset-0">
      {/* 
        Responsive Architecture:
        - When in compact mode (isCompact):
          - If mobileView === 'channels', display the Navigation View (Servers + Channels).
          - If mobileView === 'chat', display the Channel in 100% full screen width.
          - Mobile Bottom Navigation Bar allows 1-tap switching between Servers, Chat, Voice, and Profile at all times.
        - When in desktop mode (!isCompact):
          - Classic multi-column Discord layout: ServerSidebar | ChannelSidebar | ChatArea/VoiceStage | MemberList
      */}

      {/* Main App Stage Container */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* 1 & 2. Navigation Sidebars */}
        {(!isCompact || mobileView === 'channels') && (
          <div
            className={`${
              isCompact
                ? 'absolute inset-0 z-30 flex h-full w-full bg-[#1e1f22]'
                : 'flex h-full shrink-0 z-20'
            }`}
          >
            {/* Server Sidebar */}
            <ServerSidebar
              servers={servers}
              activeServerId={activeServerId}
              onSelectServer={(srv) => {
                setActiveServerId(srv.id);
                setChannels(srv.channels);
                setActiveChannelId(srv.channels[0]?.id || 'c-general');
                setForceVoiceStage(false);
                setActiveDmUserId(null);
              }}
              onSelectDirectMessages={handleSelectDirectMessages}
              pendingRequestsCount={pendingRequestsCount}
              onOpenJoinModal={() => setIsJoinModalOpen(true)}
              onOpenHostModal={(tab = 'pterodactyl') => {
                setHostModalTab(tab);
                setIsHostModalOpen(true);
              }}
              onOpenDiscovery={() => setIsDiscoveryOpen(true)}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              isAdmin={currentUser.role === 'admin' || currentUser.name.toLowerCase() === 'galaxy505g'}
              latency={latency}
            />

            {/* Channels Sidebar OR Direct Messages Sidebar */}
            {activeServerId === '@me' ? (
              <DirectMessagesSidebar
                currentUser={currentUser}
                friends={friends}
                activeDmUserId={activeDmUserId}
                onSelectFriendsHub={() => {
                  setActiveDmUserId(null);
                  setMobileView('chat');
                }}
                onSelectDmUser={handleSelectDmUser}
                onOpenUserSettings={() => setIsUserSettingsOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                isMuted={isMuted}
                isDeafened={isDeafened}
                onToggleMute={handleToggleMute}
                onToggleDeafen={handleToggleDeafen}
                pendingRequestsCount={pendingRequestsCount}
                onNavigateToCommunity={() => handleNavigateToCommunity()}
                onCloseMobileNav={() => setMobileView('chat')}
              />
            ) : (
              <ChannelSidebar
                server={activeServer}
                channels={channels}
                activeChannelId={activeChannelId}
                onSelectChannel={(chan) => {
                  setActiveChannelId(chan.id);
                  setMobileView('chat'); // TOTALLY OPENS THE CHANNEL!
                  if (chan.type === 'voice') {
                    setForceVoiceStage(true);
                    handleJoinVoice(chan.id);
                  } else {
                    setForceVoiceStage(false);
                  }
                }}
                currentUser={currentUser}
                voicePeers={voicePeers}
                currentVoiceChannelId={currentVoiceChannelId}
                onJoinVoice={handleJoinVoice}
                onLeaveVoice={handleLeaveVoice}
                isMuted={isMuted}
                isDeafened={isDeafened}
                isScreenSharing={isScreenSharing}
                isCameraOn={isCameraOn}
                isSpeaking={isSpeaking}
                onToggleMute={handleToggleMute}
                onToggleDeafen={handleToggleDeafen}
                onToggleScreenShare={handleToggleScreenShare}
                onToggleCamera={handleToggleCamera}
                onOpenCreateChannel={(category, type) => {
                  setCreateChannelCategory(category);
                  setCreateChannelType(type);
                  setIsCreateChannelOpen(true);
                }}
                onOpenUserSettings={() => setIsUserSettingsOpen(true)}
                onOpenServerSettings={() => setIsServerSettingsOpen(true)}
                onOpenHostModal={() => {
                  setHostModalTab('pterodactyl');
                  setIsHostModalOpen(true);
                }}
                onOpenInvite={() => setIsInviteOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                latency={latency}
                onNavigateToCommunity={handleNavigateToCommunity}
                onCloseMobileNav={() => setMobileView('chat')}
                members={members}
                isConnected={isConnected}
                connectionError={connectionError}
              />
            )}
          </div>
        )}

        {/* 3. Main Stage / Friends Hub / Direct Message Area / Chat Area */}
        {(!isCompact || mobileView === 'chat') && (
          <div className="flex-1 flex flex-col min-w-0 bg-[#313338] h-full overflow-hidden w-full">
            {activeServerId === '@me' ? (
              activeDmRecipient ? (
                <DirectMessageArea
                  currentUser={currentUser}
                  recipient={activeDmRecipient}
                  messages={dmConversations[activeDmRecipient.id] || []}
                  onSendMessage={handleSendDm}
                  onSendTyping={handleSendDmTyping}
                  isTyping={dmTyping[activeDmRecipient.id]}
                  onStartVoiceCall={handleStartVoiceCallWithFriend}
                  onToggleMobileNav={() => setMobileView('channels')}
                  onBackToFriends={() => {
                    setActiveDmUserId(null);
                    setMobileView('chat');
                  }}
                />
              ) : (
                <FriendsHub
                  currentUser={currentUser}
                  friends={friends}
                  onOpenDm={handleSelectDmUser}
                  onStartVoiceCall={handleStartVoiceCallWithFriend}
                  onSendFriendRequest={handleSendFriendRequest}
                  onRespondFriendRequest={handleRespondFriendRequest}
                  onRemoveFriend={handleRemoveFriend}
                  onToggleMobileNav={() => setMobileView('channels')}
                />
              )
            ) : isViewingVoiceStage ? (
              <VoiceStage
                channel={
                  activeChannel.type === 'voice'
                    ? activeChannel
                    : channels.find((c) => c.id === currentVoiceChannelId) || activeChannel
                }
                currentUser={currentUser}
                voicePeers={voicePeers}
                members={members}
                isMuted={isMuted}
                isDeafened={isDeafened}
                isScreenSharing={isScreenSharing}
                isCameraOn={isCameraOn}
                isSpeaking={isSpeaking}
                localScreenStream={localScreenStream}
                localCameraStream={localCameraStream}
                remoteStreams={remoteStreams}
                onToggleMute={handleToggleMute}
                onToggleDeafen={handleToggleDeafen}
                onToggleScreenShare={handleToggleScreenShare}
                onToggleCamera={handleToggleCamera}
                onLeaveVoice={handleLeaveVoice}
                onToggleMobileNav={() => setMobileView('channels')}
                onNavigateToCommunity={handleNavigateToCommunity}
              />
            ) : (
              <ChatArea
                channel={activeChannel}
                messages={messages.filter((m) => {
                  if (activeServerId === 'nexus-global-community') {
                    return !m.serverId || m.serverId === 'nexus-global-community';
                  }
                  return m.serverId === activeServerId;
                })}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onSendTyping={handleSendTyping}
                onToggleReaction={handleToggleReaction}
                typingUsers={typingUsers}
                isMemberListOpen={isMemberListOpen}
                onToggleMemberList={() => setIsMemberListOpen(!isMemberListOpen)}
                isVoiceActive={!!currentVoiceChannelId}
                onOpenVoiceStage={() => setForceVoiceStage(true)}
                onToggleMobileNav={() => setMobileView('channels')}
                onNavigateToCommunity={handleNavigateToCommunity}
                isCommunityServer={activeServerId === 'nexus-global-community'}
                communityChannels={servers.find((s) => s.id === 'nexus-global-community')?.channels || []}
                onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              />
            )}
          </div>
        )}

        {/* 4. Desktop Right Member List (shown on wide screens, only in server view) */}
        {activeServerId !== '@me' && isMemberListOpen && !isViewingVoiceStage && (
          <div className="hidden xl:flex shrink-0 h-full">
            <MemberList
              members={members}
              voicePeers={voicePeers}
              currentUser={currentUser}
              onClose={() => setIsMemberListOpen(false)}
            />
          </div>
        )}

        {/* 5. Mobile / Tablet Overlay Member List (shown on smaller screens when toggled, only in server view) */}
        {activeServerId !== '@me' && isMemberListOpen && !isViewingVoiceStage && (
          <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMemberListOpen(false)}
            />
            <div className="relative z-10 h-full shadow-2xl">
              <MemberList
                members={members}
                voicePeers={voicePeers}
                currentUser={currentUser}
                onClose={() => setIsMemberListOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Discord style) */}
      {isCompact && (
        <nav className="h-14 bg-[#111214] border-t border-[#1f2023] flex items-center justify-around px-2 z-40 shrink-0 select-none touch-manipulation">
          {/* Servers & Channels Tab */}
          <button
            onClick={() => setMobileView('channels')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
              mobileView === 'channels'
                ? 'text-indigo-400 font-bold bg-[#1e1f22]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Servers and Channels"
            aria-label="Servers and Channels"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Servers</span>
          </button>

          {/* Current Channel / Chat Tab */}
          <button
            onClick={() => {
              setForceVoiceStage(false);
              setMobileView('chat');
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
              mobileView === 'chat' && !isViewingVoiceStage
                ? 'text-indigo-400 font-bold bg-[#1e1f22]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Chat in #${activeChannel.name}`}
            aria-label={`Chat in #${activeChannel.name}`}
          >
            <Hash className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5 truncate max-w-[85px]">
              #{activeChannel.name}
            </span>
          </button>

          {/* Voice Tab (if in voice channel or for voice stage) */}
          {currentVoiceChannelId && (
            <button
              onClick={() => {
                setForceVoiceStage(true);
                setMobileView('chat');
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation relative ${
                isViewingVoiceStage && mobileView === 'chat'
                  ? 'text-emerald-400 font-bold bg-[#1e1f22]'
                  : 'text-emerald-500 hover:text-emerald-300'
              }`}
              title="Voice Stage"
              aria-label="Voice Stage"
            >
              <div className="relative">
                <Volume2 className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">Voice</span>
            </button>
          )}

          {/* User Settings Tab */}
          <button
            onClick={() => setIsUserSettingsOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer active:scale-95 touch-manipulation"
            title="User Profile & Settings"
            aria-label="User Profile & Settings"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#111214]" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">You</span>
          </button>
        </nav>
      )}

      {/* --- Modals --- */}
      <JoinServerModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinServer={handleConnectServer}
        onOpenHostModal={(tab = 'pterodactyl') => {
          setHostModalTab(tab);
          setIsHostModalOpen(true);
        }}
      />

      <HostServerModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
        defaultTab={hostModalTab}
        onConnectServer={handleConnectServer}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        defaultCategory={createChannelCategory}
        defaultType={createChannelType}
        onCreateChannel={handleCreateChannel}
      />

      <ServerSettingsModal
        isOpen={isServerSettingsOpen}
        onClose={() => setIsServerSettingsOpen(false)}
        server={activeServer}
        channels={channels}
        latency={latency}
        onDeleteChannel={handleDeleteChannel}
        onRemoveServer={handleRemoveServer}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        server={activeServer}
      />

      <DiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        onOpenHostModal={(tab = 'pterodactyl') => {
          setHostModalTab(tab);
          setIsHostModalOpen(true);
        }}
        onSelectServer={(srv) => {
          if (!servers.some((s) => s.id === srv.id)) {
            setServers((prev) => [...prev, srv]);
          }
          setActiveServerId(srv.id);
          setChannels(srv.channels);
          setActiveChannelId(srv.channels[0]?.id || 'c-general');
          setForceVoiceStage(false);
          setActiveDmUserId(null);
          setIsDiscoveryOpen(false);
          setMobileView('chat');
        }}
        activeServerId={activeServerId}
        servers={servers}
      />

      {(currentUser.role === 'admin' || currentUser.name.toLowerCase() === 'galaxy505g') && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          currentUser={currentUser}
          onUserSwitched={(newUser) => {
            setCurrentUser(newUser);
            socketService.send({
              type: 'identify',
              user: newUser,
              serverId: activeServerId,
            });
          }}
        />
      )}
    </div>
  );
}
