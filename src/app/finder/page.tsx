import type { Metadata } from "next";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { Finder } from "./Finder";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "finder.title"), description: translate(locale, "finder.subtitle") };
}

export default function FinderPage() {
  return <Finder />;
}
