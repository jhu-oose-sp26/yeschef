import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'yeschef_recent_recipes';
const MAX = 8;

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(KEY, value); return; }
  await SecureStore.setItemAsync(KEY, value);
}

export async function getRecentIds(): Promise<number[]> {
  try {
    const raw = await read();
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentId(id: number): Promise<void> {
  try {
    const current = await getRecentIds();
    const updated = [id, ...current.filter((r) => r !== id)].slice(0, MAX);
    await write(JSON.stringify(updated));
  } catch {
    // silently ignore storage errors
  }
}
