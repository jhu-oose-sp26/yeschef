import { tokenStore } from '@/lib/auth/tokenStore';

export function authHeaders(): Record<string, string> {
  const token = tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse<T>(
  res: Response,
  retry?: () => Promise<Response>,
): Promise<T> {
  if (res.status === 401 && typeof window !== 'undefined' && typeof (window as any).dispatchEvent === 'function' && tokenStore.get()) {
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
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const text = await res.text();
    let message: string = text;
    try {
      const json = JSON.parse(text);
      if (typeof json.message === 'string') message = json.message;
      else if (typeof json.error === 'string') message = json.error;
    } catch { /* not JSON — use raw text */ }
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text) as T;
}
