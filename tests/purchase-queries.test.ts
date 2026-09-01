import { afterEach, describe, expect, it, vi } from "vitest";
import { productQueries, type ProductId } from "../src/lib/purchase-queries";
import { resolvePurchaseHref, selectRakutenProduct } from "../src/lib/rakuten";

afterEach(() => {
  vi.unstubAllEnvs();
});

/**
 * productQueries（購入リンク選択レジストリ）の振る舞いテスト。
 *
 * レジストリは AffiliateButton / resolvePurchaseHref の唯一の検索条件源で、
 * 誤選択は収益と広告表示の信頼に直結する。ここでは
 *
 * - レジストリ自体の完全性（全 ProductId が fail-closed な選択条件を持つ）
 * - 代表エントリが resolvePurchaseHref 経由で正しく商品を解決すること
 * - terms 一致・除外の境界（NFKC 正規化・大小文字・部分一致）
 * - 解決不能時（曖昧候補・認証情報欠損・API データ欠損）に安全側へ倒れること
 *
 * を検証する。旧 issue-2.test.ts のソース文字列マッチを置き換えるテスト群。
 */

/** レジストリが扱うべき全商品ID。新規追加時はここも更新する（欠落はこのテストが落とす）。 */
const ALL_PRODUCT_IDS: readonly ProductId[] = [
  "pampers-premium-newborn",
  "pampers-sarasara-newborn",
  "merries-fp-newborn",
  "merries-airsle-newborn",
  "pigeon-glass-240",
  "pigeon-ppsu-240",
  "pigeon-slim-240",
  "pigeon-160",
  "moony-teishigeki-m",
  "moony-mashumaro-m",
  "shupot-dendo",
  "shupot-shudo",
];

const apiResponse = (items: unknown[]) =>
  new Response(JSON.stringify({ items }), { status: 200 });

const stubRakutenCredentials = () => {
  vi.stubEnv("RAKUTEN_APPLICATION_ID", "test-app");
  vi.stubEnv("RAKUTEN_ACCESS_KEY", "test-key");
  vi.stubEnv("RAKUTEN_AFFILIATE_ID", "test-affiliate");
};

describe("productQueries registry", () => {
  it("covers every known product id with complete fail-closed selection data", () => {
    // キー集合が ProductId 全体と一致すること（typo・欠損・意図しない追加を検出）。
    expect(Object.keys(productQueries).sort()).toEqual(
      [...ALL_PRODUCT_IDS].sort(),
    );

    for (const [productId, query] of Object.entries(productQueries)) {
      // keyword / requiredTerms の欠損は「検索不能」や「全件落選＝リンク切れ」
      // を招くため禁止。
      expect(
        query.keyword.trim().length,
        `${productId}: keyword`,
      ).toBeGreaterThan(0);
      expect(
        query.requiredTerms.length,
        `${productId}: requiredTerms`,
      ).toBeGreaterThan(0);
      for (const term of query.requiredTerms) {
        expect(
          term.trim().length,
          `${productId}: term "${term}"`,
        ).toBeGreaterThan(0);
      }
      // selection は曖昧候補を排除できる条件を最低1つ持つこと
      // （excludedTerms + 完全一致条件のどれか）。空オブジェクトは許さない。
      expect(
        query.selection.excludedTerms?.length ?? 0,
        `${productId}: excludedTerms`,
      ).toBeGreaterThan(0);
      const hasExactCondition =
        (query.selection.exactItemCodes?.length ?? 0) > 0 ||
        (query.selection.exactIdentifiers?.length ?? 0) > 0;
      expect(hasExactCondition, `${productId}: exact condition`).toBe(true);
    }
  });
});

describe("productQueries resolution via resolvePurchaseHref", () => {
  it("selects the registered premium diaper through its exact JAN identifier", async () => {
    stubRakutenCredentials();
    const result = await resolvePurchaseHref(
      productQueries["pampers-premium-newborn"],
      {
        fetchImpl: async () =>
          apiResponse([
            {
              itemCode: "shop:premium-90",
              itemName: "パンパース 肌へのいちばん 新生児 テープ 90枚",
              itemUrl: "https://item.rakuten.co.jp/shop/premium-90",
              itemPrice: 2280,
            },
            {
              itemCode: "4987176203229",
              itemName: "パンパース 肌へのいちばん 新生児 テープ 66枚",
              itemUrl: "https://item.rakuten.co.jp/shop/premium-66",
              affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/premium-66",
              itemPrice: 1980,
            },
          ]),
        timeoutMs: 100,
      },
    );

    // 排他語「90枚」の大容量品ではなく、JAN 完全一致の商品が選ばれる。
    expect(result.product?.id).toBe("4987176203229");
    expect(result.href).toContain("hb.afl.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
  });

  it("selects the registered merries pack by exact item code and rejects a longer prefix code", async () => {
    stubRakutenCredentials();
    const result = await resolvePurchaseHref(
      productQueries["merries-fp-newborn"],
      {
        fetchImpl: async () =>
          apiResponse([
            {
              // 先頭一致する類似コード。名前は必須語すべてを満たすため、
              // exactItemCodes の完全一致だけが両者を区別できる。
              itemCode: "rakutensokuhaimart:1001875200",
              itemName: "メリーズ ファーストプレミアム 新生児 テープ 62枚",
              itemUrl:
                "https://item.rakuten.co.jp/rakutensokuhaimart/1001875200",
              itemPrice: 1480,
            },
            {
              itemCode: "rakutensokuhaimart:10018752",
              itemName: "メリーズ ファーストプレミアム 新生児 テープ 62枚",
              itemUrl: "https://item.rakuten.co.jp/rakutensokuhaimart/10018752",
              affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/merries-fp",
              itemPrice: 1580,
            },
          ]),
        timeoutMs: 100,
      },
    );

    // プレフィックス一致の誤商品ではなく、登録コードそのものが選ばれる。
    expect(result.product?.id).toBe("rakutensokuhaimart:10018752");
    expect(result.href).toContain("hb.afl.rakuten.co.jp/hgc/merries-fp");
    expect(result.isAffiliate).toBe(true);
  });

  it("falls back to the affiliate-converted search URL when candidates stay ambiguous", async () => {
    stubRakutenCredentials();
    const entry = productQueries["pampers-premium-newborn"];
    const fallback =
      "https://search.rakuten.co.jp/search/mall/%E3%83%91%E3%83%B3%E3%83%91%E3%83%BC%E3%82%B9/";
    const result = await resolvePurchaseHref(
      {
        keyword: "パンパース 肌へのいちばん 新生児 同時出品", // キャッシュ分離のため専用キー
        requiredTerms: entry.requiredTerms,
        selection: entry.selection,
        fallbackUrl: fallback,
      },
      {
        fetchImpl: async () =>
          apiResponse([
            {
              itemCode: "shopA:premium-66",
              itemName:
                "パンパース 肌へのいちばん 新生児 テープ 66枚 4987176203229",
              itemUrl: "https://item.rakuten.co.jp/shopA/premium-66",
              itemPrice: 1980,
            },
            {
              itemCode: "shopB:premium-66",
              itemName:
                "パンパース 肌へのいちばん 新生児 テープ 66枚 4987176203229",
              itemUrl: "https://item.rakuten.co.jp/shopB/premium-66",
              itemPrice: 2100,
            },
          ]),
        timeoutMs: 100,
      },
    );

    // 同一 JAN を掲げる複数出品は一意に定められないため、フォールバックURLへ倒れる。
    expect(result.product).toBeUndefined();
    expect(result.href).toContain("search.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
  });

  it("fails closed with an empty href when Rakuten credentials are missing", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "");
    const fetchSpy = vi.fn(async () =>
      apiResponse([
        {
          itemCode: "shop:any",
          itemName: "パンパース さらさらケア 新生児",
          itemUrl: "https://item.rakuten.co.jp/shop/any",
          itemPrice: 1280,
        },
      ]),
    );
    const result = await resolvePurchaseHref(
      productQueries["pampers-sarasara-newborn"],
      { fetchImpl: fetchSpy, timeoutMs: 100 },
    );

    // 認証情報が揃わない場合は API を呼ばず、フォールバックも無しのときは
    // リンクを出さない（空 href）のが安全側。
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.product).toBeUndefined();
    expect(result.href).toBe("");
    expect(result.isAffiliate).toBe(false);
  });

  it("falls back safely when the Rakuten API responds with an HTTP error", async () => {
    stubRakutenCredentials();
    const result = await resolvePurchaseHref(
      {
        ...productQueries["merries-fp-newborn"],
        keyword: "メリーズ APIエラー応答",
        fallbackUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%83%A1%E3%83%AA%E3%83%BC%E3%82%BA/",
      },
      {
        fetchImpl: async () => new Response("gateway error", { status: 502 }),
        timeoutMs: 100,
      },
    );

    expect(result.product).toBeUndefined();
    expect(result.href).toContain("search.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
  });

  it("falls back safely when the Rakuten API response is not JSON", async () => {
    stubRakutenCredentials();
    const result = await resolvePurchaseHref(
      {
        ...productQueries["shupot-dendo"],
        keyword: "シュポット 不正JSON応答",
        fallbackUrl:
          "https://search.rakuten.co.jp/search/mall/%E3%82%B7%E3%83%A5%E3%83%9D%E3%83%83%E3%83%88/",
      },
      {
        fetchImpl: async () =>
          new Response("<html>temporary error</html>", { status: 200 }),
        timeoutMs: 100,
      },
    );

    expect(result.product).toBeUndefined();
    expect(result.href).toContain("search.rakuten.co.jp");
    expect(result.isAffiliate).toBe(true);
  });
});

describe("purchase query term boundaries via selectRakutenProduct", () => {
  it("matches full-width names after NFKC normalization", () => {
    const glass240 = productQueries["pigeon-glass-240"];
    // 全角空白・全角英数（２４０ｍＬ）でも正規化により requiredTerms に一致し、
    // JAN 識別子も名前中の出現位置として一致する。
    expect(
      selectRakutenProduct(
        [
          {
            id: "pigeon-lab:glass240",
            name: "ピジョン　母乳実感　哺乳びん　２４０ｍＬ　耐熱ガラス 4902508024488",
            url: "https://item.rakuten.co.jp/pigeon-lab/glass240",
            price: 2200,
          },
        ],
        glass240.requiredTerms,
        glass240.selection,
      )?.id,
    ).toBe("pigeon-lab:glass240");
  });

  it("matches mixed-case item codes case-insensitively", () => {
    const pigeon160 = productQueries["pigeon-160"];
    // API 側の itemCode 表記ゆれ（大文字小文字）は正規化後に一致扱いになる。
    expect(
      selectRakutenProduct(
        [
          {
            id: "PIGEON-SHOP:1026735",
            name: "ピジョン 母乳実感 哺乳びん 160ml",
            url: "https://item.rakuten.co.jp/pigeon-shop/1026735",
            price: 1800,
          },
        ],
        pigeon160.requiredTerms,
        pigeon160.selection,
      )?.id,
    ).toBe("PIGEON-SHOP:1026735");
  });

  it("excludes a candidate whose name merely contains an excluded term even when its identifier matches", () => {
    const premium = productQueries["pampers-premium-newborn"];
    // requiredTerms・JAN 識別子が一致しても、名前に排他語（部分一致）を含む
    // 候補は除外される。除外条件は識別子一致より優先される（fail-closed）。
    expect(
      selectRakutenProduct(
        [
          {
            id: "shop:gift-set",
            name: "パンパース 肌へのいちばん 新生児 お試しセット 4987176203229",
            url: "https://item.rakuten.co.jp/shop/gift-set",
            price: 2500,
          },
        ],
        premium.requiredTerms,
        premium.selection,
      ),
    ).toBeUndefined();
  });
});
