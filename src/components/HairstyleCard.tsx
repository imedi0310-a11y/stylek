"use client";

import Link from "next/link";
import type { Hairstyle } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { FavoriteButton } from "./FavoriteButton";
import { StyleImage } from "./StyleImage";

export function HairstyleCard({ style, priority = false }: { style: Hairstyle; priority?: boolean }) {
  const { t, l } = useI18n();
  const name = l(style.name);
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        <StyleImage style={style} priority={priority} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="badge absolute start-3 top-3 bg-surface/90 backdrop-blur">{t(`category.${style.category}`)}</span>
        <div className="absolute end-2 top-2 z-10">
          <FavoriteButton styleId={style.id} styleName={name} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-semibold">
          <Link href={`/styles/${style.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-soft">{l(style.description)}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <span className="badge">{t(`length.${style.length}`)}</span>
          <span className="badge">{t("label.maintenanceValue", { level: t(`maintenance.${style.maintenance}`) })}</span>
        </div>
      </div>
    </article>
  );
}

export function HairstyleGrid({ styles, priorityCount = 0 }: { styles: Hairstyle[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {styles.map((style, index) => (
        <li key={style.id} className="flex">
          <div className="w-full">
            <HairstyleCard style={style} priority={index < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
