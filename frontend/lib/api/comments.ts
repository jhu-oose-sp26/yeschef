import { commentsUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';

export interface CommentResponse {
  id: number;
  postId: number;
  userId: number;
  text: string;
  createdAt: string;
}

export async function getCommentsByPost(postId: number): Promise<CommentResponse[]> {
  const res = await fetch(commentsUrl(`/post/${postId}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  return handleResponse<CommentResponse[]>(res);
}

export async function createComment(body: {
  postId: number;
  userId: number;
  text: string;
}, token?: string | null): Promise<CommentResponse> {
  const t = token ?? authHeaders().Authorization?.replace('Bearer ', '') ?? null;
  const res = await fetch(commentsUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : authHeaders()),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<CommentResponse>(res);
}

export async function deleteComment(id: number): Promise<void> {
  const res = await fetch(commentsUrl(`/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) throw new Error(`Delete comment failed: ${res.status}`);
}
