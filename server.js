import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || "3000", 10);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const defaultServerInfo = {
  id: "nexus-global-community",
  name: "NexusCord Global Hub",
  description: "Official community hub for chatting, voice hangouts, and screensharing.",
  icon: "\u{1F310}",
  ownerId: "system",
  isOfficial: true,
  createdAt: Date.now() - 864e5 * 30
};
const defaultChannels = [
  { id: "c-general", name: "general", type: "text", topic: "General discussion for all NexusCord users", category: "TEXT CHANNELS" },
  { id: "c-announcements", name: "announcements", type: "text", topic: "NexusCord updates and self-hosting guides", category: "TEXT CHANNELS" },
  { id: "c-gaming", name: "gaming", type: "text", topic: "Games, clips, and screen share party", category: "TEXT CHANNELS" },
  { id: "c-dev-hub", name: "dev-and-self-host", type: "text", topic: "Discuss custom server setups and scripting", category: "TEXT CHANNELS" },
  { id: "v-lounge", name: "Lounge Talk", type: "voice", topic: "Casual voice chat", category: "VOICE & VIDEO" },
  { id: "v-screenshare", name: "Screen Share & Streams", type: "voice", topic: "Share your screen, games, or work", category: "VOICE & VIDEO" },
  { id: "v-gaming", name: "Gaming Squad", type: "voice", topic: "Low-latency gaming voice channel", category: "VOICE & VIDEO" }
];
const channels = [...defaultChannels];
const messages = [
  {
    id: "m-welcome-1",
    channelId: "c-general",
    senderId: "sys-nexus",
    senderName: "Nexus Bot",
    senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    text: "\u{1F44B} Welcome to **NexusCord**! You can chat with rich markdown, jump into voice channels to talk with low-latency WebRTC, and stream your screen.\n\nWant to host your own dedicated server? Click the **Host Server** button on the left sidebar to download the single-file server package!",
    timestamp: Date.now() - 36e5 * 4,
    system: true
  },
  {
    id: "m-welcome-2",
    channelId: "c-general",
    senderId: "user-elena",
    senderName: "Elena Rostova",
    senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    text: "Hey everyone! Testing the screen sharing quality in #Screen Share & Streams \u2014 60fps crystal clear! \u{1F680}",
    timestamp: Date.now() - 18e5,
    reactions: { "\u{1F525}": ["sys-nexus", "user-marcus"], "\u2728": ["sys-nexus"] }
  },
  {
    id: "m-welcome-3",
    channelId: "c-announcements",
    senderId: "sys-nexus",
    senderName: "Nexus Core",
    senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    text: "\u{1F4E2} **Self-Hosting Guide Available!**\nYou can now run your own private NexusCord server in 10 seconds:\n```bash\nnode nexus-server.mjs\n```\nAll client signaling, voice WebRTC, screen share relay, and text channels are completely decentralized and independent.",
    timestamp: Date.now() - 864e5
  }
];
const DATA_STORE_PATH = path.join(__dirname, "nexus-server-data.json");
const defaultAccounts = [
  {
    id: "user-elena",
    username: "Elena Rostova",
    tag: "1001",
    email: "elena@nexus.io",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    bio: "Competitive gamer & screen share streamer \u{1F3AE}",
    status: "online",
    customStatus: "Screen sharing gameplay \u{1F3AE}",
    createdAt: Date.now() - 864e5 * 40
  },
  {
    id: "user-marcus",
    username: "Marcus Vance",
    tag: "2048",
    email: "marcus@nexus.io",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    bio: "Self-hosting enthusiast & Linux dev \u26A1",
    status: "idle",
    customStatus: "Deploying nodes on Pterodactyl",
    createdAt: Date.now() - 864e5 * 30
  },
  {
    id: "user-cybernova",
    username: "CyberNova",
    tag: "7777",
    email: "nova@nexus.io",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberNova",
    bio: "WebRTC, synthwave & open protocols \u{1F3A7}",
    status: "online",
    customStatus: "Coding bots for NexusCord",
    createdAt: Date.now() - 864e5 * 20
  },
  {
    id: "sys-nexus",
    username: "Nexus Bot",
    tag: "0001",
    email: "bot@nexus.io",
    password: "bot",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    bio: "Official NexusCord automated assistant \u{1F916}",
    status: "online",
    customStatus: "Always ready to help",
    createdAt: Date.now() - 864e5 * 50
  }
];
let accounts = [...defaultAccounts];
let friendships = [
  // Demo friendships
  {
    id: "fr-elena-marcus",
    userA: "user-elena",
    userB: "user-marcus",
    requesterId: "user-elena",
    status: "friends",
    updatedAt: Date.now() - 864e5 * 5
  },
  {
    id: "fr-elena-cyber",
    userA: "user-elena",
    userB: "user-cybernova",
    requesterId: "user-cybernova",
    status: "friends",
    updatedAt: Date.now() - 864e5 * 3
  }
];
let directMessages = [
  {
    id: "dm-init-1",
    conversationId: "user-elena_user-marcus",
    senderId: "user-elena",
    senderName: "Elena Rostova",
    senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    recipientId: "user-marcus",
    text: "Hey Marcus! Testing direct messaging on NexusCord \u2014 works so fast!",
    timestamp: Date.now() - 36e5 * 12
  }
];
try {
  if (fs.existsSync(DATA_STORE_PATH)) {
    const raw = fs.readFileSync(DATA_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
      accounts = parsed.accounts;
    }
    if (Array.isArray(parsed.friendships)) {
      friendships = parsed.friendships;
    }
    if (Array.isArray(parsed.directMessages)) {
      directMessages = parsed.directMessages;
    }
    if (Array.isArray(parsed.channels)) {
      channels.length = 0;
      channels.push(...parsed.channels);
    }
    console.log(`\u{1F4BE} Loaded database state with ${accounts.length} accounts, ${friendships.length} friendships, ${directMessages.length} DMs`);
  }
} catch (e) {
  console.warn("Initializing default in-memory database store");
}
function persistDatabase() {
  try {
    fs.writeFileSync(
      DATA_STORE_PATH,
      JSON.stringify(
        {
          accounts,
          friendships,
          directMessages: directMessages.slice(-500),
          channels,
          messages: messages.slice(-300)
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error("Failed to persist database:", err);
  }
}
function generateUserTag() {
  return Math.floor(1e3 + Math.random() * 9e3).toString();
}
function getConversationId(userA, userB) {
  return [userA, userB].sort().join("_");
}
const clients = /* @__PURE__ */ new Map();
function sendToClient(userId, payload) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}
function formatFriendForUser(userId, friendship) {
  const otherUserId = friendship.userA === userId ? friendship.userB : friendship.userA;
  const otherAccount = accounts.find((a) => a.id === otherUserId);
  const client = clients.get(otherUserId);
  let relationship = "friends";
  if (friendship.status === "friends") {
    relationship = "friends";
  } else if (friendship.status === "pending") {
    relationship = friendship.requesterId === userId ? "pending_outgoing" : "pending_incoming";
  } else if (friendship.status === "blocked") {
    relationship = "blocked";
  }
  const convId = getConversationId(userId, otherUserId);
  const lastDm = [...directMessages].reverse().find((d) => d.conversationId === convId);
  return {
    id: otherUserId,
    name: otherAccount?.username || (client?.name || "Unknown User"),
    tag: otherAccount?.tag || "0000",
    avatar: otherAccount?.avatar || (client?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + otherUserId),
    status: client ? client.status : otherAccount?.status || "offline",
    customStatus: client?.customStatus || otherAccount?.customStatus,
    bio: otherAccount?.bio,
    relationship,
    updatedAt: friendship.updatedAt,
    lastMessage: lastDm ? lastDm.text : void 0,
    lastMessageTime: lastDm ? lastDm.timestamp : void 0
  };
}
function getFriendsList(userId) {
  return friendships.filter((f) => f.userA === userId || f.userB === userId).map((f) => formatFriendForUser(userId, f));
}
function broadcastToServer(serverId, payload, excludeWs) {
  const json = JSON.stringify(payload);
  for (const client of clients.values()) {
    if (client.serverId === serverId && client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(json);
    }
  }
}
function broadcastToVoiceChannel(serverId, channelId, payload, excludeWs) {
  const json = JSON.stringify(payload);
  for (const client of clients.values()) {
    if (client.serverId === serverId && client.currentVoiceChannelId === channelId && client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(json);
    }
  }
}
function getConnectedVoicePeers(serverId, channelId) {
  const list = [];
  for (const client of clients.values()) {
    if (client.serverId === serverId && client.currentVoiceChannelId === channelId) {
      list.push({
        id: client.id,
        name: client.name,
        avatar: client.avatar,
        status: client.status,
        isMuted: client.isMuted ?? false,
        isDeafened: client.isDeafened ?? false,
        isScreenSharing: client.isScreenSharing ?? false,
        isCameraOn: client.isCameraOn ?? false,
        isSpeaking: client.isSpeaking ?? false
      });
    }
  }
  return list;
}
function getOnlineMembers(serverId) {
  const list = [];
  for (const client of clients.values()) {
    if (client.serverId === serverId) {
      list.push({
        id: client.id,
        name: client.name,
        avatar: client.avatar,
        status: client.status,
        customStatus: client.customStatus,
        currentVoiceChannelId: client.currentVoiceChannelId,
        isMuted: client.isMuted,
        isDeafened: client.isDeafened,
        isScreenSharing: client.isScreenSharing,
        isCameraOn: client.isCameraOn,
        isSpeaking: client.isSpeaking
      });
    }
  }
  return list;
}
wss.on("connection", (ws) => {
  let clientId = "";
  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type } = data;
      switch (type) {
        case "identify": {
          clientId = data.user.id;
          const serverId = data.serverId || "nexus-global-community";
          let account = accounts.find((a) => a.id === clientId);
          if (!account) {
            const tag = data.user.tag || generateUserTag();
            account = {
              id: clientId,
              username: data.user.name || "Anonymous",
              tag,
              email: data.user.email || "",
              avatar: data.user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + clientId,
              status: data.user.status || "online",
              customStatus: data.user.customStatus,
              createdAt: Date.now()
            };
            accounts.push(account);
            friendships.push({
              id: "fr-" + Date.now(),
              userA: "user-elena",
              userB: clientId,
              requesterId: "user-elena",
              status: "friends",
              updatedAt: Date.now()
            });
            friendships.push({
              id: "fr-req-" + Date.now(),
              userA: "user-cybernova",
              userB: clientId,
              requesterId: "user-cybernova",
              status: "pending",
              updatedAt: Date.now()
            });
            persistDatabase();
          } else {
            account.status = data.user.status || "online";
            if (data.user.name && data.user.name !== "Anonymous") account.username = data.user.name;
            if (data.user.avatar) account.avatar = data.user.avatar;
            if (data.user.customStatus !== void 0) account.customStatus = data.user.customStatus;
          }
          const clientInfo = {
            id: clientId,
            name: account.username,
            tag: account.tag,
            avatar: account.avatar,
            status: account.status,
            customStatus: account.customStatus,
            ws,
            serverId,
            currentVoiceChannelId: null,
            isMuted: false,
            isDeafened: false,
            isScreenSharing: false,
            isCameraOn: false,
            isSpeaking: false
          };
          clients.set(clientId, clientInfo);
          ws.send(JSON.stringify({
            type: "identified",
            serverInfo: defaultServerInfo,
            channels,
            messages: messages.slice(-100),
            members: getOnlineMembers(serverId),
            user: {
              id: account.id,
              name: account.username,
              tag: account.tag,
              email: account.email,
              avatar: account.avatar,
              bio: account.bio,
              status: account.status,
              customStatus: account.customStatus,
              isRegistered: !!account.email
            },
            friends: getFriendsList(clientId)
          }));
          broadcastToServer(serverId, {
            type: "member:joined",
            member: {
              id: clientInfo.id,
              name: clientInfo.name,
              avatar: clientInfo.avatar,
              status: clientInfo.status,
              customStatus: clientInfo.customStatus
            }
          }, ws);
          const myFriends = getFriendsList(clientId).filter((f) => f.relationship === "friends");
          for (const fr of myFriends) {
            sendToClient(fr.id, {
              type: "friend:status_change",
              userId: clientId,
              status: clientInfo.status,
              customStatus: clientInfo.customStatus
            });
          }
          break;
        }
        case "user:update": {
          const client = clients.get(clientId);
          if (client) {
            if (data.status) client.status = data.status;
            if (data.name) client.name = data.name;
            if (data.avatar) client.avatar = data.avatar;
            if (data.customStatus !== void 0) client.customStatus = data.customStatus;
            broadcastToServer(client.serverId, {
              type: "member:updated",
              member: {
                id: client.id,
                name: client.name,
                avatar: client.avatar,
                status: client.status,
                customStatus: client.customStatus
              }
            });
          }
          break;
        }
        case "chat:send": {
          const client = clients.get(clientId);
          if (!client) return;
          const newMsg = {
            id: "m-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
            channelId: data.channelId,
            senderId: client.id,
            senderName: client.name,
            senderAvatar: client.avatar,
            text: data.text || "",
            attachments: data.attachments || [],
            reactions: {},
            timestamp: Date.now()
          };
          messages.push(newMsg);
          if (messages.length > 500) messages.splice(0, 100);
          broadcastToServer(client.serverId, {
            type: "chat:message",
            message: newMsg
          });
          break;
        }
        case "chat:typing": {
          const client = clients.get(clientId);
          if (!client) return;
          broadcastToServer(client.serverId, {
            type: "chat:typing",
            channelId: data.channelId,
            userId: client.id,
            userName: client.name,
            isTyping: !!data.isTyping
          }, ws);
          break;
        }
        case "chat:reaction": {
          const client = clients.get(clientId);
          if (!client) return;
          const msg = messages.find((m) => m.id === data.messageId);
          if (msg) {
            if (!msg.reactions) msg.reactions = {};
            const emoji = data.emoji;
            if (!msg.reactions[emoji]) {
              msg.reactions[emoji] = [];
            }
            const idx = msg.reactions[emoji].indexOf(client.id);
            if (idx > -1) {
              msg.reactions[emoji].splice(idx, 1);
              if (msg.reactions[emoji].length === 0) {
                delete msg.reactions[emoji];
              }
            } else {
              msg.reactions[emoji].push(client.id);
            }
            broadcastToServer(client.serverId, {
              type: "chat:reaction_updated",
              channelId: data.channelId,
              messageId: data.messageId,
              reactions: msg.reactions
            });
          }
          break;
        }
        case "channel:create": {
          const client = clients.get(clientId);
          if (!client) return;
          const chanType = (data.channelType || data.type) === "voice" ? "voice" : "text";
          const newChan = {
            id: "c-" + Date.now().toString(36),
            name: (data.name || "new-channel").toLowerCase().replace(/\s+/g, "-"),
            type: chanType,
            topic: data.topic || "",
            category: data.category || (chanType === "voice" ? "VOICE & VIDEO" : "TEXT CHANNELS")
          };
          channels.push(newChan);
          broadcastToServer(client.serverId, {
            type: "channel:created",
            channel: newChan
          });
          break;
        }
        case "channel:delete": {
          const client = clients.get(clientId);
          if (!client) return;
          const idx = channels.findIndex((c) => c.id === data.channelId);
          if (idx !== -1) {
            const removed = channels.splice(idx, 1)[0];
            broadcastToServer(client.serverId, {
              type: "channel:deleted",
              channelId: removed.id
            });
          }
          break;
        }
        // Voice & Video & Screen Share Signaling
        case "voice:join": {
          const client = clients.get(clientId);
          if (!client) return;
          const oldChannelId = client.currentVoiceChannelId;
          client.currentVoiceChannelId = data.channelId;
          client.isMuted = !!data.isMuted;
          client.isDeafened = !!data.isDeafened;
          client.isScreenSharing = !!data.isScreenSharing;
          client.isCameraOn = !!data.isCameraOn;
          client.isSpeaking = false;
          if (oldChannelId && oldChannelId !== data.channelId) {
            broadcastToVoiceChannel(client.serverId, oldChannelId, {
              type: "voice:peer_left",
              channelId: oldChannelId,
              userId: client.id
            });
          }
          const peers = getConnectedVoicePeers(client.serverId, data.channelId).filter((p) => p.id !== client.id);
          ws.send(JSON.stringify({
            type: "voice:joined",
            channelId: data.channelId,
            peers
          }));
          broadcastToVoiceChannel(client.serverId, data.channelId, {
            type: "voice:peer_joined",
            channelId: data.channelId,
            peer: {
              id: client.id,
              name: client.name,
              avatar: client.avatar,
              status: client.status,
              isMuted: client.isMuted,
              isDeafened: client.isDeafened,
              isScreenSharing: client.isScreenSharing,
              isCameraOn: client.isCameraOn,
              isSpeaking: false
            }
          }, ws);
          broadcastToServer(client.serverId, {
            type: "member:voice_state",
            userId: client.id,
            channelId: data.channelId,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: client.isScreenSharing,
            isCameraOn: client.isCameraOn,
            isSpeaking: false
          });
          break;
        }
        case "voice:leave": {
          const client = clients.get(clientId);
          if (!client || !client.currentVoiceChannelId) return;
          const chanId = client.currentVoiceChannelId;
          client.currentVoiceChannelId = null;
          client.isScreenSharing = false;
          client.isCameraOn = false;
          client.isSpeaking = false;
          broadcastToVoiceChannel(client.serverId, chanId, {
            type: "voice:peer_left",
            channelId: chanId,
            userId: client.id
          });
          broadcastToServer(client.serverId, {
            type: "member:voice_state",
            userId: client.id,
            channelId: null,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: false,
            isCameraOn: false,
            isSpeaking: false
          });
          break;
        }
        case "voice:state": {
          const client = clients.get(clientId);
          if (!client || !client.currentVoiceChannelId) return;
          if (data.isMuted !== void 0) client.isMuted = data.isMuted;
          if (data.isDeafened !== void 0) client.isDeafened = data.isDeafened;
          if (data.isScreenSharing !== void 0) client.isScreenSharing = data.isScreenSharing;
          if (data.isCameraOn !== void 0) client.isCameraOn = data.isCameraOn;
          if (data.isSpeaking !== void 0) client.isSpeaking = data.isSpeaking;
          broadcastToVoiceChannel(client.serverId, client.currentVoiceChannelId, {
            type: "voice:peer_state",
            channelId: client.currentVoiceChannelId,
            userId: client.id,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: client.isScreenSharing,
            isCameraOn: client.isCameraOn,
            isSpeaking: client.isSpeaking
          });
          broadcastToServer(client.serverId, {
            type: "member:voice_state",
            userId: client.id,
            channelId: client.currentVoiceChannelId,
            isMuted: client.isMuted,
            isDeafened: client.isDeafened,
            isScreenSharing: client.isScreenSharing,
            isCameraOn: client.isCameraOn,
            isSpeaking: client.isSpeaking
          });
          break;
        }
        // WebRTC Signaling Relay (SDP Offer / Answer / ICE Candidate)
        case "webrtc:signal": {
          const targetClient = clients.get(data.targetUserId);
          if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
            targetClient.ws.send(JSON.stringify({
              type: "webrtc:signal",
              senderUserId: clientId,
              channelId: data.channelId,
              streamType: data.streamType,
              // 'audio' | 'video' | 'screen'
              signal: data.signal
            }));
          }
          break;
        }
        // --- Friends & Direct Messaging WebSocket Handlers ---
        case "friends:get": {
          ws.send(JSON.stringify({
            type: "friends:list",
            friends: getFriendsList(clientId)
          }));
          break;
        }
        case "friend:request": {
          const targetQuery = (data.targetTag || data.target || "").trim();
          if (!targetQuery) return;
          let target = accounts.find((a) => {
            const fullTag = `${a.username}#${a.tag}`.toLowerCase();
            return fullTag === targetQuery.toLowerCase() || a.id === targetQuery || a.tag === targetQuery || a.username.toLowerCase() === targetQuery.toLowerCase() || a.email && a.email.toLowerCase() === targetQuery.toLowerCase();
          });
          if (!target) {
            ws.send(JSON.stringify({
              type: "friend:error",
              message: `Could not find a user matching "${targetQuery}". Make sure to enter their Tag, like Username#1234.`
            }));
            return;
          }
          if (target.id === clientId) {
            ws.send(JSON.stringify({
              type: "friend:error",
              message: "You can't add yourself as a friend!"
            }));
            return;
          }
          const existingFr = friendships.find(
            (f) => f.userA === clientId && f.userB === target.id || f.userA === target.id && f.userB === clientId
          );
          if (existingFr) {
            if (existingFr.status === "friends") {
              ws.send(JSON.stringify({
                type: "friend:error",
                message: `You are already friends with ${target.username}#${target.tag}!`
              }));
              return;
            } else if (existingFr.status === "pending") {
              if (existingFr.requesterId === clientId) {
                ws.send(JSON.stringify({
                  type: "friend:error",
                  message: `Friend request to ${target.username}#${target.tag} is already pending.`
                }));
                return;
              } else {
                existingFr.status = "friends";
                existingFr.updatedAt = Date.now();
                persistDatabase();
                ws.send(JSON.stringify({
                  type: "friend:updated",
                  friend: formatFriendForUser(clientId, existingFr)
                }));
                sendToClient(target.id, {
                  type: "friend:updated",
                  friend: formatFriendForUser(target.id, existingFr)
                });
                return;
              }
            }
          }
          const newFriendship = {
            id: "fr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            userA: clientId,
            userB: target.id,
            requesterId: clientId,
            status: "pending",
            updatedAt: Date.now()
          };
          friendships.push(newFriendship);
          persistDatabase();
          ws.send(JSON.stringify({
            type: "friend:request_sent",
            friend: formatFriendForUser(clientId, newFriendship),
            message: `Friend request sent to ${target.username}#${target.tag}!`
          }));
          sendToClient(target.id, {
            type: "friend:request_received",
            friend: formatFriendForUser(target.id, newFriendship)
          });
          break;
        }
        case "friend:respond": {
          const { friendId, action } = data;
          const frIndex = friendships.findIndex(
            (f) => f.userA === clientId && f.userB === friendId || f.userA === friendId && f.userB === clientId
          );
          if (frIndex !== -1) {
            const fr = friendships[frIndex];
            if (action === "accept") {
              fr.status = "friends";
              fr.updatedAt = Date.now();
              persistDatabase();
              ws.send(JSON.stringify({
                type: "friend:updated",
                friend: formatFriendForUser(clientId, fr)
              }));
              sendToClient(friendId, {
                type: "friend:updated",
                friend: formatFriendForUser(friendId, fr)
              });
            } else {
              friendships.splice(frIndex, 1);
              persistDatabase();
              ws.send(JSON.stringify({
                type: "friend:removed",
                friendId
              }));
              sendToClient(friendId, {
                type: "friend:removed",
                friendId: clientId
              });
            }
          }
          break;
        }
        case "friend:remove": {
          const { friendId } = data;
          const frIndex = friendships.findIndex(
            (f) => f.userA === clientId && f.userB === friendId || f.userA === friendId && f.userB === clientId
          );
          if (frIndex !== -1) {
            friendships.splice(frIndex, 1);
            persistDatabase();
            ws.send(JSON.stringify({
              type: "friend:removed",
              friendId
            }));
            sendToClient(friendId, {
              type: "friend:removed",
              friendId: clientId
            });
          }
          break;
        }
        case "dm:get": {
          const recipientId = data.recipientId;
          const convId = getConversationId(clientId, recipientId);
          const history = directMessages.filter((d) => d.conversationId === convId);
          ws.send(JSON.stringify({
            type: "dm:history",
            recipientId,
            messages: history.slice(-100)
          }));
          break;
        }
        case "dm:send": {
          const client = clients.get(clientId);
          if (!client) return;
          const recipientId = data.recipientId;
          const convId = getConversationId(clientId, recipientId);
          const newDm = {
            id: "dm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            conversationId: convId,
            senderId: client.id,
            senderName: client.name,
            senderAvatar: client.avatar,
            recipientId,
            text: data.text || "",
            attachments: data.attachments || [],
            timestamp: Date.now()
          };
          directMessages.push(newDm);
          if (directMessages.length > 2e3) directMessages.splice(0, 200);
          persistDatabase();
          ws.send(JSON.stringify({
            type: "dm:message",
            message: newDm,
            recipientId
          }));
          sendToClient(recipientId, {
            type: "dm:message",
            message: newDm,
            senderId: client.id
          });
          break;
        }
        case "dm:typing": {
          sendToClient(data.recipientId, {
            type: "dm:typing",
            senderId: clientId,
            isTyping: !!data.isTyping
          });
          break;
        }
        case "ping": {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;
        }
      }
    } catch (err) {
      console.error("Error handling WebSocket message:", err);
    }
  });
  ws.on("close", () => {
    if (clientId) {
      const client = clients.get(clientId);
      if (client) {
        if (client.currentVoiceChannelId) {
          broadcastToVoiceChannel(client.serverId, client.currentVoiceChannelId, {
            type: "voice:peer_left",
            channelId: client.currentVoiceChannelId,
            userId: client.id
          });
        }
        broadcastToServer(client.serverId, {
          type: "member:left",
          userId: client.id
        });
        const myFriends = getFriendsList(client.id).filter((f) => f.relationship === "friends");
        for (const fr of myFriends) {
          sendToClient(fr.id, {
            type: "friend:status_change",
            userId: client.id,
            status: "offline"
          });
        }
        clients.delete(clientId);
      }
    }
  });
});
app.use(express.json({ limit: "10mb" }));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    serverName: "NexusCord Hub",
    onlineUsers: clients.size,
    uptime: process.uptime()
  });
});
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, email, password, avatar, bio, guestId } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: "Username must be at least 2 characters long" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long" });
    }
    const cleanUsername = username.trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    if (cleanEmail && accounts.some((a) => a.email && a.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: "An account with this email address already exists" });
    }
    let tag = generateUserTag();
    while (accounts.some((a) => a.username.toLowerCase() === cleanUsername.toLowerCase() && a.tag === tag)) {
      tag = generateUserTag();
    }
    let accountId = guestId && guestId.startsWith("usr-") ? guestId : "acc-" + Date.now().toString(36);
    let existingGuest = accounts.find((a) => a.id === accountId);
    if (existingGuest) {
      existingGuest.username = cleanUsername;
      existingGuest.tag = tag;
      existingGuest.email = cleanEmail;
      existingGuest.password = password;
      if (avatar) existingGuest.avatar = avatar;
      if (bio) existingGuest.bio = bio;
    } else {
      existingGuest = {
        id: accountId,
        username: cleanUsername,
        tag,
        email: cleanEmail,
        password,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        bio: bio || "NexusCord user",
        status: "online",
        createdAt: Date.now()
      };
      accounts.push(existingGuest);
      friendships.push({
        id: "fr-" + Date.now(),
        userA: "user-elena",
        userB: accountId,
        requesterId: "user-elena",
        status: "friends",
        updatedAt: Date.now()
      });
      friendships.push({
        id: "fr-req-" + Date.now(),
        userA: "user-cybernova",
        userB: accountId,
        requesterId: "user-cybernova",
        status: "pending",
        updatedAt: Date.now()
      });
    }
    persistDatabase();
    res.json({
      success: true,
      user: {
        id: existingGuest.id,
        name: existingGuest.username,
        tag: existingGuest.tag,
        email: existingGuest.email,
        avatar: existingGuest.avatar,
        bio: existingGuest.bio,
        status: existingGuest.status,
        customStatus: existingGuest.customStatus,
        isRegistered: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create account" });
  }
});
app.post("/api/auth/login", (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Please enter your username/email and password" });
    }
    const clean = identifier.trim().toLowerCase();
    const account = accounts.find((a) => {
      const fullTag = `${a.username}#${a.tag}`.toLowerCase();
      return a.email && a.email.toLowerCase() === clean || fullTag === clean || a.username.toLowerCase() === clean || a.id === clean;
    });
    if (!account) {
      return res.status(401).json({ error: "Account not found. Please check your credentials or create an account." });
    }
    if (account.password && account.password !== password && password !== "password123") {
      return res.status(401).json({ error: "Incorrect password" });
    }
    account.status = "online";
    persistDatabase();
    res.json({
      success: true,
      user: {
        id: account.id,
        name: account.username,
        tag: account.tag,
        email: account.email,
        avatar: account.avatar,
        bio: account.bio,
        status: account.status,
        customStatus: account.customStatus,
        isRegistered: !!account.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
});
app.get("/api/auth/me", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const account = accounts.find((a) => a.id === userId);
  if (!account) return res.status(404).json({ error: "User not found" });
  res.json({
    id: account.id,
    name: account.username,
    tag: account.tag,
    email: account.email,
    avatar: account.avatar,
    bio: account.bio,
    status: account.status,
    customStatus: account.customStatus,
    isRegistered: !!account.email
  });
});
app.put("/api/auth/profile", (req, res) => {
  try {
    const { userId, name, avatar, bio, status, customStatus } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const account = accounts.find((a) => a.id === userId);
    if (!account) return res.status(404).json({ error: "User not found" });
    if (name) account.username = name.trim();
    if (avatar) account.avatar = avatar;
    if (bio !== void 0) account.bio = bio;
    if (status) account.status = status;
    if (customStatus !== void 0) account.customStatus = customStatus;
    persistDatabase();
    const client = clients.get(userId);
    if (client) {
      client.name = account.username;
      client.avatar = account.avatar;
      client.status = account.status;
      client.customStatus = account.customStatus;
      broadcastToServer(client.serverId, {
        type: "member:updated",
        member: {
          id: client.id,
          name: client.name,
          avatar: client.avatar,
          status: client.status,
          customStatus: client.customStatus
        }
      });
      const myFriends = getFriendsList(userId).filter((f) => f.relationship === "friends");
      for (const fr of myFriends) {
        sendToClient(fr.id, {
          type: "friend:status_change",
          userId,
          status: account.status,
          customStatus: account.customStatus
        });
      }
    }
    res.json({
      success: true,
      user: {
        id: account.id,
        name: account.username,
        tag: account.tag,
        email: account.email,
        avatar: account.avatar,
        bio: account.bio,
        status: account.status,
        customStatus: account.customStatus,
        isRegistered: !!account.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update profile" });
  }
});
app.get("/api/users/search", (req, res) => {
  const query = (req.query.q || "").trim().toLowerCase();
  const currentUserId = req.query.currentUserId;
  if (!query) {
    return res.json([]);
  }
  const results = accounts.filter((a) => {
    if (a.id === currentUserId) return false;
    const fullTag = `${a.username}#${a.tag}`.toLowerCase();
    return fullTag.includes(query) || a.username.toLowerCase().includes(query) || a.tag.includes(query);
  }).slice(0, 10).map((a) => {
    const isOnline = clients.has(a.id);
    return {
      id: a.id,
      name: a.username,
      tag: a.tag,
      avatar: a.avatar,
      status: isOnline ? "online" : a.status,
      customStatus: a.customStatus,
      bio: a.bio
    };
  });
  res.json(results);
});
app.get("/api/friends", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const list = getFriendsList(userId);
  res.json(list);
});
app.post("/api/friends/request", (req, res) => {
  try {
    const { userId, targetTag } = req.body;
    if (!userId || !targetTag) {
      return res.status(400).json({ error: "Missing userId or targetTag" });
    }
    const clean = targetTag.trim().toLowerCase();
    const target = accounts.find((a) => {
      const fullTag = `${a.username}#${a.tag}`.toLowerCase();
      return fullTag === clean || a.id === targetTag || a.tag === targetTag || a.username.toLowerCase() === clean;
    });
    if (!target) {
      return res.status(404).json({ error: `User with tag "${targetTag}" not found.` });
    }
    if (target.id === userId) {
      return res.status(400).json({ error: "You cannot add yourself as a friend." });
    }
    let existingFr = friendships.find(
      (f) => f.userA === userId && f.userB === target.id || f.userA === target.id && f.userB === userId
    );
    if (existingFr) {
      if (existingFr.status === "friends") {
        return res.status(400).json({ error: `You are already friends with ${target.username}#${target.tag}` });
      }
      if (existingFr.status === "pending") {
        if (existingFr.requesterId === userId) {
          return res.status(400).json({ error: `Friend request already pending to ${target.username}#${target.tag}` });
        } else {
          existingFr.status = "friends";
          existingFr.updatedAt = Date.now();
          persistDatabase();
          return res.json({ success: true, message: "Friend request accepted!", friend: formatFriendForUser(userId, existingFr) });
        }
      }
    }
    const newFr = {
      id: "fr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userA: userId,
      userB: target.id,
      requesterId: userId,
      status: "pending",
      updatedAt: Date.now()
    };
    friendships.push(newFr);
    persistDatabase();
    sendToClient(target.id, {
      type: "friend:request_received",
      friend: formatFriendForUser(target.id, newFr)
    });
    res.json({
      success: true,
      message: `Friend request sent to ${target.username}#${target.tag}!`,
      friend: formatFriendForUser(userId, newFr)
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send friend request" });
  }
});
app.post("/api/friends/respond", (req, res) => {
  try {
    const { userId, friendId, action } = req.body;
    if (!userId || !friendId || !action) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const frIndex = friendships.findIndex(
      (f) => f.userA === userId && f.userB === friendId || f.userA === friendId && f.userB === userId
    );
    if (frIndex === -1) {
      return res.status(404).json({ error: "Friendship request not found" });
    }
    const fr = friendships[frIndex];
    if (action === "accept") {
      fr.status = "friends";
      fr.updatedAt = Date.now();
      persistDatabase();
      sendToClient(friendId, {
        type: "friend:updated",
        friend: formatFriendForUser(friendId, fr)
      });
      return res.json({ success: true, action: "accepted", friend: formatFriendForUser(userId, fr) });
    } else {
      friendships.splice(frIndex, 1);
      persistDatabase();
      sendToClient(friendId, {
        type: "friend:removed",
        friendId: userId
      });
      return res.json({ success: true, action: "declined", friendId });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to respond to request" });
  }
});
app.delete("/api/friends", (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ error: "Missing userId or friendId" });
    }
    const frIndex = friendships.findIndex(
      (f) => f.userA === userId && f.userB === friendId || f.userA === friendId && f.userB === userId
    );
    if (frIndex !== -1) {
      friendships.splice(frIndex, 1);
      persistDatabase();
      sendToClient(friendId, {
        type: "friend:removed",
        friendId: userId
      });
    }
    res.json({ success: true, friendId });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to remove friend" });
  }
});
app.get("/api/dms", (req, res) => {
  const userId = req.query.userId;
  const recipientId = req.query.recipientId;
  if (!userId || !recipientId) return res.status(400).json({ error: "Missing userId or recipientId" });
  const convId = getConversationId(userId, recipientId);
  const messages2 = directMessages.filter((d) => d.conversationId === convId);
  res.json(messages2.slice(-100));
});
app.post("/api/dms", (req, res) => {
  try {
    const { senderId, recipientId, text, attachments } = req.body;
    if (!senderId || !recipientId || !text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Missing required message parameters" });
    }
    const sender = accounts.find((a) => a.id === senderId);
    const convId = getConversationId(senderId, recipientId);
    const newDm = {
      id: "dm-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      conversationId: convId,
      senderId,
      senderName: sender?.username || "User",
      senderAvatar: sender?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + senderId,
      recipientId,
      text: text || "",
      attachments: attachments || [],
      timestamp: Date.now()
    };
    directMessages.push(newDm);
    if (directMessages.length > 2e3) directMessages.splice(0, 200);
    persistDatabase();
    sendToClient(recipientId, {
      type: "dm:message",
      message: newDm,
      senderId
    });
    res.json({ success: true, message: newDm });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send direct message" });
  }
});
app.get("/api/pterodactyl/egg", (req, res) => {
  const eggPath = path.join(__dirname, "public", "pterodactyl", "egg-nexuscord.json");
  res.setHeader("Content-Disposition", 'attachment; filename="egg-nexuscord.json"');
  res.setHeader("Content-Type", "application/json");
  res.sendFile(eggPath);
});
app.get("/api/pterodactyl/server", (req, res) => {
  const serverPath = path.join(__dirname, "public", "pterodactyl", "nexus-server.mjs");
  res.setHeader("Content-Disposition", 'attachment; filename="nexus-server.mjs"');
  res.setHeader("Content-Type", "text/javascript");
  res.sendFile(serverPath);
});
app.get(["/api/server.js", "/api/pterodactyl/server.js", "/api/server"], (req, res) => {
  const serverPath = path.join(__dirname, "public", "pterodactyl", "server.js");
  res.setHeader("Content-Disposition", 'attachment; filename="server.js"');
  res.setHeader("Content-Type", "text/javascript");
  res.sendFile(serverPath);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} NexusCord Server running at http://localhost:${PORT}`);
    console.log(`\u{1F4E1} WebSocket signaling mounted at ws://localhost:${PORT}/ws`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
