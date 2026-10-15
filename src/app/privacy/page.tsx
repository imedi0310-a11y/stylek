import type { Metadata } from "next";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { PrivacyContent } from "./PrivacyContent";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "privacy.title"), description: translate(locale, "privacy.intro") };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
