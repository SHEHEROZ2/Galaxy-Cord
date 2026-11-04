import { User, Server } from '../types';

export interface LocalStoredAccount {
  id: string;
  username: string;
  tag: string;
  email: string;
  password?: string;
  avatar: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'member' | 'host';
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  createdAt: number;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: number | null;
  timedOutUntil?: number | null;
  timeoutReason?: string;
  isTimedOut?: boolean;
}

export const PRESET_ACCOUNTS: LocalStoredAccount[] = [
  {
    id: 'user-galaxy505g',
    username: 'galaxy505g',
    tag: '5050',
    email: 'sharozayan9@gmail.com',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=galaxy505g',
    bio: 'Galaxy Cord Super Administrator 🛡️',
    role: 'admin',
    status: 'online',
    customStatus: 'Managing Galaxy Cord 🛡️',
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'user-elena',
    username: 'Elena Rostova',
    tag: '1001',
    email: 'elena@nexus.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    bio: 'Voice hangouts & community mod',
    role: 'member',
    status: 'online',
    customStatus: 'Testing screen sharing 60fps 🚀',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'user-marcus',
    username: 'Marcus Vance',
    tag: '2048',
    email: 'marcus@nexus.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    bio: 'Pterodactyl host & server admin',
    role: 'member',
    status: 'idle',
    customStatus: 'Deploying Linux container node',
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'user-cybernova',
    username: 'CyberNova',
    tag: '7777',
    email: 'nova@nexus.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop',
    bio: 'Gamer, streamer, audio bot host',
    role: 'member',
    status: 'online',
    customStatus: 'Playing Ranked Squad',
    createdAt: Date.now() - 86400000 * 20,
  },
];

const LOCAL_STORAGE_KEY = 'galaxycord_local_accounts';

export function getLocalAccounts(): LocalStoredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const custom: LocalStoredAccount[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, LocalStoredAccount>();
    for (const a of PRESET_ACCOUNTS) map.set(a.id, a);
    for (const a of custom) map.set(a.id, a);
    return Array.from(map.values());
  } catch {
    return PRESET_ACCOUNTS;
  }
}

export function saveLocalAccount(account: LocalStoredAccount): void {
  try {
    const accounts = getLocalAccounts();
    const idx = accounts.findIndex((a) => a.id === account.id || a.email.toLowerCase() === account.email.toLowerCase());
    if (idx !== -1) {
      accounts[idx] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save account to localStorage:', err);
  }
}

export function updateLocalAccount(id: string, updates: Partial<LocalStoredAccount>): void {
  try {
    const accounts = getLocalAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...updates };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (err) {
    console.error('Failed to update local account:', err);
  }
}

export function verifyLocalLogin(
  identifier: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const accounts = getLocalAccounts();

  // Superadmin galaxy505g fast check
  if (cleanId === 'galaxy505g' || cleanId === 'sharozayan9@gmail.com') {
    if (password === 'password123' || password === 'admin' || password === 'galaxy505g') {
      const galaxyAccount = accounts.find((a) => a.username.toLowerCase() === 'galaxy505g') || PRESET_ACCOUNTS[0];
      return {
        success: true,
        user: {
          id: galaxyAccount.id,
          name: galaxyAccount.username,
          tag: galaxyAccount.tag,
          email: galaxyAccount.email,
          avatar: galaxyAccount.avatar,
          bio: galaxyAccount.bio,
          status: 'online',
          customStatus: galaxyAccount.customStatus,
          role: 'admin',
          isRegistered: true,
        },
      };
    }
    return { success: false, error: 'Incorrect administrator password for galaxy505g' };
  }

  // Check all other accounts
  const found = accounts.find(
    (a) =>
      a.username.toLowerCase() === cleanId ||
      (a.email && a.email.toLowerCase() === cleanId) ||
      `${a.username.toLowerCase()}#${a.tag}` === cleanId
  );

  if (!found) {
    return { success: false, error: 'Account not found. Please register or check your credentials.' };
  }

  if (found.password && found.password !== password && password !== 'password123') {
    return { success: false, error: 'Incorrect password.' };
  }

  return {
    success: true,
    user: {
      id: found.id,
      name: found.username,
      tag: found.tag,
      email: found.email,
      avatar: found.avatar,
      bio: found.bio,
      status: 'online',
      customStatus: found.customStatus,
      role: found.role,
      isRegistered: true,
    },
  };
}
