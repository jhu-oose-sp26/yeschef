import { Platform } from 'react-native';
import { postsUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';
import type { RecipeCreateRequest } from './types';
import type { Recipe } from './recipes';
import { getFriendsRecipes } from './users';

export interface PostResponse {
  id: number;
  image: string | null;
  notes: string | null;
  recipe: {
    id: number;
    title: string;
    sourceType: string;
    prepTime: number;
    cookTime: number;
  };
}

export interface FeedPost {
  postId: number;
  image: string | null;
  notes: string | null;
  recipe: Recipe;
}

export interface PostCreateRequest {
  image?: string;
  notes?: string;
  recipe: RecipeCreateRequest;
}

export async function getPostById(postId: number): Promise<PostResponse | null> {
  const res = await fetch(postsUrl(`/${postId}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  if (res.status === 404) return null;
  return handleResponse<PostResponse>(res);
}

export async function getAllPosts(): Promise<PostResponse[]> {
  const res = await fetch(postsUrl(), {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  return handleResponse<PostResponse[]>(res);
}

/**
 * Fetch posts for a user's friends.
 * Fetches all posts + friends' recipes in parallel (2 requests),
 * then joins by recipe.id so only actual posts are returned.
 */
export async function getFriendsFeed(userId: number): Promise<FeedPost[]> {
  const [allPosts, friendRecipes] = await Promise.all([
    getAllPosts(),
    getFriendsRecipes(userId),
  ]);
  const recipeMap = new Map(friendRecipes.map((r) => [r.id, r]));
  return allPosts
    .filter((post) => recipeMap.has(post.recipe.id))
    .map((post) => ({
      postId: post.id,
      image: post.image,
      notes: post.notes ?? null,
      recipe: recipeMap.get(post.recipe.id)!,
    }));
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetch(postsUrl(`/${postId}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete post failed: ${res.status}`);
  }
}

export async function getPostByRecipeId(recipeId: number): Promise<PostResponse | null> {
  const res = await fetch(postsUrl(`/by-recipe/${recipeId}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  if (res.status === 404) return null;
  return handleResponse<PostResponse>(res);
}

export async function createPost(body: PostCreateRequest): Promise<PostResponse> {
  const res = await fetch(postsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse<PostResponse>(res);
}

export async function uploadPostImage(imageUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const blob = await fetch(imageUri).then((r) => r.blob());
    formData.append('file', blob, 'photo.jpg');
  } else {
    formData.append('file', {
      uri: imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
  }

  const res = await fetch(postsUrl('/upload-image'), {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  const data = await handleResponse<{ url: string }>(res);
  return data.url;
}
