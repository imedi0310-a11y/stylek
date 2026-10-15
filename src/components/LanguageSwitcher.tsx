"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { isLocale, LOCALE_LABELS } from "@/i18n/config";
import { LOCALES } from "@/lib/types";

export function LanguageSwitcher({ id = "language-select" }: { id?: string }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  return (
    <div className="relative flex items-center">
      <label htmlFor={id} className="sr-only">
        {t("lang.label")}
      </label>
      <Languages aria-hidden className="pointer-events-none absolute start-2.5 h-4 w-4 text-ink-soft" />
      <select
        id={id}
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (!isLocale(next)) return;
          setLocale(next);
          // Re-render server components (metadata) with the new cookie.
          router.refresh();
        }}
        className="min-h-10 appearance-none rounded-full border border-line bg-surface py-1.5 ps-8 pe-3 text-sm font-medium"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
