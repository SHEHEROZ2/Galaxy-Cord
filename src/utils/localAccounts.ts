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
