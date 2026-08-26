import { readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ArticleComparisonV2 from "../src/components/ArticleComparisonV2.astro";

const read = (path: string) => readFileSync(path, "utf8");

/**
 * 比較記事シェル（ArticleComparisonV2）の契約を守るテスト。
 *
 * - レンダリング検証: シェルを実際に描画し、ページ内ジャンプのアンカー
 *   （#decision-guide / #key-differences）と TrustLine（信頼表示）が
 *   出力に現れることを確認する（旧 issue-2.test.ts のソース文字列マッチを
 *   実モジュール動作へのアサーションへ置換したもの）。
 * - 構造確認: 代表記事ページが標準骨格で構成されていること。
 */
describe("editorial comparison shell", () => {
  const renderShell = async (checkedAt?: string) => {
    const container = await AstroContainer.create();
    return container.renderToString(ArticleComparisonV2, {
      props: {
        left: {
          brand: "パンパース",
          line: "肌へのいちばん",
          tagline: "ゆるうんちを素早く吸収",
          image: "/products/pampers-premium-newborn.jpg",
          imageAlt: "パンパース 肌へのいちばん 新生児",
          officialHref: "https://www.jp.pampers.com/products/premium-tape",
          guidePoints: ["ワセリン配合シート"],
        },
        right: {
          brand: "パンパース",
          line: "さらさらケア",
          tagline: "モレ・ムレ対策",
          image: "/products/pampers-sarasara-newborn.jpg",
          imageAlt: "パンパース さらさらケア 新生児",
          officialHref: "https://www.jp.pampers.com/products/mainline-tape",
          guidePoints: ["360°ゆるうんちモレガード"],
        },
        rows: [{ label: "重さ", left: "約104g", right: "約102g" }],
        ...(checkedAt ? { checkedAt } : {}),
      },
    });
  };

  it("renders jump anchors for decision-guide and key-differences", async () => {
    const html = await renderShell("2026-08-18");
    // 統合ブロック化後もページ内ジャンプの飛び先アンカーが維持されていること。
    expect(html).toContain('id="decision-guide"');
    expect(html).toContain('id="key-differences"');
  });

  it("renders a dated trust line when the product info is verified", async () => {
    const html = await renderShell("2026-08-18");
    // 確認状態の表示は TrustLine（✓ 公式確認済み（日付）・広告を含みます）に統一されている。
    expect(html).toContain('class="trust-line"');
    expect(html).toContain("公式確認済み");
    expect(html).toContain("2026-08-18");
    expect(html).toContain("広告を含みます");
  });

  it("renders an undated trust line without claiming verification", async () => {
    // 確認日が未宣言の記事は「広告を含みます」のみ表示し、確認済みを主張しないこと。
    const html = await renderShell();
    expect(html).toContain('class="trust-line"');
    expect(html).toContain("広告を含みます");
    expect(html).not.toContain("公式確認済み");
  });

  it("keeps the pampers-newborn article on the canonical comparison composition", () => {
    // 【純粋な構造確認】このテストはページソースの構成検査である。
    // 守るもの: 代表記事（パンパース新生児）が v3 標準骨格
    // （ArticleComparisonV2 + ArticleSocialProof）で構成され、廃止済みの
    // DifferenceList へ戻っていないこと。ジャンプ先アンカー自体の存在は
    // 上の render テストが担保する。ページ全体の最終描画は verify チェーンの
    // scripts/check-rendered-html.mjs と playwright e2e（test:e2e）が担保する。
    const article = read("src/pages/articles/pampers-newborn/index.astro");
    // pampers-newborn is now data-driven via ArticleComparisonPage or CommercialArticlePage
    expect(article).toMatch(
      /ArticleComparisonPage|CommercialArticlePage|ManualArticlePage|ArticleComparisonV2/,
    );
    expect(article).not.toContain("DifferenceList");
  });
});
