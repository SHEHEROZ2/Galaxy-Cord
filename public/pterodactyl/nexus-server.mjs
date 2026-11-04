/**
 * ⚡ NEXUSCORD STANDALONE SERVER FOR PTERODACTYL & DOCKER ⚡
 * 
 * Works seamlessly inside Pterodactyl Panel containers (ghcr.io/parkervcp/yolks:nodejs_20)
 * as well as plain Node.js, VPS, Docker Compose, or local PCs.
 * 
 * Startup trigger: "Server ready!"
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

// Pterodactyl passes SERVER_PORT or PORT
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SERVER_NAME = process.env.SERVER_NAME || 'NexusCord Pterodactyl Server';
const SERVER_DESCRIPTION = process.env.SERVER_DESC || 'Self-hosted voice, video screen share & chat server';
const AUTH_PASSWORD = process.env.SERVER_PASSWORD || '';
const DATA_FILE = process.env.DATA_FILE 
  ? path.resolve(process.env.DATA_FILE)
  : path.resolve(process.cwd(), 'nexus-server-data.json');

console.log(`
===================================================================
      ⚡ NEXUSCORD STANDALONE SERVER IS STARTING UP ⚡
  Server Name : ${SERVER_NAME}
  Port        : ${PORT}
  Auth Token  : ${AUTH_PASSWORD ? 'Protected (Password Required)' : 'Public (No Password)'}
  Data File   : ${DATA_FILE}
  Environment : ${process.env.P_SERVER_UUID ? 'Pterodactyl Panel' : 'Standalone / Docker'}
===================================================================
`);

let channels = [
  { id: 'c-general', name: 'general', type: 'text', topic: 'Welcome to our private server!', category: 'TEXT CHANNELS' },
  { id: 'c-gaming', name: 'gaming', type: 'text', topic: 'Gaming talk and screen share clips', category: 'TEXT CHANNELS' },
  { id: 'v-lounge', name: 'General Voice', type: 'voice', topic: 'Voice chat room', category: 'VOICE & VIDEO' },
  { id: 'v-screenshare', name: 'Screen Share & Streams', type: 'voice', topic: 'Live screen sharing and video', category: 'VOICE & VIDEO' }
];

let messages = [
  {
    id: 'm-init',
    serverId: 'custom-' + PORT,
    channelId: 'c-general',
    senderId: 'sys-host',
    senderName: 'Server Engine',
    senderAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=PterodactylNode',
    text: `🚀 **Server is Online!** Welcome to **${SERVER_NAME}**.\nThis server is hosted directly in a container on your own Pterodactyl panel or server node. Your chats, WebRTC voice streams, and 60fps screen shares are completely private!`,
    timestamp: Date.now(),
    system: true
  }
];

function persistState() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = JSON.stringify({ channels, messages: messages.slice(-500) }, null, 2);
    const tmp = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, payload, 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
    console.log(`💾 [Storage] Successfully saved ${messages.length} messages and ${channels.length} channels to ${DATA_FILE}`);
  } catch (err) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ channels, messages: messages.slice(-500) }, null, 2), 'utf-8');
      console.log(`💾 [Storage] Saved via direct write to ${DATA_FILE}`);
    } catch (fallbackErr) {
      console.error(`❌ [Storage Error] Failed saving state to ${DATA_FILE}:`, fallbackErr.message);
    }
  }
}

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.channels) && parsed.channels.length > 0) channels = parsed.channels;
    if (Array.isArray(parsed.messages)) messages = parsed.messages;
    console.log(`💾 [Storage] Loaded persisted server state from ${DATA_FILE} (${messages.length} messages, ${channels.length} channels)`);
  } else {
    console.log(`💾 [Storage] Initializing fresh state file at ${DATA_FILE}`);
    persistState();
  }
} catch (e) {
  console.error(`⚠️ [Storage Error] Could not load state from ${DATA_FILE}:`, e.message);
}

// Graceful container shutdown on Pterodactyl Stop
process.on('SIGINT', () => {
  console.log('Stopping NexusCord server...');
  persistState();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping NexusCord server...');
  persistState();
  process.exit(0);
});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'online',
      serverName: SERVER_NAME,
      clientsOnline: clients.size,
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.2.0'
    }));
  } else if (pathname === '/messages' || pathname === '/api/messages') {
    const channelId = url.searchParams.get('channelId');
    let filtered = messages;
    if (channelId) {
      filtered = filtered.filter(m => m.channelId === channelId);
    }
    res.writeHead(200);
    res.end(JSON.stringify(filtered.slice(-150)));
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: SERVER_NAME,
      description: SERVER_DESCRIPTION,
      requiresPassword: !!AUTH_PASSWORD,
      channels: channels.map(c => ({ id: c.id, name: c.name, type: c.type, category: c.category }))
    }));
  }
});

const wss = new WebSocketServer({ server });
const clients = new Map();

function broadcast(payload, excludeWs = null) {
  const json = JSON.stringify(payload);
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(json);
    }
  }
}

function broadcastVoice(channelId, payload, excludeWs = null) {
  const json = JSON.stringify(payload);
  for (const client of clients.values()) {
    if (client.voiceChannelId === channelId && client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(json);
    }
  }
}

function getVoicePeers(channelId) {
  const list = [];
  for (const client of clients.values()) {
    if (client.voiceChannelId === channelId) {
      list.push({
        id: client.info.id,
        name: client.info.name,
        avatar: client.info.avatar,
        status: client.info.status,
        isMuted: client.isMuted || false,
        isDeafened: client.isDeafened || false,
        isScreenSharing: client.isScreenSharing || false,
        isCameraOn: client.isCameraOn || false,
        isSpeaking: client.isSpeaking || false
      });
    }
  }
  return list;
}

wss.on('connection', (ws) => {
  let clientId = '';

  ws.on('message', (msgRaw) => {
    try {
      const data = JSON.parse(msgRaw.toString());
      const { type } = data;

      switch (type) {
        case 'identify': {
          if (AUTH_PASSWORD && data.password !== AUTH_PASSWORD) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid server password' }));
            ws.close();
            return;
          }

          clientId = data.user.id;
          const assignedServerId = data.serverId || ('custom-' + PORT);
          const clientData = {
            ws,
            serverId: assignedServerId,
            info: {
              id: clientId,
              name: data.user.name || 'Anonymous',
              avatar: data.user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + clientId,
              status: data.user.status || 'online',
              customStatus: data.user.customStatus || ''
            },
            voiceChannelId: null,
            isMuted: false,
            isDeafened: false,
            isScreenSharing: false,
            isCameraOn: false,
            isSpeaking: false
          };

          clients.set(clientId, clientData);
          console.log(`🟢 [Connect] ${clientData.info.name} (${clientId}) | Total Online: ${clients.size}`);

          const returnMessages = messages.map(m => ({
            ...m,
            serverId: m.serverId || assignedServerId
          }));

          const memberList = Array.from(clients.values()).map(c => ({
            ...c.info,
            currentVoiceChannelId: c.voiceChannelId,
            isMuted: c.isMuted,
            isDeafened: c.isDeafened,
            isScreenSharing: c.isScreenSharing,
            isCameraOn: c.isCameraOn,
            isSpeaking: c.isSpeaking
          }));

          ws.send(JSON.stringify({
            type: 'identified',
            serverInfo: {
              id: assignedServerId,
              name: SERVER_NAME,
              description: SERVER_DESCRIPTION,
              icon: '⚡',
              isSelfHosted: true,
              createdAt: Date.now()
            },
            channels,
            messages: returnMessages.slice(-200),
            members: memberList
          }));

          broadcast({
            type: 'member:joined',
            member: {
              ...clientData.info,
              currentVoiceChannelId: null,
              isMuted: false,
              isDeafened: false,
              isScreenSharing: false,
              isCameraOn: false,
              isSpeaking: false
            }
          }, ws);
          break;
        }

        case 'chat:send': {
          const client = clients.get(clientId);
          if (!client) return;

          const msg = {
            id: data.id || ('m-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
            serverId: client.serverId || data.serverId || ('custom-' + PORT),
            channelId: data.channelId,
            senderId: client.info.id,
            senderName: client.info.name,
            senderAvatar: client.info.avatar,
            text: data.text || '',
            attachments: data.attachments || [],
            reactions: {},
            timestamp: Date.now()
          };

          messages.push(msg);
          if (messages.length > 500) messages.splice(0, messages.length - 500);
          persistState();
          broadcast({ type: 'chat:message', message: msg });
          break;
        }

        case 'chat:typing': {
          const client = clients.get(clientId);
          if (!client) return;
          broadcast({
            type: 'chat:typing',
            channelId: data.channelId,
            userId: client.info.id,
            userName: client.info.name,
            isTyping: !!data.isTyping
          }, ws);
          break;
        }

        case 'chat:reaction': {
          const client = clients.get(clientId);
          if (!client) return;
          const msg = messages.find(m => m.id === data.messageId);
          if (msg) {
            if (!msg.reactions) msg.reactions = {};
            const emoji = data.emoji;
            if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
            const idx = msg.reactions[emoji].indexOf(client.info.id);
            if (idx > -1) {
              msg.reactions[emoji].splice(idx, 1);
              if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
            } else {
              msg.reactions[emoji].push(client.info.id);
            }
            persistState();
            broadcast({
              type: 'chat:reaction_updated',
              channelId: data.channelId,
              messageId: data.messageId,
              reactions: msg.reactions
            });
          }
          break;
        }

        case 'channel:create': {
          const chanType = (data.channelType || data.type) === 'voice' ? 'voice' : 'text';
          const newChan = {
            id: 'c-' + Date.now().toString(36),
            name: (data.name || 'channel').toLowerCase().replace(/\s+/g, '-'),
            type: chanType,
            topic: data.topic || '',
            category: data.category || (chanType === 'voice' ? 'VOICE & VIDEO' : 'TEXT CHANNELS')
          };
          channels.push(newChan);
          persistState();
          broadcast({ type: 'channel:created', channel: newChan });
          break;
        }

        case 'channel:delete': {
          const idx = channels.findIndex(c => c.id === data.channelId);
          if (idx !== -1) {
            const removed = channels.splice(idx, 1)[0];
            persistState();
            broadcast({ type: 'channel:deleted', channelId: removed.id });
          }
          break;
        }

        // WebRTC Voice Mesh
        case 'voice:join': {
          const client = clients.get(clientId);
          if (!client) return;

          const oldChan = client.voiceChannelId;
          client.voiceChannelId = data.channelId;
          client.isMuted = !!data.isMuted;
          client.isDeafened = !!data.isDeafened;
          client.isScreenSharing = !!data.isScreenSharing;
          client.isCameraOn = !!data.isCameraOn;
          client.isSpeaking = false;

          if (oldChan && oldChan !== data.channelId) {
            broadcastVoice(oldChan, {
              type: 'voice:peer_left',
              channelId: oldChan,
              userId: client.info.id
            });
          }

          // Existing peers in this voice channel (excluding this client)
          const existingPeers = getVoicePeers(data.channelId).filter(p => p.id !== client.info.id);

          // 1. Send existing peers list to the joining user
          ws.send(JSON.stringify({
            type: 'voice:joined',
            channelId: data.channelId,
            peers: existingPeers
          }));

          // 2. Notify all existing peers in the voice channel about the new peer
          broadcastVoice(data.channelId, {
            type: 'voice:peer_joined',
            channelId: data.channelId,
            peer: {
              id: client.info.id,
              name: client.info.name,
              avatar: client.info.avatar,
              status: client.info.status,
              isMuted: client.isMuted,
              isDeafened: client.isDeafened,
              isScreenSharing: client.isScreenSharing,
              isCameraOn: client.isCameraOn,
              isSpeaking: false
            }
          }, ws);

          // 3. Update voice state for all server members
          broadcast({
            type: 'member:voice_state',
            userId: client.info.id,
            userName: client.info.name,
            userAvatar: client.info.avatar,
            channelId: data.channelId,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: client.isScreenSharing,
            isCameraOn: client.isCameraOn,
            isSpeaking: false
          });
          break;
        }

        case 'voice:leave': {
          const client = clients.get(clientId);
          if (!client || !client.voiceChannelId) return;

          const chanId = client.voiceChannelId;
          client.voiceChannelId = null;
          client.isScreenSharing = false;
          client.isCameraOn = false;
          client.isSpeaking = false;

          broadcastVoice(chanId, {
            type: 'voice:peer_left',
            channelId: chanId,
            userId: client.info.id
          });

          broadcast({
            type: 'member:voice_state',
            userId: client.info.id,
            userName: client.info.name,
            userAvatar: client.info.avatar,
            channelId: null,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: false,
            isCameraOn: false,
            isSpeaking: false
          });
          break;
        }

        case 'voice:state': {
          const client = clients.get(clientId);
          if (!client || !client.voiceChannelId) return;

          if (data.isMuted !== undefined) client.isMuted = data.isMuted;
          if (data.isDeafened !== undefined) client.isDeafened = data.isDeafened;
          if (data.isScreenSharing !== undefined) client.isScreenSharing = data.isScreenSharing;
          if (data.isCameraOn !== undefined) client.isCameraOn = data.isCameraOn;
          if (data.isSpeaking !== undefined) client.isSpeaking = data.isSpeaking;

          broadcastVoice(client.voiceChannelId, {
            type: 'voice:peer_state',
            channelId: client.voiceChannelId,
            userId: client.info.id,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: client.isScreenSharing,
            isCameraOn: client.isCameraOn,
            isSpeaking: client.isSpeaking
          });

          broadcast({
            type: 'member:voice_state',
            userId: client.info.id,
            userName: client.info.name,
            userAvatar: client.info.avatar,
            channelId: client.voiceChannelId,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: client.isScreenSharing,
            isCameraOn: client.isCameraOn,
            isSpeaking: client.isSpeaking
          });
          break;
        }

        case 'webrtc:signal': {
          const target = clients.get(data.targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'webrtc:signal',
              senderUserId: clientId,
              channelId: data.channelId,
              streamType: data.streamType,
              signal: data.signal
            }));
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        }
      }
    } catch (e) {
      console.error('Socket message parse error:', e.message);
    }
  });

  ws.on('close', () => {
    if (clientId) {
      const client = clients.get(clientId);
      if (client) {
        if (client.voiceChannelId) {
          broadcastVoice(client.voiceChannelId, {
            type: 'voice:peer_left',
            channelId: client.voiceChannelId,
            userId: client.info.id
          });
          broadcast({
            type: 'member:voice_state',
            userId: client.info.id,
            userName: client.info.name,
            userAvatar: client.info.avatar,
            channelId: null
          });
        }
        broadcast({ type: 'member:left', userId: client.info.id });
        console.log(`🔴 [Disconnect] ${client.info.name} (${clientId}) | Remaining: ${clients.size - 1}`);
        clients.delete(clientId);
      }
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`
✅ Server ready!
   📡 WebSocket Address : ws://${HOST}:${PORT}
   🩺 HTTP Health Check : http://${HOST}:${PORT}/health

To connect from NexusCord:
1. Open NexusCord web client
2. Click '+' (Join Server)
3. Enter Address: ws://${HOST}:${PORT} (or your Pterodactyl IP:Port)
`);
});
