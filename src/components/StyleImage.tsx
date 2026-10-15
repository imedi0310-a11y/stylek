"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { Hairstyle } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { StyleIllustration } from "./StyleIllustration";

interface Props {
  style: Hairstyle;
  className?: string;
  priority?: boolean;
}

/**
 * Shows a licensed photo when the dataset provides one, otherwise the built-in
 * illustration. A failed photo falls back to the illustration; a broken
 * illustration (should not happen) falls back to a designed placeholder.
 */
export function StyleImage({ style, className = "", priority = false }: Props) {
  const { l, t } = useI18n();
  const [photoFailed, setPhotoFailed] = useState(false);
  const name = l(style.name);

  if (style.photo && !photoFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote licensed photos with their own dimensions
      <img
        src={style.photo.src}
        alt={l(style.photo.alt)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setPhotoFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  if (!style.illustration) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-muted text-ink-soft ${className}`}>
        <ImageOff aria-hidden className="h-6 w-6" />
        <span className="text-sm">{t("image.fallback")}</span>
      </div>
    );
  }

  return (
    <StyleIllustration
      id={style.id}
      spec={style.illustration}
      title={`${name} — ${t("styles.illustration")}`}
      className={`h-full w-full ${className}`}
    />
  );
}
