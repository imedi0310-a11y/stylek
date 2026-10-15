"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Check, Copy, Printer, Share2 } from "lucide-react";
import { getHairstyleBySlug } from "@/data/hairstyles";
import { StyleImage } from "@/components/StyleImage";
import { useI18n } from "@/i18n/I18nProvider";
import { barberCardRows, barberCardText, CUSTOM_NOTE_MAX, sanitizeNote } from "@/lib/barberCard";

const noopSubscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => undefined;

type Status = { kind: "idle" } | { kind: "copied" } | { kind: "copyFailed" } | { kind: "shareFallback" };

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function BarberCard({ slug }: { slug: string }) {
  const { t, l, locale } = useI18n();
  const noteId = useId();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const origin = useSyncExternalStore(noopSubscribe, getOrigin, getServerOrigin);
  const style = getHairstyleBySlug(slug);
  if (!style) return null;

  const rows = barberCardRows(style, locale);
  const pageUrl = origin ? `${origin}/styles/${style.slug}` : undefined;
  const text = barberCardText(style, locale, note, pageUrl);

  const onCopy = async () => setStatus({ kind: (await copyText(text)) ? "copied" : "copyFailed" });

  const onShare = async () => {
    const data = { title: `${t("card.title")} — ${l(style.name)}`, text };
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setStatus({ kind: (await copyText(text)) ? "shareFallback" : "copyFailed" });
  };

  return (
    <div className="container-page max-w-3xl py-6">
      <Link href={`/styles/${style.slug}`} className="no-print btn btn-ghost -ms-3 mb-4 min-h-10 px-3 text-sm">
        <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
        {t("card.backToStyle")}
      </Link>

      <article className="card print-card overflow-hidden" aria-labelledby="card-title">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-ink px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t("card.title")}</p>
            <h1 id="card-title" className="text-xl font-bold sm:text-2xl">
              {l(style.name)}
            </h1>
          </div>
          <span className="text-sm font-bold" dir="ltr">
            Stylek <span className="text-[#5fd3c2]">AI</span>
          </span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,180px)_1fr]">
          <figure className="space-y-1">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line">
              <StyleImage style={style} priority />
            </div>
            <figcaption className="text-xs text-ink-soft">
              {t("card.reference")} · {style.photo ? style.photo.credit : t("styles.illustration")}
            </figcaption>
          </figure>

          <div className="space-y-4">
            <p className="rounded-xl bg-accent-soft p-3 text-sm font-medium text-accent-strong">{t("card.message")}</p>
            <dl className="divide-y divide-line">
              <div className="grid gap-1 py-2 sm:grid-cols-[8rem_1fr]">
                <dt className="text-sm font-semibold text-ink-soft">{t("card.requested")}</dt>
                <dd className="font-semibold">{l(style.name)}</dd>
              </div>
              <div className="grid gap-1 py-2 sm:grid-cols-[8rem_1fr]">
                <dt className="text-sm font-semibold text-ink-soft">{t("card.texture")}</dt>
                <dd>{style.textures.map((x) => t(`texture.${x}`)).join(" · ")}</dd>
              </div>
              {rows.map((row) => (
                <div key={row.label} className="grid gap-1 py-2 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm font-semibold text-ink-soft">{row.label}</dt>
                  <dd className={row.specified ? "" : "italic text-ink-soft"}>{row.value}</dd>
                </div>
              ))}
              {note.trim() && (
                <div className="grid gap-1 py-2 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm font-semibold text-ink-soft">{t("card.custom")}</dt>
                  {/* Rendered as plain text: React escapes it, no HTML is interpreted. */}
                  <dd className="whitespace-pre-wrap break-words">{note.trim()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </article>

      <div className="no-print mt-6 space-y-5">
        <div>
          <label htmlFor={noteId} className="mb-1.5 block text-sm font-semibold">
            {t("card.custom")}
          </label>
          <textarea
            id={noteId}
            value={note}
            maxLength={CUSTOM_NOTE_MAX}
            rows={3}
            onChange={(event) => setNote(sanitizeNote(event.target.value))}
            placeholder={t("card.customPlaceholder")}
            className="field resize-y"
            aria-describedby={`${noteId}-help`}
          />
          <p id={`${noteId}-help`} className="mt-1 text-xs text-ink-soft">
            {t("card.customHelp", { max: CUSTOM_NOTE_MAX })} ({note.length}/{CUSTOM_NOTE_MAX})
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" className="btn btn-primary" onClick={onCopy}>
            {status.kind === "copied" ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
            {status.kind === "copied" ? t("card.copied") : t("card.copy")}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer aria-hidden className="h-4 w-4" />
            {t("card.print")}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onShare}>
            <Share2 aria-hidden className="h-4 w-4" />
            {t("card.share")}
          </button>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-ink-soft">
          {status.kind === "shareFallback" && t("card.shareUnavailable")}
          {status.kind === "copyFailed" && t("card.copyFailed")}
        </p>

        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold">{t("card.textPreview")}</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-ink-soft" data-testid="card-text">
            {text}
          </pre>
        </details>
      </div>
    </div>
  );
}
