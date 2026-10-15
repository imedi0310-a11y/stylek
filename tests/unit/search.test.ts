import { describe, expect, it } from "vitest";
import { hairstyles } from "@/data/hairstyles";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  filterHairstyles,
  filtersFromParams,
  filtersToParams,
  normalizeText,
} from "@/lib/search";

describe("search and filters", () => {
  it("returns everything with empty filters", () => {
    expect(filterHairstyles(hairstyles, EMPTY_FILTERS, "en")).toHaveLength(hairstyles.length);
  });

  it("filters by category", () => {
    const men = filterHairstyles(hairstyles, { ...EMPTY_FILTERS, category: "men" }, "en");
    expect(men.length).toBeGreaterThan(0);
    expect(men.every((s) => s.category === "men")).toBe(true);
  });

  it("searches names in any language, case and accent insensitive", () => {
    const en = filterHairstyles(hairstyles, { ...EMPTY_FILTERS, query: "BOB" }, "en");
    expect(en.map((s) => s.slug)).toContain("classic-bob");
    const fr = filterHairstyles(hairstyles, { ...EMPTY_FILTERS, query: "degrade bas" }, "fr");
    expect(fr.map((s) => s.slug)).toContain("low-taper-fade");
    const ar = filterHairstyles(hairstyles, { ...EMPTY_FILTERS, query: "بيكسي" }, "ar");
    expect(ar.map((s) => s.slug)).toContain("pixie-cut");
  });

  it("combines length, texture, style and maintenance filters", () => {
    const result = filterHairstyles(
      hairstyles,
      { ...EMPTY_FILTERS, lengths: ["short"], textures: ["coily"], maintenance: ["low"], tags: ["natural"] },
      "en",
    );
    expect(result.length).toBeGreaterThan(0);
    for (const s of result) {
      expect(s.length).toBe("short");
      expect(s.textures).toContain("coily");
      expect(s.maintenance).toBe("low");
      expect(s.tags).toContain("natural");
    }
  });

  it("returns an empty list for unknown names", () => {
    expect(filterHairstyles(hairstyles, { ...EMPTY_FILTERS, query: "zzzz-not-a-style" }, "en")).toEqual([]);
  });

  it("round-trips through URL params and ignores invalid values", () => {
    const filters = { ...EMPTY_FILTERS, query: "fade", category: "men" as const, lengths: ["short" as const], tags: ["bold" as const] };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
    const parsed = filtersFromParams(new URLSearchParams("category=robots&length=giant,short&texture=<script>"));
    expect(parsed.category).toBe("all");
    expect(parsed.lengths).toEqual(["short"]);
    expect(parsed.textures).toEqual([]);
    expect(countActiveFilters(parsed)).toBe(1);
  });

  it("normalizes Arabic hamza and diacritics", () => {
    expect(normalizeText("أَفرو")).toBe(normalizeText("افرو"));
    expect(normalizeText("Dégradé")).toBe("degrade");
  });
});
