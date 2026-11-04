// Cloudflare Worker handler for Galaxy Cord
// Handles /api/* routes (Authentication, Admin Panel, Community Servers)
// and passes static asset requests to env.ASSETS.fetch(request)

interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

// In-worker in-memory account store for dynamic registrations
const memoryAccounts = new Map<string, any>([
  [
    'galaxy505g',
    {
      id: 'admin-galaxy505g',
      username: 'galaxy505g',
      tag: '5050',
      email: 'sharozayan9@gmail.com',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
      bio: 'Lead Administrator & Architect of Galaxy Cord.',
      status: 'online',
      customStatus: 'Galaxy Cord Master Overseer 🌌',
      role: 'admin',
      createdAt: Date.now() - 86400000 * 45,
      isBanned: false,
      isTimedOut: false,
    },
  ],
  [
    'elena rostova',
    {
      id: 'user-elena',
      username: 'Elena Rostova',
      tag: '1001',
      email: 'elena@galaxycord.net',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      bio: 'Screen sharing gameplay & hosting voice rooms',
      status: 'online',
      customStatus: 'Screen sharing gameplay 🎮',
      role: 'moderator',
      createdAt: Date.now() - 86400000 * 20,
      isBanned: false,
      isTimedOut: false,
    },
  ],
  [
    'marcus vance',
    {
      id: 'user-marcus',
      username: 'Marcus Vance',
      tag: '2048',
      email: 'marcus@galaxycord.net',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      bio: 'VPS server hosting enthusiast & Docker sysadmin',
      status: 'idle',
      customStatus: 'Self-hosting node on VPS ⚡',
      role: 'member',
      createdAt: Date.now() - 86400000 * 15,
      isBanned: false,
      isTimedOut: false,
    },
  ],
  [
    'cybernova',
    {
      id: 'user-cybernova',
      username: 'CyberNova',
      tag: '7777',
      email: 'cybernova@galaxycord.net',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
      bio: 'Esports competitive player & streamer',
      status: 'online',
      customStatus: 'Live streaming squad ranked 🏆',
      role: 'member',
      createdAt: Date.now() - 86400000 * 10,
      isBanned: false,
      isTimedOut: false,
    },
  ],
]);

const ONLINE_COMMUNITY_SERVERS = [
  {
    id: 'nexus-global-community',
    name: 'Galaxy Cord Global Hub',
    description: 'Official master hub for voice hangouts, screen streaming & chat.',
    icon: '🌌',
    url: 'wss://galaxycord.net/ws',
    isOnline: true,
    latency: 18,
    activeMembers: 42,
    voiceMembers: 9,
    channelsCount: 7,
    createdAt: Date.now() - 86400000 * 30,
    isDefault: true,
    isSelfHosted: false,
  },
];


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Health check endpoint
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        app: 'Galaxy Cord',
        runtime: 'Cloudflare Workers Edge',
        timestamp: Date.now(),
      });
    }

    // Public servers list
    if (url.pathname === '/api/servers/public' && request.method === 'GET') {
      return jsonResponse({
        success: true,
        servers: ONLINE_COMMUNITY_SERVERS,
      });
    }

    // Authentication: Login
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const bodyText = await request.text();
        const body = bodyText ? JSON.parse(bodyText) : {};
        const { username, password } = body;

        const cleanInput = (username || '').trim().toLowerCase();
        let matched: any = null;

        for (const [key, acc] of memoryAccounts.entries()) {
          if (
            key === cleanInput ||
            acc.username.toLowerCase() === cleanInput ||
            acc.email.toLowerCase() === cleanInput ||
            `${acc.username.toLowerCase()}#${acc.tag}` === cleanInput
          ) {
            matched = acc;
            break;
          }
        }

        // Special handling for galaxy505g admin
        if (!matched && cleanInput === 'galaxy505g') {
          matched = memoryAccounts.get('galaxy505g');
        }

        if (!matched) {
          return jsonResponse({ error: 'Invalid username or password' }, 401);
        }

        if (matched.isBanned) {
          return jsonResponse({ error: 'This account has been banned from Galaxy Cord.' }, 403);
        }

        const safeUser = {
          id: matched.id,
          name: matched.username,
          tag: matched.tag,
          email: matched.email,
          avatar: matched.avatar,
          bio: matched.bio,
          status: matched.status || 'online',
          customStatus: matched.customStatus,
          role: matched.role || 'member',
          isRegistered: true,
          isBanned: matched.isBanned,
          isTimedOut: matched.isTimedOut,
        };

        return jsonResponse({
          success: true,
          user: safeUser,
          token: `cf-token-${matched.id}-${Date.now()}`,
        });
      } catch (err: any) {
        return jsonResponse({ error: 'Invalid JSON request payload: ' + (err.message || '') }, 400);
      }
    }

    // Authentication: Register
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { username, email, password, avatar } = body as any;

        if (!username || !email) {
          return jsonResponse({ error: 'Username and email are required' }, 400);
        }

        const cleanUsername = username.trim();
        const randTag = Math.floor(1000 + Math.random() * 9000).toString();
        const newAcc = {
          id: `user-${Date.now()}`,
          username: cleanUsername,
          tag: randTag,
          email: email.trim(),
          password: password || 'password123',
          avatar:
            avatar ||
            `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop`,
          bio: 'New Galaxy Cord explorer',
          status: 'online',
          customStatus: 'Exploring Galaxy Cord ✨',
          role: 'member',
          createdAt: Date.now(),
          isBanned: false,
          isTimedOut: false,
        };

        memoryAccounts.set(cleanUsername.toLowerCase(), newAcc);

        return jsonResponse({
          success: true,
          user: {
            id: newAcc.id,
            name: newAcc.username,
            tag: newAcc.tag,
            email: newAcc.email,
            avatar: newAcc.avatar,
            role: newAcc.role,
            status: newAcc.status,
            isRegistered: true,
          },
          token: `cf-token-${newAcc.id}-${Date.now()}`,
        });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to register account: ' + (err.message || '') }, 400);
      }
    }

    // Admin: Overview stats
    if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
      return jsonResponse({
        stats: {
          totalServers: ONLINE_COMMUNITY_SERVERS.length,
          onlineServers: ONLINE_COMMUNITY_SERVERS.length,
          totalUsers: memoryAccounts.size + 138,
          onlineUsers: 89,
          bannedUsers: 0,
          timedOutUsers: 0,
        },
        system: {
          platform: 'Cloudflare Edge Worker',
          runtime: 'V8 / Workerd',
          version: 'v2026.11',
          memoryUsage: '38 MB',
          uptimeSeconds: 86400,
        },
      });
    }

    // Admin: Servers list
    if (url.pathname === '/api/admin/servers' && request.method === 'GET') {
      return jsonResponse(ONLINE_COMMUNITY_SERVERS);
    }

    // Admin: Accounts list
    if (url.pathname === '/api/admin/accounts' && request.method === 'GET') {
      const list = Array.from(memoryAccounts.values()).map((acc) => ({
        id: acc.id,
        username: acc.username,
        tag: acc.tag,
        email: acc.email,
        avatar: acc.avatar,
        bio: acc.bio,
        status: acc.status,
        customStatus: acc.customStatus,
        role: acc.role,
        createdAt: acc.createdAt,
        isOnline: true,
        isBanned: !!acc.isBanned,
        banReason: acc.banReason,
        banExpiresAt: acc.banExpiresAt,
        timedOutUntil: acc.timedOutUntil,
        timeoutReason: acc.timeoutReason,
        isTimedOut: !!acc.isTimedOut,
      }));
      return jsonResponse(list);
    }

    // Admin: Moderation action
    if (url.pathname === '/api/admin/action' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { action, targetUserId, reason } = body;

        for (const acc of memoryAccounts.values()) {
          if (acc.id === targetUserId) {
            if (action === 'ban') {
              acc.isBanned = true;
              acc.banReason = reason || 'Admin banned';
            } else if (action === 'unban') {
              acc.isBanned = false;
              acc.banReason = undefined;
            } else if (action === 'timeout') {
              acc.isTimedOut = true;
              acc.timeoutReason = reason || 'Admin timed out';
            } else if (action === 'remove_timeout') {
              acc.isTimedOut = false;
              acc.timeoutReason = undefined;
            } else if (action === 'set_role' && body.role) {
              acc.role = body.role;
            }
            break;
          }
        }

        return jsonResponse({ success: true, message: `Action '${action}' applied successfully.` });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to process admin action' }, 500);
      }
    }

    // Admin: Add Server
    if (url.pathname === '/api/admin/add-server' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { name, url: srvUrl, description } = body;
        const newServer = {
          id: `server-${Date.now()}`,
          name: name || 'Custom Community Server',
          description: description || 'Custom connected Galaxy Cord server',
          icon: '🌐',
          url: srvUrl || 'wss://custom.galaxycord.net/ws',
          isOnline: true,
          latency: 20,
          activeMembers: 1,
          voiceMembers: 0,
          channelsCount: 3,
          createdAt: Date.now(),
          isDefault: false,
          isSelfHosted: true,
        };
        ONLINE_COMMUNITY_SERVERS.push(newServer);
        return jsonResponse({ success: true, server: newServer });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to add server' }, 500);
      }
    }

    // Static asset fallback for Vite SPA
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Galaxy Cord API - Not Found', { status: 404 });
  },
};
