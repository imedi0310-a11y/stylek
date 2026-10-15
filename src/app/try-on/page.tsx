import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/PageLoading";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { TryOn } from "./TryOn";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "tryon.title"), description: translate(locale, "tryon.subtitle") };
}

export default function TryOnPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TryOn />
    </Suspense>
  );
}
