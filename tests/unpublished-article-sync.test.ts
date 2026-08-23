import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  additionalCommercialArticleSeeds,
  publicArticleMetadata,
} from "../src/content/articles";

/**
 * 未公開記事の同期契約（Refs #389）。
 *
 * 非公開の記事スラグは、次の4点で一致していなければならない:
 *   1. functions/articles/<slug>.ts（Cloudflare Pages Functions のハード404）
 *   2. public/_redirects の /articles/<slug>/* → /404.html (302)
 *   3. src/pages/articles/<slug>/ のページファイルが存在しないこと
 *   4. 公開メタデータ（publicArticleMetadata = sitemap / 一覧の情報源）に載らないこと
 *
 * 片方だけ更新すると、非公開記事が静的HTMLとして公開されたまま残ったり、
 * 404 Function だけが残ってデッドコードになったりする。このテストは
 * シード（初稿）・Functions・リダイレクト・ページファイルの食い違いを検知する。
 */

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** functions/articles/*.ts が守るべきスラグ一覧 */
function functionArticleSlugs(): string[] {
  const dir = path.join(repoRoot, "functions", "articles");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => name.replace(/\.ts$/, ""));
}

/** _redirects の「/articles/<slug>/* → /404.html 302」行からスラグを抽出 */
function redirectArticleSlugs(): string[] {
  const content = readFileSync(
    path.join(repoRoot, "public", "_redirects"),
    "utf8",
  );
  return [
    ...content.matchAll(
      /^\/articles\/([a-z0-9-]+)\/\*\s+\/404\.html\s+302\s*$/gm,
    ),
  ].map((match) => match[1]);
}

function hasPageFile(slug: string): boolean {
  return existsSync(path.join(repoRoot, "src", "pages", "articles", slug));
}

/** 確認日未記入＝公開対象外の初稿シード */
const unpublishedSeedIds = additionalCommercialArticleSeeds
  .filter((seed) => !seed.productInfoCheckedAt)
  .map((seed) => seed.id);

const publicPaths = new Set(
  publicArticleMetadata.map((article) => article.path),
);

describe("unpublished article sync (#389)", () => {
  it("keeps functions/articles and _redirects covering exactly the same slugs", () => {
    const functions = functionArticleSlugs().sort();
    const redirects = redirectArticleSlugs().sort();

    expect(
      functions.length,
      "functions/articles に *.ts 以外のファイルがない",
    ).toBe(redirects.length);
    expect(functions).toEqual(redirects);
    expect(functions.length).toBeGreaterThan(0);
  });

  it("returns a hard 404 from every functions/articles handler", () => {
    for (const slug of functionArticleSlugs()) {
      const source = readFileSync(
        path.join(repoRoot, "functions", "articles", `${slug}.ts`),
        "utf8",
      );
      expect(source, `${slug}.ts must answer 404`).toMatch(/status:\s*404/);
    }
  });

  it("does not ship page files or public metadata for blocked slugs", () => {
    for (const slug of functionArticleSlugs()) {
      expect(
        hasPageFile(slug),
        `src/pages/articles/${slug} must not exist`,
      ).toBe(false);
      expect(publicPaths.has(`/articles/${slug}/`)).toBe(false);
    }
  });

  it("excludes unpublished seeds from the public metadata used by lists and sitemap", () => {
    expect(unpublishedSeedIds.length).toBeGreaterThan(0);
    for (const id of unpublishedSeedIds) {
      expect(
        publicPaths.has(`/articles/${id}/`),
        `${id} must stay private`,
      ).toBe(false);
    }
  });

  it("keeps a page file for every published article (no sitemap dead links)", () => {
    for (const article of publicArticleMetadata) {
      expect(
        hasPageFile(article.id),
        `public article without page file: ${article.id}`,
      ).toBe(true);
    }
  });
});
