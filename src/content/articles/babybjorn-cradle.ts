import { defineArticleMetadata } from "./types";

export const cradleArticle = defineArticleMetadata({
  id: "babybjorn-cradle",
  productCount: 2,
  path: "/articles/babybjorn-cradle/",
  title: "ゆりかご型ベビーベッド、どっち？｜くらべる商品メモ",
  headline:
    "「ベビービョルン クレードル」と「アップリカ ココネルエアー」を比較",
  description:
    "ベビービョルン クレードル（新生児〜6か月・手動ゆりかご・49,500円）と アップリカ ココネルエアー AB（新生児〜24カ月・折りたたみ・サークル兼用・29,700円）を、公式の案内・対象期間・サイズ・価格で比較",
  category: "育児用品",
  tags: ["ベビーベッド", "ゆりかご", "ベビービョルン", "アップリカ", "新生児"],
  audiences: [
    "新生児の保護者",
    "出産準備中の人",
    "ベビーベッドの購入を検討中の人",
  ],
  uses: ["毎日使う", "長く使う", "持ち運ぶ"],
  summary:
    "「ベビービョルン クレードル」と「アップリカ ココネルエアー AB」を、各メーカー公式の案内・対象期間・サイズ・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-28",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinksCheckedAt: "2026-08-28",
  purchaseLinkStatus: "verified",
  imagePath: "/products/babybjorn-cradle.jpg",
  changeLog: [
    {
      date: "2026-08-28",
      summary:
        "楽天市場の商品詳細ページで商品名・型番・ショップを照合し、楽天アフィリエイト公式UIで生成した商品詳細リンクへ更新。",
    },
    {
      date: "2026-08-17",
      summary:
        "記事本文を新テンプレートへ短縮（1行結論→比較→違い→どっち向き→詳細→FAQ）。途中CTAを削除し、購入カードは記事末尾に統一。",
    },
    {
      date: "2026-08-16",
      summary:
        "クレードルの本体重量を修正。公式商品ページの仕様（約6kg）に合わせ、楽天市場店リストの約8kg表記を正しました。",
    },
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-10",
      summary:
        "初回公開。ベビービョルン公式楽天市場店・アップリカ公式楽天市場店の商品ページを確認。",
    },
  ],
});
