import { readJson, writeStorage } from "./storage";

export const FAVORITES_KEY = "stylek.favorites.v1";
const MAX_FAVORITES = 200;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

/** Reads favorite ids, dropping anything that is not a known hairstyle id. */
export function loadFavorites(knownIds?: ReadonlySet<string>): string[] {
  const stored = readJson(FAVORITES_KEY, isStringArray, EMPTY);
  const unique = Array.from(new Set(stored)).slice(0, MAX_FAVORITES);
  return knownIds ? unique.filter((id) => knownIds.has(id)) : unique;
}

function emit() {
  for (const listener of listeners) listener();
}

export function getFavoritesSnapshot(): string[] {
  if (cache === null) cache = loadFavorites();
  return cache;
}

export function getServerFavoritesSnapshot(): string[] {
  return EMPTY;
}

export function subscribeFavorites(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_KEY || event.key === null) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setFavorites(ids: string[]): void {
  cache = Array.from(new Set(ids)).slice(0, MAX_FAVORITES);
  writeStorage(FAVORITES_KEY, JSON.stringify(cache));
  emit();
}

export function toggleFavorite(id: string): boolean {
  const current = getFavoritesSnapshot();
  const isFavorite = current.includes(id);
  setFavorites(isFavorite ? current.filter((fav) => fav !== id) : [...current, id]);
  return !isFavorite;
}

/** Test helper: forget the in-memory cache so the next read hits storage. */
export function resetFavoritesCache(): void {
  cache = null;
}
