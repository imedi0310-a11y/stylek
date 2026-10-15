"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Camera, ClipboardList, Info, RotateCcw } from "lucide-react";
import { hairstyles } from "@/data/hairstyles";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StyleImage } from "@/components/StyleImage";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import { recommendHairstyles, type FinderAnswers, type Recommendation } from "@/lib/recommend";
import { FACE_SHAPES, LENGTHS, MAINTENANCE_LEVELS, STYLE_TAGS, TEXTURES } from "@/lib/types";

interface Step {
  key: keyof FinderAnswers;
  question: MessageKey;
  options: { value: string; label: MessageKey }[];
}

const opts = (values: readonly string[], prefix: string) =>
  values.map((value) => ({ value, label: `${prefix}.${value}` as MessageKey }));

const STEPS: Step[] = [
  { key: "collection", question: "finder.q1", options: opts(["men", "women", "all"], "category") },
  { key: "currentLength", question: "finder.q2", options: opts(LENGTHS, "length") },
  { key: "texture", question: "finder.q3", options: opts(TEXTURES, "texture") },
  { key: "look", question: "finder.q4", options: opts(STYLE_TAGS, "tag") },
  { key: "maintenance", question: "finder.q5", options: opts(MAINTENANCE_LEVELS, "maintenance") },
  { key: "faceShape", question: "finder.q6", options: opts([...FACE_SHAPES, "unsure"], "face") },
  { key: "change", question: "finder.q7", options: opts(["subtle", "moderate", "dramatic"], "change") },
];

function ReasonList({ rec, answers }: { rec: Recommendation; answers: FinderAnswers }) {
  const { t } = useI18n();
  const vars = {
    texture: answers.texture ? t(`texture.${answers.texture}`).toLowerCase() : "",
    look: answers.look ? t(`tag.${answers.look}`).toLowerCase() : "",
    maintenance: answers.maintenance ? t(`maintenance.${answers.maintenance}`).toLowerCase() : "",
    face: answers.faceShape ? t(`face.${answers.faceShape}`).toLowerCase() : "",
    change: answers.change ? t(`change.${answers.change}`).toLowerCase() : "",
  };
  return (
    <ul className="space-y-1 text-sm">
      {rec.reasons.map((reason) => {
        const negative = reason === "textureUnlisted" || reason === "maintenanceHigher" || reason === "needsGrowth";
        return (
          <li key={reason} className={`flex gap-2 ${negative ? "text-warn" : "text-ink-soft"}`}>
            <span aria-hidden>{negative ? "!" : "✓"}</span>
            <span>{t(`finder.reason.${reason}` as MessageKey, vars)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Finder() {
  const { t, l } = useI18n();
  const [answers, setAnswers] = useState<FinderAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const recommendations = useMemo(() => recommendHairstyles(hairstyles, answers), [answers]);
  const answeredCount = Object.values(answers).filter(Boolean).length;

  // Move focus to the new question/results heading for screen-reader and keyboard users.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepIndex, showResults]);

  const choose = (value: string) => setAnswers((prev) => ({ ...prev, [step.key]: value }));
  const next = () => (isLast ? setShowResults(true) : setStepIndex((i) => i + 1));
  const skip = () => {
    setAnswers((prev) => ({ ...prev, [step.key]: undefined }));
    next();
  };
  const reset = () => {
    setAnswers({});
    setStepIndex(0);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="container-page py-8">
        <header className="mb-6 space-y-2">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">
            {t("finder.resultsTitle")}
          </h1>
          <p className="text-ink-soft">{answeredCount === 0 ? t("finder.noAnswers") : t("finder.resultsIntro")}</p>
        </header>

        <ol className="grid gap-4 md:grid-cols-2">
          {recommendations.map((rec, index) => (
            <li key={rec.style.id} className="card flex gap-4 overflow-hidden p-3 sm:p-4" data-testid="recommendation">
              <Link href={`/styles/${rec.style.slug}`} className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
                <StyleImage style={rec.style} />
                <span className="sr-only">{l(rec.style.name)}</span>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-accent">
                      #{index + 1} · {t("finder.score", { score: rec.score })}
                    </p>
                    <h2 className="text-lg font-semibold">
                      <Link href={`/styles/${rec.style.slug}`} className="hover:underline">
                        {l(rec.style.name)}
                      </Link>
                    </h2>
                  </div>
                  <FavoriteButton styleId={rec.style.id} styleName={l(rec.style.name)} />
                </div>
                {rec.reasons.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-ink-soft">{t("finder.why")}</p>
                    <ReasonList rec={rec} answers={answers} />
                  </div>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Link href={`/try-on?style=${rec.style.slug}`} className="btn btn-secondary min-h-10 px-3 text-sm">
                    <Camera aria-hidden className="h-4 w-4" />
                    {t("nav.tryOn")}
                  </Link>
                  <Link href={`/styles/${rec.style.slug}/card`} className="btn btn-ghost min-h-10 px-3 text-sm">
                    <ClipboardList aria-hidden className="h-4 w-4" />
                    {t("card.title")}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 space-y-3">
          <p className="flex gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {t("finder.disclaimer")}
          </p>
          <details className="card p-4 text-sm">
            <summary className="cursor-pointer font-semibold">{t("finder.points")}</summary>
            <p className="mt-2 text-ink-soft">{t("finder.pointsDesc")}</p>
          </details>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setShowResults(false)}>
              <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
              {t("finder.edit")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              <RotateCcw aria-hidden className="h-4 w-4" />
              {t("finder.startOver")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selected = answers[step.key];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="container-page max-w-2xl py-8">
      <header className="mb-6 space-y-2">
        <p className="eyebrow">{t("finder.title")}</p>
        <p className="text-sm text-ink-soft">{t("finder.subtitle")}</p>
      </header>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">{t("finder.step", { current: stepIndex + 1, total: STEPS.length })}</span>
          <button type="button" onClick={reset} className="btn btn-ghost min-h-9 px-3 text-sm">
            <RotateCcw aria-hidden className="h-4 w-4" />
            {t("finder.reset")}
          </button>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-label={t("finder.step", { current: stepIndex + 1, total: STEPS.length })}
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <fieldset className="card p-5 sm:p-6">
        <legend className="sr-only">{t(step.question)}</legend>
        <h1 ref={headingRef} tabIndex={-1} className="mb-5 text-2xl font-bold" aria-hidden="false">
          {t(step.question)}
        </h1>
        <div className="grid gap-2 sm:grid-cols-2">
          {step.options.map((option) => {
            const checked = selected === option.value;
            return (
              <label
                key={option.value}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${
                  checked ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink-soft"
                }`}
              >
                <input
                  type="radio"
                  name={step.key}
                  value={option.value}
                  checked={checked}
                  onChange={() => choose(option.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    checked ? "border-white" : "border-line"
                  }`}
                >
                  {checked && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                </span>
                {t(option.label)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
          {t("finder.back")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={skip}>
          {t("finder.skip")}
        </button>
        <button type="button" className="btn btn-primary ms-auto" onClick={next} disabled={!selected}>
          {isLast ? t("finder.show") : t("finder.next")}
          {!isLast && <ArrowRight aria-hidden className="h-4 w-4 rtl:rotate-180" />}
        </button>
      </div>
      {!isLast && answeredCount > 0 && (
        <button type="button" className="mt-4 text-sm font-semibold text-accent hover:underline" onClick={() => setShowResults(true)}>
          {t("finder.show")}
        </button>
      )}
    </div>
  );
}
