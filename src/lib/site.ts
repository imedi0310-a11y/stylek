/** Public base URL used for sitemap, robots and Open Graph links. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}
