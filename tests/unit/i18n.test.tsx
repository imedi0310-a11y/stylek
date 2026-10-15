import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { directionFor, localeFromAcceptLanguage } from "@/i18n/config";
import { translate } from "@/i18n/messages";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function Probe() {
  const { t } = useI18n();
  return (
    <>
      <h1>{t("home.title")}</h1>
      <button type="button">{t("home.ctaFind")}</button>
    </>
  );
}

describe("i18n", () => {
  it("interpolates variables", () => {
    expect(translate("en", "styles.results", { count: 7 })).toBe("7 styles");
    expect(translate("fr", "finder.step", { current: 2, total: 7 })).toBe("Étape 2 sur 7");
  });

  it("uses RTL only for Arabic", () => {
    expect(directionFor("ar")).toBe("rtl");
    expect(directionFor("en")).toBe("ltr");
    expect(directionFor("fr")).toBe("ltr");
  });

  it("picks a locale from Accept-Language", () => {
    expect(localeFromAcceptLanguage("ar-DZ,ar;q=0.9,fr;q=0.8")).toBe("ar");
    expect(localeFromAcceptLanguage("de-DE,fr;q=0.7,en;q=0.5")).toBe("fr");
    expect(localeFromAcceptLanguage("de")).toBe("en");
    expect(localeFromAcceptLanguage(undefined)).toBe("en");
  });

  it("switches the whole interface and document direction", () => {
    render(
      <I18nProvider initialLocale="en">
        <LanguageSwitcher />
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(translate("en", "home.title"));
    expect(document.documentElement.dir).toBe("ltr");

    act(() => {
      fireEvent.change(screen.getByLabelText("Language"), { target: { value: "ar" } });
    });
    expect(screen.getByRole("heading")).toHaveTextContent(translate("ar", "home.title"));
    expect(screen.getByRole("button")).toHaveTextContent(translate("ar", "home.ctaFind"));
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(window.localStorage.getItem("stylek.locale")).toBe("ar");

    act(() => {
      fireEvent.change(screen.getByLabelText("اللغة"), { target: { value: "fr" } });
    });
    expect(screen.getByRole("heading")).toHaveTextContent(translate("fr", "home.title"));
    expect(document.documentElement.dir).toBe("ltr");
  });
});
