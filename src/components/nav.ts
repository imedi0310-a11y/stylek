import { Heart, Home, ScanFace, Scissors, Sparkles } from "lucide-react";
import type { MessageKey } from "@/i18n/messages";

export const NAV_ITEMS: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/", label: "nav.home", icon: Home },
  { href: "/styles", label: "nav.styles", icon: Scissors },
  { href: "/finder", label: "nav.finder", icon: Sparkles },
  { href: "/try-on", label: "nav.tryOn", icon: ScanFace },
  { href: "/favorites", label: "nav.favorites", icon: Heart },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
