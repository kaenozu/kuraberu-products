import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseCard from "../src/components/PurchaseCard.astro";

const validRakutenUrl = "https://item.rakuten.co.jp/shop/thermos-jnl-s500";

describe("PurchaseCard", () => {
  // 開発者マシンのユーザー環境変数に楽天API資格情報があると、クエリ解決
  // （resolvePurchaseHref）が実ネットワークへ出て遅くなりタイムアウトの
  // 元になる。単体テストは常に「資格情報なし」＝fail-closed の空配列
  // フォールバック経路で実行する（CI と同じ条件）。
  beforeEach(() => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders name, audience, CTA label, and note when verified", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "サーモス JNL-S500",
        audience: "軽さ・コンパクト・食洗機対応を優先する人向け",
        href: validRakutenUrl,
        productId: "thermos-jnl-s500",
        imagePath: "/products/thermos-jnl-s500.jpg",
        placement: "article-end",
        note: "価格・在庫は販売先でご確認ください。",
        // fail-closed 契約: verified を明示したときだけ CTA を出す
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain("サーモス JNL-S500");
    expect(html).toContain("軽さ・コンパクト・食洗機対応を優先する人向け");
    expect(html).toContain("楽天市場で商品ページを見る");
    expect(html).not.toContain("（広告）");
    expect(html).toContain("価格・在庫は販売先でご確認ください。");
    expect(html).toContain('data-placement="article-end"');
    expect(html).toContain('rel="nofollow noopener noreferrer"');
  });

  it("renders a verified product detail URL as sponsored advertising", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "パンパース 肌へのいちばん",
        audience: "肌へのやさしさを優先する人向け",
        href: "https://item.rakuten.co.jp/shop/pampers-premium",
        productId: "pampers-premium-newborn",
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain("楽天市場で商品ページを見る");
    expect(html).toContain('rel="nofollow noopener noreferrer"');
  });

  it("renders a Rakuten short URL when status is verified", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "ベビービョルン バウンサー Bliss",
        audience: "公式商品ページを確認したい人向け",
        // short URLs are rejected even when the caller claims verified
        href: "https://a.r10.to/hPtZZE",
        productId: "babybjorn-bouncer-bliss",
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain("楽天市場で確認する");
    expect(html).toContain('rel="sponsored nofollow noopener noreferrer"');
  });

  it("defaults to article-end placement (v3 principle) and renders image", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "タイガー MTA-J050",
        audience: "保冷力を優先する人向け",
        href: validRakutenUrl,
        imagePath: "/products/tiger-mta-j050.jpg",
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain("タイガー MTA-J050");
    expect(html).toContain('data-placement="article-end"');
    // astro:assets で最適化された画像パスまたは元のパスのいずれかを含む
    expect(html).toMatch(/src="[^"]*tiger-mta-j050/);
  });

  it("supports article-end placement", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PurchaseCard, {
      props: {
        name: "タイガー MTA-J050",
        audience: "保冷力を優先する人向け",
        href: validRakutenUrl,
        placement: "article-end",
        purchaseLinkStatus: "verified",
      },
    });

    expect(html).toContain('data-placement="article-end"');
  });

  // fail-closed 契約: 未指定（undefined）/ unverified / unavailable では
  // アフィリエイトCTAを出さず、「購入先の確認中です」メッセージを表示する。
  it.each([
    ["omitted", undefined],
    ["unverified", "unverified"],
    ["unavailable", "unavailable"],
  ] as const)(
    "hides CTAs and shows the pending message when the status is %s",
    async (_label, purchaseLinkStatus) => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(PurchaseCard, {
        props: {
          name: "サーモス JNL-S500",
          audience: "軽さ・コンパクト・食洗機対応を優先する人向け",
          href: validRakutenUrl,
          productId: "thermos-jnl-s500",
          purchaseLinkStatus,
        },
      });

      expect(html).not.toContain("楽天市場で確認する");
      expect(html).not.toContain("Amazonで商品を確認");
      expect(html).not.toContain("data-cta-event");
      expect(html).toContain("購入リンクは現在確認中です。");
      // カード本体（名前・対象読者）は表示を維持する
      expect(html).toContain("サーモス JNL-S500");
      expect(html).toContain("軽さ・コンパクト・食洗機対応を優先する人向け");
    },
  );
});
