import { defineArticleMetadata } from "./types";

export const pottyArticle = defineArticleMetadata({
  id: "babybjorn-potty",
  productCount: 2,
  path: "/articles/babybjorn-potty/",
  title: "トイレトレーニング、どっち？｜くらべる商品メモ",
  headline:
    "ベビービョルンのポッティ、どっち？「スマートポッティ」と「ポッティチェア」を比較",
  description:
    "ベビービョルン スマートポッティ（収納式・3,080円）と ポッティチェア（イス型・中桶付き・4,180円）を、公式の案内・形状・サイズ・価格で比較",
  category: "育児用品",
  tags: ["トイレトレーニング", "おまる", "ベビービョルン", "1歳", "2歳"],
  audiences: [
    "1〜2歳の保護者",
    "トイレトレーニングを始める人",
    "おまるの購入を検討中の人",
  ],
  uses: ["毎日使う", "場所を取らない", "長く使う"],
  summary:
    "「スマートポッティ」と「ポッティチェア」を、ベビービョルン公式の商品ページ・形状・サイズ・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-28",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinksCheckedAt: "2026-08-28",
  purchaseLinkStatus: "verified",
  imagePath: "/products/babybjorn-smart-potty.jpg",
  changeLog: [
    {
      date: "2026-08-28",
      summary:
        "スマートポッティ・ポッティチェアの商品名と仕様を楽天市場の商品詳細ページで照合し、楽天アフィリエイト公式UIで生成した商品詳細リンクへ更新。",
    },
    {
      date: "2026-08-17",
      summary:
        "記事本文を新テンプレートへ短縮（1行結論→比較→違い→どっち向き→詳細→FAQ）。途中CTAを削除し、購入カードは記事末尾に統一。",
    },
    {
      date: "2026-08-16",
      summary:
        "スマートポッティの本体重量を修正。公式商品ページの仕様（約540g）に合わせ、公式楽天市場店リストの約520g表記を正しました。",
    },
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-10",
      summary: "初回公開。ベビービョルン公式楽天市場店の商品ページを確認。",
    },
  ],
});
