export interface User {
  id: string;
  name: string;
  tag?: string; // 4-digit Discord-style discriminator, e.g. "1337"
  avatar: string;
  email?: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  role?: 'host' | 'admin' | 'member' | 'bot';
  isRegistered?: boolean;
  currentVoiceChannelId?: string | null;
  isMuted?: boolean;
  isDeafened?: boolean;
  isScreenSharing?: boolean;
  isCameraOn?: boolean;
  isSpeaking?: boolean;
}

export interface Account {
  id: string;
  username: string;
  tag: string;
  email: string;
  password?: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  createdAt: number;
}

export type FriendshipStatus = 'friends' | 'pending_incoming' | 'pending_outgoing' | 'blocked';

export interface FriendUser {
  id: string;
  name: string;
  tag: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  bio?: string;
  relationship: FriendshipStatus;
  updatedAt: number;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  text: string;
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>;
  timestamp: number;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  url: string; // ws://... or 'local'
  isDefault?: boolean;
  isSelfHosted?: boolean;
  isBrowserHost?: boolean;
  password?: string;
  ownerId?: string;
  createdAt: number;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  category: string;
  unreadCount?: number;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Message {
  id: string;
  serverId?: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  timestamp: number;
  system?: boolean;
}

export interface VoicePeer {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  screenStream?: MediaStream;
}

export interface ServerConfig {
  port: number;
  serverName: string;
  serverDescription: string;
  password?: string;
  requireAuth: boolean;
}
