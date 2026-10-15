import type { Locale } from "@/lib/types";
import { ar } from "./ar";
import { en, type MessageKey } from "./en";
import { fr } from "./fr";

export type { MessageKey };

export const messages: Record<Locale, Record<MessageKey, string>> = { en, fr, ar };

export type TranslateVars = Record<string, string | number>;

export function translate(locale: Locale, key: MessageKey, vars?: TranslateVars): string {
  const template = messages[locale][key] ?? messages.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
