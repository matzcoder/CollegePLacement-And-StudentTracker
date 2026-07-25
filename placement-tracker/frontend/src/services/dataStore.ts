import {
  readAppData,
  writeAppData,
  readSessionCookie,
  writeSessionCookie,
} from '../lib/cookieStorage';
import { SEED_DATA, SEED_VERSION } from '../data/seedData';
import type { AppData, SessionUser } from '../data/types';

const SEED_VERSION_KEY = 'pt_seed_version';

let memoryData: AppData | null = null;

function cloneSeed(): AppData {
  return JSON.parse(JSON.stringify(SEED_DATA)) as AppData;
}

function loadFromCookies(): AppData | null {
  return readAppData<AppData>();
}

function persist(data: AppData): void {
  memoryData = data;
  writeAppData(data);
}

export function getData(): AppData {
  if (memoryData) return memoryData;

  const stored = loadFromCookies();
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);

  if (stored && storedVersion === SEED_VERSION) {
    memoryData = stored;
    return memoryData;
  }

  memoryData = cloneSeed();
  persist(memoryData);
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  return memoryData;
}

export function saveData(data: AppData): void {
  persist(data);
}

export function resetData(): AppData {
  memoryData = cloneSeed();
  persist(memoryData);
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  return memoryData;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getSession(): SessionUser | null {
  return readSessionCookie<SessionUser>();
}

export function setSession(session: SessionUser | null): void {
  writeSessionCookie(session);
}

export function logActivity(
  data: AppData,
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string
): void {
  data.activityLogs.unshift({
    id: newId('log'),
    userId,
    action,
    entityType: entityType ?? null,
    entityId: entityId ?? null,
    ipAddress: 'browser',
    createdAt: new Date().toISOString(),
  });
}

export function encodeSessionToken(session: SessionUser): string {
  return btoa(JSON.stringify(session));
}

export function decodeSessionToken(token: string): SessionUser | null {
  try {
    return JSON.parse(atob(token)) as SessionUser;
  } catch {
    return null;
  }
}

export function getAuthFromHeader(authHeader?: string): SessionUser | null {
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = decodeSessionToken(token);
    if (decoded) return decoded;
  }
  return getSession();
}
