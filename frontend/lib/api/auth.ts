import { authUrl } from '@/constants/api';

export interface AuthRequest {
  email: string;
  password: string;
  username?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  supabaseId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      if (typeof json.message === 'string') {
        message = json.message;
      } else if (typeof json.error === 'string') {
        message = json.error;
      }
    } catch { /* not JSON — use raw text */ }
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** POST /auth/login */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(authUrl('/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

/** POST /auth/signup — always requires email confirmation; never returns a session. */
export async function signup(email: string, password: string, username: string): Promise<void> {
  const res = await fetch(authUrl('/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  await handleResponse<{ message: string }>(res);
}

/** POST /auth/refresh — exchange a refresh token for a new access + refresh token pair. */
export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const res = await fetch(authUrl('/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse<AuthResponse>(res);
}

/** POST /auth/resend-confirmation — asks Supabase to resend the signup confirmation email. */
export async function resendConfirmation(email: string): Promise<void> {
  const res = await fetch(authUrl('/resend-confirmation'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email }),
  });
  await handleResponse<void>(res);
}
