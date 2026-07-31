import type { APIRoute } from "astro";
import { site } from "../config/site";

const isProduction = import.meta.env.DEPLOYMENT_ENV === "production";

export const GET: APIRoute = () => {
  const body = isProduction
    ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
