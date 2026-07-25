/** Cookie helpers with chunking for payloads larger than ~4KB per cookie. */

const DATA_COUNT_KEY = 'pt_data_n';
const DATA_CHUNK_PREFIX = 'pt_data_';
const SESSION_KEY = 'pt_session';
const CHUNK_SIZE = 3500;
const DEFAULT_MAX_AGE_DAYS = 7;

function setCookie(name: string, value: string, maxAgeDays = DEFAULT_MAX_AGE_DAYS): void {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearDataCookies(): void {
  const count = parseInt(getCookie(DATA_COUNT_KEY) || '0', 10);
  deleteCookie(DATA_COUNT_KEY);
  for (let i = 0; i < count; i += 1) {
    deleteCookie(`${DATA_CHUNK_PREFIX}${i}`);
  }
}

export function readJsonCookie<T>(countKey: string, chunkPrefix: string): T | null {
  const count = parseInt(getCookie(countKey) || '0', 10);
  if (!count) return null;

  let raw = '';
  for (let i = 0; i < count; i += 1) {
    const chunk = getCookie(`${chunkPrefix}${i}`);
    if (chunk === null) return null;
    raw += chunk;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonCookie<T>(value: T, countKey: string, chunkPrefix: string): void {
  const raw = JSON.stringify(value);
  const chunks: string[] = [];

  for (let i = 0; i < raw.length; i += CHUNK_SIZE) {
    chunks.push(raw.slice(i, i + CHUNK_SIZE));
  }

  // Clear previous chunks first
  const prevCount = parseInt(getCookie(countKey) || '0', 10);
  for (let i = 0; i < prevCount; i += 1) {
    deleteCookie(`${chunkPrefix}${i}`);
  }

  chunks.forEach((chunk, index) => {
    setCookie(`${chunkPrefix}${index}`, chunk);
  });
  setCookie(countKey, String(chunks.length));
}

export function readSessionCookie<T>(): T | null {
  const raw = getCookie(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSessionCookie<T>(value: T | null): void {
  if (value === null) {
    deleteCookie(SESSION_KEY);
    return;
  }
  setCookie(SESSION_KEY, JSON.stringify(value));
}

export function readAppData<T>(): T | null {
  return readJsonCookie<T>(DATA_COUNT_KEY, DATA_CHUNK_PREFIX);
}

export function writeAppData<T>(value: T): void {
  writeJsonCookie(value, DATA_COUNT_KEY, DATA_CHUNK_PREFIX);
}
