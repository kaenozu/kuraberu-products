import { defineArticleMetadata } from "./types";

export const thermosTigerBottleArticle = defineArticleMetadata({
  id: "thermos-tiger-bottle",
  productCount: 2,
  path: "/articles/thermos-tiger-bottle/",
  title: "サーモスとタイガーの水筒、どっち？｜くらべる商品メモ",
  headline:
    "サーモスとタイガーの水筒、どっち？「JNL-S500」と「MTA-J050」を比較",
  description:
    "サーモスJNL-S500とタイガーMTA-J050の0.5L水筒を、公式の保温・保冷効力・サイズ・お手入れ方法で比較",
  category: "生活雑貨",
  tags: ["水筒", "ステンレスボトル", "サーモス", "タイガー"],
  audiences: ["水筒を買い替えたい人", "夏の保冷を重視する人"],
  uses: ["毎日使う", "保温・保冷を比較"],
  summary:
    "「JNL-S500」と「MTA-J050」を、公式の保温・保冷効力とサイズ・お手入れ方法に分けて比較します。",
  publishedAt: "2026-08-12",
  modifiedAt: "2026-09-01",
  productInfoCheckedAt: "2026-09-01",
  purchaseLinkStatus: "verified",
  purchaseLinksCheckedAt: "2026-09-01",
  imagePath: "/products/thermos-jnl-s500.jpg",
  changeLog: [
    {
      date: "2026-09-01",
      summary:
        "公式ページと楽天商品単体ページ（JNL-S500・MTA-J050）のHTTP 200、商品名・型番・ショップ一致を確認し、検索ページではなく通常の商品単体URLへ更新。",
    },
    {
      date: "2026-08-17",
      summary:
        "記事本文を新テンプレートへ短縮（1行結論→比較→違い→どっち向き→詳細→FAQ）。途中CTAを削除し、購入カードは記事末尾に統一。",
    },
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-12",
      summary: "初回公開。サーモス・タイガー公式の商品ページで仕様を確認。",
    },
  ],
});
