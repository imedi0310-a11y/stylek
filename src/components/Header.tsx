"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoMark } from "./Logo";
import { isActive, NAV_ITEMS } from "./nav";

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-canvas/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label={`${t("app.name")} — ${t("nav.home")}`}>
          <LogoMark />
          <span className="text-lg font-bold tracking-tight" dir="ltr">
            Stylek <span className="text-accent">AI</span>
          </span>
        </Link>
        <nav aria-label={t("a11y.menu")} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-ink text-white" : "text-ink-soft hover:bg-surface-muted hover:text-ink"
                    }`}
                  >
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

/** Thumb-friendly tab bar for phones. */
export function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <nav
      aria-label={t("a11y.menu")}
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] font-medium leading-tight ${
                  active ? "text-accent" : "text-ink-soft"
                }`}
              >
                <Icon aria-hidden className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className="max-w-full truncate">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
