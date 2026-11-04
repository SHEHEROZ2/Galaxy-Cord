import { Server } from '../types';

export function getDefaultServer(): Server {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const defaultWsUrl = `${protocol}//${host}/ws`;

  return {
    id: 'nexus-global-community',
    name: 'Galaxy Cord Global Hub',
    description: 'Official master hub for voice hangouts, screen streaming & chat.',
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

export const ALL_ONLINE_SERVERS: Server[] = [
  getDefaultServer(),
];

export function getInitialServers(): Server[] {
  try {
    const saved = localStorage.getItem('nexus_custom_servers');
    const customList: Server[] = saved ? JSON.parse(saved) : [];
    
    // Purge any of the removed dummy servers if cached in user's browser localStorage
    const removedIds = new Set([
      'server-community-alpha',
      'server-dev-cluster',
      'server-chill-synth',
      'server-anime-realm',
      'server-esports-arena',
    ]);
    const cleanedCustom = customList.filter((c) => !removedIds.has(c.id) && c.id !== 'nexus-global-community');
    if (cleanedCustom.length !== customList.length) {
      localStorage.setItem('nexus_custom_servers', JSON.stringify(cleanedCustom));
    }

    const map = new Map<string, Server>();
    for (const s of ALL_ONLINE_SERVERS) {
      map.set(s.id, s);
    }
    for (const c of cleanedCustom) {
      map.set(c.id, c);
    }
    return Array.from(map.values());
  } catch {
    return ALL_ONLINE_SERVERS;
  }
}

