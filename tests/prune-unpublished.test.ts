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
  collectUnpublishedArticleDirectories,
  pruneUnpublishedArticles,
} from "../scripts/prune-unpublished-articles.mjs";

const fixtureDirectories: string[] = [];

function fixtureDist() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-prune-"));
  fixtureDirectories.push(directory);
  return directory;
}

function articlePage(published: boolean) {
  return `<!doctype html>
<html>
<head><meta name="article:published" content="${published}"></head>
<body><h1>Fixture</h1></body>
</html>`;
}

afterEach(() => {
  while (fixtureDirectories.length) {
    rmSync(fixtureDirectories.pop()!, { recursive: true, force: true });
  }
});

describe("prune unpublished articles", () => {
  it("collects draft article directories from the rendered meta", () => {
    const directory = fixtureDist();
    mkdirSync(path.join(directory, "articles", "draft-a"), { recursive: true });
    mkdirSync(path.join(directory, "articles", "live-b"), { recursive: true });
    writeFileSync(
      path.join(directory, "articles", "draft-a", "index.html"),
      articlePage(false),
    );
    writeFileSync(
      path.join(directory, "articles", "live-b", "index.html"),
      articlePage(true),
    );

    expect(
      collectUnpublishedArticleDirectories(directory).map((item) =>
        path.basename(item),
      ),
    ).toEqual(["draft-a"]);
  });

  it("keeps draft pages in preview and removes them in production", () => {
    const directory = fixtureDist();
    mkdirSync(path.join(directory, "articles", "draft-a"), { recursive: true });
    mkdirSync(path.join(directory, "articles", "live-b"), { recursive: true });
    writeFileSync(
      path.join(directory, "articles", "draft-a", "index.html"),
      articlePage(false),
    );
    writeFileSync(
      path.join(directory, "articles", "live-b", "index.html"),
      articlePage(true),
    );

    expect(
      pruneUnpublishedArticles({
        distDirectory: directory,
        deploymentEnv: "preview",
      }).pruned,
    ).toEqual([]);
    expect(
      existsSync(path.join(directory, "articles", "draft-a", "index.html")),
    ).toBe(true);

    expect(
      pruneUnpublishedArticles({
        distDirectory: directory,
        deploymentEnv: "production",
      }).pruned.map((item) => path.basename(item)),
    ).toEqual(["draft-a"]);
    expect(existsSync(path.join(directory, "articles", "draft-a"))).toBe(false);
    expect(
      existsSync(path.join(directory, "articles", "live-b", "index.html")),
    ).toBe(true);
  });

  it("ignores pages without a published meta (treated as published)", () => {
    const directory = fixtureDist();
    mkdirSync(path.join(directory, "articles", "plain"), { recursive: true });
    writeFileSync(
      path.join(directory, "articles", "plain", "index.html"),
      "<!doctype html><html><body><h1>Plain</h1></body></html>",
    );

    expect(collectUnpublishedArticleDirectories(directory)).toEqual([]);
    expect(
      pruneUnpublishedArticles({
        distDirectory: directory,
        deploymentEnv: "production",
      }).pruned,
    ).toEqual([]);
    expect(
      existsSync(path.join(directory, "articles", "plain", "index.html")),
    ).toBe(true);
  });
});
