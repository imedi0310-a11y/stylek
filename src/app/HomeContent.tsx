"use client";

import Link from "next/link";
import { ArrowRight, Camera, Check, Compass, Heart, ListChecks, Lock, Scissors } from "lucide-react";
import { getFeaturedHairstyles, getHairstylesByCategory, hairstyles } from "@/data/hairstyles";
import { HairstyleGrid } from "@/components/HairstyleCard";
import { StyleIllustration } from "@/components/StyleIllustration";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";

const HERO_STYLES = ["w-butterfly", "m-textured-crop", "w-curly-bob", "m-afro"];

export function HomeContent() {
  const { t, l } = useI18n();
  const { ids } = useFavorites();
  const featured = getFeaturedHairstyles();
  const heroStyles = HERO_STYLES.map((id) => hairstyles.find((s) => s.id === id)).filter((s) => s !== undefined);
  const menCount = getHairstylesByCategory("men").length;
  const womenCount = getHairstylesByCategory("women").length;

  const steps: { icon: typeof Compass; title: MessageKey; desc: MessageKey }[] = [
    { icon: Compass, title: "home.how1Title", desc: "home.how1Desc" },
    { icon: ListChecks, title: "home.how2Title", desc: "home.how2Desc" },
    { icon: Camera, title: "home.how3Title", desc: "home.how3Desc" },
    { icon: Scissors, title: "home.how4Title", desc: "home.how4Desc" },
  ];
  const tips: MessageKey[] = ["home.tip1", "home.tip2", "home.tip3", "home.tip4", "home.tip5"];

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-10 pb-12 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div className="space-y-6">
          <p className="eyebrow">{t("app.tagline")}</p>
          <h1 className="text-[2rem] font-extrabold leading-tight sm:text-5xl">{t("home.title")}</h1>
          <p className="max-w-xl text-lg text-ink-soft">{t("home.subtitle")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/finder" className="btn btn-primary px-6 py-3 text-base">
              {t("home.ctaFind")}
              <ArrowRight aria-hidden className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/try-on" className="btn btn-secondary px-6 py-3 text-base">
              <Camera aria-hidden className="h-4 w-4" />
              {t("home.ctaTry")}
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3" aria-hidden="true">
          {heroStyles.map((style, index) => (
            <div
              key={style.id}
              className={`card aspect-[4/5] overflow-hidden ${index % 2 === 1 ? "translate-y-6" : ""}`}
            >
              <StyleIllustration id={style.id} spec={style.illustration} title={l(style.name)} className="h-full w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="container-page py-10" aria-labelledby="collections-title">
        <h2 id="collections-title" className="mb-5 text-2xl font-bold">
          {t("home.collectionsTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              { href: "/styles?category=men", label: "category.men", desc: "home.menDesc", count: menCount },
              { href: "/styles?category=women", label: "category.women", desc: "home.womenDesc", count: womenCount },
              { href: "/styles", label: "category.all", desc: "home.allDesc", count: hairstyles.length },
            ] as const
          ).map((item) => (
            <Link key={item.href} href={item.href} className="card group flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
              <div>
                <p className="text-xl font-bold">{t(item.label)}</p>
                <p className="mt-1 text-sm text-ink-soft">{t(item.desc)}</p>
                <p className="mt-3 text-sm font-semibold text-accent">{t("styles.results", { count: item.count })}</p>
              </div>
              <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-10" aria-labelledby="featured-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="featured-title" className="text-2xl font-bold">
            {t("home.featuredTitle")}
          </h2>
          <Link href="/styles" className="text-sm font-semibold text-accent hover:underline">
            {t("home.viewAll")}
          </Link>
        </div>
        <HairstyleGrid styles={featured.slice(0, 8)} priorityCount={2} />
      </section>

      {/* How it works */}
      <section className="container-page py-10" aria-labelledby="how-title">
        <h2 id="how-title" className="mb-5 text-2xl font-bold">
          {t("home.howTitle")}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-soft">{index + 1}</span>
                </div>
                <h3 className="font-semibold">{t(step.title)}</h3>
                <p className="mt-1 text-sm text-ink-soft">{t(step.desc)}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Confidence */}
      <section className="container-page py-10" aria-labelledby="confidence-title">
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-ink p-6 text-white sm:p-10">
          <h2 id="confidence-title" className="text-2xl font-bold sm:text-3xl">
            {t("home.confidenceTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-white/80">{t("home.confidenceIntro")}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-3 rounded-2xl bg-white/5 p-4">
                <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#5fd3c2]" />
                <span className="text-sm text-white/90">{t(tip)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Favorites + privacy */}
      <section className="container-page grid gap-4 py-10 md:grid-cols-2">
        <div className="card flex flex-col gap-3 p-6">
          <Heart aria-hidden className="h-6 w-6 text-danger" />
          <h2 className="text-xl font-bold">{t("home.favoritesTitle")}</h2>
          <p className="text-sm text-ink-soft">{t("home.favoritesDesc")}</p>
          <Link href="/favorites" className="btn btn-secondary mt-auto self-start">
            {t("home.favoritesCta")}
            {ids.length > 0 && <span className="badge bg-accent-soft text-accent">{ids.length}</span>}
          </Link>
        </div>
        <div className="card flex flex-col gap-3 p-6">
          <Lock aria-hidden className="h-6 w-6 text-accent" />
          <h2 className="text-xl font-bold">{t("home.privacyTitle")}</h2>
          <p className="text-sm text-ink-soft">{t("home.privacyDesc")}</p>
          <Link href="/privacy" className="mt-auto self-start text-sm font-semibold text-accent hover:underline">
            {t("home.privacyLink")}
          </Link>
        </div>
      </section>
    </>
  );
}
