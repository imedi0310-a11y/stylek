import type { Localized } from "@/lib/types";

/** Builds a localized string in the order English, French, Arabic. */
export function L(en: string, fr: string, ar: string): Localized {
  return { en, fr, ar };
}
