import type { APIRoute } from "astro";
import { site } from "../config/site";
import { articleMetadata } from "../content/articles";

const publicPaths = [
  "/",
  "/articles/",
  "/about/",
  "/privacy/",
  "/disclaimer/",
  ...articleMetadata.map((article) => article.path),
] as const;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = () => {
  const urls = publicPaths
    .map((pathname) => {
      const location = new URL(pathname, `${site.url}/`).toString();
      const article = articleMetadata.find((entry) => entry.path === pathname);
      // 記事URLには更新日（modifiedAt）を lastmod として付与する。
      const lastmod = article
        ? `<lastmod>${escapeXml(article.modifiedAt)}</lastmod>`
        : "";
      const image = article?.imagePath
        ? new URL(article.imagePath, `${site.url}/`).toString()
        : undefined;
      if (image) {
        return `  <url><loc>${escapeXml(location)}</loc>${lastmod}<image:image><image:loc>${escapeXml(image)}</image:loc></image:image></url>`;
      }
      return `  <url><loc>${escapeXml(location)}</loc>${lastmod}</url>`;
    })
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
