import type { APIRoute } from "astro";
import { site } from "../config/site";
import { publicArticleMetadata } from "../content/articles";
import { diagnosisCategories } from "../data/diagnoses";
import {
  ARTICLE_LIST_PAGE_SIZE,
  maxDate,
  sortByModifiedAtDesc,
} from "../lib/article-list";

type SitemapEntry = {
  path: string;
  /** ISO 日付（YYYY-MM-DD）。無いURLは lastmod を出力しない */
  lastmod?: string;
  imagePath?: string;
};

// 公開記事（publicArticleMetadata）から一覧系URLを導出する。
// カテゴリ頁は pages/articles/category/[category].astro、
// ページネーションは pages/articles/page/[page].astro が生成するページと一致させる。
const sortedByModifiedDesc = sortByModifiedAtDesc(publicArticleMetadata);
const latestModifiedAt = maxDate(
  publicArticleMetadata.map((article) => article.modifiedAt),
);

const categoryEntries: SitemapEntry[] = [
  ...new Set(publicArticleMetadata.map((article) => article.category)),
]
  .sort()
  .map((category) => ({
    path: `/articles/category/${category}/`,
    // カテゴリ内の公開記事で最も新しい modifiedAt
    lastmod: maxDate(
      publicArticleMetadata
        .filter((article) => article.category === category)
        .map((article) => article.modifiedAt),
    ),
  }));

const totalPages = Math.ceil(
  sortedByModifiedDesc.length / ARTICLE_LIST_PAGE_SIZE,
);
const paginationEntries: SitemapEntry[] = Array.from(
  { length: Math.max(totalPages - 1, 0) },
  (_, index) => ({
    path: `/articles/page/${index + 2}/`,
    // 一覧の並び順は modifiedAt 降順のため、サイト全体の最新更新日を lastmod にする
    ...(latestModifiedAt ? { lastmod: latestModifiedAt } : {}),
  }),
);

const staticPaths: SitemapEntry[] = [
  { path: "/" },
  { path: "/articles/" },
  { path: "/about/" },
  { path: "/privacy/" },
  { path: "/disclaimer/" },
  { path: "/tools/product-finder/" },
  ...diagnosisCategories.map((category) => ({
    path: `/tools/product-finder/${category.slug}/` as const,
  })),
];

const articleEntries: SitemapEntry[] = publicArticleMetadata.map((article) => ({
  path: article.path,
  lastmod: article.modifiedAt,
  ...(article.imagePath ? { imagePath: article.imagePath } : {}),
}));

const publicPaths: SitemapEntry[] = [
  ...staticPaths,
  ...categoryEntries,
  ...paginationEntries,
  ...articleEntries,
];

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
    .map(({ path: pathname, lastmod, imagePath }) => {
      const location = new URL(pathname, `${site.url}/`).toString();
      // 記事・カテゴリ・ページネーションには導出した更新日（lastmod）を付与する。
      const lastmodTag = lastmod
        ? `<lastmod>${escapeXml(lastmod)}</lastmod>`
        : "";
      const image = imagePath
        ? new URL(imagePath, `${site.url}/`).toString()
        : undefined;
      if (image) {
        return `  <url><loc>${escapeXml(location)}</loc>${lastmodTag}<image:image><image:loc>${escapeXml(image)}</image:loc></image:image></url>`;
      }
      return `  <url><loc>${escapeXml(location)}</loc>${lastmodTag}</url>`;
    })
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
