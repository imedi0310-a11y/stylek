import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHairstyleBySlug } from "@/data/hairstyles";
import { getRequestLocale } from "@/i18n/server";
import { StyleDetail } from "./StyleDetail";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const style = getHairstyleBySlug(slug);
  if (!style) return {};
  const locale = await getRequestLocale();
  return {
    title: style.name[locale],
    description: style.description[locale],
    alternates: { canonical: `/styles/${style.slug}` },
    openGraph: { title: style.name[locale], description: style.description[locale] },
  };
}

export default async function StylePage({ params }: { params: Params }) {
  const { slug } = await params;
  const style = getHairstyleBySlug(slug);
  if (!style) notFound();
  return <StyleDetail slug={style.slug} />;
}
