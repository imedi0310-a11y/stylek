import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FAVORITES_KEY, getFavoritesSnapshot, loadFavorites, resetFavoritesCache, toggleFavorite } from "@/lib/favorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import { I18nProvider } from "@/i18n/I18nProvider";


describe("favorites storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetFavoritesCache();
  });

  it("adds and removes favorites and persists them", () => {
    expect(toggleFavorite("m-buzz-cut")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!)).toEqual(["m-buzz-cut"]);
    resetFavoritesCache(); // simulate a page refresh
    expect(getFavoritesSnapshot()).toEqual(["m-buzz-cut"]);
    expect(toggleFavorite("m-buzz-cut")).toBe(false);
    expect(getFavoritesSnapshot()).toEqual([]);
  });

  it("ignores malformed or unknown stored data", () => {
    window.localStorage.setItem(FAVORITES_KEY, "{not json");
    expect(loadFavorites()).toEqual([]);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify({ a: 1 }));
    expect(loadFavorites()).toEqual([]);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(["w-bob", "deleted-style", "w-bob"]));
    expect(loadFavorites(new Set(["w-bob"]))).toEqual(["w-bob"]);
  });

  it("works when localStorage throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
    try {
      expect(() => toggleFavorite("w-bob")).not.toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("toggles from the heart button", () => {
    render(
      <I18nProvider initialLocale="en">
        <FavoriteButton styleId="w-bob" styleName="Classic Bob" />
      </I18nProvider>,
    );
    const button = screen.getByRole("button", { name: /save to favorites: classic bob/i });
    expect(button).toHaveAttribute("aria-pressed", "false");
    act(() => button.click());
    expect(screen.getByRole("button", { name: /remove from favorites/i })).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!)).toEqual(["w-bob"]);
  });
});
