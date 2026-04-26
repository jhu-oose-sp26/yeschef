import { Platform } from 'react-native';
import { postsUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';
import type { RecipeCreateRequest } from './types';

export interface PostResponse {
  id: number;
  image: string | null;
  recipe: {
    id: number;
    title: string;
    sourceType: string;
    prepTime: number;
    cookTime: number;
  };
}

export interface PostCreateRequest {
  image?: string;
  recipe: RecipeCreateRequest;
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
