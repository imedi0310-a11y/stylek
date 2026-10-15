"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { hairstyles } from "@/data/hairstyles";
import {
  getFavoritesSnapshot,
  getServerFavoritesSnapshot,
  setFavorites,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites";

const knownIds = new Set(hairstyles.map((style) => style.id));

export function useFavorites() {
  const raw = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getServerFavoritesSnapshot);
  const ids = useMemo(() => raw.filter((id) => knownIds.has(id)), [raw]);
  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => toggleFavorite(id), []);
  const clear = useCallback(() => setFavorites([]), []);
  return { ids, isFavorite, toggle, clear };
}
