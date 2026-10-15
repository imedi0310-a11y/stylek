import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHairstyleBySlug } from "@/data/hairstyles";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { BarberCard } from "./BarberCard";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const style = getHairstyleBySlug(slug);
  if (!style) return {};
  const locale = await getRequestLocale();
  return {
    title: `${translate(locale, "card.title")} — ${style.name[locale]}`,
    description: style.barber.overall[locale],
    robots: { index: false },
  };
}

export default async function BarberCardPage({ params }: { params: Params }) {
  const { slug } = await params;
  const style = getHairstyleBySlug(slug);
  if (!style) notFound();
  return <BarberCard slug={style.slug} />;
}
