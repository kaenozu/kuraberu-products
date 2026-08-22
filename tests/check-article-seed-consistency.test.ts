import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkArticleSeedConsistency,
  collectArticleSeeds,
  collectPageSlugs,
  collectStubSlugs,
  findSeedInconsistencies,
} from "../scripts/check-article-seed-consistency.mjs";

const fixtureRoots: string[] = [];

function fixtureRoot(): string {
  const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-seed-gate-"));
  fixtureRoots.push(directory);
  return directory;
}

afterEach(() => {
  while (fixtureRoots.length) {
    rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
  }
});

function writeSeedMonolith(root: string, body = ""): void {
  mkdirSync(path.join(root, "src", "content"), { recursive: true });
  writeFileSync(path.join(root, "src", "content", "articles.ts"), body);
}

function writeDirectorySeed(root: string, name: string, body: string): void {
  mkdirSync(path.join(root, "src", "content", "articles"), { recursive: true });
  writeFileSync(path.join(root, "src", "content", "articles", name), body);
}

const commercialSeedsBody = (ids: { id: string; checked: boolean }[]) =>
  `type CommercialArticleSeed = { id: string };\n` +
  `export const additionalCommercialArticles = [];\n` +
  `const commercialArticleSeeds: readonly CommercialArticleSeed[] = [\n` +
  ids
    .map(
      ({ id, checked }) =>
        `  {\n    id: "${id}",\n${
          checked ? `    productInfoCheckedAt: "2026-08-01",\n` : ""
        }  },\n`,
    )
    .join("") +
  `];\n`;

function writePage(root: string, slug: string): void {
  mkdirSync(path.join(root, "src", "pages", "articles", slug), {
    recursive: true,
  });
  writeFileSync(
    path.join(root, "src", "pages", "articles", slug, "index.astro"),
    "---\n---\n",
  );
}

function writeStub(root: string, slug: string): void {
  mkdirSync(path.join(root, "functions", "articles"), { recursive: true });
  writeFileSync(
    path.join(root, "functions", "articles", `${slug}.ts`),
    "export const onRequest = () => new Response(null, { status: 404 });",
  );
}

describe("collectArticleSeeds", () => {
  it("derives slugs from path metadata, not file names", () => {
    const root = fixtureRoot();
    writeSeedMonolith(
      root,
      `export const cradleArticle = defineArticleMetadata({\n  id: "cradle",\n  path: "/articles/babybjorn-cradle/",\n});`,
    );

    const seeds = collectArticleSeeds({ root });
    expect([...seeds.keys()]).toEqual(["babybjorn-cradle"]);
    expect(seeds.get("babybjorn-cradle")).toMatchObject({
      isPublic: true,
    });
  });

  it("ignores template-literal paths and non-article paths", () => {
    const root = fixtureRoot();
    writeSeedMonolith(
      root,
      [
        `const a = { path: \`/articles/\${seed.id}/\` };`,
        `const b = { path: "/products/foo/" };`,
        `export const ok = { path: "/articles/manual-one/" };`,
      ].join("\n"),
    );

    expect([...collectArticleSeeds({ root }).keys()]).toEqual(["manual-one"]);
  });

  it("treats manual directory seeds as public", () => {
    const root = fixtureRoot();
    writeDirectorySeed(
      root,
      "pampers-newborn.ts",
      `export const pampersNewbornArticle = defineArticleMetadata({\n  path: "/articles/pampers-newborn/",\n});`,
    );

    const seeds = collectArticleSeeds({ root });
    expect(seeds.get("pampers-newborn")?.isPublic).toBe(true);
    expect(seeds.get("pampers-newborn")?.sources).toEqual([
      "src/content/articles/pampers-newborn.ts",
    ]);
  });

  it("marks commercial seeds public only when productInfoCheckedAt is present", () => {
    const root = fixtureRoot();
    writeDirectorySeed(
      root,
      "commercial.ts",
      commercialSeedsBody([
        { id: "checked-commercial", checked: true },
        { id: "unchecked-commercial", checked: false },
      ]),
    );

    const seeds = collectArticleSeeds({ root });
    expect(seeds.get("checked-commercial")?.isPublic).toBe(true);
    expect(seeds.get("unchecked-commercial")?.isPublic).toBe(false);
  });

  it("unions slugs across the monolith and the directory registry", () => {
    const root = fixtureRoot();
    // 両系統に同名 seed がある場合は sources が統合され、公開扱いも統合される。
    writeSeedMonolith(
      root,
      `export const shared = { path: "/articles/shared-slug/" };\nexport const onlyMonolith = { path: "/articles/monolith-only/" };`,
    );
    writeDirectorySeed(
      root,
      "extra.ts",
      `export const extra = { path: "/articles/dir-only/" };`,
    );
    writeDirectorySeed(
      root,
      "shared.ts",
      `export const shared = { path: "/articles/shared-slug/" };`,
    );

    const seeds = collectArticleSeeds({ root });
    expect([...seeds.keys()].sort()).toEqual([
      "dir-only",
      "monolith-only",
      "shared-slug",
    ]);
    expect(seeds.get("shared-slug")?.sources).toHaveLength(2);
  });
});

describe("findSeedInconsistencies", () => {
  it("reports a public seed without a page (rule A)", () => {
    const violations = findSeedInconsistencies({
      seeds: new Map([
        ["published-a", { sources: ["seed"], isPublic: true }],
        ["draft-b", { sources: ["seed"], isPublic: false }],
      ]),
      pageSlugs: [],
      stubSlugs: [],
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("/articles/published-a/");
    expect(violations[0]).toContain(
      "src/pages/articles/published-a/index.astro",
    );
    expect(violations[0]).not.toContain("draft-b");
  });

  it("reports stale stubs whose seed metadata is gone (rule B)", () => {
    const violations = findSeedInconsistencies({
      seeds: new Map([["live", { sources: ["seed"], isPublic: true }]]),
      pageSlugs: ["live"],
      stubSlugs: ["removed-long-ago"],
    });

    expect(violations).toEqual([
      expect.stringContaining("functions/articles/removed-long-ago.ts"),
    ]);
    expect(violations[0]).toContain("/articles/removed-long-ago/");
  });

  it("accepts a stub for an unpublished seed without a page", () => {
    const violations = findSeedInconsistencies({
      seeds: new Map([
        ["live", { sources: ["seed"], isPublic: true }],
        ["unpublished", { sources: ["seed"], isPublic: false }],
      ]),
      pageSlugs: ["live"],
      stubSlugs: ["unpublished"],
    });

    expect(violations).toEqual([]);
  });

  it("reports a dead stub that shadows an existing page (rule C)", () => {
    const violations = findSeedInconsistencies({
      seeds: new Map([["live", { sources: ["seed"], isPublic: true }]]),
      pageSlugs: ["live"],
      stubSlugs: ["live"],
    });

    expect(violations).toEqual([
      expect.stringContaining("functions/articles/live.ts"),
    ]);
    expect(violations[0]).toContain("src/pages/articles/live/index.astro");
  });

  it("reports orphan pages without any seed metadata (rule D)", () => {
    const violations = findSeedInconsistencies({
      seeds: new Map(),
      pageSlugs: ["orphan-page"],
      stubSlugs: [],
    });

    expect(violations).toEqual([
      expect.stringContaining("src/pages/articles/orphan-page/index.astro"),
    ]);
  });
});

describe("checkArticleSeedConsistency (fixture integration)", () => {
  it("passes when every public seed has a page and stubs are clean", () => {
    const root = fixtureRoot();
    writeSeedMonolith(
      root,
      `export const a = { path: "/articles/published-a/" };`,
    );
    writeDirectorySeed(
      root,
      "commercial.ts",
      commercialSeedsBody([{ id: "unpublished-stubbed", checked: false }]),
    );
    writePage(root, "published-a");

    const result = checkArticleSeedConsistency({ root });
    expect(result.violations).toEqual([]);
    expect(collectPageSlugs(root)).toEqual(["published-a"]);
    expect(collectStubSlugs(root)).toEqual([]);
  });

  it("fails with concrete file names for each direction of inconsistency", () => {
    const root = fixtureRoot();
    // 公開 seed（ページ無し）+ 孤児ページ + スタブ残置。
    writeSeedMonolith(
      root,
      `export const a = { path: "/articles/pageless-public/" };`,
    );
    writeDirectorySeed(
      root,
      "orphan.ts",
      `export const o = { path: "/articles/orphaned-seed/" };`,
    );
    writeStub(root, "ghost-seed");
    writePage(root, "orphaned-seed");
    writePage(root, "no-metadata-at-all");

    const result = checkArticleSeedConsistency({ root });
    expect(result.violations).toHaveLength(3);
    const joined = result.violations.join("\n");
    expect(joined).toContain("src/pages/articles/pageless-public/index.astro");
    expect(joined).toContain("functions/articles/ghost-seed.ts");
    expect(joined).toContain(
      "src/pages/articles/no-metadata-at-all/index.astro",
    );
    // seed とページが両方ある orphaned-seed は違反にならない。
    expect(joined).not.toContain("/articles/orphaned-seed/");
  });

  it("returns empty results for an empty fixture", () => {
    const root = fixtureRoot();
    const result = checkArticleSeedConsistency({ root });
    expect(result.seeds.size).toBe(0);
    expect(result.pageSlugs).toEqual([]);
    expect(result.stubSlugs).toEqual([]);
    expect(result.violations).toEqual([]);
  });
});
