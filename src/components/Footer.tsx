"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { LogoMark } from "./Logo";
import { NAV_ITEMS } from "./nav";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="no-print mt-16 border-t border-line bg-surface pb-24 md:pb-10">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="font-bold" dir="ltr">Stylek AI</span>
          </div>
          <p className="text-sm text-ink-soft">{t("app.tagline")}</p>
          <p className="max-w-md text-sm text-ink-soft">{t("footer.note")}</p>
        </div>
        <nav aria-label={t("a11y.menu")}>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[...NAV_ITEMS, { href: "/privacy", label: "nav.privacy" as const }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-soft hover:text-ink hover:underline">
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container-page border-t border-line pt-6 text-xs text-ink-soft">
        © {new Date().getFullYear()} {t("footer.rights")}
      </div>
    </footer>
  );
}
