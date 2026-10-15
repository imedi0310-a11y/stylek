import type { Metadata } from "next";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { Favorites } from "./Favorites";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "fav.title"), description: translate(locale, "fav.subtitle"), robots: { index: false } };
}

export default function FavoritesPage() {
  return <Favorites />;
}
