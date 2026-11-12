import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon, Pool } from '@neondatabase/serverless';
import crypto from 'crypto';

export function hashPassword(password: string): string {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain || !password) return false;
  if (!storedHashOrPlain.includes(':')) {
    // Migration: legacy plaintext password check
    return storedHashOrPlain === password;
  }
  const [salt, key] = storedHashOrPlain.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface StoredAccount {
  id: string;
  username: string;
  tag: string;
  email: string;
  password?: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  role?: 'admin' | 'moderator' | 'member' | 'host' | 'bot';
  createdAt: number;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: number | null;
  timedOutUntil?: number | null;
  timeoutReason?: string;
}

export interface RegisteredServer {
  id: string;
  name: string;
  description?: string;
  url: string;
  ownerId?: string;
  createdAt: number;
  channelsCount?: number;
  isDefault?: boolean;
  activeMembers?: number;
  voiceMembers?: number;
  isOnline?: boolean;
  latency?: number;
  icon?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  category?: string;
  serverId?: string;
}

export interface Message {
  id: string;
  serverId?: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  reactions?: Record<string, string[]>;
  timestamp: number;
  system?: boolean;
}

export interface FriendshipRecord {
  id: string;
  userA: string;
  userB: string;
  requesterId: string;
  status: 'friends' | 'pending' | 'blocked';
  updatedAt: number;
}

export interface DirectMessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  text: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  reactions?: Record<string, string[]>;
  timestamp: number;
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '';

export const isNeonConfigured = !!DATABASE_URL;

// Initial seed data
export const defaultAccounts: StoredAccount[] = [
  {
    id: 'user-galaxy505g',
    username: 'galaxy505g',
    tag: '5050',
    email: 'sharozayan9@gmail.com',
    password: hashPassword('password123'),
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=galaxy505g',
    bio: 'Galaxy Cord Super Administrator 🛡️',
    status: 'online',
    customStatus: 'Managing Galaxy Cord on Neon 🛡️',
    role: 'admin',
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'user-elena',
    username: 'Elena Rostova',
    tag: '1001',
    email: 'elena@nexus.io',
    password: hashPassword('password123'),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    bio: 'Competitive gamer & screen share streamer 🎮',
    status: 'online',
    customStatus: 'Screen sharing gameplay 🎮',
    role: 'member',
    createdAt: Date.now() - 86400000 * 40,
  },
  {
    id: 'user-marcus',
    username: 'Marcus Vance',
    tag: '2048',
    email: 'marcus@nexus.io',
    password: hashPassword('password123'),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    bio: 'Self-hosting enthusiast & Linux dev ⚡',
    status: 'idle',
    customStatus: 'Deploying nodes on Pterodactyl',
    role: 'moderator',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'user-cybernova',
    username: 'CyberNova',
    tag: '7777',
    email: 'nova@nexus.io',
    password: hashPassword('password123'),
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNova',
    bio: 'WebRTC, synthwave & open protocols 🎧',
    status: 'online',
    customStatus: 'Coding bots for Galaxy Cord',
    role: 'member',
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'sys-nexus',
    username: 'Galaxy Bot',
    tag: '0001',
    email: 'bot@nexus.io',
    password: hashPassword('internal-galaxy-bot-pass-9988'),
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    bio: 'Official Galaxy Cord automated assistant 🤖',
    status: 'online',
    customStatus: 'Powered by Neon Lakebase Postgres',
    role: 'bot',
    createdAt: Date.now() - 86400000 * 50,
  },
];

export const defaultChannels: Channel[] = [
  { id: 'c-general', name: 'general', type: 'text', topic: 'General discussion for all Galaxy Cord users', category: 'TEXT CHANNELS', serverId: 'nexus-global-community' },
  { id: 'c-announcements', name: 'announcements', type: 'text', topic: 'Galaxy Cord updates and announcements', category: 'TEXT CHANNELS', serverId: 'nexus-global-community' },
  { id: 'c-gaming', name: 'gaming', type: 'text', topic: 'Games, clips, and screen share party', category: 'TEXT CHANNELS', serverId: 'nexus-global-community' },
  { id: 'c-dev-hub', name: 'dev-and-self-host', type: 'text', topic: 'Discuss custom server setups and scripting', category: 'TEXT CHANNELS', serverId: 'nexus-global-community' },
  { id: 'v-lounge', name: 'Lounge Talk', type: 'voice', topic: 'Casual voice chat', category: 'VOICE & VIDEO', serverId: 'nexus-global-community' },
  { id: 'v-screenshare', name: 'Screen Share & Streams', type: 'voice', topic: 'Share your screen, games, or work', category: 'VOICE & VIDEO', serverId: 'nexus-global-community' },
  { id: 'v-gaming', name: 'Gaming Squad', type: 'voice', topic: 'Low-latency gaming voice channel', category: 'VOICE & VIDEO', serverId: 'nexus-global-community' },
];

export const defaultServerInfo: RegisteredServer = {
  id: 'nexus-global-community',
  name: 'Galaxy Cord Global Hub',
  description: 'Official master hub for voice hangouts, screen streaming & chat.',
  icon: '🌌',
  url: '',
  ownerId: 'system',
  isDefault: true,
  isOnline: true,
  createdAt: Date.now() - 86400000 * 30,
};

export const defaultMessages: Message[] = [
  {
    id: 'm-welcome-1',
    channelId: 'c-general',
    serverId: 'nexus-global-community',
    senderId: 'sys-nexus',
    senderName: 'Galaxy Bot',
    senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    text: '👋 Welcome to **Galaxy Cord**! Connected to **Neon Lakebase Postgres**.\n\nYou can chat with rich markdown, jump into voice channels to talk with low-latency WebRTC, and stream your screen in crystal-clear quality.',
    timestamp: Date.now() - 3600000 * 4,
    system: true,
  },
  {
    id: 'm-welcome-2',
    channelId: 'c-general',
    serverId: 'nexus-global-community',
    senderId: 'user-elena',
    senderName: 'Elena Rostova',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    text: 'Hey everyone! Testing voice & screen sharing quality — crystal clear 60fps! 🚀',
    timestamp: Date.now() - 1800000,
    reactions: { '🔥': ['sys-nexus', 'user-marcus'], '✨': ['sys-nexus'] },
  },
];

class NeonDatabaseManager {
  private sql: any = null;
  public accounts: StoredAccount[] = [...defaultAccounts];
  public servers: RegisteredServer[] = [defaultServerInfo];
  public channels: Channel[] = [...defaultChannels];
  public messages: Message[] = [...defaultMessages];
  public friendships: FriendshipRecord[] = [
    {
      id: 'fr-elena-marcus',
      userA: 'user-elena',
      userB: 'user-marcus',
      requesterId: 'user-elena',
      status: 'friends',
      updatedAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'fr-elena-cyber',
      userA: 'user-elena',
      userB: 'user-cybernova',
      requesterId: 'user-cybernova',
      status: 'friends',
      updatedAt: Date.now() - 86400000 * 3,
    },
  ];
  public directMessages: DirectMessageRecord[] = [
    {
      id: 'dm-init-1',
      conversationId: 'user-elena_user-marcus',
      senderId: 'user-elena',
      senderName: 'Elena Rostova',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      recipientId: 'user-marcus',
      text: 'Hey Marcus! Direct messaging on Galaxy Cord backed by Neon Postgres is super fast!',
      timestamp: Date.now() - 3600000 * 12,
    },
  ];
  public isConnected: boolean = false;
  public dbInfo: any = {};

  constructor() {
    if (DATABASE_URL) {
      try {
        this.sql = neon(DATABASE_URL);
      } catch (e) {
        console.error('Failed to initialize Neon SQL client:', e);
      }
    }
  }

  async init(): Promise<void> {
    if (!this.sql) {
      console.warn('⚠️ DATABASE_URL not set. Running with fallback storage.');
      this.ensureGalaxyAdmin();
      return;
    }

    try {
      console.log('⚡ Initializing Neon Lakebase Postgres tables...');
      
      // 1. Create Accounts table
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_accounts (
          id VARCHAR(128) PRIMARY KEY,
          username VARCHAR(128) NOT NULL,
          tag VARCHAR(16) NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255),
          avatar TEXT,
          bio TEXT,
          status VARCHAR(32) DEFAULT 'online',
          custom_status TEXT,
          role VARCHAR(32) DEFAULT 'member',
          created_at BIGINT NOT NULL,
          is_banned BOOLEAN DEFAULT FALSE,
          ban_reason TEXT,
          ban_expires_at BIGINT,
          timed_out_until BIGINT,
          timeout_reason TEXT
        );
      `;

      // 2. Create Servers table
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_servers (
          id VARCHAR(128) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          url TEXT,
          owner_id VARCHAR(128),
          created_at BIGINT NOT NULL,
          channels_count INT DEFAULT 0,
          is_default BOOLEAN DEFAULT FALSE,
          active_members INT DEFAULT 0,
          voice_members INT DEFAULT 0,
          is_online BOOLEAN DEFAULT TRUE,
          latency INT DEFAULT 0,
          icon TEXT
        );
      `;

      // 3. Create Channels table
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_channels (
          id VARCHAR(128) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          type VARCHAR(32) NOT NULL,
          topic TEXT,
          category VARCHAR(128),
          server_id VARCHAR(128)
        );
      `;

      // 4. Create Messages table
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_messages (
          id VARCHAR(128) PRIMARY KEY,
          server_id VARCHAR(128),
          channel_id VARCHAR(128) NOT NULL,
          sender_id VARCHAR(128) NOT NULL,
          sender_name VARCHAR(128) NOT NULL,
          sender_avatar TEXT,
          text TEXT NOT NULL,
          attachments JSONB,
          reactions JSONB,
          timestamp BIGINT NOT NULL,
          system BOOLEAN DEFAULT FALSE
        );
      `;

      // 5. Create Friendships table
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_friendships (
          id VARCHAR(128) PRIMARY KEY,
          user_a VARCHAR(128) NOT NULL,
          user_b VARCHAR(128) NOT NULL,
          requester_id VARCHAR(128) NOT NULL,
          status VARCHAR(32) NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `;

      // 6. Create Direct Messages table
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_direct_messages (
          id VARCHAR(128) PRIMARY KEY,
          conversation_id VARCHAR(255) NOT NULL,
          sender_id VARCHAR(128) NOT NULL,
          sender_name VARCHAR(128) NOT NULL,
          sender_avatar TEXT,
          recipient_id VARCHAR(128) NOT NULL,
          text TEXT NOT NULL,
          attachments JSONB,
          reactions JSONB,
          timestamp BIGINT NOT NULL
        );
      `;

      // 7. Create Sessions table for secure token validation
      await this.sql`
        CREATE TABLE IF NOT EXISTS galaxy_sessions (
          token VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          created_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL
        );
      `;

      // Test connection info
      const dbMeta = await this.sql`SELECT current_database() as db, current_user as user, version() as version;`;
      this.dbInfo = dbMeta[0] || {};
      this.isConnected = true;
      console.log(`✅ Connected to Neon Lakebase Postgres (${this.dbInfo.db}) as ${this.dbInfo.user}`);

      // Load existing records from Postgres
      await this.loadFromPostgres();

      // Ensure galaxy505g administrator exists
      this.ensureGalaxyAdmin();
      await this.syncGalaxyAdminToDb();

    } catch (err: any) {
      console.error('❌ Neon Postgres initialization failed:', err.message);
      this.isConnected = false;
      this.ensureGalaxyAdmin();
    }
  }

  private async loadFromPostgres(): Promise<void> {
    try {
      const rows = await this.sql`SELECT * FROM galaxy_accounts;`;
      if (rows && rows.length > 0) {
        this.accounts = rows.map((r: any) => {
          let pw = r.password;
          if (pw && !pw.includes(':')) {
            pw = hashPassword(pw);
            this.sql`UPDATE galaxy_accounts SET password = ${pw} WHERE id = ${r.id}`.catch(() => {});
          }
          return {
            id: r.id,
            username: r.username,
            tag: r.tag,
            email: r.email,
            password: pw,
            avatar: r.avatar,
            bio: r.bio,
            status: r.status,
            customStatus: r.custom_status,
            role: r.role,
            createdAt: Number(r.created_at || Date.now()),
            isBanned: r.is_banned,
            banReason: r.ban_reason,
            banExpiresAt: r.ban_expires_at ? Number(r.ban_expires_at) : null,
            timedOutUntil: r.timed_out_until ? Number(r.timed_out_until) : null,
            timeoutReason: r.timeout_reason,
          };
        });
        console.log(`📥 Loaded ${this.accounts.length} accounts from Neon Postgres`);
      } else {
        console.log('🌱 Seeding initial accounts into Neon Postgres...');
        for (const acc of defaultAccounts) {
          await this.insertAccount(acc);
        }
        this.accounts = [...defaultAccounts];
      }

      // Servers
      const serverRows = await this.sql`SELECT * FROM galaxy_servers;`;
      if (serverRows && serverRows.length > 0) {
        this.servers = serverRows.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          url: r.url || '',
          ownerId: r.owner_id,
          createdAt: Number(r.created_at || Date.now()),
          channelsCount: r.channels_count || 7,
          isDefault: r.is_default,
          activeMembers: r.active_members || 1,
          voiceMembers: r.voice_members || 0,
          isOnline: r.is_online !== false,
          latency: r.latency || 18,
          icon: r.icon,
        }));
      } else {
        await this.insertServer(defaultServerInfo);
        this.servers = [defaultServerInfo];
      }

      // Channels
      const channelRows = await this.sql`SELECT * FROM galaxy_channels;`;
      if (channelRows && channelRows.length > 0) {
        this.channels = channelRows.map((r: any) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          topic: r.topic,
          category: r.category,
          serverId: r.server_id,
        }));
      } else {
        for (const ch of defaultChannels) {
          await this.insertChannel(ch);
        }
        this.channels = [...defaultChannels];
      }

      // Messages
      const msgRows = await this.sql`SELECT * FROM galaxy_messages ORDER BY timestamp ASC LIMIT 200;`;
      if (msgRows && msgRows.length > 0) {
        this.messages = msgRows.map((r: any) => ({
          id: r.id,
          serverId: r.server_id,
          channelId: r.channel_id,
          senderId: r.sender_id,
          senderName: r.sender_name,
          senderAvatar: r.sender_avatar,
          text: r.text,
          attachments: r.attachments,
          reactions: r.reactions,
          timestamp: Number(r.timestamp),
          system: r.system,
        }));
      } else {
        for (const msg of defaultMessages) {
          await this.insertMessage(msg);
        }
        this.messages = [...defaultMessages];
      }

      // Friendships
      const frRows = await this.sql`SELECT * FROM galaxy_friendships;`;
      if (frRows && frRows.length > 0) {
        this.friendships = frRows.map((r: any) => ({
          id: r.id,
          userA: r.user_a,
          userB: r.user_b,
          requesterId: r.requester_id,
          status: r.status,
          updatedAt: Number(r.updated_at),
        }));
      }

      // Direct Messages
      const dmRows = await this.sql`SELECT * FROM galaxy_direct_messages ORDER BY timestamp ASC LIMIT 500;`;
      if (dmRows && dmRows.length > 0) {
        this.directMessages = dmRows.map((r: any) => ({
          id: r.id,
          conversationId: r.conversation_id,
          senderId: r.sender_id,
          senderName: r.sender_name,
          senderAvatar: r.sender_avatar,
          recipientId: r.recipient_id,
          text: r.text,
          attachments: r.attachments,
          reactions: r.reactions,
          timestamp: Number(r.timestamp),
        }));
      }

    } catch (e: any) {
      console.error('Error loading data from Neon Postgres:', e.message);
    }
  }

  public sessions = new Map<string, SessionRecord>();

  async createSession(userId: string): Promise<string> {
    const token = 'sess_' + crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + 86400000 * 30; // 30 days
    const session: SessionRecord = { token, userId, createdAt: now, expiresAt };
    this.sessions.set(token, session);

    if (this.sql) {
      try {
        await this.sql`
          INSERT INTO galaxy_sessions (token, user_id, created_at, expires_at)
          VALUES (${token}, ${userId}, ${now}, ${expiresAt})
          ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at;
        `;
      } catch (e: any) {
        console.error('Failed to persist session to Neon:', e.message);
      }
    }
    return token;
  }

  async verifySession(token: string): Promise<StoredAccount | null> {
    if (!token) return null;
    const now = Date.now();
    let sess = this.sessions.get(token);
    if (!sess && this.sql) {
      try {
        const rows = await this.sql`SELECT * FROM galaxy_sessions WHERE token = ${token} AND expires_at > ${now} LIMIT 1;`;
        if (rows && rows.length > 0) {
          sess = {
            token: rows[0].token,
            userId: rows[0].user_id,
            createdAt: Number(rows[0].created_at),
            expiresAt: Number(rows[0].expires_at),
          };
          this.sessions.set(token, sess);
        }
      } catch (e: any) {
        console.error('Session lookup error:', e.message);
      }
    }

    if (!sess || sess.expiresAt <= now) {
      this.sessions.delete(token);
      return null;
    }

    const account = this.accounts.find((a) => a.id === sess!.userId);
    return account || null;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
    if (this.sql) {
      try {
        await this.sql`DELETE FROM galaxy_sessions WHERE token = ${token};`;
      } catch {}
    }
  }

  public ensureGalaxyAdmin() {
    let admin = this.accounts.find(
      (a) => a.username.toLowerCase() === 'galaxy505g' || a.id === 'user-galaxy505g' || (a.email && a.email.toLowerCase() === 'sharozayan9@gmail.com')
    );
    if (!admin) {
      admin = {
        id: 'user-galaxy505g',
        username: 'galaxy505g',
        tag: '5050',
        email: 'sharozayan9@gmail.com',
        password: hashPassword('password123'),
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=galaxy505g',
        bio: 'Galaxy Cord Super Administrator 🛡️',
        status: 'online',
        customStatus: 'Managing Galaxy Cord 🛡️',
        role: 'admin',
        createdAt: Date.now() - 86400000 * 60,
      };
      this.accounts.unshift(admin);
    } else {
      admin.role = 'admin';
      if (!admin.email) admin.email = 'sharozayan9@gmail.com';
      if (admin.password && !admin.password.includes(':')) {
        admin.password = hashPassword(admin.password);
      }
    }
  }

  public async syncGalaxyAdminToDb() {
    const admin = this.accounts.find((a) => a.username.toLowerCase() === 'galaxy505g');
    if (admin && this.sql) {
      await this.insertAccount(admin);
    }
  }

  // Account operations
  async insertAccount(acc: StoredAccount): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`
        INSERT INTO galaxy_accounts (
          id, username, tag, email, password, avatar, bio, status, custom_status, role,
          created_at, is_banned, ban_reason, ban_expires_at, timed_out_until, timeout_reason
        ) VALUES (
          ${acc.id}, ${acc.username}, ${acc.tag}, ${acc.email || null}, ${acc.password || null},
          ${acc.avatar}, ${acc.bio || null}, ${acc.status}, ${acc.customStatus || null}, ${acc.role || 'member'},
          ${acc.createdAt}, ${acc.isBanned || false}, ${acc.banReason || null}, ${acc.banExpiresAt || null},
          ${acc.timedOutUntil || null}, ${acc.timeoutReason || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          tag = EXCLUDED.tag,
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          avatar = EXCLUDED.avatar,
          bio = EXCLUDED.bio,
          status = EXCLUDED.status,
          custom_status = EXCLUDED.custom_status,
          role = EXCLUDED.role,
          is_banned = EXCLUDED.is_banned,
          ban_reason = EXCLUDED.ban_reason,
          ban_expires_at = EXCLUDED.ban_expires_at,
          timed_out_until = EXCLUDED.timed_out_until,
          timeout_reason = EXCLUDED.timeout_reason;
      `;
    } catch (err: any) {
      console.error('Failed to persist account to Neon:', err.message);
    }
  }

  async insertServer(srv: RegisteredServer): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`
        INSERT INTO galaxy_servers (
          id, name, description, url, owner_id, created_at, channels_count, is_default, active_members, voice_members, is_online, latency, icon
        ) VALUES (
          ${srv.id}, ${srv.name}, ${srv.description || null}, ${srv.url || ''}, ${srv.ownerId || null},
          ${srv.createdAt}, ${srv.channelsCount || 0}, ${srv.isDefault || false}, ${srv.activeMembers || 0},
          ${srv.voiceMembers || 0}, ${srv.isOnline !== false}, ${srv.latency || 0}, ${srv.icon || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          url = EXCLUDED.url,
          channels_count = EXCLUDED.channels_count,
          is_online = EXCLUDED.is_online,
          latency = EXCLUDED.latency;
      `;
    } catch (err: any) {
      console.error('Failed to persist server to Neon:', err.message);
    }
  }

  async deleteServer(serverId: string): Promise<void> {
    this.servers = this.servers.filter((s) => s.id !== serverId);
    if (!this.sql) return;
    try {
      await this.sql`DELETE FROM galaxy_servers WHERE id = ${serverId};`;
    } catch (err: any) {
      console.error('Failed to delete server from Neon:', err.message);
    }
  }

  async insertChannel(ch: Channel): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`
        INSERT INTO galaxy_channels (id, name, type, topic, category, server_id)
        VALUES (${ch.id}, ${ch.name}, ${ch.type}, ${ch.topic || null}, ${ch.category || null}, ${ch.serverId || null})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          topic = EXCLUDED.topic,
          category = EXCLUDED.category;
      `;
    } catch (err: any) {
      console.error('Failed to persist channel to Neon:', err.message);
    }
  }

  async insertMessage(msg: Message): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`
        INSERT INTO galaxy_messages (
          id, server_id, channel_id, sender_id, sender_name, sender_avatar, text, attachments, reactions, timestamp, system
        ) VALUES (
          ${msg.id}, ${msg.serverId || null}, ${msg.channelId}, ${msg.senderId}, ${msg.senderName}, ${msg.senderAvatar},
          ${msg.text}, ${msg.attachments ? JSON.stringify(msg.attachments) : null},
          ${msg.reactions ? JSON.stringify(msg.reactions) : null}, ${msg.timestamp}, ${msg.system || false}
        )
        ON CONFLICT (id) DO UPDATE SET
          reactions = EXCLUDED.reactions;
      `;
    } catch (err: any) {
      console.error('Failed to persist message to Neon:', err.message);
    }
  }

  async insertFriendship(fr: FriendshipRecord): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`
        INSERT INTO galaxy_friendships (id, user_a, user_b, requester_id, status, updated_at)
        VALUES (${fr.id}, ${fr.userA}, ${fr.userB}, ${fr.requesterId}, ${fr.status}, ${fr.updatedAt})
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at;
      `;
    } catch (err: any) {
      console.error('Failed to persist friendship to Neon:', err.message);
    }
  }

  async insertDirectMessage(dm: DirectMessageRecord): Promise<void> {
    if (!this.sql) return;
    try {
      await this.sql`
        INSERT INTO galaxy_direct_messages (
          id, conversation_id, sender_id, sender_name, sender_avatar, recipient_id, text, attachments, reactions, timestamp
        ) VALUES (
          ${dm.id}, ${dm.conversationId}, ${dm.senderId}, ${dm.senderName}, ${dm.senderAvatar},
          ${dm.recipientId}, ${dm.text}, ${dm.attachments ? JSON.stringify(dm.attachments) : null},
          ${dm.reactions ? JSON.stringify(dm.reactions) : null}, ${dm.timestamp}
        )
        ON CONFLICT (id) DO UPDATE SET
          reactions = EXCLUDED.reactions;
      `;
    } catch (err: any) {
      console.error('Failed to persist direct message to Neon:', err.message);
    }
  }

  async executeRawQuery(queryString: string) {
    if (!this.sql) throw new Error('Database not connected');
    return await this.sql(queryString);
  }

  async getHealthStatus() {
    let pgOk = false;
    let latencyMs = -1;
    let tableStats = {};

    if (this.sql) {
      const start = Date.now();
      try {
        const res = await this.sql`
          SELECT 
            (SELECT COUNT(*) FROM galaxy_accounts) AS accounts_count,
            (SELECT COUNT(*) FROM galaxy_messages) AS messages_count,
            (SELECT COUNT(*) FROM galaxy_servers) AS servers_count,
            (SELECT COUNT(*) FROM galaxy_channels) AS channels_count;
        `;
        latencyMs = Date.now() - start;
        pgOk = true;
        tableStats = res[0] || {};
      } catch (e: any) {
        latencyMs = Date.now() - start;
      }
    }

    return {
      neonLakebasePostgres: {
        configured: !!DATABASE_URL,
        connected: pgOk,
        latencyMs,
        database: this.dbInfo.db || 'neondb',
        user: this.dbInfo.user || 'neondb_owner',
        version: this.dbInfo.version,
        stats: tableStats,
      },
      neonAuth: {
        configured: !!process.env.NEON_AUTH_BASE_URL,
        baseUrl: process.env.NEON_AUTH_BASE_URL,
        jwksUrl: process.env.NEON_AUTH_JWKS_URL,
        provider: 'better_auth',
      },
      branch: process.env.NEON_BRANCH || 'production',
      serverTime: new Date().toISOString(),
    };
  }
}

export const neonDb = new NeonDatabaseManager();
