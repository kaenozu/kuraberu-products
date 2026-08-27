import { defineArticleMetadata } from "./types";

export const babybjornBouncerArticle = defineArticleMetadata({
  id: "babybjorn-bouncer",
  productCount: 2,
  path: "/articles/babybjorn-bouncer/",
  title: "ベビービョルンのバウンサー、どっち？｜くらべる商品メモ",
  headline:
    "ベビービョルンのバウンサー、どっち？「Bliss」と「バランスソフト」を比較",
  description:
    "ベビービョルン バウンサー Bliss（最新モデル・20種類以上のバリエーション）と バランスソフト（2トーン生地）を、公式のガイド・対象月齢・シート素材・価格で比較",
  category: "育児用品",
  tags: ["バウンサー", "ベビービョルン", "新生児"],
  audiences: [
    "新生児の保護者",
    "出産準備中の人",
    "バウンサーの購入を検討中の人",
  ],
  uses: ["毎日使う", "デザインで選ぶ", "長く使う"],
  summary:
    "「Bliss」と「バランスソフト」を、ベビービョルン公式のガイド・対象月齢・シート素材・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-27",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinksCheckedAt: "2026-08-27",
  purchaseLinkStatus: "verified",
  imagePath: "/products/babybjorn-bouncer-bliss.jpg",
  changeLog: [
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
      date: "2026-08-10",
      summary:
        "初回公開。ベビービョルン公式のバウンサーガイド・商品ページを確認。",
    },
  ],
});
