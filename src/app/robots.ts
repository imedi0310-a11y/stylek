import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/favorites", "/styles/*/card"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
