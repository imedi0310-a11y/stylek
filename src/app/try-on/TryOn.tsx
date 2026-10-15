"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  Download,
  ImagePlus,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getHairstyleBySlug, hairstyles } from "@/data/hairstyles";
import { StyleIllustration } from "@/components/StyleIllustration";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import { cameraEnvironment, cameraUnavailableReason, type CameraErrorKey } from "@/lib/tryon/camera";
import { composeReference, ENGINE_KIND, EngineError, runGuideEngine, runToneEngine, type EngineId } from "@/lib/tryon/engines";
import {
  ACCEPTED_TYPES,
  canvasToBlob,
  fileToCanvas,
  ImageInputError,
  MAX_FILE_MB,
  MIN_DIMENSION,
  releaseCanvas,
} from "@/lib/tryon/image";
import { HAIR_TONES, type HairTone } from "@/lib/tryon/tint";
import type { Category } from "@/lib/types";
import { CameraCapture } from "./CameraCapture";
import { CompareSlider } from "./CompareSlider";

interface Photo {
  canvas: HTMLCanvasElement;
  url: string;
}

interface Result {
  url: string;
  mode: EngineId;
  styleId: string;
  faceProtected: boolean;
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; message: MessageKey }
  | { kind: "error"; message: string };

const MODES: { id: EngineId; label: MessageKey; desc: MessageKey; action: MessageKey }[] = [
  { id: "reference", label: "tryon.mode.reference", desc: "tryon.mode.referenceDesc", action: "tryon.showReference" },
  { id: "tone", label: "tryon.mode.tone", desc: "tryon.mode.toneDesc", action: "tryon.applyTone" },
  { id: "guide", label: "tryon.mode.guide", desc: "tryon.mode.guideDesc", action: "tryon.applyGuide" },
];

async function toPhoto(canvas: HTMLCanvasElement): Promise<Photo> {
  const blob = await canvasToBlob(canvas);
  return { canvas, url: URL.createObjectURL(blob) };
}

function disposePhoto(photo: Photo | null) {
  if (!photo) return;
  URL.revokeObjectURL(photo.url);
  releaseCanvas(photo.canvas);
}

export function TryOn() {
  const { t, l } = useI18n();
  const searchParams = useSearchParams();
  const initialStyle = getHairstyleBySlug(searchParams.get("style") ?? "");

  const [pending, setPending] = useState<Photo | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [category, setCategory] = useState<Category | "all">(initialStyle?.category ?? "all");
  const [styleId, setStyleId] = useState<string | null>(initialStyle?.id ?? null);
  const [mode, setMode] = useState<EngineId>("reference");
  const [tone, setTone] = useState<HairTone>("brown");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [inputError, setInputError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const galleryRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Keep the latest objects in refs so the unmount cleanup releases them.
  const live = useRef({ pending, photo, result });
  useEffect(() => {
    live.current = { pending, photo, result };
  }, [pending, photo, result]);

  useEffect(
    () => () => {
      disposePhoto(live.current.pending);
      disposePhoto(live.current.photo);
      if (live.current.result) URL.revokeObjectURL(live.current.result.url);
    },
    [],
  );

  const style = useMemo(() => hairstyles.find((s) => s.id === styleId) ?? null, [styleId]);
  const visibleStyles = useMemo(
    () => (category === "all" ? hairstyles : hairstyles.filter((s) => s.category === category)),
    [category],
  );

  const clearResult = useCallback(() => {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setStatus({ kind: "idle" });
  }, []);

  const acceptCanvas = useCallback(async (canvas: HTMLCanvasElement) => {
    const next = await toPhoto(canvas);
    setPending((current) => {
      disposePhoto(current);
      return next;
    });
  }, []);

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setInputError(null);
    if (!file) return;
    try {
      await acceptCanvas(await fileToCanvas(file));
    } catch (error) {
      const key = error instanceof ImageInputError ? error.key : "file.decodeFailed";
      setInputError(t(key, { max: MAX_FILE_MB, min: MIN_DIMENSION }));
    }
  };

  const openCamera = () => {
    setInputError(null);
    const reason = cameraUnavailableReason(cameraEnvironment());
    if (reason) {
      // Fall back to the phone's native camera through the file picker.
      setInputError(t(reason));
      nativeCameraRef.current?.click();
      return;
    }
    setCameraOpen(true);
  };

  const onCameraError = useCallback(
    (key: CameraErrorKey) => {
      setCameraOpen(false);
      setInputError(t(key));
    },
    [t],
  );

  const onCapture = useCallback(
    async (canvas: HTMLCanvasElement) => {
      setCameraOpen(false);
      await acceptCanvas(canvas);
    },
    [acceptCanvas],
  );

  const confirmPhoto = () => {
    if (!pending) return;
    clearResult();
    setPhoto((current) => {
      disposePhoto(current);
      return pending;
    });
    setPending(null);
  };

  const removePhoto = () => {
    clearResult();
    disposePhoto(photo);
    disposePhoto(pending);
    setPhoto(null);
    setPending(null);
    setInputError(null);
  };

  const apply = async () => {
    if (!photo || !style) return;
    clearResult();
    const finish = async (canvas: HTMLCanvasElement, faceProtected: boolean) => {
      const blob = await canvasToBlob(canvas, "image/png");
      releaseCanvas(canvas);
      setResult({ url: URL.createObjectURL(blob), mode, styleId: style.id, faceProtected });
      setStatus({ kind: "idle" });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };

    if (mode === "reference") {
      setResult({ url: "", mode, styleId: style.id, faceProtected: true });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }

    setStatus({ kind: "working", message: "tryon.loadingModel" });
    try {
      // Yield so the loading state paints before heavy work starts.
      await new Promise((resolve) => setTimeout(resolve, 30));
      const output =
        mode === "tone" ? await runToneEngine(photo.canvas, tone) : await runGuideEngine(photo.canvas, style.illustration);
      setStatus({ kind: "working", message: "tryon.processing" });
      await finish(output.canvas, output.faceProtected);
    } catch (error) {
      if (error instanceof EngineError) {
        if (error.reason === "noFace") setStatus({ kind: "error", message: t("tryon.noFace") });
        else if (error.reason === "noHair") setStatus({ kind: "error", message: t("tryon.noHair") });
        else if (error.reason === "load") setStatus({ kind: "error", message: t("tryon.offline") });
        else setStatus({ kind: "error", message: t("tryon.engineError", { message: error.message }) });
      } else {
        const message = error instanceof Error ? error.message : String(error);
        setStatus({ kind: "error", message: t("tryon.engineError", { message }) });
      }
    }
  };

  const save = async () => {
    if (!photo || !result || !style) return;
    let url = result.url;
    let temporary = false;
    if (result.mode === "reference") {
      const composed = await composeReference(photo.canvas, referenceRef.current?.querySelector("svg") ?? null);
      url = URL.createObjectURL(await canvasToBlob(composed, "image/png"));
      releaseCanvas(composed);
      temporary = true;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = `stylek-${style.slug}-${result.mode}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (temporary) setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tryAnother = () => {
    clearResult();
    document.getElementById("style-picker")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const working = status.kind === "working";
  const currentMode = MODES.find((m) => m.id === mode)!;
  const resultStyle = result ? hairstyles.find((s) => s.id === result.styleId) : null;

  return (
    <div className="container-page max-w-4xl py-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">{t("tryon.title")}</h1>
        <p className="text-ink-soft">{t("tryon.subtitle")}</p>
        <p className="flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-strong">
          <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {t("tryon.privacy")}
        </p>
      </header>

      {/* Hidden inputs: gallery and the native camera fallback. */}
      <input
        ref={galleryRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
        data-testid="gallery-input"
      />
      <input
        ref={nativeCameraRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        capture="user"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
      />

      {/* Step 1: photo */}
      <section aria-labelledby="step1" className="card p-5">
        <h2 id="step1" className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">1</span>
          {t("tryon.step1")}
        </h2>

        {pending ? (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element -- in-memory blob URL */}
            <img src={pending.url} alt={t("tryon.yourPhoto")} className="w-full rounded-2xl border border-line object-cover" />
            <div className="space-y-3">
              <h3 className="font-semibold">{t("tryon.confirmTitle")}</h3>
              <p className="text-sm text-ink-soft">{t("tryon.confirmDesc")}</p>
              <p className="text-sm text-ink-soft">{t("tryon.photoTips")}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary" onClick={confirmPhoto}>
                  <Check aria-hidden className="h-4 w-4" />
                  {t("tryon.usePhoto")}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => galleryRef.current?.click()}>
                  {t("tryon.changePhoto")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={removePhoto}>
                  <Trash2 aria-hidden className="h-4 w-4" />
                  {t("tryon.removePhoto")}
                </button>
              </div>
            </div>
          </div>
        ) : photo ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- in-memory blob URL */}
            <img src={photo.url} alt={t("tryon.yourPhoto")} className="h-24 w-24 rounded-2xl border border-line object-cover" />
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 font-semibold text-accent">
                <Check aria-hidden className="h-4 w-4" />
                {t("tryon.photoReady")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary min-h-10 px-3 text-sm" onClick={openCamera}>
                  <Camera aria-hidden className="h-4 w-4" />
                  {t("tryon.changePhoto")}
                </button>
                <button type="button" className="btn btn-secondary min-h-10 px-3 text-sm" onClick={() => galleryRef.current?.click()}>
                  <ImagePlus aria-hidden className="h-4 w-4" />
                  {t("tryon.chooseGallery")}
                </button>
                <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={removePhoto}>
                  <Trash2 aria-hidden className="h-4 w-4" />
                  {t("tryon.removePhoto")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line px-4 py-10 text-center">
            <Camera aria-hidden className="h-10 w-10 text-ink-soft" />
            <div>
              <p className="font-semibold">{t("tryon.noPhoto")}</p>
              <p className="mt-1 text-sm text-ink-soft">{t("tryon.noPhotoDesc", { max: MAX_FILE_MB })}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button type="button" className="btn btn-primary" onClick={openCamera}>
                <Camera aria-hidden className="h-4 w-4" />
                {t("tryon.takePhoto")}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => galleryRef.current?.click()}>
                <ImagePlus aria-hidden className="h-4 w-4" />
                {t("tryon.chooseGallery")}
              </button>
            </div>
          </div>
        )}

        {inputError && (
          <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {inputError}
          </p>
        )}
      </section>

      {/* Step 2: style */}
      <section id="style-picker" aria-labelledby="step2" className="card mt-4 scroll-mt-20 p-5">
        <h2 id="step2" className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">2</span>
          {t("tryon.selectStyle")}
        </h2>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={t("tryon.collection")}>
          {(["all", "men", "women"] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {t(`category.${c}`)}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label={t("tryon.selectStyle")} className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {visibleStyles.map((s) => {
            const selected = s.id === styleId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setStyleId(s.id);
                  clearResult();
                }}
                className={`w-28 shrink-0 snap-start overflow-hidden rounded-2xl border-2 text-start transition-colors ${
                  selected ? "border-accent" : "border-transparent"
                }`}
              >
                <div className="aspect-[4/5] bg-surface-muted">
                  <StyleIllustration id={s.id} spec={s.illustration} title={l(s.name)} className="h-full w-full" />
                </div>
                <p className="line-clamp-2 p-1.5 text-xs font-medium">{l(s.name)}</p>
              </button>
            );
          })}
        </div>
        {style && (
          <p className="mt-2 text-sm font-semibold" aria-live="polite">
            {t("tryon.selected", { name: l(style.name) })}{" "}
            <Link href={`/styles/${style.slug}`} className="font-normal text-accent hover:underline">
              ↗
            </Link>
          </p>
        )}
      </section>

      {/* Step 3: preview */}
      <section aria-labelledby="step3" className="card mt-4 p-5">
        <h2 id="step3" className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">3</span>
          {t("tryon.step3")}
        </h2>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">{t("tryon.mode")}</legend>
          {MODES.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${
                mode === m.id ? "border-ink bg-surface-muted" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={m.id}
                checked={mode === m.id}
                onChange={() => {
                  setMode(m.id);
                  clearResult();
                }}
                className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
              />
              <span>
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {t(m.label)}
                  {ENGINE_KIND[m.id] === "prototype" && <span className="badge bg-warn-soft text-warn">Beta</span>}
                </span>
                <span className="block text-sm text-ink-soft">{t(m.desc)}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {mode === "tone" && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">{t("tryon.toneColor")}</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(HAIR_TONES) as HairTone[]).map((key) => {
                const c = HAIR_TONES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className="chip"
                    aria-pressed={tone === key}
                    onClick={() => {
                      setTone(key);
                      clearResult();
                    }}
                  >
                    <span aria-hidden className="h-4 w-4 rounded-full border border-white/50" style={{ background: `rgb(${c.r} ${c.g} ${c.b})` }} />
                    {t(`tryon.tone.${key}` as MessageKey)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {mode !== "reference" && (
          <p className="mt-4 flex gap-2 text-xs text-ink-soft">
            <Info aria-hidden className="h-4 w-4 shrink-0" />
            {t("tryon.modelNotice")}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-accent" onClick={apply} disabled={!photo || !style || working} aria-describedby="apply-help">
            {working ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Sparkles aria-hidden className="h-4 w-4" />}
            {t(currentMode.action)}
          </button>
          {result && (
            <button type="button" className="btn btn-ghost" onClick={clearResult}>
              <RotateCcw aria-hidden className="h-4 w-4" />
              {t("tryon.reset")}
            </button>
          )}
        </div>
        <p id="apply-help" className="mt-2 text-xs text-ink-soft">
          {!photo ? t("tryon.noPhoto") : !style ? t("tryon.selectStyle") : ""}
        </p>

        <div aria-live="polite" className="mt-3">
          {working && (
            <p className="flex items-center gap-2 text-sm text-ink-soft" role="status">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {t(status.message)}
            </p>
          )}
          {status.kind === "error" && (
            <p role="alert" className="flex gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              {status.message}
            </p>
          )}
        </div>

        <p className="mt-4 flex gap-2 rounded-xl bg-surface-muted p-3 text-xs text-ink-soft">
          <Info aria-hidden className="h-4 w-4 shrink-0" />
          {t("tryon.realisticUnavailable")}
        </p>
      </section>

      {/* Result */}
      {result && photo && resultStyle && (
        <section ref={resultRef} aria-labelledby="result-title" className="card mt-4 scroll-mt-20 p-5" data-testid="tryon-result">
          <h2 id="result-title" className="mb-3 text-lg font-semibold">
            {result.mode === "reference" ? t("tryon.mode.reference") : t("tryon.compare")}
          </h2>
          <p className="mb-4 flex gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn" data-testid="result-label">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {t(`tryon.resultLabel.${result.mode}` as MessageKey)}
          </p>

          {result.mode === "reference" ? (
            <div className="grid grid-cols-2 gap-3">
              <figure className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- in-memory blob URL */}
                <img src={photo.url} alt={t("tryon.yourPhoto")} className="aspect-[4/5] w-full rounded-2xl object-cover" />
                <figcaption className="text-center text-xs text-ink-soft">{t("tryon.yourPhoto")}</figcaption>
              </figure>
              <figure className="space-y-1">
                <div ref={referenceRef} className="aspect-[4/5] overflow-hidden rounded-2xl">
                  <StyleIllustration id={resultStyle.id} spec={resultStyle.illustration} title={l(resultStyle.name)} className="h-full w-full" />
                </div>
                <figcaption className="text-center text-xs text-ink-soft">
                  {t("tryon.styleReference")}: {l(resultStyle.name)}
                </figcaption>
              </figure>
            </div>
          ) : (
            <CompareSlider
              beforeUrl={photo.url}
              afterUrl={result.url}
              beforeAlt={t("tryon.yourPhoto")}
              afterAlt={`${t(MODES.find((m) => m.id === result.mode)!.label)} — ${l(resultStyle.name)}`}
            />
          )}

          {result.mode !== "reference" && result.faceProtected && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent">
              <ShieldCheck aria-hidden className="h-4 w-4" />
              {t("tryon.faceProtected")}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={save}>
              <Download aria-hidden className="h-4 w-4" />
              {t("tryon.save")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={tryAnother}>
              {t("tryon.tryAnother")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearResult}>
              <RotateCcw aria-hidden className="h-4 w-4" />
              {t("tryon.reset")}
            </button>
            <Link href={`/styles/${resultStyle.slug}/card`} className="btn btn-ghost">
              {t("detail.prepareCard")}
            </Link>
          </div>
        </section>
      )}

      {cameraOpen && <CameraCapture onCapture={onCapture} onClose={() => setCameraOpen(false)} onError={onCameraError} />}
    </div>
  );
}
