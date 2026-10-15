import { describe, expect, it } from "vitest";
import { hairstyles, getRelatedHairstyles } from "@/data/hairstyles";
import { LOCALES } from "@/lib/types";
import { messages } from "@/i18n/messages";

describe("hairstyle dataset", () => {
  it("has at least 30 entries with both collections represented", () => {
    expect(hairstyles.length).toBeGreaterThanOrEqual(30);
    expect(hairstyles.filter((s) => s.category === "men").length).toBeGreaterThanOrEqual(12);
    expect(hairstyles.filter((s) => s.category === "women").length).toBeGreaterThanOrEqual(12);
  });

  it("has unique ids and slugs", () => {
    expect(new Set(hairstyles.map((s) => s.id)).size).toBe(hairstyles.length);
    expect(new Set(hairstyles.map((s) => s.slug)).size).toBe(hairstyles.length);
    for (const s of hairstyles) expect(s.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("is fully localized in every language", () => {
    for (const s of hairstyles) {
      for (const locale of LOCALES) {
        expect(s.name[locale], `${s.id} name ${locale}`).toBeTruthy();
        expect(s.description[locale], `${s.id} description ${locale}`).toBeTruthy();
        expect(s.barber.overall[locale]).toBeTruthy();
        s.styling.forEach((step) => expect(step[locale]).toBeTruthy());
      }
      expect(s.textures.length).toBeGreaterThan(0);
      expect(s.tags.length).toBeGreaterThan(0);
    }
  });

  it("never states guard numbers or exact measurements", () => {
    const text = JSON.stringify(hairstyles);
    expect(text).not.toMatch(/#\s?\d|guard\s?\d|\d+\s?(mm|cm|inch)/i);
  });

  it("returns related styles from the same collection", () => {
    const style = hairstyles[0];
    const related = getRelatedHairstyles(style);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((r) => r.category === style.category && r.id !== style.id)).toBe(true);
  });
});

describe("translations", () => {
  it("every locale defines every key with a non-empty string", () => {
    const keys = Object.keys(messages.en);
    for (const locale of LOCALES) {
      for (const key of keys) {
        expect(messages[locale][key as keyof typeof messages.en], `${locale}:${key}`).toBeTruthy();
      }
    }
  });

  it("keeps the same placeholders across languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
      for (const locale of LOCALES) {
        expect(placeholders(messages[locale][key]), `${locale}:${key}`).toBe(placeholders(messages.en[key]));
      }
    }
  });
});
