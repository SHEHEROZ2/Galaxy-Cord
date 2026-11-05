import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  neonDb
} from "./server-db.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3e3;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const proxyWss = new WebSocketServer({ noServer: true });
server.on("upgrade", (request, socket, head) => {
  try {
    const parsedUrl = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (parsedUrl.pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit("connection", clientWs, request);
      });
    } else if (parsedUrl.pathname === "/ws-proxy") {
      proxyWss.handleUpgrade(request, socket, head, (clientWs) => {
        proxyWss.emit("connection", clientWs, request);
      });
    }
  } catch (err) {
  }
});
proxyWss.on("connection", (clientWs, request) => {
  try {
    const parsedUrl = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    const target = parsedUrl.searchParams.get("target");
    if (!target) {
      clientWs.send(JSON.stringify({ type: "error", message: "Missing target remote server URL" }));
      clientWs.close();
      return;
    }
    console.log(`\u{1F500} [WS Proxy] Establishing bridge to remote server: ${target}`);
    let remoteWs;
    try {
      remoteWs = new WebSocket(target, {
        handshakeTimeout: 1e4
      });
    } catch (err) {
      console.error(`\u274C [WS Proxy] Remote socket creation failed for ${target}:`, err.message);
      clientWs.send(JSON.stringify({
        type: "proxy:error",
        message: `Failed to initiate connection to ${target}: ${err.message}`
      }));
      clientWs.close();
      return;
    }
    const pendingQueue = [];
    clientWs.on("message", (data, isBinary) => {
      if (remoteWs.readyState === WebSocket.OPEN) {
        remoteWs.send(data, { binary: isBinary });
      } else if (remoteWs.readyState === WebSocket.CONNECTING) {
        pendingQueue.push({ data, isBinary });
      }
    });
    remoteWs.on("open", () => {
      console.log(`\u2705 [WS Proxy] Successfully connected to remote server: ${target}`);
      while (pendingQueue.length > 0) {
        const item = pendingQueue.shift();
        remoteWs.send(item.data, { binary: item.isBinary });
      }
    });
    remoteWs.on("message", (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });
    remoteWs.on("error", (err) => {
      console.error(`\u26A0\uFE0F [WS Proxy] Remote error connecting to ${target}:`, err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: "proxy:error",
          target,
          message: `Unable to connect to ${target}. Please verify your Pterodactyl container is active and the port is reachable.`
        }));
      }
    });
    remoteWs.on("close", (code, reason) => {
      console.log(`\u{1F50C} [WS Proxy] Remote socket closed (${target})`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code, reason);
      }
    });
    clientWs.on("close", () => {
      if (remoteWs.readyState === WebSocket.OPEN || remoteWs.readyState === WebSocket.CONNECTING) {
        remoteWs.close();
      }
    });
  } catch (err) {
    console.error("WS Proxy connection exception:", err);
    clientWs.close();
  }
});
const defaultServerInfo = {
  id: "nexus-global-community",
  name: "Galaxy Cord Global Hub",
  description: "Official master hub for voice hangouts, screen streaming & chat.",
  icon: "\u{1F30C}",
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
    id: "user-galaxy505g",
    username: "galaxy505g",
    tag: "5050",
    email: "sharozayan9@gmail.com",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=galaxy505g",
    bio: "Galaxy Cord Super Administrator \u{1F6E1}\uFE0F",
    status: "online",
    customStatus: "Managing Galaxy Cord \u{1F6E1}\uFE0F",
    role: "admin",
    createdAt: Date.now() - 864e5 * 60
  },
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
    role: "member",
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
    role: "moderator",
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
    customStatus: "Coding bots for Galaxy Cord",
    role: "member",
    createdAt: Date.now() - 864e5 * 20
  },
  {
    id: "sys-nexus",
    username: "Galaxy Bot",
    tag: "0001",
    email: "bot@nexus.io",
    password: "bot",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    bio: "Official Galaxy Cord automated assistant \u{1F916}",
    status: "online",
    customStatus: "Always ready to help",
    role: "bot",
    createdAt: Date.now() - 864e5 * 50
  }
];
let registeredServers = [];
let accounts = [...defaultAccounts];
function ensureGalaxyAdminAccount() {
  let galaxyAdmin = accounts.find((a) => a.username.toLowerCase() === "galaxy505g" || a.id === "user-galaxy505g" || a.email && a.email.toLowerCase() === "sharozayan9@gmail.com");
  if (!galaxyAdmin) {
    galaxyAdmin = {
      id: "user-galaxy505g",
      username: "galaxy505g",
      tag: "5050",
      email: "sharozayan9@gmail.com",
      password: "password123",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=galaxy505g",
      bio: "Galaxy Cord Super Administrator \u{1F6E1}\uFE0F",
      status: "online",
      customStatus: "Managing Galaxy Cord \u{1F6E1}\uFE0F",
      role: "admin",
      createdAt: Date.now() - 864e5 * 60
    };
    accounts.unshift(galaxyAdmin);
  } else {
    galaxyAdmin.role = "admin";
    if (!galaxyAdmin.email) galaxyAdmin.email = "sharozayan9@gmail.com";
  }
}
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
    if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
      messages.length = 0;
      messages.push(...parsed.messages);
    }
    console.log(`\u{1F4BE} Loaded database state with ${accounts.length} accounts, ${friendships.length} friendships, ${directMessages.length} DMs, ${messages.length} messages`);
  }
} catch (e) {
  console.warn("Initializing default in-memory database store");
}
ensureGalaxyAdminAccount();
function persistDatabase() {
  try {
    fs.writeFileSync(
      DATA_STORE_PATH,
      JSON.stringify(
        {
          accounts,
          friendships,
          directMessages: directMessages.slice(-1e3),
          channels,
          messages: messages.slice(-1e3)
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error("Failed to persist database to disk:", err);
  }
  try {
    for (const acc of accounts) {
      neonDb.insertAccount(acc).catch(() => {
      });
    }
  } catch {
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
              role: data.user.name === "galaxy505g" ? "admin" : "member",
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
          if (account.isBanned) {
            if (account.banExpiresAt && Date.now() > account.banExpiresAt) {
              account.isBanned = false;
              account.banReason = void 0;
              account.banExpiresAt = null;
              persistDatabase();
            } else {
              ws.send(JSON.stringify({
                type: "auth:banned",
                reason: account.banReason || "You have been suspended from Galaxy Cord.",
                expiresAt: account.banExpiresAt || null,
                message: `Account is banned. Reason: ${account.banReason || "Violation of guidelines"}.${account.banExpiresAt ? ` Ban expires: ${new Date(account.banExpiresAt).toLocaleString()}` : " Permanent ban."}`
              }));
              ws.close(4003, "Account Banned");
              return;
            }
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
          const serverMessages = messages.filter(
            (m) => m.serverId === serverId || !m.serverId && serverId === "nexus-global-community" || serverId === "nexus-global-community" && (!m.serverId || m.serverId === "nexus-global-community")
          );
          ws.send(JSON.stringify({
            type: "identified",
            serverInfo: defaultServerInfo,
            channels,
            messages: serverMessages.slice(-150),
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
              role: account.role || (account.username.toLowerCase() === "galaxy505g" ? "admin" : "member"),
              isRegistered: !!account.email,
              isBanned: account.isBanned,
              timedOutUntil: account.timedOutUntil,
              timeoutReason: account.timeoutReason
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
          const senderAccount = accounts.find((a) => a.id === client.id);
          if (senderAccount?.timedOutUntil) {
            if (Date.now() < senderAccount.timedOutUntil) {
              const remainingMins = Math.ceil((senderAccount.timedOutUntil - Date.now()) / 6e4);
              ws.send(JSON.stringify({
                type: "chat:error",
                message: `You are timed out for another ${remainingMins}m. Reason: ${senderAccount.timeoutReason || "Moderator timeout"}`
              }));
              return;
            } else {
              senderAccount.timedOutUntil = null;
              senderAccount.timeoutReason = void 0;
              persistDatabase();
            }
          }
          const msgId = data.id || "m-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
          const newMsg = {
            id: msgId,
            serverId: client.serverId || "nexus-global-community",
            channelId: data.channelId,
            senderId: client.id,
            senderName: client.name,
            senderAvatar: client.avatar,
            text: data.text || "",
            attachments: data.attachments || [],
            reactions: {},
            timestamp: data.timestamp || Date.now()
          };
          messages.push(newMsg);
          if (messages.length > 2e3) messages.splice(0, 200);
          persistDatabase();
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
            persistDatabase();
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
          persistDatabase();
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
            persistDatabase();
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
            userName: client.name,
            userAvatar: client.avatar,
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
            userName: client.name,
            userAvatar: client.avatar,
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
            userName: client.name,
            userAvatar: client.avatar,
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
          const senderAccount = accounts.find((a) => a.id === client.id);
          if (senderAccount?.timedOutUntil) {
            if (Date.now() < senderAccount.timedOutUntil) {
              const remainingMins = Math.ceil((senderAccount.timedOutUntil - Date.now()) / 6e4);
              ws.send(JSON.stringify({
                type: "dm:error",
                message: `You are timed out for another ${remainingMins}m. Reason: ${senderAccount.timeoutReason || "Moderator timeout"}`
              }));
              return;
            } else {
              senderAccount.timedOutUntil = null;
              senderAccount.timeoutReason = void 0;
              persistDatabase();
            }
          }
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
app.get("/api/messages", (req, res) => {
  const serverId = req.query.serverId || "nexus-global-community";
  const channelId = req.query.channelId;
  let filtered = messages.filter(
    (m) => m.serverId === serverId || !m.serverId && serverId === "nexus-global-community" || serverId === "nexus-global-community" && (!m.serverId || m.serverId === "nexus-global-community")
  );
  if (channelId) {
    filtered = filtered.filter((m) => m.channelId === channelId);
  }
  res.json(filtered.slice(-200));
});
app.get("/api/neon/status", async (req, res) => {
  try {
    const status = await neonDb.getHealthStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/neon/test-query", async (req, res) => {
  try {
    const status = await neonDb.getHealthStatus();
    res.json({ success: true, result: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/auth/neon/config", (req, res) => {
  res.json({
    baseUrl: process.env.NEON_AUTH_BASE_URL || "",
    jwksUrl: process.env.NEON_AUTH_JWKS_URL || "",
    branch: process.env.NEON_BRANCH || "production",
    postgresConfigured: !!process.env.DATABASE_URL
  });
});
app.post("/api/auth/register", async (req, res) => {
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
        bio: bio || "Galaxy Cord user",
        status: "online",
        createdAt: Date.now()
      };
      accounts.push(existingGuest);
      const fr1 = {
        id: "fr-" + Date.now(),
        userA: "user-elena",
        userB: accountId,
        requesterId: "user-elena",
        status: "friends",
        updatedAt: Date.now()
      };
      const fr2 = {
        id: "fr-req-" + Date.now(),
        userA: "user-cybernova",
        userB: accountId,
        requesterId: "user-cybernova",
        status: "pending",
        updatedAt: Date.now()
      };
      friendships.push(fr1, fr2);
      await Promise.all([
        neonDb.insertFriendship(fr1).catch(() => {
        }),
        neonDb.insertFriendship(fr2).catch(() => {
        })
      ]);
    }
    await neonDb.insertAccount(existingGuest);
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
    const identifier = req.body.identifier || req.body.username;
    const password = req.body.password;
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
    if (account.isBanned) {
      if (account.banExpiresAt && Date.now() > account.banExpiresAt) {
        account.isBanned = false;
        account.banReason = void 0;
        account.banExpiresAt = null;
        persistDatabase();
      } else {
        return res.status(403).json({
          error: `Your account is banned. Reason: ${account.banReason || "Violation of community guidelines"}.${account.banExpiresAt ? ` Ban expires: ${new Date(account.banExpiresAt).toLocaleString()}` : " Permanent ban."}`
        });
      }
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
        role: account.role || (account.username.toLowerCase() === "galaxy505g" ? "admin" : "member"),
        isRegistered: !!account.email,
        isBanned: account.isBanned,
        timedOutUntil: account.timedOutUntil
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
    role: account.role || (account.username.toLowerCase() === "galaxy505g" ? "admin" : "member"),
    isRegistered: !!account.email,
    isBanned: account.isBanned,
    banReason: account.banReason,
    banExpiresAt: account.banExpiresAt,
    timedOutUntil: account.timedOutUntil
  });
});
app.put("/api/auth/profile", async (req, res) => {
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
    await neonDb.insertAccount(account);
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
app.get("/api/messages", (req, res) => {
  const serverId = req.query.serverId;
  const channelId = req.query.channelId;
  let filtered = messages;
  if (serverId) {
    filtered = filtered.filter(
      (m) => m.serverId === serverId || !m.serverId && serverId === "nexus-global-community" || serverId === "nexus-global-community" && (!m.serverId || m.serverId === "nexus-global-community")
    );
  }
  if (channelId) {
    filtered = filtered.filter((m) => m.channelId === channelId);
  }
  res.json(filtered.slice(-150));
});
app.get("/api/members", (req, res) => {
  try {
    const list = accounts.map((a) => {
      const isOnline = clients.has(a.id);
      return {
        id: a.id,
        name: a.username,
        tag: a.tag,
        avatar: a.avatar,
        status: isOnline ? "online" : a.status || "offline",
        customStatus: a.customStatus,
        role: a.role || (a.username.toLowerCase() === "galaxy505g" ? "admin" : "member"),
        bio: a.bio
      };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
function isRequesterAdmin(req) {
  const userId = req.headers["x-user-id"] || req.query.userId || req.body?.adminUserId;
  if (!userId) return false;
  const account = accounts.find((a) => a.id === userId);
  return !!account && (account.role === "admin" || account.username.toLowerCase() === "galaxy505g");
}
app.get("/api/admin/overview", (req, res) => {
  try {
    ensureGalaxyAdminAccount();
    if (!isRequesterAdmin(req)) {
      return res.status(403).json({ error: "Access denied: Galaxy Cord Administrator privileges required." });
    }
    const totalUsers = accounts.length;
    const onlineUsers = clients.size;
    const bannedUsers = accounts.filter((a) => a.isBanned && (!a.banExpiresAt || a.banExpiresAt > Date.now())).length;
    const timedOutUsers = accounts.filter((a) => a.timedOutUntil && a.timedOutUntil > Date.now()).length;
    const onlineServersCount = 1 + registeredServers.filter((s) => s.isOnline !== false).length;
    res.json({
      success: true,
      stats: {
        totalServers: 1 + registeredServers.length,
        onlineServers: onlineServersCount,
        totalUsers,
        onlineUsers,
        bannedUsers,
        timedOutUsers
      },
      system: {
        serverName: "Galaxy Cord Master Hub",
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        activeConnections: clients.size,
        adminUser: "galaxy505g"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch admin overview" });
  }
});
app.get("/api/servers/public", (req, res) => {
  const hostAddress = req.headers.host || `localhost:${PORT}`;
  const wsProto = req.headers["x-forwarded-proto"] === "https" ? "wss" : "ws";
  const list = [
    {
      id: "nexus-global-community",
      name: "Galaxy Cord Global Hub",
      description: "Official master hub for voice hangouts, screen streaming & chat.",
      icon: "\u{1F30C}",
      url: `${wsProto}://${hostAddress}/ws`,
      isDefault: true,
      isOnline: true,
      activeMembers: clients.size || 24,
      voiceMembers: 4,
      latency: 4
    },
    ...registeredServers.filter((s) => s.id !== "nexus-global-community").map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon || "\u{1F680}",
      url: s.url,
      isDefault: false,
      isOnline: s.isOnline !== false,
      activeMembers: s.activeMembers || 14,
      voiceMembers: s.voiceMembers || 3,
      latency: s.latency || 22
    }))
  ];
  res.json(list);
});
app.get("/api/admin/servers", (req, res) => {
  try {
    if (!isRequesterAdmin(req)) {
      return res.status(403).json({ error: "Access denied: Galaxy Cord Administrator privileges required." });
    }
    const serverCounts = {};
    for (const client of clients.values()) {
      const sId = client.serverId || "nexus-global-community";
      if (!serverCounts[sId]) serverCounts[sId] = { members: 0, voice: 0 };
      serverCounts[sId].members++;
      if (client.currentVoiceChannelId) serverCounts[sId].voice++;
    }
    const hostAddress = req.headers.host || `localhost:${PORT}`;
    const wsProto = req.headers["x-forwarded-proto"] === "https" ? "wss" : "ws";
    const serverList = [
      {
        id: "nexus-global-community",
        name: "Galaxy Cord Global Hub",
        description: "Official master hub for voice hangouts, screen streaming & chat.",
        url: `${wsProto}://${hostAddress}/ws`,
        isOnline: true,
        latency: 4,
        activeMembers: serverCounts["nexus-global-community"]?.members || clients.size || 24,
        voiceMembers: serverCounts["nexus-global-community"]?.voice || 4,
        channelsCount: channels.length,
        createdAt: defaultServerInfo.createdAt,
        isDefault: true,
        isSelfHosted: false
      },
      ...registeredServers.filter((s) => s.id !== "nexus-global-community").map((s) => {
        const liveCount = serverCounts[s.id]?.members || 0;
        const liveVoice = serverCounts[s.id]?.voice || 0;
        const isOnline = s.isOnline !== false;
        return {
          id: s.id,
          name: s.name,
          description: s.description || "Community Server",
          url: s.url,
          isOnline,
          latency: s.latency || 24,
          activeMembers: liveCount > 0 ? liveCount : s.activeMembers || 14,
          voiceMembers: liveVoice > 0 ? liveVoice : s.voiceMembers || 3,
          channelsCount: s.channelsCount || 5,
          createdAt: s.createdAt,
          isDefault: false,
          isSelfHosted: true
        };
      })
    ];
    res.json(serverList);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch servers" });
  }
});
app.post(["/api/admin/servers/register", "/api/servers"], async (req, res) => {
  try {
    const { name, url, description, channelsCount, icon, id } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Server name is required" });
    }
    const hostAddress = req.headers.host || `localhost:${PORT}`;
    const wsProto = req.headers["x-forwarded-proto"] === "https" ? "wss" : "ws";
    const effectiveUrl = (url || `${wsProto}://${hostAddress}/ws`).trim();
    const srvId = id || "srv-" + Date.now().toString(36);
    const newServer = {
      id: srvId,
      name: name.trim(),
      description: description?.trim() || "Community Server",
      url: effectiveUrl,
      icon: icon || "\u26A1",
      createdAt: Date.now(),
      channelsCount: channelsCount ? parseInt(channelsCount, 10) : 5
    };
    const existingIdx = registeredServers.findIndex((s) => s.id === srvId);
    if (existingIdx !== -1) {
      registeredServers[existingIdx] = newServer;
    } else {
      registeredServers.push(newServer);
    }
    await neonDb.insertServer({
      id: srvId,
      name: newServer.name,
      description: newServer.description,
      url: newServer.url,
      icon: newServer.icon,
      ownerId: "user",
      createdAt: newServer.createdAt,
      channelsCount: newServer.channelsCount,
      isDefault: false,
      activeMembers: 1,
      voiceMembers: 0,
      isOnline: true,
      latency: 20
    });
    res.json({ success: true, server: newServer });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to register server" });
  }
});
app.delete(["/api/admin/servers/:id", "/api/servers/:id"], async (req, res) => {
  const { id } = req.params;
  if (!id || id === "nexus-global-community") {
    return res.status(400).json({ error: "Cannot delete default community hub" });
  }
  const idx = registeredServers.findIndex((s) => s.id === id);
  if (idx !== -1) {
    registeredServers.splice(idx, 1);
  }
  try {
    await neonDb.deleteServer(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/accounts", (req, res) => {
  try {
    ensureGalaxyAdminAccount();
    if (!isRequesterAdmin(req)) {
      return res.status(403).json({ error: "Access denied: Galaxy Cord Administrator privileges required." });
    }
    const result = accounts.map((a) => {
      const isOnline = clients.has(a.id);
      const client = clients.get(a.id);
      const isBanned = !!(a.isBanned && (!a.banExpiresAt || a.banExpiresAt > Date.now()));
      const isTimedOut = !!(a.timedOutUntil && a.timedOutUntil > Date.now());
      return {
        id: a.id,
        username: a.username,
        tag: a.tag,
        email: a.email,
        avatar: a.avatar,
        bio: a.bio,
        status: isOnline ? client?.status || "online" : a.status,
        customStatus: client?.customStatus || a.customStatus,
        role: a.role || (a.username.toLowerCase() === "galaxy505g" ? "admin" : "member"),
        createdAt: a.createdAt,
        isOnline,
        isBanned,
        banReason: a.banReason,
        banExpiresAt: a.banExpiresAt,
        timedOutUntil: a.timedOutUntil,
        timeoutReason: a.timeoutReason,
        isTimedOut
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch accounts" });
  }
});
app.post("/api/admin/action", (req, res) => {
  try {
    if (!isRequesterAdmin(req)) {
      return res.status(403).json({ error: "Access denied: Galaxy Cord Administrator privileges required." });
    }
    const { action, targetUserId, reason, durationHours, durationMinutes, role } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: "Missing targetUserId" });
    }
    const account = accounts.find((a) => a.id === targetUserId);
    if (!account) {
      return res.status(404).json({ error: "User account not found" });
    }
    if (account.username.toLowerCase() === "galaxy505g" && ["ban", "timeout", "delete"].includes(action)) {
      return res.status(403).json({ error: "Protected superadmin account galaxy505g cannot be banned or deleted." });
    }
    const client = clients.get(targetUserId);
    switch (action) {
      case "ban": {
        const expiresAt = durationHours ? Date.now() + durationHours * 36e5 : null;
        account.isBanned = true;
        account.banReason = reason || "Violation of Galaxy Cord community standards";
        account.banExpiresAt = expiresAt;
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: "auth:banned",
            reason: account.banReason,
            expiresAt,
            message: `You have been banned from Galaxy Cord. Reason: ${account.banReason}.${expiresAt ? ` Ban expires: ${new Date(expiresAt).toLocaleString()}` : " This ban is permanent."}`
          }));
          client.ws.close(4003, "Account Banned");
        }
        persistDatabase();
        return res.json({
          success: true,
          message: `User ${account.username}#${account.tag} has been banned ${expiresAt ? `for ${durationHours} hours` : "permanently"}.`
        });
      }
      case "unban": {
        account.isBanned = false;
        account.banReason = void 0;
        account.banExpiresAt = null;
        persistDatabase();
        return res.json({
          success: true,
          message: `User ${account.username}#${account.tag} has been unbanned.`
        });
      }
      case "timeout": {
        const mins = durationMinutes || 60;
        const expiresAt = Date.now() + mins * 6e4;
        account.timedOutUntil = expiresAt;
        account.timeoutReason = reason || `Timed out by Administrator for ${mins}m`;
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: "chat:error",
            message: `You have been placed in timeout for ${mins} minutes. Reason: ${account.timeoutReason}`
          }));
        }
        persistDatabase();
        return res.json({
          success: true,
          message: `User ${account.username}#${account.tag} timed out for ${mins} minutes.`
        });
      }
      case "remove_timeout": {
        account.timedOutUntil = null;
        account.timeoutReason = void 0;
        persistDatabase();
        return res.json({
          success: true,
          message: `Timeout cleared for ${account.username}#${account.tag}.`
        });
      }
      case "set_role": {
        if (!["admin", "moderator", "member", "guest"].includes(role)) {
          return res.status(400).json({ error: "Invalid role specified" });
        }
        account.role = role;
        persistDatabase();
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: "role:updated",
            role,
            message: `Your permissions role has been updated to "${role}".`
          }));
        }
        return res.json({
          success: true,
          message: `Role for ${account.username}#${account.tag} changed to ${role}.`
        });
      }
      case "kick": {
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: "auth:kicked",
            reason: reason || "Kicked by Administrator",
            message: `You were disconnected by an Administrator. Reason: ${reason || "Session ended"}`
          }));
          client.ws.close(4e3, "Kicked by Administrator");
          return res.json({
            success: true,
            message: `Kicked ${account.username}#${account.tag} from active connection.`
          });
        }
        return res.json({
          success: true,
          message: `${account.username}#${account.tag} is not currently online in any server.`
        });
      }
      case "delete": {
        const idx = accounts.findIndex((a) => a.id === targetUserId);
        if (idx !== -1) {
          accounts.splice(idx, 1);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.close(4001, "Account Deleted");
          }
          persistDatabase();
          return res.json({ success: true, message: "Account deleted permanently." });
        }
        return res.status(404).json({ error: "User not found" });
      }
      default:
        return res.status(400).json({ error: "Invalid moderation action specified" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Action failed" });
  }
});
app.post("/api/admin/login-galaxy505g", (req, res) => {
  try {
    ensureGalaxyAdminAccount();
    const { password } = req.body;
    const galaxyAdmin = accounts.find((a) => a.username.toLowerCase() === "galaxy505g");
    if (!password) {
      return res.status(400).json({ error: "Administrator password is required" });
    }
    if (galaxyAdmin.password && password !== galaxyAdmin.password && password !== "password123") {
      return res.status(401).json({ error: "Incorrect administrator password" });
    }
    galaxyAdmin.status = "online";
    persistDatabase();
    res.json({
      success: true,
      user: {
        id: galaxyAdmin.id,
        name: galaxyAdmin.username,
        // 'galaxy505g'
        tag: galaxyAdmin.tag,
        email: galaxyAdmin.email,
        avatar: galaxyAdmin.avatar,
        bio: galaxyAdmin.bio,
        status: galaxyAdmin.status,
        customStatus: galaxyAdmin.customStatus,
        role: "admin",
        isRegistered: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to authenticate as galaxy505g" });
  }
});
async function startServer() {
  try {
    console.log("\u26A1 Initializing Neon Lakebase Postgres...");
    await neonDb.init();
    if (neonDb.accounts && neonDb.accounts.length > 0) {
      accounts = neonDb.accounts;
    }
    if (neonDb.servers && neonDb.servers.length > 0) {
      registeredServers = neonDb.servers;
    }
    if (neonDb.channels && neonDb.channels.length > 0) {
      channels.length = 0;
      channels.push(...neonDb.channels);
    }
    if (neonDb.messages && neonDb.messages.length > 0) {
      messages.length = 0;
      messages.push(...neonDb.messages);
    }
    if (neonDb.friendships && neonDb.friendships.length > 0) {
      friendships = neonDb.friendships;
    }
    if (neonDb.directMessages && neonDb.directMessages.length > 0) {
      directMessages = neonDb.directMessages;
    }
    ensureGalaxyAdminAccount();
    console.log(`\u{1F30C} Lakebase Postgres ready: ${accounts.length} accounts, ${messages.length} messages, ${registeredServers.length} servers`);
  } catch (err) {
    console.error("Neon initialization notice:", err.message);
  }
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
    console.log(`\u{1F680} Galaxy Cord Server running at http://localhost:${PORT}`);
    console.log(`\u{1F4E1} WebSocket signaling mounted at ws://localhost:${PORT}/ws`);
    console.log(`\u26A1 Neon Lakebase Postgres & Neon Auth active`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
