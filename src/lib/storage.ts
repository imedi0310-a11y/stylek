/**
 * Safe wrappers around localStorage. Storage can be unavailable (private mode,
 * blocked cookies) or contain malformed data; every call degrades gracefully.
 * Only non-sensitive preferences are stored — never photographs.
 */
export function readStorage(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJson<T>(key: string, validate: (value: unknown) => value is T, fallback: T): T {
  const raw = readStorage(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
