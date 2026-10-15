"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { hairstyles } from "@/data/hairstyles";
import { HairstyleGrid } from "@/components/HairstyleCard";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  filterHairstyles,
  filtersFromParams,
  filtersToParams,
  type StyleFilters,
} from "@/lib/search";
import { LENGTHS, MAINTENANCE_LEVELS, STYLE_TAGS, TEXTURES } from "@/lib/types";

type ListKey = "lengths" | "textures" | "tags" | "maintenance";

const GROUPS: { key: ListKey; label: MessageKey; values: readonly string[]; prefix: string }[] = [
  { key: "lengths", label: "label.length", values: LENGTHS, prefix: "length" },
  { key: "textures", label: "label.texture", values: TEXTURES, prefix: "texture" },
  { key: "tags", label: "label.style", values: STYLE_TAGS, prefix: "tag" },
  { key: "maintenance", label: "label.maintenance", values: MAINTENANCE_LEVELS, prefix: "maintenance" },
];

export function Catalogue() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchId = useId();
  const [showFilters, setShowFilters] = useState(false);

  const urlFilters = useMemo(() => filtersFromParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  // The search box keeps its own state so typing stays responsive while the URL catches up.
  const [query, setQuery] = useState(urlFilters.query);
  const filters = useMemo(() => ({ ...urlFilters, query }), [urlFilters, query]);
  const results = useMemo(() => filterHairstyles(hairstyles, filters, locale), [filters, locale]);
  const active = countActiveFilters(filters);

  const update = useCallback(
    (next: StyleFilters) => {
      setQuery(next.query);
      const params = filtersToParams(next).toString();
      router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const toggleValue = (key: ListKey, value: string) => {
    const current = filters[key] as string[];
    const nextList = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ ...filters, [key]: nextList });
  };

  return (
    <div className="container-page py-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">{t("styles.title")}</h1>
        <p className="text-ink-soft">{t("styles.subtitle")}</p>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            {t("styles.searchLabel")}
          </label>
          <Search aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" />
          <input
            id={searchId}
            type="search"
            inputMode="search"
            maxLength={80}
            value={filters.query}
            onChange={(event) => update({ ...filters, query: event.target.value })}
            placeholder={t("styles.searchPlaceholder")}
            className="field ps-11"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("label.collection")}>
          {(["all", "men", "women"] as const).map((category) => (
            <button
              key={category}
              type="button"
              className="chip"
              aria-pressed={filters.category === category}
              onClick={() => update({ ...filters, category })}
            >
              {t(`category.${category}`)}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost ms-auto min-h-10 px-3 text-sm"
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            onClick={() => setShowFilters((value) => !value)}
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            {showFilters ? t("styles.hideFilters") : t("styles.showFilters")}
            {active > 0 && <span className="badge bg-accent text-white">{active}</span>}
          </button>
        </div>

        <div id="filter-panel" hidden={!showFilters} className="card space-y-5 p-4 sm:p-5">
          {GROUPS.map((group) => (
            <fieldset key={group.key}>
              <legend className="mb-2 text-sm font-semibold">{t(group.label)}</legend>
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip"
                    aria-pressed={(filters[group.key] as string[]).includes(value)}
                    onClick={() => toggleValue(group.key, value)}
                  >
                    {t(`${group.prefix}.${value}` as MessageKey)}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold" role="status" aria-live="polite">
            {results.length === 1 ? t("styles.resultsOne") : t("styles.results", { count: results.length })}
          </p>
          {active > 0 && (
            <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={() => update(EMPTY_FILTERS)}>
              <RotateCcw aria-hidden className="h-4 w-4" />
              {t("styles.reset")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        {results.length > 0 ? (
          <HairstyleGrid styles={results} priorityCount={2} />
        ) : (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <SearchX aria-hidden className="h-10 w-10 text-ink-soft" />
            <h2 className="text-lg font-semibold">{t("styles.emptyTitle")}</h2>
            <p className="max-w-sm text-sm text-ink-soft">{t("styles.emptyDesc")}</p>
            <button type="button" className="btn btn-primary mt-2" onClick={() => update(EMPTY_FILTERS)}>
              {t("styles.reset")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
