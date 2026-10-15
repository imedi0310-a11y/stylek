"use client";

import Link from "next/link";
import { ArrowLeft, Camera, ClipboardList, Info } from "lucide-react";
import { getHairstyleBySlug, getRelatedHairstyles } from "@/data/hairstyles";
import { FavoriteButton } from "@/components/FavoriteButton";
import { HairstyleGrid } from "@/components/HairstyleCard";
import { StyleImage } from "@/components/StyleImage";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";

export function StyleDetail({ slug }: { slug: string }) {
  const { t, l } = useI18n();
  const style = getHairstyleBySlug(slug);
  if (!style) return null;
  const name = l(style.name);
  const related = getRelatedHairstyles(style);

  const barberRows: { label: MessageKey; value?: string }[] = [
    { label: "card.overall", value: l(style.barber.overall) },
    { label: "card.top", value: style.barber.top && l(style.barber.top) },
    { label: "card.sides", value: style.barber.sides && l(style.barber.sides) },
    { label: "card.back", value: style.barber.back && l(style.barber.back) },
    { label: "card.fade", value: style.barber.fadeOrTaper && l(style.barber.fadeOrTaper) },
  ];

  return (
    <div className="container-page py-6">
      <Link href="/styles" className="btn btn-ghost -ms-3 mb-4 min-h-10 px-3 text-sm">
        <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
        {t("detail.back")}
      </Link>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <div className="card relative aspect-[4/5] overflow-hidden">
            <StyleImage style={style} priority />
          </div>
          {!style.photo && (
            <p className="flex gap-2 text-xs text-ink-soft">
              <Info aria-hidden className="h-4 w-4 shrink-0" />
              {t("detail.illustrationNotice")}
            </p>
          )}
          {style.photo && (
            <p className="text-xs text-ink-soft">
              <a href={style.photo.sourceUrl} className="underline" rel="noopener noreferrer" target="_blank">
                {style.photo.credit}
              </a>{" "}
              — {style.photo.license}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <span className="badge">{t(`category.${style.category}`)}</span>
            <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>
            <p className="text-lg text-ink-soft">{l(style.description)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <dt className="text-xs font-semibold text-ink-soft">{t("detail.length")}</dt>
              <dd className="mt-1 font-semibold">{t(`length.${style.length}`)}</dd>
            </div>
            <div className="card p-4">
              <dt className="text-xs font-semibold text-ink-soft">{t("detail.maintenance")}</dt>
              <dd className="mt-1 font-semibold">{t(`maintenance.${style.maintenance}`)}</dd>
            </div>
            <div className="card col-span-2 p-4">
              <dt className="text-xs font-semibold text-ink-soft">{t("detail.textures")}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {style.textures.map((texture) => (
                  <span key={texture} className="badge bg-accent-soft text-accent">
                    {t(`texture.${texture}`)}
                  </span>
                ))}
              </dd>
            </div>
            <div className="card col-span-2 p-4">
              <dt className="text-xs font-semibold text-ink-soft">{t("label.style")}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {style.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {t(`tag.${tag}`)}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={`/try-on?style=${style.slug}`} className="btn btn-primary">
              <Camera aria-hidden className="h-4 w-4" />
              {t("detail.tryThis")}
            </Link>
            <Link href={`/styles/${style.slug}/card`} className="btn btn-accent">
              <ClipboardList aria-hidden className="h-4 w-4" />
              {t("detail.prepareCard")}
            </Link>
            <FavoriteButton styleId={style.id} styleName={name} variant="full" />
          </div>

          <section aria-labelledby="styling-title" className="card p-5">
            <h2 id="styling-title" className="mb-3 text-lg font-semibold">
              {t("detail.styling")}
            </h2>
            <ol className="list-decimal space-y-2 ps-5 text-ink-soft">
              {style.styling.map((step, index) => (
                <li key={index}>{l(step)}</li>
              ))}
            </ol>
            {style.tools && style.tools.length > 0 && (
              <>
                <h3 className="mb-2 mt-4 text-sm font-semibold">{t("detail.tools")}</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {style.tools.map((tool, index) => (
                    <li key={index} className="badge">
                      {l(tool)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="barber-title" className="card p-5">
            <h2 id="barber-title" className="mb-3 text-lg font-semibold">
              {t("detail.barber")}
            </h2>
            <dl className="space-y-3">
              {barberRows
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t(row.label)}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
            </dl>
            {style.notes && (
              <p className="mt-4 rounded-xl bg-warn-soft p-3 text-sm text-warn">
                <strong>{t("detail.notes")}:</strong> {l(style.notes)}
              </p>
            )}
          </section>

          {style.faceShapes && style.faceShapes.length > 0 && (
            <section aria-labelledby="face-title" className="card p-5">
              <h2 id="face-title" className="mb-2 text-sm font-semibold">
                {t("detail.faceShapes")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {style.faceShapes.map((shape) => (
                  <span key={shape} className="badge">
                    {t(`face.${shape}`)}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-soft">{t("detail.faceShapesNote")}</p>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14">
          <h2 id="related-title" className="mb-5 text-2xl font-bold">
            {t("detail.related")}
          </h2>
          <HairstyleGrid styles={related} />
        </section>
      )}
    </div>
  );
}
