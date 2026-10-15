"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { getHairstyleById } from "@/data/hairstyles";
import { HairstyleGrid } from "@/components/HairstyleCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/I18nProvider";

export function Favorites() {
  const { t } = useI18n();
  const { ids, clear } = useFavorites();
  const styles = ids.map((id) => getHairstyleById(id)).filter((style) => style !== undefined);

  return (
    <div className="container-page py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("fav.title")}</h1>
          <p className="text-ink-soft">{t("fav.subtitle")}</p>
        </div>
        {styles.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost text-danger"
            onClick={() => {
              if (window.confirm(t("fav.clearConfirm"))) clear();
            }}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            {t("fav.clear")}
          </button>
        )}
      </header>

      {styles.length > 0 ? (
        <>
          <p className="mb-4 text-sm font-semibold" role="status">
            {styles.length === 1 ? t("styles.resultsOne") : t("styles.results", { count: styles.length })}
          </p>
          <HairstyleGrid styles={styles} />
        </>
      ) : (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Heart aria-hidden className="h-10 w-10 text-ink-soft" />
          <h2 className="text-lg font-semibold">{t("fav.emptyTitle")}</h2>
          <p className="max-w-sm text-sm text-ink-soft">{t("fav.emptyDesc")}</p>
          <Link href="/styles" className="btn btn-primary mt-2">
            {t("fav.browse")}
          </Link>
        </div>
      )}
    </div>
  );
}
