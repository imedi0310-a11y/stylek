import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { hairstyles } from "@/data/hairstyles";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/styles", "/finder", "/try-on", "/privacy"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const styles = hairstyles.map((style) => ({
    url: `${base}/styles/${style.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...styles];
}
