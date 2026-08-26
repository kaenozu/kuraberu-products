import { describe, expect, it } from "vitest";
import { GET } from "../src/pages/sitemap.xml";
import {
  additionalCommercialArticleSeeds,
  publicArticleMetadata,
} from "../src/content/articles";

import { site } from "../src/config/site";

const SITE_ORIGIN = site.url;

async function sitemapXml(): Promise<string> {
  // 実装は context を参照しないため、キャストして引数なしで呼び出す。
  const response = (GET as unknown as () => Response)();
  expect(response.headers.get("Content-Type")).toContain("application/xml");
  return await response.text();
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function lastmodOf(xml: string, path: string): string | undefined {
  const entry = xml
    .split("<url>")
    .find((chunk) => chunk.includes(path) && chunk.includes("<lastmod>"));
  return entry?.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
}

/** 日本語カテゴリは <loc> 内で percent-encode されるため符号化して照合する */
function categoryLoc(category: string): string {
  return `${SITE_ORIGIN}/articles/category/${encodeURIComponent(category)}/`;
}

describe("sitemap.xml (#390)", () => {
  it("lists every published article and no unpublished slug", async () => {
    const xml = await sitemapXml();
    for (const article of publicArticleMetadata) {
      expect(locs(xml)).toContain(`${SITE_ORIGIN}${article.path}`);
    }
    // 公開対象外の初稿（シードに確認日が無い記事）は列挙しない
    const unpublished = additionalCommercialArticleSeeds
      .filter((seed) => !seed.productInfoCheckedAt)
      .map((seed) => seed.id);
    expect(unpublished.length).toBeGreaterThan(0);
    for (const id of unpublished) {
      expect(xml).not.toContain(`/articles/${id}/`);
    }
  });

  it("lists category pages with the newest modifiedAt inside each category", async () => {
    const xml = await sitemapXml();
    const categories = [
      ...new Set(publicArticleMetadata.map((article) => article.category)),
    ].sort();

    for (const category of categories) {
      const expected = publicArticleMetadata
        .filter((article) => article.category === category)
        .map((article) => article.modifiedAt)
        .sort()
        .at(-1)!;
      expect(lastmodOf(xml, categoryLoc(category))).toBe(expected);
    }
  });

  it("lists pagination pages with the latest modifiedAt across articles", async () => {
    const xml = await sitemapXml();
    const latest = publicArticleMetadata
      .map((article) => article.modifiedAt)
      .sort()
      .at(-1)!;
    const totalPages = Math.ceil(publicArticleMetadata.length / 12);
    expect(totalPages).toBeGreaterThan(1);

    for (let page = 2; page <= totalPages; page += 1) {
      expect(lastmodOf(xml, `/articles/page/${page}/`)).toBe(latest);
    }
    // 1ページ目は /articles/ 自身なので page/1/ は生成しない
    expect(locs(xml)).not.toContain(`${SITE_ORIGIN}/articles/page/1/`);
  });

  it("keeps article entries carrying lastmod and image tags", async () => {
    const xml = await sitemapXml();
    const withImage = publicArticleMetadata.find(
      (article) => article.imagePath,
    )!;
    const entry = xml
      .split("<url>")
      .find((chunk) => chunk.includes(withImage.path));
    expect(entry).toContain("<image:loc>");
    expect(entry).toContain(`<lastmod>${withImage.modifiedAt}</lastmod>`);
  });
});
