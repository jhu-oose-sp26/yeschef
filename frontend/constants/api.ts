/**
 * Base URL for the YesChef backend API.
 * - Web / local: use http://localhost:8080 (ensure backend is running: cd backend && ./mvnw spring-boot:run)
 * - Physical device / emulator: use your machine's LAN IP, e.g. http://192.168.1.x:8080
 * Backend must allow CORS from this origin and permit GET /recipes for validation.
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8080';

export function recipesUrl(path = '') {
  return `${API_BASE_URL}/recipes${path}`;
}

export function usersUrl(path = '') {
  return `${API_BASE_URL}/users${path}`;
}

export function savedUrl(userId: number, path = '') {
  return `${API_BASE_URL}/users/${userId}/saved${path}`;
}
