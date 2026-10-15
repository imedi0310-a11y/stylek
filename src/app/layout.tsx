import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { BottomNav, Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/i18n/I18nProvider";
import { directionFor } from "@/i18n/config";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const title = `Stylek AI — ${translate(locale, "app.tagline")}`;
  const description = translate(locale, "home.subtitle");
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: "%s | Stylek AI" },
    description,
    applicationName: "Stylek AI",
    openGraph: {
      type: "website",
      siteName: "Stylek AI",
      title,
      description,
      locale: { en: "en_US", fr: "fr_FR", ar: "ar_DZ" }[locale],
    },
    twitter: { card: "summary", title, description },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5f2",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} dir={directionFor(locale)}>
      <body className="min-h-dvh antialiased">
        <I18nProvider initialLocale={locale}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
          >
            {translate(locale, "a11y.skip")}
          </a>
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </I18nProvider>
      </body>
    </html>
  );
}
