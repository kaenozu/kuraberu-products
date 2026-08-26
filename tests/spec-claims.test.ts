import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Read all individual article source files (post-split structure). */
function readAllArticleSources(): string {
  const dir = "src/content/articles";
  const exclude = new Set(["index.ts", "commercial.ts", "types.ts", "manual-seeds.ts"]);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !exclude.has(f))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}
import { format } from "prettier";
import {
  DEFAULT_THRESHOLD_DAYS,
  SCHEMA_VERSION,
  addMissingEntries,
  checkCoverage,
  collectArticleClaims,
  computeFingerprint,
  daysSince,
  emptyManifest,
  extractOfficialUrls,
  extractSpecClaims,
  findStaleEntries,
  loadManifest,
  serializeManifest,
  updateEntry,
} from "../scripts/spec-claims.mjs";
import { parseArticles } from "../scripts/generate-x-announcements.mjs";

interface ManifestEntry {
  articleId: string;
  checkedAt: string;
  claimsFingerprint: string;
  officialUrls?: string[];
  note?: string;
}

const articleFixture = `
<article>
  <h1>テスト記事</h1>
  <p>本体寸法は幅約25.5×奥行き約32×高さ約17.5cm、製品重量は約540gです。</p>
  <p>タンク容量は約3.2L、定格消費電力は1,300W、運転音は約48dBです。</p>
  <p>木造11畳まで対応します。保温効力は68℃以上です。</p>
  <p>表示価格は3,080円（税込）です。口径は約4.0cm、カラー数は12色です。</p>
  <p>スチーム量は通常平均13g/分です。カップ1杯約60秒、満水約4分で沸とうします。</p>
  <p>対象身長は40〜105cmです。耐荷重は5kgです。</p>
</article>
`;

const officialUrlFixture = `
const smartPottyOfficialProductUrl = 'https://www.babybjorn.jp/products/bathroom/smart-potty/';
const pottyChairOfficialProductUrl = "https://www.babybjorn.jp/products/bathroom/potty-chair/";
const storeUrl = 'https://item.rakuten.co.jp/example/123/';
`;

describe("extractSpecClaims", () => {
  it("finds dimensions, weight, capacity, power, noise, tatami and efficiency claims", () => {
    const claims = extractSpecClaims(articleFixture);
    expect(claims).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/25\.5×奥行き約32×高さ約17\.5cm/),
        expect.stringMatching(/約540g/),
        expect.stringMatching(/約3\.2L/),
        expect.stringMatching(/1,300W/),
        expect.stringMatching(/48dB/),
        expect.stringMatching(/11畳/),
        expect.stringMatching(/68℃/),
      ]),
    );
  });

  it("finds price, mouth diameter, colors, steam, boiling time, usage height and load capacity claims", () => {
    const claims = extractSpecClaims(articleFixture);
    expect(claims).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/3,080円/),
        expect.stringMatching(/口径は約4\.0cm/),
        expect.stringMatching(/カラー数は12色/),
        expect.stringMatching(/13g/),
        expect.stringMatching(/カップ1杯約60秒/),
        expect.stringMatching(/満水約4分/),
        expect.stringMatching(/40〜105cm/),
        expect.stringMatching(/耐荷重は5kg/),
      ]),
    );
  });

  it("does not treat bare price digits without a price label as a claim", () => {
    const claims = extractSpecClaims(
      "<p>お届け予定は3日後、3,080円の商品です。</p>",
    );
    expect(claims.some((claim) => claim.includes("円"))).toBe(false);
  });

  it("returns an empty list when no spec claim exists", () => {
    expect(extractSpecClaims("<p>使い心地についての感想です。</p>")).toEqual(
      [],
    );
  });

  it("deduplicates repeated claims", () => {
    const source = `<p>重量は約540g。</p><p>もう一度、重量は約540g。</p>`;
    const claims = extractSpecClaims(source);
    expect(claims.filter((claim) => claim.includes("540g"))).toHaveLength(1);
  });
});

describe("extractOfficialUrls", () => {
  it("finds URLs assigned to official-flavored identifiers", () => {
    const urls = extractOfficialUrls(officialUrlFixture);
    expect(urls).toEqual([
      "https://www.babybjorn.jp/products/bathroom/potty-chair/",
      "https://www.babybjorn.jp/products/bathroom/smart-potty/",
    ]);
  });

  it("ignores non-official URL constants", () => {
    const urls = extractOfficialUrls(officialUrlFixture);
    expect(urls.some((url) => url.includes("item.rakuten.co.jp"))).toBe(false);
  });
});

describe("computeFingerprint", () => {
  it("is deterministic for the same input", () => {
    const claims = ["約540g", "25.5×32×17.5cm"];
    const urls = ["https://example.com/a"];
    expect(computeFingerprint(claims, urls)).toBe(
      computeFingerprint(claims, urls),
    );
  });

  it("changes when a claim changes", () => {
    const urls = ["https://example.com/a"];
    const before = computeFingerprint(["約540g"], urls);
    const after = computeFingerprint(["約520g"], urls);
    expect(after).not.toBe(before);
  });

  it("changes when the official source changes", () => {
    const claims = ["約540g"];
    const before = computeFingerprint(claims, ["https://example.com/a"]);
    const after = computeFingerprint(claims, ["https://example.com/b"]);
    expect(after).not.toBe(before);
  });
});

describe("daysSince / findStaleEntries", () => {
  it("computes the days between two ISO dates", () => {
    expect(daysSince("2026-08-01", "2026-08-16")).toBe(15);
    expect(daysSince("2026-08-16", "2026-08-16")).toBe(0);
  });

  it("flags entries older than the threshold", () => {
    const entries: ManifestEntry[] = [
      { articleId: "a", checkedAt: "2026-01-01", claimsFingerprint: "x" },
      { articleId: "b", checkedAt: "2026-08-10", claimsFingerprint: "x" },
    ];
    const stale = findStaleEntries(entries, "2026-08-16", 180);
    expect(stale.map((entry: ManifestEntry) => entry.articleId)).toEqual(["a"]);
  });

  it("uses the default 180-day threshold", () => {
    expect(DEFAULT_THRESHOLD_DAYS).toBe(180);
  });

  it("rejects a non-positive threshold", () => {
    expect(() => findStaleEntries([], "2026-08-16", 0)).toThrow();
  });
});

describe("collectArticleClaims", () => {
  it("includes product-master specs when the article references a product record", () => {
    const { claims, officialUrls } = collectArticleClaims(
      "thermos-tiger-bottle",
    );
    expect(claims).toEqual(
      expect.arrayContaining(["約0.2kg", "約0.26kg", "6.5×8.0×22.0cm"]),
    );
    expect(officialUrls).toEqual(
      expect.arrayContaining([
        "https://www.thermos.jp/product/series/jnl-s00.html",
      ]),
    );
  });

  it("does not fold in product-master specs when the article only uses articlePurchaseLinks", () => {
    const { claims } = collectArticleClaims("moony-m");
    expect(claims.some((claim) => claim.includes("約0.2kg"))).toBe(false);
  });
});

describe("checkCoverage", () => {
  it("passes for the real repository with the current manifest", () => {
    const articles = parseArticles(readAllArticleSources());
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    expect(checkCoverage(articles, manifest)).toEqual([]);
  });

  it("reports a manifest whose schemaVersion differs from SCHEMA_VERSION", () => {
    const articles = parseArticles(readAllArticleSources());
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    expect(SCHEMA_VERSION).toBe(1);
    expect(
      checkCoverage(articles, { ...manifest, schemaVersion: 99 }).some(
        (issue) => issue.includes("schemaVersion"),
      ),
    ).toBe(true);
  });

  it("reports spec-bearing articles without a manifest entry", () => {
    const articles = parseArticles(readAllArticleSources());
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    const missing = manifest.entries[0].articleId;
    const withoutEntry = {
      ...manifest,
      entries: manifest.entries.filter(
        (entry: ManifestEntry) => entry.articleId !== missing,
      ),
    };
    const issues = checkCoverage(articles, withoutEntry);
    expect(issues.some((issue) => issue.includes(missing))).toBe(true);
  });

  it("reports an entry referencing an unknown article", () => {
    const articles = parseArticles(readAllArticleSources());
    const manifest = {
      ...emptyManifest(),
      entries: [
        {
          articleId: "does-not-exist",
          checkedAt: "2026-08-16",
          claimsFingerprint: "x",
        },
      ],
    };
    const issues = checkCoverage(articles, manifest);
    expect(issues.some((issue) => issue.includes("does-not-exist"))).toBe(true);
  });

  it("reports a fingerprint drift for a known article", () => {
    const articles = parseArticles(readAllArticleSources());
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    const target = manifest.entries[0].articleId;
    const { claims } = collectArticleClaims(target);
    const manifestWithDrift = {
      ...manifest,
      entries: manifest.entries.map((entry: ManifestEntry) =>
        entry.articleId === target
          ? {
              ...entry,
              claimsFingerprint: computeFingerprint(claims, [
                "https://example.com/other",
              ]),
            }
          : entry,
      ),
    };
    const issues = checkCoverage(articles, manifestWithDrift);
    expect(issues.some((issue) => issue.includes(target))).toBe(true);
  });
});

describe("addMissingEntries / updateEntry", () => {
  it("adds entries only for spec-bearing articles without an entry", () => {
    const articles = parseArticles(readAllArticleSources());
    const { manifest, added } = addMissingEntries(
      articles,
      emptyManifest(),
      "2026-08-16",
    );
    expect(added).toBeGreaterThan(0);
    expect(manifest.entries.length).toBe(added);
    for (const entry of manifest.entries) {
      expect(entry.claimsFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(entry.officialUrls.length).toBeGreaterThan(0);
    }
  });

  it("does not duplicate existing entries", () => {
    const articles = parseArticles(readAllArticleSources());
    const first = addMissingEntries(articles, emptyManifest(), "2026-08-16");
    const second = addMissingEntries(articles, first.manifest, "2026-08-16");
    expect(second.added).toBe(0);
    expect(second.manifest.entries.length).toBe(first.manifest.entries.length);
  });

  it("updates the fingerprint and checkedAt of a target entry", () => {
    const articles = parseArticles(readAllArticleSources());
    const seeded = addMissingEntries(articles, emptyManifest(), "2026-08-01");
    const target = seeded.manifest.entries[0];
    const { manifest } = updateEntry(
      seeded.manifest,
      target.articleId,
      "2026-08-16",
    );
    const updated = (manifest.entries as ManifestEntry[]).find(
      (entry: ManifestEntry) => entry.articleId === target.articleId,
    );
    expect(updated?.checkedAt).toBe("2026-08-16");
    expect(updated?.claimsFingerprint).toBe(target.claimsFingerprint);
  });
});

describe("manifest serialization", () => {
  it("keeps the committed manifest prettier-formatted", async () => {
    const raw = readFileSync("data/spec-claims.json", "utf8");
    const formatted = await format(raw, { parser: "json" });
    expect(raw).toBe(formatted);
  });

  it("serializes update/init output in a prettier-stable format", async () => {
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    const serialized = await serializeManifest(manifest);
    const reformatted = await format(serialized, { parser: "json" });
    expect(serialized).toBe(reformatted);
  });
});

describe("real manifest hygiene", () => {
  it("has a valid checkedAt for every entry", () => {
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    for (const entry of manifest.entries) {
      expect(entry.checkedAt, `${entry.articleId}: invalid checkedAt`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(
        entry.claimsFingerprint,
        `${entry.articleId}: missing fingerprint`,
      ).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it("declares at least one official URL for every entry", () => {
    // officialUrls: [] のままにすると出典不明の確認記録になるため禁止する。
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    expect(manifest.entries.length).toBeGreaterThan(0);
    for (const entry of manifest.entries) {
      expect(
        entry.officialUrls?.length ?? 0,
        `${entry.articleId}: officialUrls must not be empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("covers every real spec-bearing article", () => {
    const articles = parseArticles(readAllArticleSources());
    const manifest = loadManifest() as { entries: ManifestEntry[] };
    const covered = new Set(
      manifest.entries.map((entry: ManifestEntry) => entry.articleId),
    );
    for (const article of articles) {
      const { claims } = collectArticleClaims(article.id);
      if (claims.length > 0) {
        expect(
          covered.has(article.id),
          `${article.id}: spec claims without manifest entry`,
        ).toBe(true);
      }
    }
  });
});
