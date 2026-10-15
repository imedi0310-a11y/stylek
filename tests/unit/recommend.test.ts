import { describe, expect, it } from "vitest";
import { hairstyles } from "@/data/hairstyles";
import { recommendHairstyles, scoreHairstyle, SCORE_WEIGHTS } from "@/lib/recommend";

describe("style finder ranking", () => {
  it("returns 3–6 real dataset entries", () => {
    const recs = recommendHairstyles(hairstyles, { collection: "women", texture: "curly", look: "natural" });
    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs.length).toBeLessThanOrEqual(6);
    for (const r of recs) expect(hairstyles).toContain(r.style);
  });

  it("respects the chosen collection", () => {
    const recs = recommendHairstyles(hairstyles, { collection: "men" });
    expect(recs.every((r) => r.style.category === "men")).toBe(true);
  });

  it("ranks matching texture, look and maintenance first", () => {
    const recs = recommendHairstyles(hairstyles, {
      collection: "men",
      texture: "coily",
      look: "natural",
      maintenance: "medium",
    });
    const top = recs[0].style;
    expect(top.textures).toContain("coily");
    expect(top.tags).toContain("natural");
    expect(recs[0].reasons).toEqual(expect.arrayContaining(["textureMatch", "lookMatch", "maintenanceMatch"]));
  });

  it("scores transparently with the published weights", () => {
    const style = hairstyles.find((s) => s.slug === "buzz-cut")!;
    const rec = scoreHairstyle(style, { texture: "straight", look: "bold", maintenance: "low", currentLength: "short", change: "subtle" });
    expect(rec.score).toBe(
      SCORE_WEIGHTS.textureMatch + SCORE_WEIGHTS.lookMatch + SCORE_WEIGHTS.maintenanceMatch + SCORE_WEIGHTS.changeMatch,
    );
  });

  it("flags styles that require growing hair out", () => {
    const style = hairstyles.find((s) => s.slug === "long-layers")!;
    const rec = scoreHairstyle(style, { currentLength: "short" });
    expect(rec.reasons).toContain("needsGrowth");
  });

  it("is deterministic", () => {
    const answers = { texture: "wavy" as const, look: "modern" as const };
    expect(recommendHairstyles(hairstyles, answers).map((r) => r.style.id)).toEqual(
      recommendHairstyles(hairstyles, answers).map((r) => r.style.id),
    );
  });

  it("still returns picks when every question is skipped", () => {
    expect(recommendHairstyles(hairstyles, {}).length).toBe(3);
  });
});
