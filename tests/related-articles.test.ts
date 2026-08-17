import { describe, expect, it } from "vitest";
import { ARTICLE_LAYOUT } from "../config/article-layout.mjs";
import { articleMetadata } from "../src/content/articles";
import {
  findUnusedBrandTags,
  scoreArticleRelevance,
  selectRelatedArticles,
  type RelatedSelectionOptions,
} from "../src/lib/related-articles";

// 各テストで意図した信号だけが一致するよう、base はどの記事とも重ならない値にする。
const base = {
  path: "/articles/a/",
  category: "育児用品",
  tags: ["タグA"],
  audiences: ["対象者A"],
  uses: ["用途A"],
  publishedAt: "2026-08-01",
} as const;

const options: RelatedSelectionOptions = {
  limit: 4,
  othersLimit: 3,
  minScore: 1,
  weights: { tag: 3, use: 2, audience: 2, category: 1 },
  brandTagWeight: 1,
  brandTags: ["パナソニック"],
};

describe("scoreArticleRelevance", () => {
  // 両引数で一致させたい信号だけが重なるよう、各テストで明示的に排他値を渡す。
  const other = {
    tags: ["タグB"],
    audiences: ["対象者B"],
    uses: ["用途B"],
  };

  it("scores a shared product-type tag highest", () => {
    expect(
      scoreArticleRelevance(
        { ...base, tags: ["紙おむつ"] },
        { ...base, ...other, tags: ["紙おむつ", "メリーズ"] },
        options,
      ),
    ).toBe(4); // tag 3 + category 1
  });

  it("treats a brand tag as a weak signal", () => {
    expect(
      scoreArticleRelevance(
        { ...base, tags: ["パナソニック"] },
        { ...base, ...other, tags: ["パナソニック"] },
        options,
      ),
    ).toBe(2); // brandTag 1 + category 1
  });

  it("scores shared uses and audiences", () => {
    expect(
      scoreArticleRelevance(
        { ...base, uses: ["毎日使う"], audiences: ["新生児の保護者"] },
        {
          ...base,
          ...other,
          uses: ["毎日使う"],
          audiences: ["新生児の保護者"],
        },
        options,
      ),
    ).toBe(5); // use 2 + audience 2 + category 1
  });

  it("scores only the same category", () => {
    expect(
      scoreArticleRelevance({ ...base }, { ...base, ...other }, options),
    ).toBe(1);
  });

  it("scores zero with no overlap", () => {
    expect(
      scoreArticleRelevance(
        { ...base },
        { ...base, category: "美容家電", ...other },
        options,
      ),
    ).toBe(0);
  });
});

describe("selectRelatedArticles", () => {
  const articles = [
    { ...base, path: "/articles/a/" },
    {
      ...base,
      path: "/articles/b/",
      tags: ["紙おむつ", "メリーズ"],
    },
    {
      ...base,
      path: "/articles/c/",
      tags: ["ドライヤー"],
      category: "美容家電",
    },
    { ...base, path: "/articles/d/", tags: ["水筒"], category: "生活雑貨" },
  ];

  it("excludes the current article and orders by score", () => {
    const { related, others } = selectRelatedArticles(
      articles,
      "/articles/a/",
      "育児用品",
      options,
    );
    expect(related.map((article) => article.path)).toEqual([
      "/articles/b/", // tag 3 + category 1 = 4
      "/articles/c/", // category 1
      "/articles/d/", // category 1
    ]);
    expect(others).toEqual([]);
    expect(related.some((article) => article.path === "/articles/a/")).toBe(
      false,
    );
  });

  it("caps related and others by the configured limits", () => {
    const many = Array.from({ length: 10 }, (_, index) => ({
      ...base,
      path: `/articles/x${index}/`,
      tags: ["紙おむつ"],
    }));
    const { related, others } = selectRelatedArticles(
      many,
      "/articles/x0/",
      "育児用品",
      options,
    );
    expect(related).toHaveLength(options.limit);
    expect(others).toHaveLength(options.othersLimit);
  });

  it("falls back to category selection when the current page has no metadata", () => {
    const { related, others } = selectRelatedArticles(
      articles,
      "/tools/product-finder/育児用品/",
      "育児用品",
      options,
    );
    // a と b は 育児用品、c/d は他カテゴリ
    expect(related.map((article) => article.path)).toEqual([
      "/articles/a/",
      "/articles/b/",
    ]);
    expect(others.map((article) => article.path)).toEqual([
      "/articles/c/",
      "/articles/d/",
    ]);
  });

  it("prefers a product-type match over a brand-only match", () => {
    const current = {
      ...base,
      path: "/articles/kx/",
      tags: ["ベビーモニター"],
    };
    const productType = {
      ...base,
      path: "/articles/bed/",
      tags: ["ベビーベッド"],
    };
    const brandOnly = {
      ...base,
      path: "/articles/dryer/",
      tags: ["パナソニック"],
      category: "美容家電",
    };
    const { related } = selectRelatedArticles(
      [current, productType, brandOnly],
      current.path,
      "育児用品",
      options,
    );
    // ベビーベッド: tag 3 + category 1 = 4 > パナソニック: brand 1
    expect(related[0].path).toBe("/articles/bed/");
  });

  it("breaks ties by preferring the same category over a brand-only match", () => {
    const current = {
      ...base,
      path: "/articles/kx/",
      tags: ["ベビーモニター"],
    };
    const sameCategory = {
      ...base,
      path: "/articles/diaper/",
      tags: ["紙おむつ"],
      publishedAt: "2026-07-01", // 古いが同カテゴリ
    };
    const brandOnly = {
      ...base,
      path: "/articles/dryer/",
      tags: ["パナソニック"],
      category: "美容家電",
      publishedAt: "2026-08-17", // 新しいが他カテゴリ
    };
    const { related } = selectRelatedArticles(
      [current, sameCategory, brandOnly],
      current.path,
      "育児用品",
      options,
    );
    // 両方 score=1 のとき、同カテゴリ（紙おむつ）がブランド一致（パナソニック）より先
    expect(related[0].path).toBe("/articles/diaper/");
  });
});

describe("real article data", () => {
  it("keeps every article within the configured limits", () => {
    for (const current of articleMetadata) {
      const { related, others } = selectRelatedArticles(
        articleMetadata,
        current.path,
        current.category,
      );
      expect(related.length, current.path).toBeLessThanOrEqual(
        ARTICLE_LAYOUT.relatedSelection.limit,
      );
      expect(others.length, current.path).toBeLessThanOrEqual(
        ARTICLE_LAYOUT.relatedSelection.othersLimit,
      );
      const paths = new Set([
        ...related.map((article) => article.path),
        ...others.map((article) => article.path),
      ]);
      expect(paths.has(current.path), current.path).toBe(false);
    }
  });

  it("selects genuinely relevant neighbors for shupot", () => {
    const { related } = selectRelatedArticles(
      articleMetadata,
      "/articles/shupot/",
      "育児用品",
    );
    const paths = related.map((article) => article.path);
    // ピジョンの哺乳びん記事は ブランド一致で関連候補に入る
    expect(paths).toContain("/articles/pigeon-bottle-160-240/");
    expect(paths).toContain("/articles/pigeon-bottle-240/");
  });

  it("selects the water-bottle guide for thermos-tiger-bottle", () => {
    const { related } = selectRelatedArticles(
      articleMetadata,
      "/articles/thermos-tiger-bottle/",
      "生活雑貨",
    );
    const paths = related.map((article) => article.path);
    expect(paths[0]).toBe("/articles/tiger-mta-j050-guide/");
  });

  it("keeps the brandTags list in sync with the articles", () => {
    expect(findUnusedBrandTags(articleMetadata)).toEqual([]);
  });

  it("keeps the baby-monitor article within its own category (no brand-only noise)", () => {
    const { related } = selectRelatedArticles(
      articleMetadata,
      "/articles/panasonic-baby-monitor-kx-hc705/",
      "育児用品",
    );
    expect(related.length).toBeGreaterThan(0);
    for (const article of related) {
      expect(article.category, article.path).toBe("育児用品");
    }
  });
});
