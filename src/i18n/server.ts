import { cookies, headers } from "next/headers";
import type { Locale } from "@/lib/types";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from "./config";

/** Resolves the request locale from the saved cookie, then the browser's Accept-Language. */
export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
}
