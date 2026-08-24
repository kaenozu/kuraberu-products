import { describe, expect, it } from "vitest";
import {
  ALLOWED_OUTBOUND_HOSTS,
  MAX_REDIRECT_HOPS,
  auditVerifiedCtaDestinations,
  checkArticleSource,
  checkPurchaseLinkConsistency,
  collectVerifiedCtaUrls,
  countPurchaseLinkStatuses,
  extractNextStepHrefs,
  extractPurchaseCardHrefs,
  hostnameOf,
  keyFromRef,
  loadPurchaseLinkStatusesFromSource,
  loadRegistryEntries,
  loadRegistryKeys,
  outboundHostAllowlist,
  resolveFinalUrl,
} from "../scripts/check-purchase-link-consistency.mjs";
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const registry = new Set(["moony-m:left", "moony-m:right"]);

describe("purchase link consistency gate (registry keys)", () => {
  it("extracts registry keys from an ArticleComparisonV2 page in left/right order", () => {
    const source = `<ArticleComparisonV2
  left={{ brand: "A", line: "L", purchaseHref: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ brand: "B", line: "M", purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>`;
    expect(extractNextStepHrefs(source)!.map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  it("extracts keys from a direct NextStepBlock usage", () => {
    const source = `<NextStepBlock
  left={{ label: "A", href: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ label: "B", href: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>`;
    expect(extractNextStepHrefs(source)!.map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  it("extracts PurchaseCard hrefs in document order", () => {
    const source = `
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} name="B" />
`;
    expect(extractPurchaseCardHrefs(source).map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  // fail-closed 契約: purchaseLinkStatus prop（CTA の表示/非表示）は
  // レジストリ参照の抽出と順序検査に影響しない。unverified 記事も
  // href はレジストリ参照を保持したまま、表示だけが pending 文言に置き換わる。
  it("keeps extracting hrefs when PurchaseCards declare purchaseLinkStatus", () => {
    const source = `
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" purchaseLinkStatus="verified" />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} name="B" purchaseLinkStatus={articleMetadata.purchaseLinkStatus} />
`;
    expect(extractPurchaseCardHrefs(source).map(keyFromRef)).toEqual([
      "moony-m:left",
      "moony-m:right",
    ]);
  });

  it("returns null for guide articles without a next-step block", () => {
    const source = `<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" />`;
    expect(extractNextStepHrefs(source)).toBeNull();
  });

  it("loads registry keys from lib/products.ts", () => {
    const directory = mkdtempSync(join(tmpdir(), "purchase-link-gate-"));
    try {
      mkdirSync(join(directory, "lib"), { recursive: true });
      writeFileSync(
        join(directory, "lib", "products.ts"),
        `export const articlePurchaseLinks = {\n  "a:left": { name: "A", purchaseUrl: "https://a.r10.to/x" },\n  "a:right": { name: "B", purchaseUrl: "https://a.r10.to/y" },\n} as const satisfies Record<string, ArticlePurchaseLink>;\n`,
      );
      expect(loadRegistryKeys(directory)).toEqual(
        new Set(["a:left", "a:right"]),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("accepts a page where block keys match article-end PurchaseCards in order", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([]);
  });

  it("rejects a raw https purchase URL instead of a registry reference", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: 'https://a.r10.to/OLD' }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={'https://a.r10.to/OLD'} />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain(
      "must come from the articlePurchaseLinks registry",
    );
    expect(errors[0]).toContain("https://a.r10.to/OLD");
  });

  it("rejects an unknown registry key", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['moony-m:leff'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['moony-m:leff'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([
      'pages/articles/sample/index.astro: articlePurchaseLinks has no entry for "moony-m:leff"',
    ]);
  });

  it("flags an order swap between block and article-end cards", () => {
    const source = `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['moony-m:left'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['moony-m:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['moony-m:right'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("#1");
    expect(errors[1]).toContain("#2");
  });

  it("accepts a single-card guide using a registry reference", () => {
    const source = `<PurchaseCard href={articlePurchaseLinks['moony-m:left'].purchaseUrl} name="A" />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/sample/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([]);
  });

  it("skips the commercial template (dynamic API resolution)", () => {
    const source = `<CommercialArticlePage articleId="x" />
<PurchaseCard href={leftSearch} />`;
    const errors: string[] = [];
    checkArticleSource(
      source,
      "pages/articles/x/index.astro",
      errors,
      registry,
    );
    expect(errors).toEqual([]);
  });

  it("reports a missing registry when running the full check", () => {
    const directory = mkdtempSync(join(tmpdir(), "purchase-link-gate-full-"));
    try {
      mkdirSync(join(directory, "pages", "articles"), { recursive: true });
      const errors = checkPurchaseLinkConsistency({ srcDirectory: directory });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(" ")).toContain("products.ts");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  // fail-closed 契約の監査用集計。verified / unverified / unavailable の
  // 3値のみを扱い、未分類のステータス文字列を黙って無視しないことを確認する。
  it("keeps NextStepBlock purchase CTA fail-closed when status is omitted", () => {
    const source = readFileSync("src/components/NextStepBlock.astro", "utf8");
    expect(source).toContain(
      'purchaseLinkStatus: "verified" | "unverified" | "unavailable"',
    );
    expect(source).toContain("purchaseLinkStatus === 'verified' && leftHref");
    expect(source).toContain("purchaseLinkStatus === 'verified' && rightHref");
    expect(source).not.toContain("purchaseLinkStatus !== 'unverified'");
    expect(source).not.toContain("purchaseLinkStatus !== 'unavailable'");
  });

  it("audits purchaseLinkStatus values from the article metadata", () => {
    const counts = countPurchaseLinkStatuses();
    expect(Object.keys(counts).sort()).toEqual([
      "unavailable",
      "unverified",
      "verified",
    ]);
    expect(counts.verified).toBeGreaterThan(0);
    expect(counts.unverified).toBeGreaterThan(0);
    for (const value of Object.values(counts)) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

// Issue #342: verified CTA の最終遷移先検証。
type StubResponse = {
  status: number;
  headers: Map<string, string>;
  url?: string;
};

function stubFetch(
  routes: Record<string, StubResponse>,
  calls: { url: string; init?: RequestInit }[] = [],
) {
  return async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const route = routes[url];
    if (!route) throw new Error(`unexpected request: ${url}`);
    return route;
  };
}

const redirect = (location: string): StubResponse => ({
  status: 302,
  headers: new Map([["location", location]]),
});

describe("verified CTA destination audit (issue #342)", () => {
  it("keeps every registry purchase URL resolvable, including constant references", () => {
    const entries = loadRegistryEntries("src");
    expect(entries.size).toBeGreaterThan(40);
    for (const [key, url] of entries) {
      expect(key).toMatch(/:(left|right|card)$/);
      expect(url).toMatch(/^https:\/\//);
    }
    // 商品定数参照（thermosJnlS500.rakutenUrl 等）も解決できる
    expect(entries.get("thermos-tiger-bottle:left")).toMatch(/^https:\/\//);
    expect(loadRegistryKeys("src").size).toBe(entries.size);
  });

  it("parses id → purchaseLinkStatus pairs from registry source", () => {
    const statuses = loadPurchaseLinkStatusesFixture();
    expect(statuses.get("a")).toBe("verified");
    expect(statuses.get("b")).toBeUndefined();
    expect(statuses.get("c")).toBe("unverified");
  });

  it("collects outbound URLs only from verified articles via registry references", () => {
    const directory = mkdtempSync(join(tmpdir(), "cta-dest-"));
    try {
      writeSrcTree(directory, [
        {
          slug: "sample-vs-other",
          source: `<ArticleComparisonV2
  left={{ purchaseHref: articlePurchaseLinks['sample-vs-other:left'].purchaseUrl }}
  right={{ purchaseHref: articlePurchaseLinks['sample-vs-other:right'].purchaseUrl }}
/>
<PurchaseCard href={articlePurchaseLinks['sample-vs-other:left'].purchaseUrl} />
<PurchaseCard href={articlePurchaseLinks['sample-vs-other:right'].purchaseUrl} />`,
        },
        {
          slug: "draft-vs-other",
          source: `<PurchaseCard href={articlePurchaseLinks['sample-vs-other:left'].purchaseUrl} />`,
        },
      ]);
      const { ctas } = collectVerifiedCtaUrls({ srcDirectory: directory });
      // draft-vs-other は unverified のため除外、重複キーは 1 度だけ
      expect(ctas).toEqual([
        {
          article: "sample-vs-other",
          key: "sample-vs-other:left",
          url: "https://a.r10.to/AAA",
        },
        {
          article: "sample-vs-other",
          key: "sample-vs-other:right",
          url: "https://ext.example.com/go",
        },
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("normalizes hostnames and builds the allowlist from required + registry hosts", () => {
    expect(hostnameOf("https://Example.com./x")).toBe("example.com");
    expect(hostnameOf("not a url")).toBeNull();
    const allowlist = outboundHostAllowlist([
      "https://hb.afl.rakuten.co.jp/hgc/x",
      "https://a.r10.to/abc",
    ]);
    for (const host of ALLOWED_OUTBOUND_HOSTS)
      expect(allowlist.has(host)).toBe(true);
    expect(allowlist.size).toBe(ALLOWED_OUTBOUND_HOSTS.length);
  });

  it("accepts an allowlisted initial host without touching the network", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = stubFetch({}, calls) as unknown as typeof fetch;
    const audit = await auditVerifiedCtaDestinations({
      urls: [{ article: "a", key: "a:left", url: "https://a.r10.to/h58jf3" }],
      allowlist: outboundHostAllowlist(),
      fetchImpl,
    });
    expect(audit.errors).toEqual([]);
    expect(audit.warnings).toEqual([]);
    expect(calls).toHaveLength(0);
    expect(audit.checked[0].result).toBe("allowlisted-initial");
  });

  it("follows redirects up to the hop cap and accepts an allowlisted final host", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = stubFetch(
      {
        "https://promo.example.com/1": redirect("https://mid.example.com/2"),
        "https://mid.example.com/2": redirect("/3"),
        "https://mid.example.com/3": {
          status: 200,
          headers: new Map(),
          url: "https://hb.afl.rakuten.co.jp/landing",
        },
      },
      calls,
    ) as unknown as typeof fetch;
    const audit = await auditVerifiedCtaDestinations({
      urls: [
        { article: "a", key: "a:left", url: "https://promo.example.com/1" },
      ],
      allowlist: outboundHostAllowlist(),
      fetchImpl,
    });
    expect(audit.errors).toEqual([]);
    expect(calls.map((call) => call.init?.method)).toEqual([
      "HEAD",
      "HEAD",
      "HEAD",
    ]);
    expect(audit.checked[0]).toMatchObject({
      result: "resolved",
      finalHost: "hb.afl.rakuten.co.jp",
      hops: 2,
    });
  });

  it("fails closed when the final host is outside the allowlist", async () => {
    const fetchImpl = stubFetch({
      "https://promo.example.com/1": redirect(
        "https://tracker.example.net/buy",
      ),
      "https://tracker.example.net/buy": {
        status: 200,
        headers: new Map(),
      },
    }) as unknown as typeof fetch;
    const audit = await auditVerifiedCtaDestinations({
      urls: [
        { article: "a", key: "a:left", url: "https://promo.example.com/1" },
      ],
      allowlist: outboundHostAllowlist(),
      fetchImpl,
    });
    expect(audit.errors).toHaveLength(1);
    expect(audit.errors[0]).toContain("tracker.example.net");
    expect(audit.errors[0]).toContain("not in the verified CTA allowlist");
  });

  it("rejects chains that exceed the redirect hop cap", async () => {
    let hop = 0;
    const fetchImpl = (async (url: string) =>
      redirect(
        `https://hop${++hop}.example.com/${new URL(url).pathname}`,
      )) as unknown as typeof fetch;
    const audit = await auditVerifiedCtaDestinations({
      urls: [
        { article: "a", key: "a:left", url: "https://loop.example.com/x" },
      ],
      allowlist: outboundHostAllowlist(),
      fetchImpl,
      maxHops: MAX_REDIRECT_HOPS,
    });
    expect(audit.errors).toHaveLength(1);
    expect(audit.errors[0]).toContain("redirect hops");
  });

  it("retries with GET when the server rejects HEAD", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = stubFetch(
      {
        "https://promo.example.com/a": {
          status: 405,
          headers: new Map(),
        },
      },
      calls,
    );
    // GET の結果として非リダイレクトなら、最終ホストは初期ホストのまま → 許可リスト外でエラー
    await resolveFinalUrl("https://promo.example.com/a", { fetchImpl });
    expect(calls.map((call) => call.init?.method)).toEqual(["HEAD", "GET"]);
    // credentials/cookie を送らないこと
    for (const call of calls) {
      expect(call.init?.credentials).toBe("omit");
      expect(new Headers(call.init?.headers).get("cookie")).toBeNull();
    }
  });

  it("treats network errors as fatal by default and warn-only with ALLOW_NETWORK_SKIP", async () => {
    const failing = async () => {
      throw new Error("DNS lookup failed");
    };
    const failingFetchImpl = failing as unknown as typeof fetch;
    const options = {
      urls: [
        { article: "a", key: "a:left", url: "https://down.example.com/x" },
      ],
      allowlist: outboundHostAllowlist(),
      // 構造的に Response 互換のため typeof fetch へ明示キャストする。
      fetchImpl: failing as unknown as typeof fetch,
    };
    const strict = await auditVerifiedCtaDestinations(options);
    expect(strict.errors).toHaveLength(1);
    expect(strict.errors[0]).toContain("could not verify final destination");
    expect(strict.warnings).toEqual([]);

    const skipped = await auditVerifiedCtaDestinations({
      ...options,
      allowNetworkSkip: true,
    });
    expect(skipped.errors).toEqual([]);
    expect(skipped.warnings).toHaveLength(1);
    expect(skipped.warnings[0]).toContain("ALLOW_NETWORK_SKIP=1");
    expect(skipped.warnings[0]).toContain("DNS lookup failed");
  });

  it("reports unparseable CTA URLs as errors", async () => {
    const audit = await auditVerifiedCtaDestinations({
      urls: [{ article: "a", key: "a:left", url: "::broken::" }],
      allowlist: outboundHostAllowlist(),
      fetchImpl: stubFetch({}) as unknown as typeof fetch,
    });
    expect(audit.errors).toHaveLength(1);
    expect(audit.errors[0]).toContain("unparseable URL");
  });

  it("resolves relative Location headers against the current URL", async () => {
    const result = await resolveFinalUrl("https://promo.example.com/deep/x", {
      fetchImpl: stubFetch({
        "https://promo.example.com/deep/x": redirect("../final?a=1"),
        "https://promo.example.com/final?a=1": {
          status: 200,
          headers: new Map(),
        },
      }),
    });
    expect(result.finalUrl).toBe("https://promo.example.com/final?a=1");
    expect(result.hops).toBe(1);
  });
});

function loadPurchaseLinkStatusesFixture() {
  // loadArticleStatuses のコア（ソース解析部）を fixture で検証する
  return loadPurchaseLinkStatusesFromSource(
    `
export const a = defineArticleMetadata({
  id: "a",
  purchaseLinkStatus: "verified",
});
export const c = defineArticleMetadata({
  id: "c",
  purchaseLinkStatus: "unverified",
});
`,
    new Map<string, string>(),
  );
}

function writeSrcTree(
  directory: string,
  articles: { slug: string; source: string }[],
) {
  mkdirSync(join(directory, "lib"), { recursive: true });
  mkdirSync(join(directory, "content"), { recursive: true });
  mkdirSync(join(directory, "pages", "articles"), { recursive: true });
  writeFileSync(
    join(directory, "lib", "products.ts"),
    `export interface ArticlePurchaseLink {\n  name: string;\n  purchaseUrl: string;\n}\nexport const sampleProduct: Product = {\n  rakutenUrl: "https://a.r10.to/AAA",\n};\nexport const articlePurchaseLinks = {\n  "sample-vs-other:left": { name: "A", purchaseUrl: sampleProduct.rakutenUrl },\n  "sample-vs-other:right": { name: "B", purchaseUrl: "https://ext.example.com/go" },\n} as const satisfies Record<string, ArticlePurchaseLink>;\n`,
  );
  writeFileSync(
    join(directory, "content", "articles.ts"),
    `export const sampleVsOther = defineArticleMetadata({\n  id: "sample-vs-other",\n  purchaseLinkStatus: "verified",\n});\nexport const draft = defineArticleMetadata({\n  id: "draft-vs-other",\n  purchaseLinkStatus: "unverified",\n});\n`,
  );
  for (const { slug, source } of articles) {
    mkdirSync(join(directory, "pages", "articles", slug), { recursive: true });
    writeFileSync(
      join(directory, "pages", "articles", slug, "index.astro"),
      source,
    );
  }
}
