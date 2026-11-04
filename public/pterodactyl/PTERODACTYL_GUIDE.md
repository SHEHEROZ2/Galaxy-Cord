# 🦖 Pterodactyl Panel Setup Guide for NexusCord

## 🌟 Overview
NexusCord can be hosted easily on any **Pterodactyl Panel** instance (including hosting providers like PebbleHost, Bisect, Shockbyte, FalixNodes, SparkedHost, or self-hosted Wings nodes).

No custom egg import required!

## 📥 Required Files
Place these files in your Pterodactyl server root folder:
1. `package.json` - Node dependencies (`ws`) and start scripts.
2. `server.js` (or `nexus-server.mjs`) - The Node.js WebSocket, chat & voice signaling server.

---

## 🛠️ Super Simple Installation (3 Steps):

### 1. Upload Files to File Manager
- Open your server in the **Pterodactyl Panel**.
- Click the **File Manager** tab.
- Upload `package.json` and `server.js` (or `nexus-server.mjs`) right next to each other in the root folder.

### 2. Start the Server
- In the Pterodactyl **Console**, click **Start** (runs `node server.js`).
- You will see:
  ```
  ✅ Server ready!
  📡 WebSocket Address : ws://0.0.0.0:<PORT>
  ```
- Your Pterodactyl server status will turn solid **Green (Online)**!

### 3. Join from NexusCord
- Copy your server IP & Port from the top of the Pterodactyl Console (for example: `142.250.190.46:25565` or `node1.myhost.net:8080`).
- Open NexusCord, click **"+" (Join Server)** on the left sidebar.
- Paste your IP:Port directly into the box and click **Connect**!
