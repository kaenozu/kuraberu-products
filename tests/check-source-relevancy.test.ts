import { describe, expect, it } from "vitest";
import {
  checkSourceRelevancy,
  collectArticleSourceRecords,
  extractModelTokens,
  findSourceRelevancyFindings,
  sourceContainsToken,
  sourceSearchTarget,
} from "../scripts/check-source-relevancy.mjs";

const fixtureRegistry = `
export const leftSeed = {
  id: "maker-a-model-x100-vs-model-y200",
  leftProduct: "メーカーA Model-X100",
  rightProduct: "メーカーA Model-Y200",
  purchaseLinkStatus: "verified",
  officialSources: [
    { label: "X100 公式", url: "https://www.maker-a.example.jp/products/MODEL-X100.html" },
    { label: "Y200 公式", url: "https://www.maker-a.example.jp/products/model-y200/spec.html" },
  ],
};

export const brokenSeed = {
  id: "maker-b-wrong-source",
  leftProduct: "メーカーB KJ-5000",
  rightProduct: "メーカーB KJ-7000",
  officialSources: [
    { label: "全然別の商品", url: "https://www.maker-b.example.jp/items/zz-unrelated/" },
    { label: "クエリで一致", url: "https://www.maker-b.example.jp/search?q=KJ-5000" },
  ],
};

export const noModelSeed = {
  id: "maker-c-brand-only",
  leftProduct: "メーカーC ブランド品",
  rightProduct: "メーカーC 別ブランド品",
  officialSources: [
    { label: "公式", url: "https://www.maker-c.example.jp/lineup/" },
  ],
};
`;

describe("source relevancy gate (issue #370)", () => {
  it("tokenizes model numbers with NFKC + lowercase alnum runs", () => {
    expect(
      extractModelTokens(["パナソニック NT-T501", "サーモス JNL-S500"]),
    ).toEqual(["jnl-s500", "nt-t501"]);
    expect(extractModelTokens(["Dreame X50 Ultra"])).toContain("x50");
    // 数字入りトークンが無い場合は英字トークンへフォールバック
    expect(extractModelTokens(["Roborock Qrevo Curv"])).toEqual([
      "curv",
      "qrevo",
      "roborock",
    ]);
    // フォールバックはテキスト単位（数字入りの無い側の英字トークンを落とさない）
    expect(
      extractModelTokens(["Logicool MX Keys S for Mac", "ロジクール K780"]),
    ).toEqual(["k780", "keys", "logicool"]);
    expect(extractModelTokens(["", "　"])).toEqual([]);
  });

  it("matches tokens against slug/path/query but never the hostname", () => {
    const target = sourceSearchTarget(
      "https://shop.example.com/products/KJ-5000.html?item=KJ-5000",
    );
    expect(target).not.toBeNull();
    expect(sourceContainsToken(target!, "kj-5000")).toBe(true);
    expect(sourceContainsToken(target!, "kj5000")).toBe(true); // ハイフン無し表記
    expect(sourceContainsToken(target!, "shop.example.com")).toBe(false);
    const hyphenless = sourceSearchTarget(
      "https://jp.sharp.example/kusei/products/kcs50/",
    );
    expect(sourceContainsToken(hyphenless!, "kc-s50")).toBe(true);
    expect(sourceSearchTarget("::broken::")).toBeNull();
  });

  it("splits the registry into article blocks with sources and model texts", () => {
    const records = collectArticleSourceRecords(fixtureRegistry);
    expect(records.map((record) => record.id)).toEqual([
      "maker-a-model-x100-vs-model-y200",
      "maker-b-wrong-source",
      "maker-c-brand-only",
    ]);
    const makerB = records[1];
    expect(makerB.sources).toHaveLength(2);
    expect(makerB.modelTexts).toEqual([
      "メーカーB KJ-5000",
      "メーカーB KJ-7000",
    ]);
  });

  it("reports violations grouped by article and keeps matched sources silent", () => {
    const { findings } = findSourceRelevancyFindings(fixtureRegistry);
    const byId = new Map(findings.map((finding) => [finding.id, finding]));

    expect(byId.get("maker-a-model-x100-vs-model-y200")).toBeUndefined();

    const broken = byId.get("maker-b-wrong-source")!;
    expect(broken.violations).toHaveLength(1);
    expect(broken.violations[0].url).toBe(
      "https://www.maker-b.example.jp/items/zz-unrelated/",
    );
    // クエリパラメータに型番がある出典は合格
    expect(broken.unverifiable).toBe(0);

    const brandOnly = byId.get("maker-c-brand-only")!;
    expect(brandOnly.violations).toHaveLength(0);
    expect(brandOnly.unverifiable).toBe(1); // 型番候補なしは violation にしない
  });

  it("runs against the real registry without throwing and reports a summary", () => {
    const { findings, checkedSources } = checkSourceRelevancy();
    expect(checkedSources).toBeGreaterThan(0);
    for (const finding of findings) {
      for (const violation of finding.violations) {
        expect(violation.url).toMatch(/^https:\/\//);
        expect(violation.tokens.length).toBeGreaterThan(0);
      }
    }
  });
});
