import type { Category, HairLength, Hairstyle, Locale, Maintenance, StyleTag, Texture } from "./types";
import { CATEGORIES, LENGTHS, MAINTENANCE_LEVELS, STYLE_TAGS, TEXTURES } from "./types";

export interface StyleFilters {
  query: string;
  category: Category | "all";
  lengths: HairLength[];
  textures: Texture[];
  tags: StyleTag[];
  maintenance: Maintenance[];
}

export const EMPTY_FILTERS: StyleFilters = {
  query: "",
  category: "all",
  lengths: [],
  textures: [],
  tags: [],
  maintenance: [],
};

/** Lower-cases and strips diacritics (including Arabic harakat) so search is forgiving. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .toLowerCase()
    .trim();
}

function matchesQuery(style: Hairstyle, query: string, locale: Locale): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  // Names in every language are searchable so a user can type an English term with the Arabic UI.
  const haystack = [style.name.en, style.name.fr, style.name.ar, style.description[locale], style.slug.replace(/-/g, " ")]
    .map(normalizeText)
    .join(" | ");
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterHairstyles(list: Hairstyle[], filters: StyleFilters, locale: Locale): Hairstyle[] {
  return list.filter((style) => {
    if (filters.category !== "all" && style.category !== filters.category) return false;
    if (filters.lengths.length && !filters.lengths.includes(style.length)) return false;
    if (filters.textures.length && !filters.textures.some((t) => style.textures.includes(t))) return false;
    if (filters.tags.length && !filters.tags.some((tag) => style.tags.includes(tag))) return false;
    if (filters.maintenance.length && !filters.maintenance.includes(style.maintenance)) return false;
    return matchesQuery(style, filters.query, locale);
  });
}

export function countActiveFilters(filters: StyleFilters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    filters.lengths.length +
    filters.textures.length +
    filters.tags.length +
    filters.maintenance.length
  );
}

function pickList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const values = raw.split(",").filter((v): v is T => (allowed as readonly string[]).includes(v));
  return Array.from(new Set(values));
}

/** Parses filters from URL search params, ignoring anything that is not a known value. */
export function filtersFromParams(params: URLSearchParams): StyleFilters {
  const category = params.get("category");
  return {
    query: (params.get("q") ?? "").slice(0, 80),
    category: category && (CATEGORIES as readonly string[]).includes(category) ? (category as Category) : "all",
    lengths: pickList(params.get("length"), LENGTHS),
    textures: pickList(params.get("texture"), TEXTURES),
    tags: pickList(params.get("style"), STYLE_TAGS),
    maintenance: pickList(params.get("maintenance"), MAINTENANCE_LEVELS),
  };
}

export function filtersToParams(filters: StyleFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.lengths.length) params.set("length", filters.lengths.join(","));
  if (filters.textures.length) params.set("texture", filters.textures.join(","));
  if (filters.tags.length) params.set("style", filters.tags.join(","));
  if (filters.maintenance.length) params.set("maintenance", filters.maintenance.join(","));
  return params;
}
