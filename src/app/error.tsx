"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <h1 className="text-2xl font-bold">{t("error.title")}</h1>
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>
        {t("error.retry")}
      </button>
    </div>
  );
}
