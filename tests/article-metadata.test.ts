import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateSourceToggle } from "../scripts/check-rendered-html.mjs";
import {
  articleMetadata,
  publicArticleMetadata,
  babybjornArticle,
  babybjornBouncerArticle,
  babybjornOnekaiArticle,
  cradleArticle,
  combiTheSArticle,
  tigerRiceArticle,
  tigerPctA120VsPctA150Article,
  zojirushiCoffeeArticle,
  panasonicVacuumArticle,
  panasonicHairDryerArticle,
  defineArticleMetadata,
  merriesNewbornArticle,
  merriesPantsArticle,
  moonyMArticle,
  pampersNewbornArticle,
  panasonicBabyMonitorArticle,
  panasonicEhNa9mGuideArticle,
  pigeonBottle240Article,
  pigeonSlim240Article,
  thermosTigerBottleArticle,
  tefalKettleArticle,
  pigeonBottleSizeArticle,
  pottyArticle,
  shupotArticle,
  sharpKcS50VsFuS50Article,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  yamajitsuBathStoolArticle,
  yamazakiFreeBroomArticle,
  yamazakiDustWagonArticle,
  zojirushiElectricKettleArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicNeFl1aVsNeFl1cArticle,
  panasonicAirCleanerArticle,
  thermosKfm020VsKfi020Article,
  tigerMtaJ050GuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  tigerKettlePcjVsPcmArticle,
  additionalCommercialArticles,
} from "../src/content/articles";

function extractJsonLd(html: string): Record<string, unknown>[] {
  return [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1] ?? "{}") as Record<string, unknown>);
}

describe("article metadata", () => {
  it("includes verified commercial articles in public discovery surfaces", () => {
    expect(publicArticleMetadata).toHaveLength(70);
    const newlyPublishedIds = [
      "roborock-qrevo-curv-vs-dreame-x50",
      "makita-cl107-vs-cl286",
      "iris-airfryer-fvx-d3-vs-tefal-ey201",
      "recolte-automatic-cooker-vs-panasonic-nf-pc400",
      "brita-marella-vs-zero-water",
      "tiger-jpv-l100-vs-zojirushi-nw-fc10",
      "sharp-kc-s50-vs-panasonic-f-vxw55",
      "anker-soundcore-liberty-4-nc-vs-sony-wf-c710n",
      "xiaomi-redmi-watch-5-vs-huawei-band-10",
      "panasonic-eh-na9m-vs-refa-beautech",
      "panasonic-f-px60c-vs-f-px70c",
    ];
    for (const id of newlyPublishedIds) {
      expect(publicArticleMetadata.some((article) => article.id === id)).toBe(
        true,
      );
    }
    expect(
      publicArticleMetadata.some(
        (article) => article.id === "thermos-tiger-bottle",
      ),
    ).toBe(true);
  });

  it("keeps the article page directories synchronized with the canonical master", () => {
    const articlesDir = join(process.cwd(), "src/pages/articles");
    const pagePaths = readdirSync(articlesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) =>
        readdirSync(join(articlesDir, entry.name)).includes("index.astro"),
      )
      .map((entry) => `/articles/${entry.name}/`)
      .sort();
    const metadataPaths = articleMetadata.map((article) => article.path).sort();

    expect(pagePaths).toEqual(metadataPaths);
  });

  it("uses the canonical master for the article index, memo page, and sitemap", () => {
    const articleIndex = readFileSync("src/pages/articles/index.astro", "utf8");
    const memoPage = readFileSync("src/pages/memo.astro", "utf8");
    const sitemap = readFileSync("src/pages/sitemap.xml.ts", "utf8");

    expect(articleIndex).toContain("publicArticleMetadata");
    expect(memoPage).toContain("publicArticleMetadata");
    expect(sitemap).toContain(
      "...publicArticleMetadata.map((article) => article.path)",
    );
    expect(articleIndex).not.toContain("thermos-tiger-bottle");
    expect(memoPage).not.toContain("thermos-tiger-bottle");
    expect(sitemap).not.toContain("thermos-tiger-bottle");
  });

  it("keeps the saved water-bottle article renderable in the memo page", () => {
    const memoPage = readFileSync("src/pages/memo.astro", "utf8");
    const waterBottle = articleMetadata.find(
      (article) => article.id === "thermos-tiger-bottle",
    );

    expect(waterBottle).toBeDefined();
    expect(memoPage).toContain("{publicArticleMetadata.map((article) => (");
    expect(memoPage).toContain(
      "data-memo-template data-article-id={article.id}",
    );
    expect(memoPage).toContain(
      "sanitizeComparisonMemo(localStorage.getItem(comparisonMemoStorageKey), knownIds)",
    );
    expect(articleMetadata.map((article) => article.path)).toContain(
      waterBottle!.path,
    );
  });

  it("keeps one typed canonical source for article listings and pages", () => {
    expect(articleMetadata).toEqual([
      pampersNewbornArticle,
      merriesNewbornArticle,
      merriesPantsArticle,
      pigeonBottle240Article,
      pigeonSlim240Article,
      moonyMArticle,
      shupotArticle,
      babybjornArticle,
      babybjornOnekaiArticle,
      babybjornBouncerArticle,
      cradleArticle,
      pottyArticle,
      pigeonBottleSizeArticle,
      combiTheSArticle,
      tigerRiceArticle,
      tigerPctA120VsPctA150Article,
      zojirushiCoffeeArticle,
      panasonicVacuumArticle,
      panasonicHairDryerArticle,
      tefalKettleArticle,
      panasonicNeFl1aVsNeFl1cArticle,
      panasonicAirCleanerArticle,
      sharpKcS50VsFuS50Article,
      thermosTigerBottleArticle,
      yamazakiTowerDeskPanelArticle,
      yamazakiCondorWagonArticle,
      yamajitsuBathStoolArticle,
      yamazakiFreeBroomArticle,
      yamazakiDustWagonArticle,
      zojirushiElectricKettleArticle,
      tefalGarmentSteamerArticle,
      kingjimTepraArticle,
      panasonicFyhvx120VsFyhvx90Article,
      panasonicBabyMonitorArticle,
      panasonicEhNa9mGuideArticle,
      thermosKfm020VsKfi020Article,
      tigerMtaJ050GuideArticle,
      panasonicEhNa9mVsEhNa7mArticle,
      tigerKettlePcjVsPcmArticle,
      ...additionalCommercialArticles,
    ]);
    expect(pampersNewbornArticle.path).toBe("/articles/pampers-newborn/");
    expect(
      pampersNewbornArticle.modifiedAt >= pampersNewbornArticle.publishedAt,
    ).toBe(true);
    expect(merriesNewbornArticle.path).toBe("/articles/merries-newborn/");
    expect(
      merriesNewbornArticle.modifiedAt >= merriesNewbornArticle.publishedAt,
    ).toBe(true);
    expect(pigeonBottle240Article.path).toBe("/articles/pigeon-bottle-240/");
    expect(
      pigeonBottle240Article.modifiedAt >= pigeonBottle240Article.publishedAt,
    ).toBe(true);
    expect(pigeonSlim240Article.path).toBe("/articles/pigeon-slim-240/");
    expect(
      pigeonSlim240Article.modifiedAt >= pigeonSlim240Article.publishedAt,
    ).toBe(true);
  });

  it("requires every article to declare a positive product count", () => {
    for (const article of articleMetadata) {
      expect(
        Number.isInteger(article.productCount) && article.productCount >= 1,
      ).toBe(true);
    }
    // 比較記事は productCount: 2、単一商品記事（商品ガイド）は productCount: 1。
    expect(
      articleMetadata.filter((article) => article.productCount === 2),
    ).toHaveLength(82);
    expect(
      articleMetadata.filter((article) => article.productCount === 1),
    ).toEqual([panasonicBabyMonitorArticle, panasonicEhNa9mGuideArticle]);
  });

  it("declares aboutProductNames matching productCount for JSON-LD", () => {
    // 商品ガイドは単一商品名を必須で宣言する
    expect(panasonicBabyMonitorArticle.aboutProductNames).toEqual([
      "パナソニック ベビーモニター KX-HC705",
    ]);
    expect(panasonicEhNa9mGuideArticle.aboutProductNames).toEqual([
      "パナソニック ナノケア EH-NA9M",
    ]);
    // 全記事で宣言がある場合は productCount と一致する
    for (const article of articleMetadata) {
      if (!article.aboutProductNames) continue;
      expect(article.aboutProductNames.length).toBe(article.productCount);
    }
    // 比較記事（商用シード）は leftProduct / rightProduct から導出される
    const commercial = articleMetadata.find(
      (article) => article.id === "roborock-qrevo-curv-vs-dreame-x50",
    );
    expect(commercial?.aboutProductNames).toEqual([
      "Roborock Qrevo Curv",
      "Dreame X50 Ultra",
    ]);
  });

  it("rejects aboutProductNames that do not match productCount", () => {
    expect(() =>
      defineArticleMetadata({
        ...panasonicBabyMonitorArticle,
        aboutProductNames: ["商品A", "商品B"],
      }),
    ).toThrow("aboutProductNames must have exactly 1 non-empty entries");
    expect(() =>
      defineArticleMetadata({
        ...panasonicBabyMonitorArticle,
        aboutProductNames: undefined,
      }),
    ).toThrow(
      "aboutProductNames must be declared for single-product (guide) articles",
    );
  });

  it("rejects invalid product counts", () => {
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        productCount: 0,
      }),
    ).toThrow("productCount must be a positive integer");
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        productCount: 1.5,
      }),
    ).toThrow("productCount must be a positive integer");
  });

  it("rejects invalid and contradictory dates", () => {
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        publishedAt: "2026-02-30",
      }),
    ).toThrow();
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        publishedAt: "2026-08-01",
        modifiedAt: "2026-07-31",
      }),
    ).toThrow();
  });

  it("renders dates consistently in HTML, meta and Article JSON-LD", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    const article = extractJsonLd(html).find(
      (item) => item["@type"] === "Article",
    );

    expect(article).toBeDefined();
    expect(article?.headline).toBe(pampersNewbornArticle.headline);
    expect(article?.datePublished).toBe(pampersNewbornArticle.publishedAt);
    expect(article?.dateModified).toBe(pampersNewbornArticle.modifiedAt);
    expect(article?.url).toBe(article?.mainEntityOfPage);
    expect(article?.image).toBe(
      new URL(
        pampersNewbornArticle.imagePath!,
        "https://kuraberu-products.pages.dev/",
      ).toString(),
    );
    expect(html).toContain(
      `<meta property="article:published_time" content="${pampersNewbornArticle.publishedAt}">`,
    );
    expect(html).toContain(
      `<meta property="article:modified_time" content="${pampersNewbornArticle.modifiedAt}">`,
    );
    expect(html).toContain(`datetime="${pampersNewbornArticle.publishedAt}"`);
    expect(html).toContain(`datetime="${pampersNewbornArticle.modifiedAt}"`);
  });

  it("renders the product count meta for article pages", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    expect(html).toContain(
      `<meta name="article:product-count" content="${pampersNewbornArticle.productCount}">`,
    );
  });

  it("renders no mid-cta meta (midArticleCta path removed 2026-08-18)", () => {
    // v3 短縮後、途中 CTA（after-decision）は長文記事のみ許容だったが、
    // 宣言する記事がゼロのまま 2026-08-18 に経路ごと削除された。
    // 将来も mid-cta meta が出力されないことを代表記事で確認する。
    const pampersHtml = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    expect(pampersHtml).not.toContain('name="article:mid-cta"');
  });

  it("renders the single-product count for the single-product check article", () => {
    const html = readFileSync(
      "dist/articles/panasonic-baby-monitor-kx-hc705/index.html",
      "utf8",
    );
    expect(html).toContain(`<meta name="article:product-count" content="1">`);
    expect(panasonicBabyMonitorArticle.productCount).toBe(1);
  });

  it("marks the single-product article as a guide without a comparison section", () => {
    const html = readFileSync(
      "dist/articles/panasonic-baby-monitor-kx-hc705/index.html",
      "utf8",
    );
    expect(html).toContain(
      `<meta name="article:content-type" content="guide">`,
    );
    // 商品ガイドは比較セクション（ArticleComparisonV2）を持たない
    expect(html).not.toContain("article-comparison-v2");
    // 記事の meta 行にコンテンツタイプが表示される
    expect(html).toContain("商品ガイド");
    // 内部メモ（サンプル）と v3 で廃止した表示が残っていない
    expect(html).not.toContain("サンプル");
    expect(html).not.toContain("verification-summary");
  });

  it("marks a two-product article as a comparison with a comparison section", () => {
    const html = readFileSync(
      "dist/articles/zojirushi-ck-pa08-vs-ck-dc08/index.html",
      "utf8",
    );
    expect(html).toContain(
      `<meta name="article:content-type" content="comparison">`,
    );
    expect(html).toContain("article-comparison-v2");
  });

  it("keeps ordinary pages as WebPage without article dates", () => {
    const html = readFileSync("dist/about/index.html", "utf8");
    const data = extractJsonLd(html);
    expect(data.some((item) => item["@type"] === "WebPage")).toBe(true);
    expect(html).not.toContain("article:published_time");
    expect(html).not.toContain("article:product-count");
  });
});

describe("article JSON-LD by content type (rendered dist)", () => {
  const articleOf = (html: string) =>
    extractJsonLd(html).find((item) => item["@type"] === "Article") as Record<
      string,
      unknown
    >;

  it("marks a product guide with a single Product in about", () => {
    const expectedNames: Record<string, string> = {
      "panasonic-baby-monitor-kx-hc705":
        panasonicBabyMonitorArticle.aboutProductNames![0],
      "panasonic-eh-na9m-guide":
        panasonicEhNa9mGuideArticle.aboutProductNames![0],
    };
    for (const [slug, expectedName] of Object.entries(expectedNames)) {
      const html = readFileSync(`dist/articles/${slug}/index.html`, "utf8");
      const article = articleOf(html);
      expect(article.about).toEqual([
        { "@type": "Product", name: expectedName },
      ]);
    }
  });

  it("marks a comparison article with two Products in about when names are declared", () => {
    const html = readFileSync(
      "dist/articles/roborock-qrevo-curv-vs-dreame-x50/index.html",
      "utf8",
    );
    const article = articleOf(html);
    expect(article.about).toEqual([
      { "@type": "Product", name: "Roborock Qrevo Curv" },
      { "@type": "Product", name: "Dreame X50 Ultra" },
    ]);
  });

  it("omits about on a comparison article without declared product names", () => {
    const html = readFileSync(
      "dist/articles/zojirushi-ck-pa08-vs-ck-dc08/index.html",
      "utf8",
    );
    const article = articleOf(html);
    expect(article.about).toBeUndefined();
  });
});

describe("source-toggle fold (rendered dist)", () => {
  const articleSlugs = readdirSync("dist/articles", { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && !"page category".includes(entry.name),
    )
    .map((entry) => entry.name)
    .sort();

  it("every 根拠・確認先 table article renders the source-toggle and passes the gate", () => {
    let pagesWithSourceTable = 0;
    let pagesWithToggle = 0;
    for (const slug of articleSlugs) {
      const html = readFileSync(`dist/articles/${slug}/index.html`, "utf8");
      const relative = `articles/${slug}/index.html`;
      const errors = validateSourceToggle(relative, html);
      expect(errors).toEqual([]);
      if (/根拠・確認先/.test(html)) pagesWithSourceTable += 1;
      if (/class="source-toggle"/.test(html)) pagesWithToggle += 1;
    }
    // 根拠列テーブルを持つ記事とトグルを持つ記事は同数（fold 過不足なし）
    expect(pagesWithSourceTable).toBeGreaterThan(0);
    expect(pagesWithToggle).toBe(pagesWithSourceTable);
  });

  it("renders the toggle immediately before the table on pampers", () => {
    const html = readFileSync(
      "dist/articles/pampers-newborn/index.html",
      "utf8",
    );
    const tableIndex = html.indexOf('<div class="table-scroll">');
    const before = html.slice(tableIndex - 60, tableIndex);
    expect(before).toMatch(/<\/details>\s*$/);
    expect(html).toMatch(
      /<details class="source-toggle">[\s\S]*?<summary>根拠・確認先を表示<\/summary>/,
    );
  });
});

describe("article trust line (rendered dist)", () => {
  const articleSlugs = readdirSync("dist/articles", { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && !"page category".includes(entry.name),
    )
    .map((entry) => entry.name)
    .sort();

  it("renders exactly one compressed trust line per article with the checked date", () => {
    for (const slug of articleSlugs) {
      const html = readFileSync(`dist/articles/${slug}/index.html`, "utf8");
      const article = articleMetadata.find(
        (entry) => entry.path === `/articles/${slug}/`,
      );
      expect(article, `unknown article ${slug}`).toBeDefined();
      const trustLines = [
        ...html.matchAll(/<p class="trust-line">[\s\S]*?<\/p>/g),
      ];
      expect(trustLines.length, `${slug}: trust line count`).toBe(1);
      const checkedAt = article!.productInfoCheckedAt;
      const expected = checkedAt
        ? `<p class="trust-line">✓ 公式確認済み（${checkedAt}）・広告を含みます</p>`
        : '<p class="trust-line">広告を含みます</p>';
      expect(trustLines[0][0]).toBe(expected);
      // 旧形式（ヒーロー信頼行・広告表示 notice）が残っていない
      expect(html).not.toContain("公式情報確認済み · ");
      expect(html).not.toContain("広告表示：この記事には広告リンクを含みます");
    }
  });
});

describe("article diagnosis CTA (rendered dist)", () => {
  const articleSlugs = readdirSync("dist/articles", { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && !"page category".includes(entry.name),
    )
    .map((entry) => entry.name)
    .sort();

  it("renders exactly one next-step block on every comparison article, before #specs", () => {
    let comparisonPages = 0;
    for (const slug of articleSlugs) {
      const html = readFileSync(`dist/articles/${slug}/index.html`, "utf8");
      const contentType = html.match(
        /<meta name="article:content-type" content="(guide|comparison)">/i,
      )?.[1];
      const blockCount = (
        html.match(
          /<section\b[^>]*\bnext-step\b[^>]*\bdata-next-step\b[^>]*>/gi,
        ) ?? []
      ).length;
      if (contentType === "guide") {
        expect(
          blockCount,
          `${slug}: guide must not render next-step block`,
        ).toBe(0);
        continue;
      }
      comparisonPages += 1;
      expect(
        blockCount,
        `${slug}: comparison must render one next-step block`,
      ).toBe(1);
      expect(html).toMatch(
        /<a class="next-step__diagnosis-link" href="\/tools\/product-finder\//,
      );
      const buyLinks = html.match(
        /<a\b[^>]*class="[^"]*\bnext-step__buy\b[^"]*"[^>]*>/gi,
      );
      expect(
        buyLinks?.length,
        `${slug}: next-step has 2 purchase buttons`,
      ).toBe(2);
      const specsIndex = html.indexOf('id="specs"');
      const blockIndex = html.indexOf('class="next-step"');
      if (specsIndex !== -1) {
        expect(
          blockIndex,
          `${slug}: next-step block before #specs`,
        ).toBeGreaterThan(-1);
        expect(
          blockIndex,
          `${slug}: next-step block before #specs`,
        ).toBeLessThan(specsIndex);
      }
    }
    expect(comparisonPages).toBeGreaterThan(30);
  });

  it("links bottle/diaper comparisons to their matching diagnosis category", () => {
    const expectations: Record<string, string> = {
      "pigeon-bottle-160-240": "/tools/product-finder/baby-bottle/",
      "pigeon-bottle-240": "/tools/product-finder/baby-bottle/",
      "pigeon-slim-240": "/tools/product-finder/baby-bottle/",
      "moony-m": "/tools/product-finder/diaper/",
      "merries-newborn": "/tools/product-finder/diaper/",
      "merries-pants": "/tools/product-finder/diaper/",
      "pampers-newborn": "/tools/product-finder/diaper/",
      shupot: "/tools/product-finder/diaper/",
    };
    for (const [slug, href] of Object.entries(expectations)) {
      const html = readFileSync(`dist/articles/${slug}/index.html`, "utf8");
      const match = html.match(
        /<a class="next-step__diagnosis-link" href="([^"]+)"/,
      );
      expect(match?.[1], `${slug} diagnosis href`).toBe(href);
    }
  });
});

describe("article card audiences 向き line (rendered dist)", () => {
  it("declares non-empty audiences for every public article", () => {
    for (const article of publicArticleMetadata) {
      expect(
        article.audiences.length,
        `${article.id}: audiences must be non-empty for the card 向き line`,
      ).toBeGreaterThan(0);
    }
  });

  it("renders the 向き line on every ArticleCard on the top and listing pages", () => {
    const pages = [
      "dist/index.html",
      "dist/articles/index.html",
      ...readdirSync("dist/articles/page", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `dist/articles/page/${entry.name}/index.html`),
    ];
    let cardCount = 0;
    for (const file of pages) {
      const html = readFileSync(file, "utf8");
      for (const card of html.matchAll(
        /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*data-content-type="(?:guide|comparison)"[^>]*>([\s\S]*?)<\/article>/gi,
      )) {
        cardCount += 1;
        expect(
          /<p class="card-audiences">向き: [^<]+<\/p>/.test(card[1]),
          `card on ${file} must render the 向き line`,
        ).toBe(true);
        if (/data-content-type="comparison"/.test(card[0])) {
          expect(
            /<p class="card-subjects">[^<]+<\/p>/.test(card[1]),
            `comparison card on ${file} must render the 型番 line`,
          ).toBe(true);
        }
      }
    }
    expect(cardCount).toBeGreaterThanOrEqual(publicArticleMetadata.length);
  });
});
