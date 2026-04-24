import { tokenStore } from '@/lib/auth/tokenStore';

export function authHeaders(): Record<string, string> {
  const token = tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Only clear the session if we actually sent a token that was rejected.
    // If no token was in the store, the 401 just means "not logged in yet" —
    // dispatching here would delete a perfectly valid stored token mid-restore.
    if (typeof window !== 'undefined' && tokenStore.get()) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
