"use client";

import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";

const SECTIONS: [MessageKey, MessageKey][] = [
  ["privacy.photosTitle", "privacy.photos"],
  ["privacy.cameraTitle", "privacy.camera"],
  ["privacy.modelTitle", "privacy.model"],
  ["privacy.storageTitle", "privacy.storage"],
  ["privacy.futureTitle", "privacy.future"],
  ["privacy.contactTitle", "privacy.contact"],
];

export function PrivacyContent() {
  const { t } = useI18n();
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-3xl font-bold">{t("privacy.title")}</h1>
      <p className="mt-3 text-lg text-ink-soft">{t("privacy.intro")}</p>
      <div className="mt-8 space-y-4">
        {SECTIONS.map(([title, body]) => (
          <section key={title} className="card p-5">
            <h2 className="mb-2 text-lg font-semibold">{t(title)}</h2>
            <p className="text-ink-soft">{t(body)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
