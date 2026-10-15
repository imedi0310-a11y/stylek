import type { Hairstyle, Locale } from "./types";
import { translate } from "@/i18n/messages";

export const CUSTOM_NOTE_MAX = 500;

export interface BarberCardRow {
  label: string;
  value: string;
  specified: boolean;
}

/** Strips control characters and trims a user-written note to the allowed length. */
export function sanitizeNote(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, CUSTOM_NOTE_MAX);
}

/** Rows shown on the Barber Card. Unknown details are marked "not specified" — never invented. */
export function barberCardRows(style: Hairstyle, locale: Locale): BarberCardRow[] {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const notSpecified = t("card.notSpecified");
  const row = (label: string, value?: string): BarberCardRow => ({
    label,
    value: value ?? notSpecified,
    specified: Boolean(value),
  });
  return [
    row(t("card.overall"), style.barber.overall[locale]),
    row(t("card.top"), style.barber.top?.[locale]),
    row(t("card.sides"), style.barber.sides?.[locale]),
    row(t("card.back"), style.barber.back?.[locale]),
    row(t("card.fade"), style.barber.fadeOrTaper?.[locale]),
    row(
      t("card.maintenance"),
      `${t(`maintenance.${style.maintenance}`)}${style.notes ? ` — ${style.notes[locale]}` : ""}`,
    ),
  ];
}

export function barberCardText(style: Hairstyle, locale: Locale, customNote = "", url?: string): string {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const lines = [
    `${t("card.title")} — Stylek AI`,
    `${t("card.requested")}: ${style.name[locale]}`,
    "",
    ...barberCardRows(style, locale).map((r) => `• ${r.label}: ${r.value}`),
  ];
  const note = sanitizeNote(customNote).trim();
  if (note) lines.push("", `${t("card.custom")}: ${note}`);
  lines.push("", t("card.message"));
  if (url) lines.push(url);
  return lines.join("\n");
}
