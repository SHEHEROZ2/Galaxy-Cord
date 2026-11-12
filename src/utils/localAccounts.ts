import { User } from '../types';

export interface LocalStoredAccount {
  id: string;
  username: string;
  tag: string;
  email: string;
  password?: string;
  avatar: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'member' | 'host' | 'guest' | 'bot';
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

// Security: Immediately purge legacy local storage accounts if present in browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('galaxycord_local_accounts');
  } catch {}
}

const TOKEN_KEY = 'nexus_token';
const USER_KEY = 'nexus_user';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function getSavedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSavedUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('galaxycord_local_accounts');
  } catch {}
}

// Deprecated local account compatibility stubs (all accounts are in database)
export const PRESET_ACCOUNTS: LocalStoredAccount[] = [];

export function getLocalAccounts(): LocalStoredAccount[] {
  return [];
}

export function saveLocalAccount(_account: LocalStoredAccount): void {
  // No-op: all accounts must be persisted to the PostgreSQL / server database
}

export function updateLocalAccount(_id: string, _updates: Partial<LocalStoredAccount>): void {
  // No-op: all accounts must be persisted to the PostgreSQL / server database
}

export function verifyLocalLogin(
  _identifier: string,
  _password: string
): { success: boolean; user?: User; error?: string } {
  return {
    success: false,
    error: 'Local authentication disabled. Please log in through the database API.',
  };
}
