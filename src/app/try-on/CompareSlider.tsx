"use client";

import { useId, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt: string;
  afterAlt: string;
}

/** Before/after comparison controlled by an accessible range input. */
export function CompareSlider({ beforeUrl, afterUrl, beforeAlt, afterAlt }: Props) {
  const { t } = useI18n();
  const id = useId();
  const [position, setPosition] = useState(50);

  return (
    <div className="space-y-2" dir="ltr">
      <div className="relative overflow-hidden rounded-2xl bg-surface-muted has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
        {/* eslint-disable-next-line @next/next/no-img-element -- in-memory blob URL */}
        <img src={afterUrl} alt={afterAlt} className="block h-auto w-full select-none" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- in-memory blob URL */}
          <img src={beforeUrl} alt={beforeAlt} className="block h-full w-full select-none object-cover" draggable={false} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${position}%` }}>
          <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow">
            ⇆
          </span>
        </div>
        <span className="badge absolute left-2 top-2 bg-black/60 text-white">{t("tryon.before")}</span>
        <span className="badge absolute right-2 top-2 bg-black/60 text-white">{t("tryon.after")}</span>
        <label htmlFor={id} className="sr-only">
          {t("tryon.compareSlider")}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  );
}
