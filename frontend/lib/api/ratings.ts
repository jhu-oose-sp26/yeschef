import { ratingsUrl } from '@/constants/api';
import type { RatingRequest, RatingResponse } from './types';

export type { RatingRequest, RatingResponse } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** GET /ratings/recipe/{recipeId} */
export async function getRatingsForRecipe(recipeId: number): Promise<RatingResponse[]> {
  const res = await fetch(ratingsUrl(`/recipe/${recipeId}`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return handleResponse<RatingResponse[]>(res);
}

/** GET /ratings/user/{userId}/recipe/{recipeId} */
export async function getUserRatingForRecipe(
  userId: number,
  recipeId: number,
): Promise<RatingResponse | null> {
  const res = await fetch(ratingsUrl(`/user/${userId}/recipe/${recipeId}`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  return handleResponse<RatingResponse>(res);
}

/** POST /ratings */
export async function createRating(body: RatingRequest): Promise<RatingResponse> {
  const res = await fetch(ratingsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<RatingResponse>(res);
}

/** PUT /ratings/{id} */
export async function updateRating(
  ratingId: number,
  body: RatingRequest,
): Promise<RatingResponse> {
  const res = await fetch(ratingsUrl(`/${ratingId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<RatingResponse>(res);
}
