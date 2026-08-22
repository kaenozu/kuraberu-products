import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectSitemapArticleSlugs,
  collectUnpublishedArticleDirectories,
  pruneUnpublishedArticles,
} from "../scripts/prune-unpublished-articles.mjs";

const fixtureDirectories: string[] = [];

function fixtureDist() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-prune-"));
  fixtureDirectories.push(directory);
  return directory;
}

function writeArticle(distDirectory: string, slug: string) {
  const articleDirectory = path.join(distDirectory, "articles", slug);
  mkdirSync(articleDirectory, { recursive: true });
  writeFileSync(
    path.join(articleDirectory, "index.html"),
    `<!doctype html><html><body><h1>${slug}</h1></body></html>`,
  );
}

function writeSitemap(
  distDirectory: string,
  paths: string[],
  origin = "https://kuraberu-products.pages.dev",
) {
  const urls = paths
    .map((item) => `  <url><loc>${origin}${item}</loc></url>`)
    .join("\n");
  writeFileSync(
    path.join(distDirectory, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
}

afterEach(() => {
  while (fixtureDirectories.length) {
    rmSync(fixtureDirectories.pop()!, { recursive: true, force: true });
  }
});

describe("prune unpublished articles", () => {
  it("collects article slugs from sitemap loc entries only", () => {
    const directory = fixtureDist();
    writeSitemap(directory, [
      "/",
      "/articles/",
      "/articles/live-b/",
      "/memo/tools/",
    ]);

    expect([...collectSitemapArticleSlugs(directory)]).toEqual(["live-b"]);
  });

  it("keeps published articles and removes draft directories in production", () => {
    const directory = fixtureDist();
    writeArticle(directory, "draft-a");
    writeArticle(directory, "live-b");
    writeSitemap(directory, ["/", "/articles/live-b/"]);

    expect(
      collectUnpublishedArticleDirectories(directory).map((item) =>
        path.basename(item),
      ),
    ).toEqual(["draft-a"]);

    expect(
      pruneUnpublishedArticles({ distDirectory: directory }).pruned.map(
        (item) => path.basename(item),
      ),
    ).toEqual(["draft-a"]);
    expect(existsSync(path.join(directory, "articles", "draft-a"))).toBe(false);
    expect(
      existsSync(path.join(directory, "articles", "live-b", "index.html")),
    ).toBe(true);
  });

  it("fails closed and removes nothing when sitemap.xml is missing", () => {
    const directory = fixtureDist();
    writeArticle(directory, "draft-a");

    expect(() => collectUnpublishedArticleDirectories(directory)).toThrowError(
      /fail-closed/,
    );
    expect(() =>
      pruneUnpublishedArticles({ distDirectory: directory }),
    ).toThrow();
    expect(
      existsSync(path.join(directory, "articles", "draft-a", "index.html")),
    ).toBe(true);
  });

  it("fails closed and removes nothing when sitemap.xml has no loc entries", () => {
    const directory = fixtureDist();
    writeArticle(directory, "draft-a");
    writeFileSync(
      path.join(directory, "sitemap.xml"),
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );

    expect(() =>
      pruneUnpublishedArticles({ distDirectory: directory }),
    ).toThrow(/fail-closed/);
    expect(
      existsSync(path.join(directory, "articles", "draft-a", "index.html")),
    ).toBe(true);
  });

  it("matches slugs with or without a trailing slash and XML entities", () => {
    const directory = fixtureDist();
    writeArticle(directory, "plain");
    writeSitemap(directory, ["/articles/plain"], "https://example.test");
    // 末尾スラッシュ無しの <loc>、エンティティを含む URL も許容する。
    expect(collectUnpublishedArticleDirectories(directory)).toEqual([]);
    expect(
      existsSync(path.join(directory, "articles", "plain", "index.html")),
    ).toBe(true);
  });

  it("ignores directories without index.html and a missing articles root", () => {
    const directory = fixtureDist();
    writeSitemap(directory, ["/articles/live-b/"]);
    mkdirSync(path.join(directory, "articles", "no-index"), {
      recursive: true,
    });

    expect(collectUnpublishedArticleDirectories(directory)).toEqual([]);
    expect(existsSync(path.join(directory, "articles", "no-index"))).toBe(true);

    const empty = fixtureDist();
    writeSitemap(empty, ["/articles/live-b/"]);
    expect(pruneUnpublishedArticles({ distDirectory: empty }).pruned).toEqual(
      [],
    );
  });

  it("fails closed and removes nothing when the sitemap lists no article URLs", () => {
    const directory = fixtureDist();
    writeArticle(directory, "draft-a");
    writeSitemap(directory, ["/", "/about/"]);

    // 記事 URL を1件も列挙しない sitemap は生成不良の可能性が高く、
    // 誤って全記事を消せないよう fail-closed で停止する。
    expect(() =>
      pruneUnpublishedArticles({ distDirectory: directory }),
    ).toThrow(/fail-closed/);
    expect(
      existsSync(path.join(directory, "articles", "draft-a", "index.html")),
    ).toBe(true);
  });
});
