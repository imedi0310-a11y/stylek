import type { Category, FaceShape, HairLength, Hairstyle, Maintenance, StyleTag, Texture } from "./types";
import { LENGTHS, MAINTENANCE_LEVELS } from "./types";

export type ChangeDegree = "subtle" | "moderate" | "dramatic";

export interface FinderAnswers {
  collection?: Category | "all";
  currentLength?: HairLength;
  texture?: Texture;
  look?: StyleTag;
  maintenance?: Maintenance;
  faceShape?: FaceShape | "unsure";
  change?: ChangeDegree;
}

/** Keys of reasons shown to the user; each maps to a translated sentence. */
export type ReasonKey =
  | "textureMatch"
  | "textureUnlisted"
  | "lookMatch"
  | "maintenanceMatch"
  | "maintenanceLower"
  | "maintenanceHigher"
  | "faceShapeCommon"
  | "changeMatch"
  | "needsGrowth";

export interface Recommendation {
  style: Hairstyle;
  score: number;
  reasons: ReasonKey[];
}

/**
 * Transparent points used by the style finder. This is a deterministic rule-based
 * ranking — it is not machine learning.
 */
export const SCORE_WEIGHTS = {
  textureMatch: 3,
  textureUnlisted: -2,
  lookMatch: 3,
  maintenanceMatch: 2,
  maintenanceLower: 1,
  maintenanceHigher: -2,
  faceShapeCommon: 1,
  changeMatch: 2,
  needsGrowth: -1,
} as const;

const lengthIndex = (length: HairLength) => LENGTHS.indexOf(length);
const maintenanceIndex = (level: Maintenance) => MAINTENANCE_LEVELS.indexOf(level);

function changeMatches(change: ChangeDegree, current: HairLength, target: Hairstyle): boolean {
  const distance = Math.abs(lengthIndex(current) - lengthIndex(target.length));
  if (change === "subtle") return distance === 0;
  if (change === "moderate") return distance === 1 || (distance === 0 && target.tags.includes("modern"));
  return distance >= 1 || target.tags.includes("bold");
}

export function scoreHairstyle(style: Hairstyle, answers: FinderAnswers): Recommendation {
  let score = 0;
  const reasons: ReasonKey[] = [];
  const add = (key: ReasonKey) => {
    score += SCORE_WEIGHTS[key];
    reasons.push(key);
  };

  if (answers.texture) add(style.textures.includes(answers.texture) ? "textureMatch" : "textureUnlisted");
  if (answers.look && style.tags.includes(answers.look)) add("lookMatch");

  if (answers.maintenance) {
    const diff = maintenanceIndex(style.maintenance) - maintenanceIndex(answers.maintenance);
    if (diff === 0) add("maintenanceMatch");
    else if (diff < 0) add("maintenanceLower");
    else add("maintenanceHigher");
  }

  if (answers.faceShape && answers.faceShape !== "unsure" && style.faceShapes?.includes(answers.faceShape)) {
    add("faceShapeCommon");
  }

  if (answers.change && answers.currentLength && changeMatches(answers.change, answers.currentLength, style)) {
    add("changeMatch");
  }

  if (answers.currentLength && lengthIndex(style.length) > lengthIndex(answers.currentLength)) {
    add("needsGrowth");
  }

  return { style, score, reasons };
}

/**
 * Ranks the dataset for the given answers. Styles from the other collection are
 * excluded only when the user picked a specific collection. Ties are broken by id so
 * results are stable.
 */
export function recommendHairstyles(
  list: Hairstyle[],
  answers: FinderAnswers,
  options: { min?: number; max?: number } = {},
): Recommendation[] {
  const { min = 3, max = 6 } = options;
  const pool =
    answers.collection && answers.collection !== "all"
      ? list.filter((style) => style.category === answers.collection)
      : list;

  const ranked = pool
    .map((style) => scoreHairstyle(style, answers))
    .sort((a, b) => b.score - a.score || a.style.id.localeCompare(b.style.id));

  const positive = ranked.filter((r) => r.score > 0);
  if (positive.length >= min) return positive.slice(0, max);
  return ranked.slice(0, Math.min(min, ranked.length));
}
