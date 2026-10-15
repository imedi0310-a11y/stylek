"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/I18nProvider";

interface Props {
  styleId: string;
  styleName: string;
  variant?: "icon" | "full";
}

export function FavoriteButton({ styleId, styleName, variant = "icon" }: Props) {
  const { t } = useI18n();
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(styleId);
  const label = `${saved ? t("fav.remove") : t("fav.add")}: ${styleName}`;

  if (variant === "full") {
    return (
      <button type="button" onClick={() => toggle(styleId)} aria-pressed={saved} className="btn btn-secondary">
        <Heart aria-hidden className={`h-5 w-5 ${saved ? "fill-danger text-danger" : ""}`} />
        {saved ? t("fav.saved") : t("fav.add")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(styleId)}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:bg-surface"
    >
      <Heart aria-hidden className={`h-5 w-5 ${saved ? "fill-danger text-danger" : "text-ink"}`} />
    </button>
  );
}
