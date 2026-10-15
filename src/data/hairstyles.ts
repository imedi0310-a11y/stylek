import type { Category, Hairstyle } from "@/lib/types";
import { menHairstyles } from "./hairstyles-men";
import { womenHairstyles } from "./hairstyles-women";

export const hairstyles: Hairstyle[] = [...menHairstyles, ...womenHairstyles];

const bySlug = new Map(hairstyles.map((style) => [style.slug, style]));
const byId = new Map(hairstyles.map((style) => [style.id, style]));

export function getHairstyleBySlug(slug: string): Hairstyle | undefined {
  return bySlug.get(slug);
}

export function getHairstyleById(id: string): Hairstyle | undefined {
  return byId.get(id);
}

export function getFeaturedHairstyles(): Hairstyle[] {
  return hairstyles.filter((style) => style.featured);
}

export function getHairstylesByCategory(category: Category): Hairstyle[] {
  return hairstyles.filter((style) => style.category === category);
}

/** Styles in the same collection that share the most attributes with `style`. */
export function getRelatedHairstyles(style: Hairstyle, limit = 4): Hairstyle[] {
  return hairstyles
    .filter((other) => other.id !== style.id && other.category === style.category)
    .map((other) => {
      let score = 0;
      if (other.length === style.length) score += 2;
      if (other.maintenance === style.maintenance) score += 1;
      score += other.tags.filter((tag) => style.tags.includes(tag)).length;
      score += other.textures.filter((t) => style.textures.includes(t)).length * 0.5;
      return { other, score };
    })
    .sort((a, b) => b.score - a.score || a.other.id.localeCompare(b.other.id))
    .slice(0, limit)
    .map(({ other }) => other);
}
