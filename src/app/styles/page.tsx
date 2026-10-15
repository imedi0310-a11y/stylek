import type { Metadata } from "next";
import { Suspense } from "react";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { Catalogue } from "./Catalogue";
import { PageLoading } from "@/components/PageLoading";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "styles.title"), description: translate(locale, "styles.subtitle") };
}

export default function StylesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Catalogue />
    </Suspense>
  );
}
