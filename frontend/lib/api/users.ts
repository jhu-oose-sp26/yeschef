import { usersUrl, savedUrl } from '@/constants/api';
import type { User, HasSaved } from './types';

export type { User, HasSaved } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** GET /users - fetch all users. */
export async function getUsers(): Promise<User[]> {
  const res = await fetch(usersUrl(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return handleResponse<User[]>(res);
}

/** GET /users/{id} - fetch a single user. */
export async function getUser(id: number): Promise<User> {
  const res = await fetch(usersUrl(`/${id}`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return handleResponse<User>(res);
}

/** GET /users/{userId}/saved - fetch saved recipe entries for a user. */
export async function getSavedRecipes(userId: number): Promise<HasSaved[]> {
  const res = await fetch(savedUrl(userId), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return handleResponse<HasSaved[]>(res);
}
