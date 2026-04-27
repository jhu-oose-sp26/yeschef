import { tokenStore } from '@/lib/auth/tokenStore';

export function authHeaders(): Record<string, string> {
  const token = tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse<T>(
  res: Response,
  retry?: () => Promise<Response>,
): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined' && typeof (window as any).dispatchEvent === 'function' && tokenStore.get()) {
      const tokenBefore = tokenStore.get();
      window.dispatchEvent(new Event('auth:unauthorized'));
      // handleUnauthorized sets pendingRefresh synchronously before its first await,
      // so it's available immediately after dispatchEvent returns.
      if (retry) {
        const pending = tokenStore.getPendingRefresh();
        if (pending) {
          await pending;
          // Only retry if the token actually changed (refresh succeeded).
          if (tokenStore.get() && tokenStore.get() !== tokenBefore) {
            const retryRes = await retry();
            return handleResponse<T>(retryRes); // no retry param — no infinite loop
          }
        }
      }
    }
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text) as T;
}
