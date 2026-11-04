import { createAuthClient } from '@neon/auth';

// Public Neon Auth URL
const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-little-scene-ao1qq1x4.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth';

export interface NeonHealthInfo {
  neonLakebasePostgres: {
    configured: boolean;
    connected: boolean;
    latencyMs: number;
    database: string;
    user: string;
    version?: string;
    stats: {
      accounts_count?: string | number;
      messages_count?: string | number;
      servers_count?: string | number;
      channels_count?: string | number;
    };
  };
  neonAuth: {
    configured: boolean;
    baseUrl?: string;
    jwksUrl?: string;
    provider?: string;
  };
  branch: string;
  serverTime: string;
}

// Client-side Neon Auth client instance
export const authClient = typeof window !== 'undefined' && NEON_AUTH_URL
  ? createAuthClient(NEON_AUTH_URL)
  : null;

// Fetch Neon Postgres & Auth health diagnostics from backend
export async function getNeonHealth(): Promise<NeonHealthInfo | null> {
  try {
    const res = await fetch('/api/neon/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Test live query on Neon Lakebase Postgres
export async function testNeonQuery(): Promise<any> {
  try {
    const res = await fetch('/api/neon/test-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Query failed');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
