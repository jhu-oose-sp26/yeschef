import { notificationsUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';

export type NotificationType = 'COMMENT' | 'RATING' | 'FRIEND_REQUEST' | 'LIKED' | 'SAVED';

export interface NotificationResponse {
  id: number;
  actorId: number;
  actorUsername: string;
  type: NotificationType;
  referenceId: number | null;
  recipeId: number | null;
  referenceTitle: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(userId: number): Promise<NotificationResponse[]> {
  const res = await fetch(notificationsUrl(`/user/${userId}`), {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  return handleResponse<NotificationResponse[]>(res);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const res = await fetch(notificationsUrl(`/user/${userId}/read-all`), {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  await handleResponse<void>(res);
}
