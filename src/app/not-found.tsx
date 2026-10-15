import Link from "next/link";
import { translate } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";

export default async function NotFound() {
  const locale = await getRequestLocale();
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">{translate(locale, "notFound.title")}</h1>
      <p className="mt-2 max-w-md text-ink-soft">{translate(locale, "notFound.desc")}</p>
      <Link href="/" className="btn btn-primary mt-6">
        {translate(locale, "notFound.home")}
      </Link>
    </div>
  );
}
