export type {
  ArticleChangeLogEntry,
  ArticleMetadata,
  ArticleMetadataBase,
  ComparisonSide,
  ComparisonRow,
  GuideArticleMetadata,
  ComparisonArticleMetadata,
} from "./articles/types";
export { defineArticleMetadata } from "./articles/types";

// Re-import for use in this file's data definitions.
import type { ArticleMetadata } from "./articles/types";
import { defineArticleMetadata } from "./articles/types";

export const pampersNewbornArticle = defineArticleMetadata({
  id: "pampers-newborn",
  productCount: 2,
  path: "/articles/pampers-newborn/",
  title: "パンパースの新生児用、どっち？｜くらべる商品メモ",
  headline:
    "パンパースの新生児用、どっち？「肌へのいちばん」と「さらさらケア」を比較",
  description:
    "パンパース肌へのいちばんとさらさらケアの新生児用テープを、公式の商品機能と確認状況で比較",
  category: "育児用品",
  tags: ["紙おむつ", "新生児", "パンパース"],
  audiences: ["新生児の保護者", "出産準備中の人"],
  uses: ["毎日使う", "肌への配慮を比較"],
  summary:
    "「肌へのいちばん」と「さらさらケア」を、公式情報・販売ページ・口コミの確認状況に分けて比較します。",
  publishedAt: "2026-07-31",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-07-31",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "verified",
  imagePath: "/products/pampers-premium-newborn.jpg",
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
      date: "2026-07-31",
      summary: "初回公開。メーカー公式の商品機能とサイズ情報を確認。",
    },
  ],
});

export const merriesNewbornArticle = defineArticleMetadata({
  id: "merries-newborn",
  productCount: 2,
  path: "/articles/merries-newborn/",
  title: "メリーズの新生児用、どっち？｜くらべる商品メモ",
  headline:
    "メリーズの新生児用、どっち？「ファーストプレミアム」と「ずっと肌さらエアスルー」を比較",
  description:
    "メリーズ・ファーストプレミアムとずっと肌さらエアスルーの新生児用テープを、公式の商品機能と確認状況で比較",
  category: "育児用品",
  tags: ["紙おむつ", "新生児", "メリーズ"],
  audiences: ["新生児の保護者", "出産準備中の人"],
  uses: ["毎日使う", "肌への配慮を比較"],
  summary:
    "「ファーストプレミアム」と「ずっと肌さらエアスルー」を、公式情報・販売ページ・確認状況に分けて比較します。",
  publishedAt: "2026-08-08",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-08",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/merries-fp-newborn.jpg",
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
      date: "2026-08-08",
      summary: "初回公開。花王公式の商品機能とサイズ情報を確認。",
    },
  ],
});

export const pigeonBottle240Article = defineArticleMetadata({
  id: "pigeon-bottle-240",
  productCount: 2,
  path: "/articles/pigeon-bottle-240/",
  title: "ピジョン母乳実感240ml、どっち？｜くらべる商品メモ",
  headline:
    "ピジョン「母乳実感」240ml、どっち？「耐熱ガラス製」と「プラスチック製（PPSU）」を比較",
  description:
    "ピジョン母乳実感240mlの耐熱ガラス製とプラスチック製（PPSU）を、公式の商品情報と素材の特徴で比較",
  category: "育児用品",
  tags: ["哺乳びん", "240ml", "ピジョン"],
  audiences: ["出産準備中の人", "新生児の保護者"],
  uses: ["授乳の準備", "素材で選ぶ"],
  summary:
    "「耐熱ガラス製」と「プラスチック製（PPSU）」を、公式情報・素材の特長・確認状況に分けて比較します。",
  publishedAt: "2026-08-09",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-glass240.jpg",
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
      date: "2026-08-09",
      summary:
        "初回公開。ピジョン公式の商品情報・Q&Aをもとに素材の違いを整理。",
    },
  ],
});

export const pigeonSlim240Article = defineArticleMetadata({
  id: "pigeon-slim-240",
  productCount: 2,
  path: "/articles/pigeon-slim-240/",
  title: "ピジョン母乳実感 vs スリムタイプ、どっち？｜くらべる商品メモ",
  headline:
    "ピジョンの哺乳びん、どっち？「母乳実感240ml」と「スリムタイプ240ml」を比較",
  description:
    "ピジョン母乳実感240mlとスリムタイプ240mlを、公式の商品情報・乳首体系・形状で比較",
  category: "育児用品",
  tags: ["哺乳びん", "240ml", "ピジョン"],
  audiences: ["出産準備中の人", "新生児の保護者"],
  uses: ["授乳の準備", "シリーズで選ぶ"],
  summary:
    "「母乳実感」と「スリムタイプ」の240mlを、公式情報・乳首体系・形状・確認状況に分けて比較します。",
  publishedAt: "2026-08-09",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-glass240.jpg",
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
      date: "2026-08-09",
      summary:
        "初回公開。ピジョン公式の商品情報・乳首ページをもとに2シリーズの違いを整理。",
    },
  ],
});

export const moonyMArticle = defineArticleMetadata({
  id: "moony-m",
  productCount: 2,
  path: "/articles/moony-m/",
  title: "ムーニーのテープ、どっち？｜くらべる商品メモ",
  headline:
    "ムーニーのテープ、どっち？「低刺激であんしん」と「マシュマロ肌ごこちモレ安心」を比較",
  description:
    "ムーニーのテープタイプ2ライン、「低刺激であんしん」と「マシュマロ肌ごこちモレ安心」を、公式の商品情報とサイズ別仕様で比較",
  category: "育児用品",
  tags: ["紙おむつ", "テープタイプ", "ムーニー"],
  audiences: ["乳児の保護者", "どのおむつを買うか迷っている人"],
  uses: ["毎日使う", "サイズで選ぶ", "機能で選ぶ"],
  summary:
    "「低刺激であんしん」と「マシュマロ肌ごこちモレ安心」を、公式情報・サイズ別仕様・確認状況に分けて比較します。",
  publishedAt: "2026-08-09",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/moony-teishigeki-m.jpg",
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
      date: "2026-08-14",
      summary:
        "「購入時の注意」が空だったため、価格・在庫の確認とサイズ選びの注意文を追加。",
    },
    {
      date: "2026-08-09",
      summary:
        "初回公開。ユニ・チャーム公式の商品ページをもとにサイズ別仕様を整理。",
    },
  ],
});

export const merriesPantsArticle = defineArticleMetadata({
  id: "merries-pants",
  productCount: 2,
  path: "/articles/merries-pants/",
  title: "メリーズのパンツ、どっち？｜くらべる商品メモ",
  headline:
    "メリーズのパンツ、どっち？「ファーストプレミアム」と「ずっと肌さらエアスルー」を比較",
  description:
    "メリーズ・ファーストプレミアムとずっと肌さらエアスルーのパンツタイプを、公式の商品機能とサイズ展開で比較",
  category: "育児用品",
  tags: ["紙おむつ", "パンツタイプ", "メリーズ"],
  audiences: ["パンツタイプへの切り替えを検討中の保護者"],
  uses: ["毎日使う", "肌への配慮を比較"],
  summary:
    "「ファーストプレミアム」と「ずっと肌さらエアスルー」のパンツタイプを、公式情報・販売ページ・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/merries-fp-newborn.jpg",
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
      summary: "初回公開。花王公式の商品機能とパンツタイプのサイズ展開を確認。",
    },
  ],
});

export const shupotArticle = defineArticleMetadata({
  id: "shupot",
  productCount: 2,
  path: "/articles/shupot/",
  title: "ピジョンの鼻吸い器、どっち？｜くらべる商品メモ",
  headline:
    "ピジョンの鼻吸い器、どっち？「電動 シュポット」と「手動 シュポットポンプ＋フィット鼻ノズル」を比較",
  description:
    "ピジョン電動鼻吸い器シュポットと手動鼻吸い器シュポットポンプを、公式情報・電源・お手入れ・価格で比較",
  category: "育児用品",
  tags: ["鼻吸い器", "ピジョン", "シュポット"],
  audiences: ["乳児の保護者", "鼻吸い器の購入を検討中の人"],
  uses: ["鼻水の吸引", "電源・価格で選ぶ"],
  summary:
    "「電動 シュポット」と「手動 シュポットポンプ＋フィット鼻ノズル」を、公式情報・お手入れ・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/shupot-dendo.jpg",
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
        "初回公開。ピジョン公式ショップの商品情報・安全に関するお知らせを確認。",
    },
  ],
});

export const babybjornArticle = defineArticleMetadata({
  id: "babybjorn",
  productCount: 2,
  path: "/articles/babybjorn/",
  title: "ベビービョルンの抱っこひも、どっち？｜くらべる商品メモ",
  headline: "ベビービョルンの抱っこひも、どっち？「HARMONY」と「MINI」を比較",
  description:
    "ベビービョルン HARMONY（新生児〜36ヶ月・4WAY）と MINI（新生児〜12ヶ月・2WAY）を、公式の比較表・対象月齢・抱っこの種類・価格で比較",
  category: "育児用品",
  tags: ["抱っこひも", "ベビービョルン", "新生児"],
  audiences: [
    "新生児の保護者",
    "出産準備中の人",
    "抱っこひもの購入を検討中の人",
  ],
  uses: ["毎日使う", "使える期間で選ぶ", "抱っこの種類で選ぶ"],
  summary:
    "「HARMONY」と「MINI」を、ベビービョルン公式の比較表・対象月齢・抱っこの種類・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-harmony.jpg",
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
      summary: "初回公開。ベビービョルン公式の比較表・製品ページを確認。",
    },
  ],
});

export const babybjornOnekaiArticle = defineArticleMetadata({
  id: "babybjorn-onekai",
  productCount: 2,
  path: "/articles/babybjorn-onekai/",
  title: "ベビービョルンの抱っこひも、どっち？｜くらべる商品メモ",
  headline: "ベビービョルンの抱っこひも、どっち？「ONE KAI」と「MOVE」を比較",
  description:
    "ベビービョルン ONE KAI（新生児〜36ヶ月・4WAY）と MOVE（新生児〜15ヶ月・2WAY・フルメッシュ）を、公式の比較表・対象月齢・抱っこの種類・価格で比較",
  category: "育児用品",
  tags: ["抱っこひも", "ベビービョルン", "新生児"],
  audiences: [
    "新生児の保護者",
    "出産準備中の人",
    "抱っこひもの購入を検討中の人",
  ],
  uses: ["毎日使う", "使える期間で選ぶ", "抱っこの種類で選ぶ"],
  summary:
    "「ONE KAI」と「MOVE」を、ベビービョルン公式の比較表・対象月齢・抱っこの種類・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-onekai.jpg",
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
      summary: "初回公開。ベビービョルン公式の比較表・製品ページを確認。",
    },
  ],
});

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
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
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
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-cradle.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-smart-potty.jpg",
  changeLog: [
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

export const pigeonBottleSizeArticle = defineArticleMetadata({
  id: "pigeon-bottle-160-240",
  productCount: 2,
  path: "/articles/pigeon-bottle-160-240/",
  title: "ピジョン母乳実感160ml vs 240ml、どっち？｜くらべる商品メモ",
  headline: "ピジョンの哺乳びん、どっち？「母乳実感160ml」と「240ml」を比較",
  description:
    "ピジョン母乳実感160mlと240mlを、公式の商品情報・付属乳首・対象月齢目安・価格で比較",
  category: "育児用品",
  tags: ["哺乳びん", "160ml", "240ml", "ピジョン"],
  audiences: ["出産準備中の人", "新生児の保護者"],
  uses: ["授乳の準備", "容量で選ぶ"],
  summary:
    "「160ml」と「240ml」を、公式情報・付属乳首・対象月齢目安・確認状況に分けて比較します。",
  publishedAt: "2026-08-11",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-11",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-160-240-160ml.jpg",
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
      date: "2026-08-12",
      summary:
        "記事冒頭を圧縮。30秒比較の直後に差分だけを置き、条件に応じた比較結論を詳細表の後に移動。迷ったときの販売ページ確認リンクを冒頭に追加。",
    },
    {
      date: "2026-08-11",
      summary:
        "初回公開。ピジョン公式の商品ページをもとに容量・付属乳首・対象月齢目安の違いを整理。",
    },
  ],
});

export const combiTheSArticle = defineArticleMetadata({
  id: "combi-the-s-plus-vs-premium",
  productCount: 2,
  path: "/articles/combi-the-s-plus-vs-premium/",
  title: "コンビ THE S plus と THE S premium、どっち？｜くらべる商品メモ",
  headline:
    "コンビのチャイルドシート、どっち？「THE S plus」と「THE S premium」を比較",
  description:
    "コンビ THE S plus と THE S premiumを、公式の対象身長・使用期間・回転・固定方法・重量・価格で比較",
  category: "チャイルドシート",
  tags: ["チャイルドシート", "コンビ", "新生児", "ISOFIX"],
  audiences: ["出産準備中の人", "チャイルドシートを買い替えたい人"],
  uses: ["新生児から使う", "長く使う", "車への乗せ降ろし"],
  summary:
    "THE S plusとTHE S premiumを、公式の対象身長・使用期間・回転・固定方法・重量・価格に分けて比較します。",
  publishedAt: "2026-08-12",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-12",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/the-s-plus.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-12",
      summary:
        "初回公開。コンビ公式の商品ページで対象身長・使用期間・固定方法・重量・価格を確認。",
    },
  ],
});

export const tigerRiceArticle = defineArticleMetadata({
  id: "tiger-jpv-l100-vs-jpv-m100",
  productCount: 2,
  path: "/articles/tiger-jpv-l100-vs-jpv-m100/",
  title: "タイガー JPV-L100 と JPV-M100、どっち？｜くらべる商品メモ",
  headline: "タイガーの炊飯器、どっち？「JPV-L100」と「JPV-M100」を比較",
  description:
    "タイガー JPV-L100とJPV-M100を、公式の加熱方式・容量・サイズ・質量・価格で比較",
  category: "キッチン家電",
  tags: ["炊飯器", "タイガー", "圧力IH"],
  audiences: ["炊飯器を買い替えたい人", "毎日の炊飯を見直したい人"],
  uses: ["毎日炊飯する", "価格と機能で選ぶ", "お手入れの負担を比べる"],
  summary:
    "JPV-L100とJPV-M100を、タイガー公式の加熱方式・容量・サイズ・質量・価格に分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/tiger-jpv-l100.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。タイガー公式の商品ページで仕様と価格を確認。",
    },
  ],
});

export const tigerPctA120VsPctA150Article = defineArticleMetadata({
  id: "tiger-pct-a120-vs-pct-a150",
  productCount: 2,
  path: "/articles/tiger-pct-a120-vs-pct-a150/",
  title: "タイガー PCT-A120 と PCT-A150、どっち？｜くらべる商品メモ",
  headline: "タイガーの電気ケトル、どっち？「PCT-A120」と「PCT-A150」を比較",
  description:
    "タイガー PCT-A120とPCT-A150を、公式の容量・質量・消費電力・沸とう時間で比較",
  category: "キッチン家電",
  tags: ["電気ケトル", "タイガー", "容量比較"],
  audiences: ["大容量の電気ケトルを選びたい人", "本体の軽さを比べたい人"],
  uses: ["朝の湯沸かし", "家族分の湯沸かし", "来客時"],
  summary:
    "PCT-A120とPCT-A150を、タイガー公式の商品ページで確認できる容量・質量・消費電力・沸とう時間に分けて比較します。",
  publishedAt: "2026-08-17",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-17",
  purchaseLinksCheckedAt: "2026-08-17",
  purchaseLinkStatus: "verified",
  imagePath: "/products/tiger-pct-a120.jpg",
  aboutProductNames: [
    "タイガー 電気ケトル PCT-A120",
    "タイガー 電気ケトル PCT-A150",
  ],
  changeLog: [
    {
      date: "2026-08-17",
      summary:
        "初回公開。タイガー公式の商品ページで仕様と画像、楽天公式生成画面の短縮URLを確認。",
    },
  ],
});

export const zojirushiCoffeeArticle = defineArticleMetadata({
  id: "zojirushi-ec-kv50-vs-ec-ma60",
  productCount: 2,
  path: "/articles/zojirushi-ec-kv50-vs-ec-ma60/",
  title: "象印 EC-KV50 と EC-MA60、どっち？｜くらべる商品メモ",
  headline: "象印のコーヒーメーカー、どっち？「EC-KV50」と「EC-MA60」を比較",
  description:
    "象印 EC-KV50とEC-MA60を、公式の容量・抽出先・濃度調節・サイズ・質量で比較",
  category: "キッチン家電",
  tags: ["コーヒーメーカー", "象印", "キッチン家電"],
  audiences: ["コーヒーメーカーを選びたい人", "抽出先や濃さで選びたい人"],
  uses: ["自宅でコーヒーを淹れる", "抽出先を選ぶ", "置き場所で選ぶ"],
  summary:
    "EC-KV50とEC-MA60を、象印公式の容量・抽出先・濃度調節・サイズ・質量に分けて比較します。",
  publishedAt: "2026-08-17",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-17",
  purchaseLinkStatus: "verified",
  purchaseLinksCheckedAt: "2026-08-17",
  imagePath: "/products/zojirushi-ec-kv50.png",
  aboutProductNames: ["象印 EC-KV50", "象印 EC-MA60"],
  changeLog: [
    {
      date: "2026-08-17",
      summary: "初回公開。象印公式の商品ページで仕様と画像を確認。",
    },
  ],
});

export const zojirushiEqSb22VsAh22Article = defineArticleMetadata({
  id: "zojirushi-eq-sb22-vs-eq-ah22",
  productCount: 2,
  path: "/articles/zojirushi-eq-sb22-vs-eq-ah22/",
  title: "象印 EQ-SB22 と EQ-AH22、どっち？｜くらべる商品メモ",
  headline: "象印のオーブントースター、どっち？「EQ-SB22」と「EQ-AH22」を比較",
  description:
    "象印 EQ-SB22とEQ-AH22を、公式のタイマー・外形寸法・庫内寸法・質量で比較",
  category: "キッチン家電",
  tags: ["オーブントースター", "象印", "キッチン家電"],
  audiences: ["オーブントースターを選びたい人", "設置寸法と質量で比べたい人"],
  uses: ["パンを焼く", "設置場所で選ぶ", "庫内寸法で選ぶ"],
  summary:
    "EQ-SB22とEQ-AH22を、象印公式の商品ページで確認できるタイマー・サイズ・庫内寸法・質量に分けて比較します。",
  publishedAt: "2026-08-20",
  modifiedAt: "2026-08-20",
  productInfoCheckedAt: "2026-08-20",
  purchaseLinksCheckedAt: "2026-08-20",
  purchaseLinkStatus: "verified",
  imagePath: "/products/zojirushi-eq-sb22.png",
  aboutProductNames: ["象印 EQ-SB22", "象印 EQ-AH22"],
  changeLog: [
    {
      date: "2026-08-20",
      summary:
        "初回公開。象印公式の商品ページ・画像と楽天公式生成画面の短縮URLを確認。",
    },
  ],
});

export const zojirushiToasterArticle = defineArticleMetadata({
  id: "zojirushi-eq-aa22-vs-eq-sa22",
  productCount: 2,
  path: "/articles/zojirushi-eq-aa22-vs-eq-sa22/",
  title: "象印 EQ-AA22 と EQ-SA22、どっち？｜くらべる商品メモ",
  headline: "象印のオーブントースター、どっち？「EQ-AA22」と「EQ-SA22」を比較",
  description:
    "象印 EQ-AA22とEQ-SA22を、公式のタイマー・外形寸法・庫内寸法・質量で比較",
  category: "キッチン家電",
  tags: ["オーブントースター", "象印", "キッチン家電"],
  audiences: [
    "オーブントースターを選びたい人",
    "設置寸法とタイマーで比べたい人",
  ],
  uses: ["パンを焼く", "設置場所で選ぶ", "タイマーで選ぶ"],
  summary:
    "EQ-AA22とEQ-SA22を、象印公式の商品ページで確認できるタイマー・サイズ・庫内寸法・質量に分けて比較します。",
  publishedAt: "2026-08-19",
  modifiedAt: "2026-08-19",
  productInfoCheckedAt: "2026-08-19",
  purchaseLinksCheckedAt: "2026-08-19",
  purchaseLinkStatus: "verified",
  imagePath: "/products/zojirushi-eq-aa22.png",
  aboutProductNames: ["象印 EQ-AA22", "象印 EQ-SA22"],
  changeLog: [
    {
      date: "2026-08-19",
      summary:
        "初回公開。象印公式の商品ページ・画像と楽天公式生成画面の短縮URLを確認。",
    },
  ],
});

export const panasonicVacuumArticle = defineArticleMetadata({
  id: "panasonic-mc-sb55k-vs-mc-sb35k",
  productCount: 2,
  path: "/articles/panasonic-mc-sb55k-vs-mc-sb35k/",
  title: "パナソニック MC-SB55K と MC-SB35K、どっち？｜くらべる商品メモ",
  headline: "パナソニックの掃除機、どっち？「MC-SB55K」と「MC-SB35K」を比較",
  description:
    "パナソニック MC-SB55KとMC-SB35Kを、公式の質量・センサー・充電スタンド・ブラシで比較",
  category: "生活家電",
  tags: ["掃除機", "パナソニック", "コードレス"],
  audiences: ["掃除機を買い替えたい人", "コードレス掃除機を選びたい人"],
  uses: ["毎日掃除する", "軽さで選ぶ", "収納方法で選ぶ"],
  summary:
    "MC-SB55KとMC-SB35Kを、パナソニック公式の質量・センサー・充電スタンド・ブラシに分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/panasonic-mc-sb55k.png",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。パナソニック公式の商品ページで仕様・機能を確認。",
    },
  ],
});

export const panasonicHairDryerArticle = defineArticleMetadata({
  id: "panasonic-eh-ne7m-vs-eh-ne5m",
  productCount: 2,
  path: "/articles/panasonic-eh-ne7m-vs-eh-ne5m/",
  title: "パナソニック EH-NE7M と EH-NE5M、どっち？｜くらべる商品メモ",
  headline: "パナソニックのドライヤー、どっち？「EH-NE7M」と「EH-NE5M」を比較",
  description:
    "パナソニック イオニティ EH-NE7MとEH-NE5Mを、公式のミネラル機能・イオン・低温ケア・速乾で比較",
  category: "美容家電",
  tags: ["ドライヤー", "パナソニック", "ヘアケア"],
  audiences: ["ドライヤーを買い替えたい人", "公式情報で機能差を確認したい人"],
  uses: ["毎日のヘアドライ", "低温ケアを使う", "大風量で乾かす"],
  summary:
    "EH-NE7MとEH-NE5Mを、パナソニック公式のミネラル機能・マイナスイオン・低温ケアモード・大風量の案内で比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/panasonic-eh-ne7m.png",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。パナソニック公式の商品ページで機能差を確認。",
    },
  ],
});

export const tefalKettleArticle = defineArticleMetadata({
  id: "tefal-ko5901jp-vs-ko8601j0",
  productCount: 2,
  path: "/articles/tefal-ko5901jp-vs-ko8601j0/",
  title:
    "ティファール ジャスティン ロックとアプレシア ロック コントロール、どっち？｜くらべる商品メモ",
  headline:
    "ティファールの電気ケトル、どっち？「KO5901JP」と「KO8601J0」を比較",
  description:
    "ティファール ジャスティン ロック KO5901JPとアプレシア ロック コントロール KO8601J0を、公式の容量・重量・温度調節・保温機能で比較",
  category: "キッチン家電",
  tags: ["電気ケトル", "ティファール", "温度調節"],
  audiences: ["電気ケトルを買い替えたい人", "容量と温度調節機能で選びたい人"],
  uses: ["毎日使う", "大容量で沸かす", "温度を使い分ける"],
  summary:
    "KO5901JPとKO8601J0を、ティファール公式の容量・重量・温度調節・保温などの仕様に分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/tefal-ko5901jp.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary:
        "初回公開。ティファール公式の商品ページで容量・重量・機能を確認。",
    },
  ],
});

export const sharpKcS50VsFuS50Article = defineArticleMetadata({
  id: "sharp-kc-s50-vs-fu-s50",
  productCount: 2,
  path: "/articles/sharp-kc-s50-vs-fu-s50/",
  title: "シャープ KC-S50とFU-S50、どっち？｜くらべる商品メモ",
  headline: "シャープの空気清浄機、どっち？「KC-S50」と「FU-S50」を比較",
  description:
    "シャープ KC-S50とFU-S50を、公式の加湿・サイズ・重量・適用畳数・運転音・センサーで比較",
  category: "生活家電",
  tags: ["空気清浄機", "加湿空気清浄機", "シャープ"],
  audiences: ["空気清浄機を選びたい人", "加湿機能の有無で比較したい人"],
  uses: ["リビングで使う", "空気清浄と加湿を比較"],
  summary:
    "KC-S50とFU-S50を、シャープ公式の加湿機能・サイズ・重量・適用畳数・運転音・センサーに分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/sharp-kc-s50.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。シャープ公式の商品ページと仕様ページで仕様を確認。",
    },
  ],
  leftModel: {
    brand: "シャープ",
    line: "KC-S50",
    tagline: "加湿も使うなら",
    image: "/products/sharp-kc-s50.jpg",
    imageAlt: "シャープ 加湿空気清浄機 KC-S50",
    officialHref: "https://jp.sharp/kuusei/products/kcs50/",
    guidePoints: ["加湿機能も使いたく、空気清浄と加湿を1台でまとめたい人向け"],
  },
  rightModel: {
    brand: "シャープ",
    line: "FU-S50",
    tagline: "小型・軽量なら",
    image: "/products/sharp-fu-s50.jpg",
    imageAlt: "シャープ 空気清浄機 FU-S50",
    officialHref: "https://jp.sharp/kuusei/products/fus50/",
    guidePoints: [
      "加湿機能は不要で、より小型・軽量の本体とニオイセンサーを重視する人向け",
    ],
  },
  keyDiffRows: [
    { label: "加湿", left: "あり", right: "なし", highlight: "left" },
    { label: "最大加湿量", left: "500mL/h", right: "—", highlight: "left" },
    {
      label: "外形寸法",
      left: "399×230×613mm",
      right: "383×209×540mm",
      highlight: "right",
    },
    {
      label: "本体重量",
      left: "約7.5kg",
      right: "約4.9kg",
      highlight: "right",
      highlightNote: "約2.6kg軽い",
    },
    { label: "ニオイセンサー", left: "—", right: "あり", highlight: "right" },
  ],
  faqEntries: [
    {
      question: "KC-S50とFU-S50の大きな違いは？",
      answer:
        "KC-S50は加湿機能を搭載し、最大加湿量は500mL/hです。FU-S50は加湿なしで、ニオイセンサーを搭載しています。",
    },
    {
      question: "空気清浄の適用畳数は違う？",
      answer:
        "空気清浄の適用畳数は、どちらも～23畳です。プラズマクラスター適用畳数はKC-S50が約13畳、FU-S50が約14畳です。",
    },
    {
      question: "本体が軽くて小さいのはどちら？",
      answer:
        "FU-S50は外形383×209×540mm、約4.9kgです。KC-S50は399×230×613mm、約7.5kgなので、FU-S50の方が小さく軽量です。",
    },
    {
      question: "楽天市場の価格は比較できる？",
      answer:
        "価格・在庫・ポイント・送料は変動するため、型番検索ページで購入時点の表示を確認してください。",
    },
  ],
  lead: "シャープのKC-S50とFU-S50を、公式ページで確認できる加湿機能・最大加湿量・サイズ・重量・適用畳数・運転音・センサーで比較します。価格は販売先でご確認ください。",
  summaryParagraph:
    "加湿を1台で済ませたいならKC-S50、加湿が不要で本体の小ささ・軽さやニオイセンサーを重視するならFU-S50が候補です。空気清浄の適用畳数はどちらも～23畳です。",
  socialProofQuery: "シャープ KC-S50 FU-S50",
  officialDescription:
    "比較の根拠は、シャープ公式商品ページと各仕様ページで確認した情報です。KC-S50は加湿空気清浄機、FU-S50は空気清浄機として掲載されています。",
  purchaseWarning:
    "加湿の要否、本体サイズ・重量、運転音、センサーなど、設置場所と必要な機能を購入前に確認してください。価格・在庫・ポイント・送料は販売先で変わります。",
  disclaimer:
    "この比較は、シャープ公式の商品ページと仕様ページで確認できる情報を根拠にしています。SNSの感想は比較の根拠にしていません。",
});

export const panasonicNeFl1aVsNeFl1cArticle = defineArticleMetadata({
  id: "panasonic-ne-fl1a-vs-ne-fl1c",
  productCount: 2,
  path: "/articles/panasonic-ne-fl1a-vs-ne-fl1c/",
  title: "パナソニック NE-FL1A と NE-FL1C、どっち？｜くらべる商品メモ",
  headline:
    "パナソニックの単機能レンジ、どっち？「NE-FL1A」と「NE-FL1C」を比較",
  description:
    "パナソニック NE-FL1AとNE-FL1Cを、公式の容量・庫内寸法・質量・自動メニュー数で比較",
  category: "キッチン家電",
  tags: ["電子レンジ", "単機能レンジ", "パナソニック"],
  audiences: ["単機能レンジを選びたい人", "公式仕様で機種を比較したい人"],
  uses: ["毎日使う", "軽さで選ぶ", "庫内幅で選ぶ"],
  summary:
    "NE-FL1AとNE-FL1Cを、パナソニック公式の容量・庫内寸法・質量・自動メニュー数・確認状況に分けて比較します。",
  publishedAt: "2026-08-15",
  modifiedAt: "2026-08-15",
  productInfoCheckedAt: "2026-08-15",
  purchaseLinksCheckedAt: "2026-08-15",
  purchaseLinkStatus: "verified",
  imagePath: "/products/panasonic-ne-fl1a.jpg",
  changeLog: [
    {
      date: "2026-08-15",
      summary:
        "初回公開。パナソニック公式の商品ページ・仕様ページと楽天公式生成リンクを確認。",
    },
  ],
});

export const panasonicAirCleanerArticle = defineArticleMetadata({
  id: "panasonic-f-px60c-vs-f-px70c",
  productCount: 2,
  path: "/articles/panasonic-f-px60c-vs-f-px70c/",
  title: "パナソニック F-PX60C と F-PX70C、どっち？｜くらべる商品メモ",
  headline: "パナソニックの空気清浄機、どっち？「F-PX60C」と「F-PX70C」を比較",
  description:
    "パナソニック F-PX60CとF-PX70Cを、公式の適用床面積・清浄時間・寸法・重量・運転音・消費電力で比較",
  category: "生活家電",
  tags: ["空気清浄機", "パナソニック", "ナノイー"],
  audiences: ["空気清浄機を選びたい人", "設置幅と清浄性能を比べたい人"],
  uses: ["リビングで使う", "設置場所で選ぶ", "空気清浄の仕様を比べる"],
  summary:
    "F-PX60CとF-PX70Cを、パナソニック公式の適用床面積・清浄時間・寸法・重量・運転音・消費電力に分けて比較します。",
  publishedAt: "2026-08-18",
  modifiedAt: "2026-08-18",
  productInfoCheckedAt: "2026-08-18",
  purchaseLinksCheckedAt: "2026-08-18",
  purchaseLinkStatus: "verified",
  imagePath: "/products/panasonic-f-px60c.png",
  aboutProductNames: ["パナソニック F-PX60C", "パナソニック F-PX70C"],
  changeLog: [
    {
      date: "2026-08-18",
      summary:
        "初回公開。パナソニック公式の商品ページ・仕様ページと楽天公式生成画面の短縮URLを確認。",
    },
  ],
});

export const panasonicShaverEsLt4bVsEsLv7jArticle = defineArticleMetadata({
  id: "panasonic-es-lt4b-vs-es-lv7j",
  productCount: 2,
  path: "/articles/panasonic-es-lt4b-vs-es-lv7j/",
  title: "パナソニック ES-LT4B と ES-LV7J、どっち？｜くらべる商品メモ",
  headline:
    "パナソニックのラムダッシュ、どっち？「ES-LT4B」と「ES-LV7J」を比較",
  description:
    "パナソニック ES-LT4BとES-LV7Jを、公式の刃数・サイズ・質量・充電方式・防水仕様で比較",
  category: "美容家電",
  tags: ["シェーバー", "ラムダッシュ", "パナソニック"],
  audiences: ["3枚刃の軽い本体を選びたい人", "5枚刃と洗浄充電器を確認したい人"],
  uses: ["毎日ひげを剃る", "刃数で選ぶ", "本体重量で選ぶ"],
  summary:
    "ES-LT4BとES-LV7Jを、パナソニック公式の刃数・寸法・質量・充電方式・防水仕様に分けて比較します。",
  publishedAt: "2026-08-19",
  modifiedAt: "2026-08-19",
  productInfoCheckedAt: "2026-08-19",
  purchaseLinksCheckedAt: "2026-08-19",
  purchaseLinkStatus: "verified",
  imagePath: "/products/panasonic-es-lt4b.jpg",
  aboutProductNames: ["パナソニック ES-LT4B", "パナソニック ES-LV7J"],
  changeLog: [
    {
      date: "2026-08-19",
      summary:
        "初回公開。パナソニック公式の商品ページ・仕様ページと楽天公式生成リンクを確認。",
    },
  ],
});

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
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-12",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/thermos-jnl-s500.jpg",
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
      date: "2026-08-12",
      summary: "初回公開。サーモス・タイガー公式の商品ページで仕様を確認。",
    },
  ],
});

export const yamazakiTowerDeskPanelArticle = defineArticleMetadata({
  id: "yamazaki-tower-desk-panel-vs-pen-stand",
  productCount: 2,
  path: "/articles/yamazaki-tower-desk-panel-vs-pen-stand/",
  title:
    "山崎実業 tower デスク横パネルとペンスタンド、どっち？｜くらべる商品メモ",
  headline:
    "山崎実業 towerの収納、どっち？「デスク横トレー付きスチールパネル」と「マグネットペンスタンド」を比較",
  description:
    "山崎実業 towerのデスク横トレー付きスチールパネルとマグネットペンスタンドを、公式のサイズ・重量・耐荷重・設置方法で比較",
  category: "収納用品",
  tags: ["山崎実業", "tower", "デスク収納"],
  audiences: ["デスク周りを整理したい人", "towerの収納用品を比較したい人"],
  uses: ["デスク横に収納", "ペンを立てて収納"],
  summary:
    "デスク横トレー付きスチールパネルとマグネットペンスタンドを、公式情報・確認状況・型番検索に分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/yamazaki-tower-desk-panel.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。山崎実業公式の商品ページで仕様と画像を確認。",
    },
  ],
});

export const yamazakiFreeBroomArticle = defineArticleMetadata({
  id: "yamazaki-free-broom-32-vs-45",
  productCount: 2,
  path: "/articles/yamazaki-free-broom-32-vs-45/",
  title: "山崎産業 JS自由箒32 と 45、どっち？｜くらべる商品メモ",
  headline: "山崎産業のJS自由箒、32と45を比較",
  description:
    "山崎産業 JS自由箒32と45を、公式の使用サイズ・重量・材質・個装ケースサイズで比較",
  category: "生活雑貨",
  tags: ["山崎産業", "ほうき", "清掃用品"],
  audiences: ["ほうきを選びたい人", "掃く幅と重量を比べたい人"],
  uses: ["床を掃く", "清掃用品を比較する"],
  summary: "JS自由箒32と45を、山崎産業公式の仕様と確認状況に分けて比較します。",
  publishedAt: "2026-08-16",
  modifiedAt: "2026-08-16",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "verified",
  imagePath: "/products/yamazaki-free-broom-32.jpg",
  changeLog: [
    {
      date: "2026-08-16",
      summary: "初回公開。山崎産業公式の商品ページと楽天公式生成リンクを確認。",
    },
  ],
});

export const yamazakiCondorWagonArticle = defineArticleMetadata({
  id: "yamazaki-condor-wagon-vs-self-wagon",
  productCount: 2,
  path: "/articles/yamazaki-condor-wagon-vs-self-wagon/",
  title: "山崎産業 コンドル ワゴン、どっち？｜くらべる商品メモ",
  headline:
    "山崎産業 コンドルのワゴン、どっち？「サイドメッシュワゴンII」と「セルフワゴンII」を比較",
  description:
    "山崎産業 コンドル FU943-000X-MBとFU944-000X-MBを、公式のサイズ・重量・材質・商品説明で比較",
  category: "収納用品",
  tags: ["山崎産業", "コンドル", "ワゴン"],
  audiences: [
    "荷物置きワゴンを選びたい人",
    "店舗や施設の収納用品を比較したい人",
  ],
  uses: ["荷物を置く", "ワゴンを比較する"],
  summary:
    "コンドル サイドメッシュワゴンIIとセルフワゴンIIを、山崎産業公式の仕様と確認状況に分けて比較します。",
  publishedAt: "2026-08-14",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-14",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/yamazaki-condor-fu943-000x-mb.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-14",
      summary:
        "初回公開。山崎産業公式の商品ページでFU943-000X-MBとFU944-000X-MBの仕様を確認。",
    },
  ],
});

export const yamazakiDustWagonArticle = defineArticleMetadata({
  id: "yamazaki-dust-wagon-45l-2division-vs-3division",
  productCount: 2,
  path: "/articles/yamazaki-dust-wagon-45l-2division-vs-3division/",
  title: "山崎実業 45L分別ダストワゴン、どっち？｜くらべる商品メモ",
  headline: "山崎実業の45L分別ダストワゴン、2分別と3分別を比較",
  description:
    "山崎実業の蓋付き目隠し分別ダストワゴン45Lを、公式の分別数・設置幅・重量・耐荷重で比較",
  category: "キッチン・ごみ箱収納",
  tags: ["山崎実業", "ダストワゴン", "ごみ箱"],
  audiences: ["ごみ箱の設置幅を抑えたい人", "45L袋を複数に分別したい人"],
  uses: ["ごみを分別する", "キッチン周りに置く", "設置幅を確認する"],
  summary:
    "山崎実業の45L分別ダストワゴン2分別・3分別を、公式の仕様と確認状況に分けて比較します。",
  publishedAt: "2026-08-15",
  modifiedAt: "2026-08-15",
  productInfoCheckedAt: "2026-08-15",
  purchaseLinksCheckedAt: "2026-08-15",
  purchaseLinkStatus: "verified",
  imagePath: "/products/yamazaki-dust-wagon-45l-2division.jpg",
  changeLog: [
    {
      date: "2026-08-15",
      summary: "初回公開。山崎実業公式の商品ページと楽天公式生成リンクを確認。",
    },
  ],
});

export const zojirushiElectricKettleArticle = defineArticleMetadata({
  id: "zojirushi-ck-pa08-vs-ck-dc08",
  productCount: 2,
  path: "/articles/zojirushi-ck-pa08-vs-ck-dc08/",
  title: "象印 CK-PA08 と CK-DC08、どっち？｜くらべる商品メモ",
  headline: "象印の電気ケトル、どっち？「CK-PA08」と「CK-DC08」を比較",
  description:
    "象印 CK-PA08とCK-DC08を、公式の容量・沸とう時間・安全設計・ほこり対策・手入れ方法で比較",
  category: "キッチン家電",
  tags: ["電気ケトル", "象印", "キッチン家電"],
  audiences: ["電気ケトルを選びたい人", "安全設計や手入れ方法を比べたい人"],
  uses: ["毎日のお湯沸かし", "キッチンで使う", "安全設計を確認する"],
  summary:
    "CK-PA08とCK-DC08を、象印公式の商品ページで確認できる仕様・安全設計・手入れ方法に分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinksCheckedAt: "2026-08-13",
  purchaseLinkStatus: "verified",
  imagePath: "/products/zojirushi-ck-pa08.webp",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。象印公式の商品ページでCK-PA08とCK-DC08の仕様を確認。",
    },
  ],
});

export const tefalGarmentSteamerArticle = defineArticleMetadata({
  id: "tefal-dv4030j0-vs-dv8070j0",
  productCount: 2,
  path: "/articles/tefal-dv4030j0-vs-dv8070j0/",
  title: "ティファール DV4030J0 と DV8070J0、どっち？｜くらべる商品メモ",
  headline:
    "ティファールの衣類スチーマー、どっち？「DV4030J0」と「DV8070J0」を比較",
  description:
    "ティファール DV4030J0とDV8070J0を、公式のスチーム量・立ち上がり・連続運転・水タンク容量・かけ面で比較",
  category: "衣類ケア",
  tags: ["衣類スチーマー", "ティファール", "衣類ケア"],
  audiences: ["衣類スチーマーを選びたい人", "スチーム量や準備時間を比べたい人"],
  uses: ["衣類のシワ伸ばし", "出かける前の衣類ケア", "アイロンとして使う"],
  summary:
    "DV4030J0とDV8070J0を、ティファール公式の商品ページで確認できるスチーム量・立ち上がり・連続運転・かけ面に分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinksCheckedAt: "2026-08-13",
  purchaseLinkStatus: "verified",
  imagePath: "/products/tefal-dv4030j0.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary:
        "初回公開。ティファール公式の商品ページでDV4030J0とDV8070J0の仕様を確認。",
    },
  ],
});

export const kingjimTepraArticle = defineArticleMetadata({
  id: "kingjim-tepra-sr-r2500p-vs-sr-mk1",
  productCount: 2,
  path: "/articles/kingjim-tepra-sr-r2500p-vs-sr-mk1/",
  title:
    "キングジム テプラ PRO SR-R2500P と SR-MK1、どっち？｜くらべる商品メモ",
  headline: "キングジム「テプラ」PRO、どっち？「SR-R2500P」と「SR-MK1」を比較",
  description:
    "キングジム テプラ PRO SR-R2500PとSR-MK1を、公式の対応テープ幅・電源・寸法・質量・印刷幅で比較",
  category: "デスク用品",
  tags: ["テプラ", "ラベルライター", "キングジム", "デスク用品"],
  audiences: [
    "ラベルライターを選びたい人",
    "対応テープ幅や電源方式で比べたい人",
  ],
  uses: ["収納ラベルを作る", "仕事用品を整理する", "スマホからラベルを作る"],
  summary:
    "SR-R2500PとSR-MK1を、キングジム公式の商品ページで確認できる対応テープ幅・電源・寸法・質量・印刷幅に分けて比較します。",
  publishedAt: "2026-08-14",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-14",
  purchaseLinksCheckedAt: "2026-08-14",
  purchaseLinkStatus: "verified",
  imagePath: "/products/kingjim-sr-r2500p.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-14",
      summary:
        "初回公開。キングジム公式の商品ページで仕様を確認し、楽天公式UIで成果リンクを生成。",
    },
  ],
});

export const panasonicFyhvx120VsFyhvx90Article = defineArticleMetadata({
  id: "panasonic-f-yhvx120-vs-f-yhvx90",
  productCount: 2,
  path: "/articles/panasonic-f-yhvx120-vs-f-yhvx90/",
  title: "パナソニック F-YHVX120とF-YHVX90、どっち？｜くらべる商品メモ",
  headline:
    "パナソニックの衣類乾燥除湿機、どっち？「F-YHVX120」と「F-YHVX90」を比較",
  description:
    "パナソニック F-YHVX120とF-YHVX90を、公式のタンク容量・木造対応畳数・重量・寸法・強運転音で比較",
  category: "生活家電",
  tags: ["衣類乾燥除湿機", "除湿機", "パナソニック"],
  audiences: [
    "衣類乾燥除湿機を選びたい人",
    "タンク容量や設置サイズで比較したい人",
  ],
  uses: ["部屋干し", "衣類を乾燥する", "除湿機を比較する"],
  summary:
    "F-YHVX120とF-YHVX90を、パナソニック公式のタンク容量・木造対応畳数・重量・寸法・強運転音に分けて比較します。",
  publishedAt: "2026-08-15",
  modifiedAt: "2026-08-15",
  productInfoCheckedAt: "2026-08-15",
  purchaseLinksCheckedAt: "2026-08-15",
  purchaseLinkStatus: "verified",
  imagePath: "/products/f-yhvx120.jpg",
  changeLog: [
    {
      date: "2026-08-15",
      summary:
        "比較表とFAQの本体寸法の表記を修正。幅・高さの取り違えを解消し、選び分けの結論を公式仕様に合わせて更新。",
    },
    {
      date: "2026-08-15",
      summary:
        "初回公開。パナソニック公式のF-YHVX120・F-YHVX90仕様ページで数値を確認。",
    },
  ],
});

export const panasonicBabyMonitorArticle = defineArticleMetadata({
  id: "panasonic-baby-monitor-kx-hc705",
  productCount: 1,
  path: "/articles/panasonic-baby-monitor-kx-hc705/",
  title: "パナソニック ベビーモニター KX-HC705、向いている人｜くらべる商品メモ",
  headline:
    "パナソニック ベビーモニター KX-HC705はどんな人向け？公式情報から整理",
  description:
    "パナソニック ベビーモニター KX-HC705の機能を、公式ページで確認できる情報から単品で整理",
  category: "育児用品",
  tags: ["ベビーモニター", "見守り", "パナソニック"],
  audiences: ["乳幼児の保護者", "別室で家事をしながら見守りたい人"],
  uses: ["赤ちゃんの見守り"],
  summary:
    "KX-HC705はDECT方式で接続設定が不要・音/動作/温度の3センサーを搭載した単品ベビーモニター。公式情報を確認して整理します。",
  publishedAt: "2026-08-14",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-14",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "verified",
  imagePath: "/products/panasonic-kx-hc705.jpg",
  aboutProductNames: ["パナソニック ベビーモニター KX-HC705"],
  changeLog: [
    {
      date: "2026-08-14",
      summary: "初回公開。パナソニック公式の商品機能と仕様を確認。",
    },
    {
      date: "2026-08-17",
      summary:
        "商品ガイドとして正式公開。単一商品記事のコンテンツタイプを整理し、構成を標準に合わせた。",
    },
  ],
});

export const panasonicEhNa9mGuideArticle = defineArticleMetadata({
  id: "panasonic-eh-na9m-guide",
  productCount: 1,
  path: "/articles/panasonic-eh-na9m-guide/",
  title: "パナソニック ナノケア EH-NA9M、向いている人｜くらべる商品メモ",
  headline: "パナソニック ナノケア EH-NA9Mはどんな人向け？公式情報から整理",
  description:
    "パナソニック ナノケア EH-NA9Mの機能・モード・風量・質量を、公式ページで確認できる情報から単品で整理",
  category: "美容家電",
  tags: ["ドライヤー", "ナノケア", "パナソニック"],
  audiences: ["髪のケア機能を重視する人", "複数のモードを使い分けたい人"],
  uses: ["毎日のヘアケア"],
  summary:
    "EH-NA9Mはミネラル・UVケア・複数モードを搭載したパナソニック ナノケアの上位モデル。公式情報を確認して整理します。",
  publishedAt: "2026-08-17",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "verified",
  imagePath: "/products/panasonic-eh-na9m.jpg",
  aboutProductNames: ["パナソニック ナノケア EH-NA9M"],
  changeLog: [
    {
      date: "2026-08-17",
      summary:
        "初回公開。パナソニック公式の商品ページ・仕様ページで EH-NA9M の機能と仕様を確認。",
    },
  ],
});

export const thermosKfm020VsKfi020Article = defineArticleMetadata({
  id: "thermos-kfm-020-vs-kfi-020",
  productCount: 2,
  path: "/articles/thermos-kfm-020-vs-kfi-020/",
  title: "サーモス KFM-020 と KFI-020、どっち？｜くらべる商品メモ",
  headline: "サーモスのフライパン、どっち？「KFM-020」と「KFI-020」を比較",
  description:
    "サーモス KFM-020とKFI-020を、公式の対応熱源・内径・寸法・重量・価格で比較",
  category: "キッチン用品",
  tags: ["フライパン", "サーモス", "キッチン用品"],
  audiences: ["20cmのフライパンを選びたい人", "IH対応か軽さを比べたい人"],
  uses: ["毎日の調理", "フライパンを比較する", "熱源を確認する"],
  summary:
    "サーモス KFM-020とKFI-020を、公式ページで確認できる対応熱源・重量・寸法・価格に分けて比較します。",
  publishedAt: "2026-08-15",
  modifiedAt: "2026-08-15",
  productInfoCheckedAt: "2026-08-15",
  purchaseLinksCheckedAt: "2026-08-15",
  purchaseLinkStatus: "verified",
  imagePath: "/products/thermos-kfm-020.jpg",
  changeLog: [
    {
      date: "2026-08-15",
      summary:
        "初回公開。サーモス公式のKFM・KFIシリーズページで仕様と画像を確認。",
    },
  ],
});

export const tigerMtaJ050GuideArticle = defineArticleMetadata({
  id: "tiger-mta-j050-guide",
  productCount: 2,
  path: "/articles/tiger-mta-j050-guide/",
  title: "タイガー MTA-J050とMTA-J080、どっち？｜くらべる商品メモ",
  headline: "タイガー MTA-J050とMTA-J080を比較。容量・重さ・保温保冷の違い",
  description:
    "タイガー MTA-J050とMTA-J080を、公式ページで確認できる容量・重量・保温保冷効力・寸法などから比較",
  category: "生活雑貨",
  tags: ["水筒", "タイガー", "保冷ボトル"],
  audiences: [
    "0.5Lと0.8Lの水筒で迷っている人",
    "容量と持ち運びやすさを比較したい人",
  ],
  uses: ["通勤・通学", "外出時の水分補給", "水筒の容量比較"],
  summary:
    "タイガー MTA-J050とMTA-J080は同じシリーズの真空断熱ボトル。容量・重量・保温保冷効力・寸法の違いを公式情報から整理します。",
  publishedAt: "2026-08-16",
  modifiedAt: "2026-08-16",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/tiger-mta-j050.jpg",
  changeLog: [
    {
      date: "2026-08-16",
      summary:
        "MTA-J050とMTA-J080の公式仕様を比較し、容量・重量・保温保冷効力を整理。",
    },
  ],
});

export const panasonicEhNa9mVsEhNa7mArticle = defineArticleMetadata({
  id: "panasonic-eh-na9m-vs-eh-na7m",
  productCount: 2,
  path: "/articles/panasonic-eh-na9m-vs-eh-na7m/",
  title: "パナソニック ナノケア EH-NA9MとEH-NA7M、どっち？｜くらべる商品メモ",
  headline:
    "パナソニック ナノケア EH-NA9MとEH-NA7Mを比較。機能・重さ・収納性の違い",
  description:
    "パナソニック ナノケア EH-NA9MとEH-NA7Mを、公式ページで確認できる搭載機能・モード・風量・質量・収納性から比較",
  category: "美容家電",
  tags: ["ドライヤー", "パナソニック", "ナノケア"],
  audiences: [
    "髪のケア機能を重視する人",
    "持ち運びやすいドライヤーを選びたい人",
  ],
  uses: ["毎日のヘアケア", "ドライヤーを比較する", "収納性で選ぶ"],
  summary:
    "ナノケア EH-NA9MとEH-NA7Mを、公式仕様で確認できる機能・モード・風量・質量・収納性に分けて比較します。",
  publishedAt: "2026-08-16",
  modifiedAt: "2026-08-16",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "verified",
  imagePath: "/products/panasonic-eh-na9m.jpg",
  changeLog: [
    {
      date: "2026-08-16",
      summary:
        "初稿作成。パナソニック公式の商品ページ・仕様ページで比較項目を確認。楽天アフィリエイトリンクを生成・確認済み。",
    },
  ],
});

type CommercialArticleSeed = {
  id: string;
  title: string;
  headline: string;
  description: string;
  category: string;
  tags: readonly string[];
  audiences: readonly string[];
  uses: readonly string[];
  summary: string;
  leftProduct: string;
  rightProduct: string;
  leftPoint: string;
  rightPoint: string;
  productInfoCheckedAt?: string;
  modifiedAt?: string;
  purchaseLinksCheckedAt?: string;
  purchaseLinkStatus?: "verified" | "unverified";
  officialSources?: readonly {
    label: string;
    url: `https://${string}`;
  }[];
  verifiedRows?: readonly {
    label: string;
    left: string;
    right: string;
  }[];
  /** 商品固有のFAQ（省略時は汎用FAQ） */
  faqEntries?: readonly { question: string; answer: string }[];
  /** リード文の上書き（省略時は summary + 汎用文） */
  lead?: string;
  /** 選び方ガイドのステップ（省略時は汎用4ステップ） */
  decisionGuideSteps?: readonly string[];
};

const commercialArticleSeeds: readonly CommercialArticleSeed[] = [
  {
    id: "roborock-qrevo-curv-vs-dreame-x50",
    title:
      "ロボロック Qrevo CurvとDreame X50 Ultra、どっち？｜くらべる商品メモ",
    headline:
      "Roborock Qrevo CurvとDreame X50 Ultraを比較。段差・モップ・自動化で選ぶ",
    description:
      "ロボット掃除機を、公式仕様で確認できる吸引力・段差対応・モップ・ステーション機能から比較します。",
    category: "生活家電",
    tags: ["ロボット掃除機", "時短家電", "掃除"],
    audiences: [
      "段差や敷居が多い住まいの人",
      "毛絡まりの少ない掃除機を探している人",
    ],
    uses: ["床掃除", "共働きの家事効率化", "ロボット掃除機選び"],
    summary:
      "ロボット掃除機の候補を、吸引力・段差対応・モップ・障害物回避の仕様で比べます。",
    leftProduct: "Roborock Qrevo Curv",
    rightProduct: "Dreame X50 Ultra",
    leftPoint: "毛络まりゼロ・75℃温水ドック・モップリフト20mmを重視する人向け",
    rightPoint:
      "最大6cm段差対応・100日ゴミ収集・200種障害物回避を重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Roborock Qrevo Curv 公式商品ページ",
        url: "https://jp.roborock.com/pages/roborock-qrevo-curv",
      },
      {
        label: "Dreame X50 Ultra 公式商品ページ",
        url: "https://www.dreametech.jp/products/x50-ultra",
      },
    ],
    verifiedRows: [
      {
        label: "吸引力",
        left: "18,500Pa",
        right: "20,000Pa",
      },
      {
        label: "最大段差対応",
        left: "4cm（自動前輪リフト）",
        right: "6cm（ProLeap格納式レッグ）",
      },
      {
        label: "メインブラシ",
        left: "デュアル毛絡まり防止ブラシ",
        right: "デュアル絡まり除去ブラシ（TPU+ゴム）",
      },
      {
        label: "モップ",
        left: "高速回転200回転/分・壁際0mm・30段階水量調整",
        right: "MopExtend RoboSwing（最大4cmせり出し）・32段階水量調整",
      },
      {
        label: "モップリフトアップ",
        left: "20mm",
        right: "10.5mm",
      },
      {
        label: "障害物認識",
        left: "最大62種（ストラクチャードライト+RGBカメラ）",
        right: "最大200種（3D構造化ライト+AIカメラ）",
      },
      {
        label: "ステーション",
        left: "4way全自動ドックQ3（75℃温水洗浄・自動乾燥・ゴミ収集60日分）",
        right: "6way全自動PowerDock（自動給水・洗浄液補充・ゴミ収集100日分）",
      },
      {
        label: "バッテリー",
        left: "公式未公表（自動充電あり）",
        right: "最長220分（最大205㎡対応）",
      },
      {
        label: "本体高さ",
        left: "公式未公表",
        right: "89mm（センサー格納時）",
      },
    ],
    lead: "ロボット掃除機のロボロック Qrevo Curv（18,500Pa・段差4cm）と Dreame X50 Ultra（20,000Pa・段差6cm）を比較します。吸引力・段差対応・モップ・ステーション機能の公式仕様を確認します。",
    faqEntries: [
      {
        question: "段差が多い家ならどれがいい？",
        answer:
          "Dreame X50 Ultraは最大6cmの段差対応（ProLeapシステム）を公式に謳っています。Roborock Qrevo Curvは最大4cmです。引き戸のレールや二重の敷居がある場合はX50 Ultraの方が適しています。",
      },
      {
        question: "毛络まりが気になるのはどっち？",
        answer:
          "両機種ともデュアルブラシで毛络まり低減を謳っています。Roborockは第三者認証機関テュフラインランドで毛络まり度0%の認証を取得しています。",
      },
      {
        question: "ドックの手入れはどっちが楽？",
        answer:
          "Dreame X50 Ultraは6way全自動ステーションで、自動給水・洗浄液補充・ゴミ収集100日分と自動化が進んでいます。Roborockは75℃温水洗浄と自動乾燥が特徴で、ゴミ収集は60日分です。",
      },
      {
        question: "広いお部屋に向いているのは？",
        answer:
          "Dreame X50 Ultraはバッテリー最長220分・最大205㎡対応と公式に記載されています。Roborockは公式未公表ですが、自動充電・再開機能は搭載しています。",
      },
    ],
    decisionGuideSteps: [
      "住まいの段差高さを確認する（4cm以下なら両機種、6cm以上ならX50 Ultra）",
      "毛络まりの頻度を考慮する（ペット・長髪の場合はブラシ確認）",
      "ステーションの自動化レベルを比較する（ゴミ収集日数・自動給水の有無）",
      "価格・在庫を販売ページで確認する。",
    ],
  },
  {
    id: "makita-cl107-vs-cl286",
    title: "マキタ CL107FDSHWとCL286FD、どっち？｜くらべる商品メモ",
    headline: "マキタのコードレス掃除機を比較。軽さ・吸引・紙パックで選ぶ",
    description:
      "マキタのコードレス掃除機を、重量・吸引力・集じん容量・バッテリーで比較します。",
    category: "生活家電",
    tags: ["コードレス掃除機", "マキタ", "一人暮らし"],
    audiences: [
      "軽くて手軽な掃除機を探している人",
      "吸引力と運転時間を重視する人",
    ],
    uses: ["毎日の掃除", "階段掃除", "狭い部屋の掃除"],
    summary:
      "軽量モデルCL107と上位モデルCL286を、重量・吸引力・集じん容量・バッテリーで比べます。",
    leftProduct: "マキタ CL107FDSHW",
    rightProduct: "マキタ CL286FD",
    leftPoint: "約1kgの軽量設計で毎日手軽に使いたい人向け",
    rightPoint: "パワフルな吸引力と大容量集じんを求める人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "マキタ CL107FDSHW 公式商品ページ",
        url: "https://www.makita.co.jp/products/details/CL107FDSHW",
      },
      {
        label: "マキタ CL286FD 公式商品ページ",
        url: "https://www.makita.co.jp/products/details/CL286FD",
      },
    ],
    verifiedRows: [
      {
        label: "質量",
        left: "約1.0kg",
        right: "約3.0kg",
      },
      {
        label: "集じん方式",
        left: "紙パック式（0.3L）",
        right: "タービン.setBackgroundResource式（0.65L）",
      },
      {
        label: "最大吸引力",
        left: "公式未公表",
        right: "公式未公表",
      },
      {
        label: "運転時間（強）",
        left: "約7分（BL1815B使用時）",
        right: "約8分（BL1850B使用時）",
      },
      {
        label: "バッテリー",
        left: "10.8V Li-ion（BL1815B / BL1830B）",
        right: "18V Li-ion（BL1815B / BL1830B / BL1850B）",
      },
      {
        label: "充電時間",
        left: "約60分（BL1815B使用時）",
        right: "約60分（BL1815B使用時）",
      },
      {
        label: "取付具",
        left: "ノズル・クリーニングブラシ",
        right: "ウェット・ドライ対応ノズル・クリーニングブラシ",
      },
      {
        label: "特徴",
        left: "片手で持てる軽量設計。階段や狭い場所に最適",
        right: "ウェット・ドライ対応。液体ゴミも吸引可能",
      },
    ],
    lead: "マキタのコードレス掃除機、軽量・紙パック式のCL107FDSHW（約1.0kg）とウェット・ドライ対応のCL286FD（約3.0kg）を比較します。重量・バッテリー・集じん方式の違いを公式仕様で確認します。",
    faqEntries: [
      {
        question: "どれくらい軽い？",
        answer:
          "CL107FDSHWは約1.0kgで片手で持てる軽量設計です。CL286FDは約3.0kgで、ウェット・ドライ対応のため本体が大きめです。",
      },
      {
        question: "液体ゴミは吸引できる？",
        answer:
          "CL286FDはウェット・ドライ対応で、液体ゴミも吸引可能です。CL107FDSHWは紙パック式のため、乾燥したゴミのみが対象です。",
      },
      {
        question: "バッテリーは共通？",
        answer:
          "CL107FDSHWは10.8V、CL286FDは18Vです。バッテリー番号はBL1815B/BL1830Bが共通ですが、電圧が異なるため互換性はありません。",
      },
    ],
    decisionGuideSteps: [
      "毎日手軽に使いたいならCL107（約1.0kg・紙パック式）を選ぶ。",
      "液体ゴミも吸いたいならCL286（ウェット・ドライ対応）を選ぶ。",
      "バッテリーの電圧（10.8V vs 18V）と運転時間を確認する。",
      "価格・在庫を販売ページで確認する。",
    ],
  },

  {
    id: "recolte-automatic-cooker-vs-panasonic-nf-pc400",
    title:
      "レコルト自動調理ポットとパナソニック NF-PC400、どっち？｜くらべる商品メモ",
    headline:
      "レコルト自動調理ポットとパナソニック NF-PC400を比較。容量・メニュー・洗いやすさで選ぶ",
    description:
      "自動調理家電を、容量・調理モード・予約・お手入れの確認項目で比較します。",
    category: "キッチン家電",
    tags: ["自動調理", "電気鍋", "時短家電"],
    audiences: ["料理の手間を減らしたい人", "家族分の容量を確認したい人"],
    uses: ["スープ作り", "煮込み料理", "平日の作り置き"],
    summary:
      "自動調理家電の候補を、容量・メニュー・予約機能・洗浄性で整理します。",
    leftProduct: "レコルト 自動調理ポット",
    rightProduct: "パナソニック NF-PC400",
    leftPoint: "少量調理と置き場所を優先する人向け",
    rightPoint: "家族分の調理容量と多機能さを確認したい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "récolte 自動調理ポット 公式商品ページ",
        url: "https://recolte-jp.com/products/auto-cooking-pot/",
      },
      {
        label: "パナソニック NF-PC400 公式仕様ページ",
        url: "https://panasonic.jp/cook/products/NF-PC400/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "電源",
        left: "AC100V 50/60Hz",
        right: "公式仕様ページで確認できず",
      },
      {
        label: "消費電力",
        left: "600W／55W（JUICE＆CLEAN）",
        right: "約800W",
      },
      {
        label: "容量",
        left: "約600mL",
        right: "満水3.9L／調理2.6L",
      },
      {
        label: "外形寸法",
        left: "約幅16.5×奥行12.0×高さ23.3cm",
        right: "約幅34.0×奥行27.4×高さ26.2cm",
      },
      {
        label: "質量",
        left: "約970g",
        right: "約4.2kg",
      },
    ],
  },

  {
    id: "sharp-kc-s50-vs-panasonic-f-vxw55",
    title: "シャープ KC-S50とパナソニック F-VXW55、どっち？｜くらべる商品メモ",
    headline:
      "シャープ KC-S50とパナソニック F-VXW55を比較。適用床面積・加湿・フィルターで選ぶ",
    description:
      "加湿空気清浄機を、適用床面積・加湿量・フィルター・お手入れで比較します。",
    category: "生活家電",
    tags: ["空気清浄機", "加湿器", "花粉対策"],
    audiences: [
      "空気清浄と加湿を一台で行いたい人",
      "フィルター交換を確認したい人",
    ],
    uses: ["リビング", "寝室", "乾燥対策"],
    summary:
      "加湿空気清浄機を、部屋の広さ・加湿・フィルター・給水の観点で比べます。",
    leftProduct: "シャープ KC-S50",
    rightProduct: "パナソニック F-VXW55",
    leftPoint: "プラズマクラスターと基本性能を確認したい人向け",
    rightPoint: "ナノイーと加湿運転の仕様を確認したい人向け",
    productInfoCheckedAt: "2026-08-20",
    modifiedAt: "2026-08-20",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "シャープ KC-S50 公式仕様ページ",
        url: "https://jp.sharp/kuusei/products/kcs50/spec/",
      },
      {
        label: "パナソニック F-VXW55 公式仕様ページ",
        url: "https://panasonic.jp/airrich/products/F-VXW55/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "空気清浄適用床面積",
        left: "～23畳（38㎡）",
        right: "25畳（41㎡）",
      },
      {
        label: "最大加湿量",
        left: "500mL/h",
        right: "500mL/h（強）",
      },
      {
        label: "給水タンク容量",
        left: "約2.5L",
        right: "約2.3L",
      },
      {
        label: "外形寸法",
        left: "幅399×奥行230×高さ613mm",
        right: "高さ562×幅360×奥行238mm",
      },
      {
        label: "質量",
        left: "約7.5kg",
        right: "8.0kg",
      },
    ],
  },

  {
    id: "panasonic-eh-na9m-vs-refa-beautech",
    title: "パナソニック EH-NA9MとReFa BEAUTECH、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック EH-NA9MとReFa BEAUTECH DRYERを比較。ケア機能・風量・重さで選ぶ",
    description:
      "高機能ドライヤーを、搭載モード・風量・重量・収納性の公式情報で比較します。",
    category: "美容家電",
    tags: ["ドライヤー", "ヘアケア", "美容家電"],
    audiences: [
      "毎日のヘアケアを見直したい人",
      "高機能ドライヤーを比較したい人",
    ],
    uses: ["髪を乾かす", "ヘアケア", "旅行以外の毎日使い"],
    summary:
      "高機能ドライヤーを、ケアモード・風量・重量・収納性の確認項目で比べます。",
    leftProduct: "パナソニック ナノケア EH-NA9M",
    rightProduct: "ReFa BEAUTECH DRYER",
    leftPoint: "複数のケアモードと風量を確認したい人向け",
    rightPoint: "温度管理やサロン系の仕上がりを確認したい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "パナソニック EH-NA9M 公式仕様ページ",
        url: "https://panasonic.jp/hair/p-db/EH-NA9M_spec.html",
      },
      {
        label: "ReFa BEAUTECH DRYER 公式商品ページ",
        url: "https://www.refa.net/item/refa_beautech_dryer/",
      },
    ],
    verifiedRows: [
      {
        label: "電源",
        left: "AC100V 50-60Hz",
        right: "AC100V 50/60Hz",
      },
      {
        label: "消費電力",
        left: "1200W",
        right: "1200W（HIGH時）",
      },
      {
        label: "質量",
        left: "約580g（セットノズル含まず）",
        right: "約695g（電源コード含む・セット用ノズル含まず）",
      },
      {
        label: "本体寸法",
        left: "高さ22.1×幅16.1×奥行7.4cm",
        right: "約246×81×232mm（コード・ノズル含まず）",
      },
      {
        label: "電源コード長さ",
        left: "約1.7m",
        right: "約2.5m",
      },
    ],
  },
  {
    id: "philips-s9000-vs-braun-series9pro",
    title:
      "フィリップス S9000とブラウン Series 9 Pro、どっち？｜くらべる商品メモ",
    headline: "電動シェーバーを比較。刃の方式・防水・充電で選ぶ",
    description:
      "電動シェーバーを、刃の方式・洗浄・防水・電池・替刃の確認項目で比較します。",
    category: "美容家電",
    tags: ["電動シェーバー", "メンズ美容", "身だしなみ"],
    audiences: [
      "毎朝のひげ剃りを効率化したい人",
      "上位シェーバーを比較したい人",
    ],
    uses: ["ひげ剃り", "出張", "お風呂剃り"],
    summary:
      "上位電動シェーバーを、刃の方式・洗浄・防水・充電の違いで整理します。",
    leftProduct: "フィリップス S9000",
    rightProduct: "ブラウン Series 9 Pro",
    leftPoint: "回転式の肌当たりと操作を確認したい人向け",
    rightPoint: "往復式の深剃りと洗浄システムを確認したい人向け",
  },
  {
    id: "anessa-perfect-uv-vs-biore-aqua-rich",
    title:
      "アネッサ パーフェクトUVとビオレUV アクアリッチ、どっち？｜くらべる商品メモ",
    headline: "日焼け止めを比較。SPF・落とし方・使用感の確認ポイント",
    description:
      "日焼け止めを、表示・耐水性・落とし方・塗り直しのしやすさで比較します。",
    category: "日用品",
    tags: ["日焼け止め", "UV対策", "スキンケア"],
    audiences: [
      "日常用の日焼け止めを探している人",
      "用途別にUV対策を選びたい人",
    ],
    uses: ["通勤・通学", "レジャー", "顔・からだのUV対策"],
    summary: "日焼け止めを、表示・耐水性・落とし方・塗り直しの観点で比べます。",
    leftProduct: "アネッサ パーフェクトUV",
    rightProduct: "ビオレUV アクアリッチ",
    leftPoint: "屋外レジャー向けの耐久性を確認したい人向け",
    rightPoint: "日常使いの軽い使用感と塗りやすさを重視する人向け",
  },
  {
    id: "tempur-original-vs-nishikawa-air-pillow",
    title: "テンピュール オリジナルと西川 AiR枕、どっち？｜くらべる商品メモ",
    headline: "人気の枕を比較。素材・高さ調整・手入れで選ぶ",
    description:
      "枕の候補を、素材・高さ・寝姿勢・カバーのお手入れで比較します。",
    category: "寝具",
    tags: ["枕", "睡眠", "寝具"],
    audiences: ["枕を買い替えたい人", "寝姿勢に合う高さを探したい人"],
    uses: ["睡眠", "首まわりの寝具選び", "来客用寝具"],
    summary: "人気の枕を、素材・高さ・寝姿勢・お手入れの確認項目で整理します。",
    leftProduct: "テンピュール オリジナルピロー",
    rightProduct: "西川 AiR 3Dピロー",
    leftPoint: "低反発素材の沈み込みと支えを確認したい人向け",
    rightPoint: "高さ調整や通気性を確認したい人向け",
  },
  {
    id: "samsonite-c-lite-vs-proteca-maxpass",
    title:
      "サムソナイト C-Liteとプロテカ マックスパス、どっち？｜くらべる商品メモ",
    headline: "人気スーツケースを比較。軽さ・容量・機内持ち込みで選ぶ",
    description:
      "スーツケースを、サイズ・重量・容量・キャスター・保証の公式情報で比較します。",
    category: "旅行用品",
    tags: ["スーツケース", "旅行", "機内持ち込み"],
    audiences: ["出張や旅行のケースを探している人", "軽量モデルを比較したい人"],
    uses: ["国内旅行", "海外旅行", "出張"],
    summary:
      "人気スーツケースを、重量・容量・収納・走行性・保証の観点で比べます。",
    leftProduct: "サムソナイト C-Lite",
    rightProduct: "プロテカ マックスパス",
    leftPoint: "軽さと大容量を優先する人向け",
    rightPoint: "国内移動と機内持ち込みの使いやすさを確認したい人向け",
  },
  {
    id: "montbell-tri-pack-vs-anello-backpack",
    title: "モンベル トライパックとanelloリュック、どっち？｜くらべる商品メモ",
    headline: "通勤・通学リュックを比較。容量・PC収納・背負いやすさで選ぶ",
    description:
      "通勤通学リュックを、容量・PC収納・ポケット・重量・背負い方で比較します。",
    category: "バッグ",
    tags: ["リュック", "通勤", "通学"],
    audiences: ["毎日使うリュックを探している人", "PCを持ち運ぶ人"],
    uses: ["通勤", "通学", "ノートPCの持ち運び"],
    summary:
      "通勤・通学用リュックを、容量・PC収納・ポケット・重量で整理します。",
    leftProduct: "モンベル トライパック 30",
    rightProduct: "anello 多機能リュック",
    leftPoint: "アウトドア由来の背負い心地と容量を確認したい人向け",
    rightPoint: "日常の収納ポケットと取り出しやすさを重視する人向け",
  },
  {
    id: "thermos-jdp-501-vs-zojirushi-sm-za48",
    title: "サーモス JDP-501と象印 SM-ZA48、どっち？｜くらべる商品メモ",
    headline: "保温保冷マグを比較。容量・飲み口・洗いやすさで選ぶ",
    description:
      "携帯マグを、容量・保温保冷・飲み口・パーツ・洗いやすさで比較します。",
    category: "キッチン用品",
    tags: ["水筒", "マグボトル", "保温"],
    audiences: ["毎日持ち歩くボトルを探している人", "洗いやすさを重視する人"],
    uses: ["通勤・通学", "オフィス", "外出"],
    summary: "人気の携帯マグを、容量・保温保冷・飲み口・お手入れで比べます。",
    leftProduct: "サーモス JDP-501",
    rightProduct: "象印 SM-ZA48",
    leftPoint: "スリムさと片手での使いやすさを確認したい人向け",
    rightPoint: "軽さとせん構造・洗いやすさを確認したい人向け",
  },
  {
    id: "panasonic-washer-na-lx129c-vs-hitachi-bd-sx130k",
    title: "パナソニック NA-LX129Cと日立 BD-SX130K、どっち？｜くらべる商品メモ",
    headline: "ドラム式洗濯乾燥機を比較。容量・乾燥・自動投入で選ぶ",
    description:
      "ドラム式洗濯乾燥機を、洗濯乾燥容量・乾燥方式・自動投入・設置寸法で比較します。",
    category: "生活家電",
    tags: ["ドラム式洗濯乾燥機", "洗濯", "家事時短"],
    audiences: ["洗濯乾燥を一台で済ませたい人", "設置前に寸法を確認したい人"],
    uses: ["毎日の洗濯", "乾燥までの時短", "家族の洗濯"],
    summary:
      "ドラム式洗濯乾燥機を、容量・乾燥・自動投入・設置条件で整理します。",
    leftProduct: "パナソニック NA-LX129C",
    rightProduct: "日立 BD-SX130K",
    leftPoint: "洗剤自動投入と省手間機能を確認したい人向け",
    rightPoint: "乾燥方式と洗濯コースを確認したい人向け",
  },
  {
    id: "sharp-heater-hv-r55-vs-iris-uhk500",
    title:
      "シャープ HV-R55とアイリスオーヤマ UHK-500、どっち？｜くらべる商品メモ",
    headline: "加湿器を比較。加湿方式・適用床面積・給水で選ぶ",
    description:
      "加湿器を、加湿方式・適用床面積・タンク容量・お手入れで比較します。",
    category: "生活家電",
    tags: ["加湿器", "乾燥対策", "冬家電"],
    audiences: ["部屋の乾燥対策をしたい人", "加湿方式を比べたい人"],
    uses: ["寝室", "リビング", "冬の乾燥対策"],
    summary: "加湿器を、方式・適用床面積・給水・手入れの確認項目で比べます。",
    leftProduct: "シャープ HV-R55",
    rightProduct: "アイリスオーヤマ UHK-500",
    leftPoint: "気化式の省エネ性と清潔機能を確認したい人向け",
    rightPoint: "ハイブリッド式の加湿量と操作を確認したい人向け",
  },
  {
    id: "dyson-v12-detect-slim-vs-shark-evo-power",
    title:
      "ダイソン V12 Detect SlimとShark EVOPOWER、どっち？｜くらべる商品メモ",
    headline: "コードレス掃除機を比較。吸引・軽さ・ゴミ捨てで選ぶ",
    description:
      "コードレス掃除機を、重量・運転時間・ヘッド・ゴミ捨て・収納で比較します。",
    category: "生活家電",
    tags: ["コードレス掃除機", "ダイソン", "シャーク"],
    audiences: ["掃除機を買い替えたい人", "吸引力と軽さを比べたい人"],
    uses: ["フローリング掃除", "ペットの毛", "部分掃除"],
    summary:
      "人気のコードレス掃除機を、吸引・重量・ヘッド・ゴミ捨てで整理します。",
    leftProduct: "Dyson V12 Detect Slim",
    rightProduct: "Shark EVOPOWER SYSTEM",
    leftPoint: "微細なゴミの可視化と吸引性能を確認したい人向け",
    rightPoint: "自走ヘッドとハンディ化の使い勝手を確認したい人向け",
  },
  {
    id: "t-fal-ko5901jp-vs-zoujirushi-ck-pa08",
    title: "ティファール KO5901JPと象印 CK-PA08、どっち？｜くらべる商品メモ",
    headline: "電気ケトルを比較。容量・沸騰時間・安全機能で選ぶ",
    description:
      "電気ケトルを、容量・沸騰・保温・安全機能・手入れの確認項目で比較します。",
    category: "キッチン家電",
    tags: ["電気ケトル", "時短", "キッチン"],
    audiences: ["毎朝お湯を沸かす人", "電気ケトルを買い替えたい人"],
    uses: ["コーヒー", "インスタント食品", "赤ちゃんのミルク作り"],
    summary: "電気ケトルを、容量・沸騰時間・安全性・注ぎやすさで比べます。",
    leftProduct: "ティファール KO5901JP",
    rightProduct: "象印 CK-PA08",
    leftPoint: "必要な分だけ素早く沸かしたい人向け",
    rightPoint: "蒸気対策や安全機能を確認したい人向け",
  },
  {
    id: "re-fa-straight-iron-vs-panasonic-eh-hs0e",
    title:
      "ReFaストレートアイロンとパナソニック EH-HS0E、どっち？｜くらべる商品メモ",
    headline: "ストレートアイロンを比較。温度・プレート・立ち上がりで選ぶ",
    description:
      "ストレートアイロンを、温度設定・プレート・立ち上がり・海外対応で比較します。",
    category: "美容家電",
    tags: ["ヘアアイロン", "ストレートアイロン", "美容"],
    audiences: ["毎朝スタイリングする人", "ヘアアイロンを買い替えたい人"],
    uses: ["寝ぐせ直し", "ストレートヘア", "旅行"],
    summary:
      "ストレートアイロンを、温度・プレート・立ち上がり・携帯性で整理します。",
    leftProduct: "ReFa ストレートアイロン プロ",
    rightProduct: "パナソニック EH-HS0E",
    leftPoint: "プレート設計と仕上がりを確認したい人向け",
    rightPoint: "立ち上がりと使いやすい温度設定を重視する人向け",
  },
  {
    id: "nitori-n-sleep-vs-nishikawa-air-mattress",
    title: "ニトリ Nスリープと西川 AiRマットレス、どっち？｜くらべる商品メモ",
    headline: "人気マットレスを比較。硬さ・構造・サイズ・手入れで選ぶ",
    description:
      "マットレスの候補を、構造・硬さ・サイズ・カバー・お手入れで比較します。",
    category: "寝具",
    tags: ["マットレス", "睡眠", "家具"],
    audiences: ["寝具を買い替えたい人", "体格や寝姿勢で選びたい人"],
    uses: ["毎日の睡眠", "引っ越し", "ベッド選び"],
    summary:
      "人気マットレスを、構造・硬さ・サイズ・手入れの確認項目で比べます。",
    leftProduct: "ニトリ Nスリープ",
    rightProduct: "西川 AiRマットレス",
    leftPoint: "価格とポケットコイル構造を確認したい人向け",
    rightPoint: "体圧分散と素材構造を確認したい人向け",
  },
  {
    id: "apple-watch-se-vs-xiaomi-redmi-watch-5",
    title: "Apple Watch SEとRedmi Watch 5、どっち？｜くらべる商品メモ",
    headline: "スマートウォッチを比較。対応スマホ・通知・健康記録で選ぶ",
    description:
      "スマートウォッチを、対応OS・通知・健康記録・電池・決済機能で比較します。",
    category: "スマート機器",
    tags: ["スマートウォッチ", "Apple Watch", "健康管理"],
    audiences: [
      "スマートウォッチを初めて買う人",
      "iPhoneとAndroidで選びたい人",
    ],
    uses: ["通知確認", "運動記録", "日常の健康管理"],
    summary:
      "スマートウォッチを、対応スマホ・通知・健康記録・電池で整理します。",
    leftProduct: "Apple Watch SE",
    rightProduct: "Xiaomi Redmi Watch 5",
    leftPoint: "iPhone連携とアプリ・決済を確認したい人向け",
    rightPoint: "長い電池持ちと大画面を確認したい人向け",
  },
  {
    id: "sony-bravia-55-xr80-vs-regza-55z870n",
    title: "ソニー BRAVIA 55型とREGZA 55Z870N、どっち？｜くらべる商品メモ",
    headline: "55型テレビを比較。映像・録画・ゲーム機能で選ぶ",
    description:
      "55型テレビを、パネル・映像処理・録画・音声・ゲーム機能で比較します。",
    category: "テレビ・映像",
    tags: ["テレビ", "55型", "ゲーム"],
    audiences: [
      "リビングのテレビを買い替えたい人",
      "ゲームもテレビも楽しみたい人",
    ],
    uses: ["テレビ視聴", "動画配信", "家庭用ゲーム"],
    summary: "55型テレビを、映像・録画・音声・ゲーム機能の確認項目で比べます。",
    leftProduct: "ソニー BRAVIA 55型 XR80",
    rightProduct: "REGZA 55Z870N",
    leftPoint: "映像処理とGoogle TVの連携を確認したい人向け",
    rightPoint: "録画機能とゲーム向け設定を確認したい人向け",
  },
  {
    id: "hitachi-bd-sx130k-vs-bd-stx130k",
    title: "日立 BD-SX130KとBD-STX130K、どっち？｜くらべる商品メモ",
    headline: "日立のドラム式洗濯乾燥機を比較。操作パネル・温水・乾燥で選ぶ",
    description:
      "日立 BD-SX130KとBD-STX130Kを、公式の容量・乾燥方式・操作パネル・温水・お手入れ機能で比較します。",
    category: "生活家電",
    tags: ["ドラム式洗濯乾燥機", "日立", "洗濯"],
    audiences: [
      "洗濯から乾燥まで一台で済ませたい人",
      "購入前に公式仕様を比較したい人",
    ],
    uses: ["毎日の洗濯", "洗濯乾燥", "設置前の仕様確認"],
    summary:
      "日立のドラム式洗濯乾燥機を、操作パネル・温水・乾燥・容量の確認項目で比べます。",
    leftProduct: "日立 BD-SX130K",
    rightProduct: "日立 BD-STX130K",
    leftPoint: "プッシュボタン式操作パネルを確認したい人向け",
    rightPoint: "温水・タッチ操作・スチームアイロンコースを確認したい人向け",
    purchaseLinkStatus: "verified",
    purchaseLinksCheckedAt: "2026-08-17",
    productInfoCheckedAt: "2026-08-17",
  },
  {
    id: "panasonic-nt-t501-vs-nt-d700",
    title: "パナソニック NT-T501とNT-D700、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック NT-T501とNT-D700、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック NT-T501とパナソニック NT-D700を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "キッチン家電",
    tags: ["キッチン家電", "比較", "公式仕様"],
    audiences: [
      "オーブンレンジの機能差を確認したい人",
      "パン焼き・加熱調理で選ぶ人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック NT-T501とNT-D700を、消費電力・庫内寸法・火力/温度制御・タイマー・トースト枚数の公式仕様で比較します。",
    leftProduct: "パナソニック NT-T501",
    rightProduct: "パナソニック NT-D700",
    leftPoint: "4枚焼きと5段階の火力切換を重視する人向け",
    rightPoint: "自動メニュー・温度調節・インテリジェント制御を重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（NT-T501）",
        url: "https://panasonic.jp/toaster/products/NT-T501.html",
      },
      {
        label: "Panasonic公式仕様ページ（NT-T501）",
        url: "https://panasonic.jp/toaster/products/NT-T501/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（NT-D700）",
        url: "https://panasonic.jp/toaster/products/NT-D700.html",
      },
      {
        label: "Panasonic公式仕様ページ（NT-D700）",
        url: "https://panasonic.jp/toaster/products/NT-D700/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "タイプ・枚数",
        left: "オーブントースター・トースト4枚",
        right: "ビストロ オーブントースター・トースト2枚",
      },
      { label: "消費電力", left: "1200W", right: "1300W" },
      {
        label: "庫内寸法",
        left: "幅28.4×奥行27.5×高さ8.7cm",
        right: "幅26.0×奥行25.0×高さ9.5cm",
      },
      {
        label: "火力・温度制御",
        left: "火力5段階（1200/885/600/570/315W）",
        right: "120〜260℃・8段階、マイコン温度コントロール",
      },
      { label: "タイマー", left: "30分タイマー", right: "デジタル30秒〜25分" },
    ],
  },
  {
    id: "panasonic-ne-bs9c-vs-ne-ubs10c",
    title: "パナソニック NE-BS9CとNE-UBS10C、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック NE-BS9CとNE-UBS10C、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック ビストロ NE-BS9Cとパナソニック ビストロ NE-UBS10Cを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "キッチン家電",
    tags: ["キッチン家電", "比較", "公式仕様"],
    audiences: [
      "冷蔵庫の容量とサイズを比較したい人",
      "冷凍室の使いやすさで選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック ビストロ NE-BS9CとNE-UBS10Cを、容量・出力・寸法・質量・液晶操作・自動メニュー数の公式仕様で比較します。",
    leftProduct: "パナソニック ビストロ NE-BS9C",
    rightProduct: "パナソニック ビストロ NE-UBS10C",
    leftPoint: "基本機能とホワイトバックライト液晶、215レシピを重視する人向け",
    rightPoint: "カラータッチ液晶・ソフトダンパー・267レシピを重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（NE-BS9C）",
        url: "https://panasonic.jp/range/products/NE-BS9C.html",
      },
      {
        label: "Panasonic公式仕様ページ（NE-BS9C）",
        url: "https://panasonic.jp/range/products/NE-BS9C/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（NE-UBS10C）",
        url: "https://panasonic.jp/range/products/NE-UBS10C.html",
      },
      {
        label: "Panasonic公式仕様ページ（NE-UBS10C）",
        url: "https://panasonic.jp/range/products/NE-UBS10C/spec.html",
      },
    ],
    verifiedRows: [
      { label: "総庫内容量", left: "30L", right: "30L" },
      {
        label: "レンジ出力",
        left: "最高1000W（約5分後700W）、手動800/600/500/300/150W相当",
        right: "最高1000W（約5分後700W）、手動800/600/500/300/150W相当",
      },
      {
        label: "外形・庫内寸法",
        left: "幅494×奥行435×高さ370mm／庫内394×309×235mm",
        right: "幅494×奥行435×高さ370mm／庫内394×309×235mm",
      },
      { label: "質量", left: "約19.9kg", right: "約20.0kg" },
      {
        label: "操作・レシピ",
        left: "大型ホワイトバックライト液晶・レシピ215",
        right: "カラータッチ液晶・レシピ267",
      },
    ],
  },
  {
    id: "panasonic-mc-jp860k-vs-mc-sb70km",
    title: "パナソニック MC-JP860KとMC-SB70KM、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック MC-JP860KとMC-SB70KM、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック MC-JP860Kとパナソニック MC-SB70KMを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "生活家電",
    tags: ["生活家電", "比較", "公式仕様"],
    audiences: [
      "大容量集じんと吸引性能を比較したい人",
      "紙パック式とタービン式で迷っている人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック MC-JP860KとMC-SB70KMを、方式・集じん容量・質量・運転時間・充電時間・コードの有無で比較します。",
    leftProduct: "パナソニック MC-JP860K",
    rightProduct: "パナソニック MC-SB70KM",
    leftPoint: "紙パック式・コード付きで長時間掃除したい人向け",
    rightPoint: "コードレスで軽く、ふき掃除や壁ぎわ集じんも使いたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（MC-JP860K）",
        url: "https://panasonic.jp/soji/products/MC-JP860K.html",
      },
      {
        label: "Panasonic公式仕様ページ（MC-JP860K）",
        url: "https://panasonic.jp/soji/products/MC-JP860K/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（MC-SB70KM）",
        url: "https://panasonic.jp/soji/products/MC-SB70KM.html",
      },
      {
        label: "Panasonic公式仕様ページ（MC-SB70KM）",
        url: "https://panasonic.jp/soji/products/MC-SB70KM/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "方式",
        left: "紙パック式・コード付き",
        right: "サイクロン式・コードレス",
      },
      { label: "集じん容量", left: "1.2L", right: "0.37L" },
      {
        label: "質量",
        left: "本体2.0kg、標準質量3.5kg",
        right: "スティック時1.7kg、本体1.0kg",
      },
      {
        label: "運転・充電",
        left: "コード式のため充電不要",
        right: "HIGH約8分、AUTO約10〜20分・充電約3.0時間",
      },
      {
        label: "サイズ・機能",
        left: "本体195×383×191mm、エコナビ",
        right: "スティック220×219×1142mm、マイクロミスト・壁ぎわ集じん",
      },
    ],
  },
  {
    id: "panasonic-sq-ld560-vs-sq-ld540",
    title: "パナソニック SQ-LD560とSQ-LD540、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック SQ-LD560とSQ-LD540、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック SQ-LD560とパナソニック SQ-LD540を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "デスク用品",
    tags: ["デスク用品", "比較", "公式仕様"],
    audiences: [
      "照度と調光機能で選びたい人",
      "据え置き型LEDライトの違いを確認したい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック SQ-LD560とSQ-LD540を、照度区分・調光・光色・可動範囲・光束・消費電力・寸法で比較します。",
    leftProduct: "パナソニック SQ-LD560",
    rightProduct: "パナソニック SQ-LD540",
    leftPoint: "AA形の明るさ、7段階調光、広い可動範囲を重視する人向け",
    rightPoint: "A形相当でコンパクトなデスクライトを選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（SQ-LD560）",
        url: "https://panasonic.jp/light/products/SQ-LD560.html",
      },
      {
        label: "Panasonic公式仕様ページ（SQ-LD560）",
        url: "https://panasonic.jp/light/products/SQ-LD560/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（SQ-LD540）",
        url: "https://panasonic.jp/light/products/SQ-LD540.html",
      },
      {
        label: "Panasonic公式仕様ページ（SQ-LD540）",
        url: "https://panasonic.jp/light/products/SQ-LD540/spec.html",
      },
    ],
    verifiedRows: [
      { label: "照度区分", left: "JIS:AA形", right: "JIS:A形相当（散光）" },
      {
        label: "調光",
        left: "7段階、約20〜100%",
        right: "約20〜100%・集光/散光切替",
      },
      {
        label: "光色・光束",
        left: "昼光色6200K/昼白色5000K、950lm",
        right: "昼光色6200K、413lm",
      },
      { label: "消費電力", left: "9.4W", right: "7W" },
      {
        label: "寸法・可動",
        left: "セード幅18.8cm、可動4か所",
        right: "セード幅12.4cm、上アーム20cm・下アーム27cm",
      },
    ],
  },
  {
    id: "panasonic-ni-fs70a-vs-ni-fs60b",
    title: "パナソニック NI-FS70AとNI-FS60B、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック NI-FS70AとNI-FS60B、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック NI-FS70Aとパナソニック NI-FS60Bを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "生活家電",
    tags: ["生活家電", "比較", "公式仕様"],
    audiences: [
      "アイロンの立ち上がり速度を比較したい人",
      "スチーマー機能で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック NI-FS70AとNI-FS60Bを、立ち上がり・注水量・質量・スチーム時間/量・消費電力で比較します。",
    leftProduct: "パナソニック NI-FS70A",
    rightProduct: "パナソニック NI-FS60B",
    leftPoint: "立ち上がり約17秒、130mL、連続8分のスチームを重視する人向け",
    rightPoint: "約690gで基本機能を使いたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（NI-FS70A）",
        url: "https://panasonic.jp/iron/products/NI-FS70A.html",
      },
      {
        label: "Panasonic公式仕様ページ（NI-FS70A）",
        url: "https://panasonic.jp/iron/products/NI-FS70A/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（NI-FS60B）",
        url: "https://panasonic.jp/iron/products/NI-FS60B.html",
      },
      {
        label: "Panasonic公式仕様ページ（NI-FS60B）",
        url: "https://panasonic.jp/iron/products/NI-FS60B/spec.html",
      },
    ],
    verifiedRows: [
      { label: "立ち上がり", left: "約17秒", right: "約19秒" },
      { label: "注水量", left: "約130mL", right: "約115mL" },
      { label: "質量", left: "約660g", right: "約690g" },
      {
        label: "スチーム",
        left: "連続約8分・平均約15g/分",
        right: "連続約7分・平均約15g/分",
      },
      {
        label: "消費電力・噴射",
        left: "950W・360°全方向噴射",
        right: "950W・360°全方向噴射",
      },
    ],
  },
  {
    id: "panasonic-eh-na0j-vs-eh-na0g",
    title: "パナソニック EH-NA0JとEH-NA0G、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック EH-NA0JとEH-NA0G、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック ナノケア EH-NA0Jとパナソニック ナノケア EH-NA0Gを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "生活家電",
    tags: ["生活家電", "比較", "公式仕様"],
    audiences: [
      "ナノケアドライヤーのケア機能差を確認したい人",
      "風量とモード数で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック ナノケア EH-NA0JとEH-NA0Gを、風量・寸法・質量・モード・消費電力の公式仕様で比較します。",
    leftProduct: "パナソニック ナノケア EH-NA0J",
    rightProduct: "パナソニック ナノケア EH-NA0G",
    leftPoint: "1.6m³/分の風量と約550gの軽さを重視する人向け",
    rightPoint: "インテリジェント温風モードを含む多機能モデルを選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（EH-NA0J）",
        url: "https://panasonic.jp/hair/products/EH-NA0J.html",
      },
      {
        label: "Panasonic公式仕様ページ（EH-NA0J）",
        url: "https://panasonic.jp/hair/products/EH-NA0J/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（EH-NA0G）",
        url: "https://panasonic.jp/hair/products/EH-NA0G.html",
      },
      {
        label: "Panasonic公式仕様ページ（EH-NA0G）",
        url: "https://panasonic.jp/hair/products/EH-NA0G/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "風量",
        left: "1.6m³/分（強）",
        right: "1.5m³/分（ターボ）※条件が異なる",
      },
      {
        label: "寸法",
        left: "高さ22.1×幅14.8×奥行7.4cm",
        right: "高さ22.4×幅21.6×奥行8.9cm",
      },
      { label: "質量", left: "約550g", right: "約595g" },
      {
        label: "搭載モード",
        left: "温冷リズム・スカルプ・スキン・毛先集中ケア",
        right: "左記＋インテリジェント温風",
      },
      { label: "消費電力", left: "1200W", right: "1200W" },
    ],
  },
  {
    id: "panasonic-mc-sb53k-vs-mc-sb33j",
    title: "パナソニック MC-SB53KとMC-SB33J、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック MC-SB53KとMC-SB33J、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック MC-SB53Kとパナソニック MC-SB33Jを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "生活家電",
    tags: ["生活家電", "比較", "公式仕様"],
    audiences: [
      "コードレス掃除機の運転時間を比較したい人",
      "集じん容量と充電時間で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック MC-SB53KとMC-SB33Jを、集じん容量・運転時間・充電時間・質量・方式の公式仕様で比較します。",
    leftProduct: "パナソニック MC-SB53K",
    rightProduct: "パナソニック MC-SB33J",
    leftPoint: "AUTO運転とスティック時1.5kgを重視する人向け",
    rightPoint: "スティック時1.3kgの軽さを重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（MC-SB53K）",
        url: "https://panasonic.jp/soji/products/MC-SB53K.html",
      },
      {
        label: "Panasonic公式仕様ページ（MC-SB53K）",
        url: "https://panasonic.jp/soji/products/MC-SB53K/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（MC-SB33J）",
        url: "https://panasonic.jp/soji/products/MC-SB33J.html",
      },
      {
        label: "Panasonic公式仕様ページ（MC-SB33J）",
        url: "https://panasonic.jp/soji/products/MC-SB33J/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "集じん方式・容量",
        left: "サイクロン式・0.15L",
        right: "サイクロン式・0.15L",
      },
      {
        label: "運転時間",
        left: "HIGH約6分、AUTO約10〜15分/約15〜30分",
        right: "HIGH約6分、ON約15分/約30分",
      },
      { label: "充電時間", left: "約3.5時間", right: "約3.5時間" },
      {
        label: "質量",
        left: "スティック時1.5kg、本体0.9kg",
        right: "スティック時1.3kg、本体0.9kg",
      },
      { label: "電源方式", left: "コードレス式", right: "コードレス式" },
    ],
  },
  {
    id: "panasonic-ew-dp57-vs-ew-dt73",
    title: "パナソニック ドルツ EW-DP57とEW-DT73、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック ドルツ EW-DP57とEW-DT73、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック ドルツ EW-DP57とパナソニック ドルツ EW-DT73を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "電動歯ブラシの磨きモードを比較したい人",
      "防水仕様と付属品で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック ドルツ EW-DP57とEW-DT73を、使用時間・防水・磨きモード・付属品・充電方式で比較します。",
    leftProduct: "パナソニック ドルツ EW-DP57",
    rightProduct: "パナソニック ドルツ EW-DT73",
    leftPoint: "その他のモードで約22日間使いたい人向け",
    rightPoint: "カスタムモード、ラージブラシ、携帯ケースを重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（EW-DP57）",
        url: "https://panasonic.jp/teeth/products/EW-DP57.html",
      },
      {
        label: "Panasonic公式仕様ページ（EW-DP57）",
        url: "https://panasonic.jp/teeth/products/EW-DP57/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（EW-DT73）",
        url: "https://panasonic.jp/teeth/products/EW-DT73.html",
      },
      {
        label: "Panasonic公式仕様ページ（EW-DT73）",
        url: "https://panasonic.jp/teeth/products/EW-DT73/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "使用時間",
        left: "その他モード約22日（約90分）",
        right: "その他モード約16日（約66分）",
      },
      { label: "防水", left: "IPX7", right: "IPX7" },
      {
        label: "磨きモード",
        left: "5モード",
        right: "6モード（カスタムを追加）",
      },
      {
        label: "付属品",
        left: "基本ブラシ3種・スタンド等",
        right: "ラージブラシと携帯ケースを追加",
      },
      {
        label: "充電方式",
        left: "USB・フル充電約3時間",
        right: "USB・フル充電約3時間",
      },
    ],
  },
  {
    id: "panasonic-ew-da19-vs-ew-da49",
    title: "パナソニック ドルツ EW-DA19とEW-DA49、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック ドルツ EW-DA19とEW-DA49、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック ドルツ EW-DA19とパナソニック ドルツ EW-DA49を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "超音波歯ブラシのモード数を比較したい人",
      "使用時間と防水で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック ドルツ EW-DA19とEW-DA49を、モード・充電・使用時間・防水・付属品で比較します。",
    leftProduct: "パナソニック ドルツ EW-DA19",
    rightProduct: "パナソニック ドルツ EW-DA49",
    leftPoint: "携帯ケースを使わず基本機能で選びたい人向け",
    rightPoint: "携帯ケースと3種のブラシを求める人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（EW-DA19）",
        url: "https://panasonic.jp/teeth/products/EW-DA19.html",
      },
      {
        label: "Panasonic公式仕様ページ（EW-DA19）",
        url: "https://panasonic.jp/teeth/products/EW-DA19/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（EW-DA49）",
        url: "https://panasonic.jp/teeth/products/EW-DA49.html",
      },
      {
        label: "Panasonic公式仕様ページ（EW-DA49）",
        url: "https://panasonic.jp/teeth/products/EW-DA49/spec.html",
      },
    ],
    verifiedRows: [
      { label: "モード", left: "3モード", right: "3モード" },
      {
        label: "使用時間",
        left: "約2時間充電で約90分",
        right: "約2時間充電で約90分",
      },
      { label: "防水", left: "IPX7", right: "IPX7" },
      {
        label: "付属品",
        left: "公式ページで全構成を一覧確認できず",
        right: "3種のブラシ、携帯ケース、充電スタンド等",
      },
      {
        label: "充電・機能",
        left: "4分充電で約2分、モード記憶",
        right: "4分充電で約2分、モード記憶",
      },
    ],
  },
  {
    id: "panasonic-es-lv9w-vs-es-lv7w",
    title:
      "パナソニック ラムダッシュPRO ES-LV9WとES-LV7W、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック ラムダッシュPRO ES-LV9WとES-LV7W、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック ラムダッシュPRO ES-LV9Wとパナソニック ラムダッシュPRO ES-LV7Wを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "往復式シェーバーの洗浄機能を比較したい人",
      "充電時間と使用日数で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック ラムダッシュPRO ES-LV9WとES-LV7Wを、洗浄充電器・充電・使用日数・表示・付属品・防水で比較します。",
    leftProduct: "パナソニック ラムダッシュPRO ES-LV9W",
    rightProduct: "パナソニック ラムダッシュPRO ES-LV7W",
    leftPoint: "5段階残量表示とセミハードケースを重視する人向け",
    rightPoint: "3段階残量表示とポーチで基本の全自動洗浄充電を使いたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（ES-LV9W）",
        url: "https://panasonic.jp/shaver/products/ES-LV9W.html",
      },
      {
        label: "Panasonic公式仕様ページ（ES-LV9W）",
        url: "https://panasonic.jp/shaver/products/ES-LV9W/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（ES-LV7W）",
        url: "https://panasonic.jp/shaver/products/ES-LV7W.html",
      },
      {
        label: "Panasonic公式仕様ページ（ES-LV7W）",
        url: "https://panasonic.jp/shaver/products/ES-LV7W/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "洗浄・充電",
        left: "全自動洗浄充電器、急速1時間充電",
        right: "全自動洗浄充電器、急速1時間充電",
      },
      { label: "使用日数", left: "約14日間", right: "約14日間" },
      { label: "表示", left: "5段階充電残量表示", right: "3段階充電残量表示" },
      {
        label: "付属品",
        left: "セミハードケース、洗浄剤等",
        right: "ポーチ、洗浄剤等",
      },
      { label: "防水・質量", left: "IPX7、約210g", right: "IPX7、約210g" },
    ],
  },
  {
    id: "panasonic-eh-nc80-vs-eh-nc50",
    title: "パナソニック ナノケア EH-NC80とEH-NC50、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック ナノケア EH-NC80とEH-NC50、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック ナノケア EH-NC80とパナソニック ナノケア EH-NC50を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "ナノケアドライヤーのケアモード数を比較したい人",
      "付属品と価格帯で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック ナノケア EH-NC80とEH-NC50を、パーソナルメニュー数・ケア機能・風の特徴・付属品の公式説明で比較します。",
    leftProduct: "パナソニック ナノケア EH-NC80",
    rightProduct: "パナソニック ナノケア EH-NC50",
    leftPoint: "4つのメニューと第2世代高浸透ナノイーを重視する人向け",
    rightPoint: "3つのメニューで基本ケアを選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（EH-NC80）",
        url: "https://panasonic.jp/hair/products/EH-NC80.html",
      },
      {
        label: "Panasonic公式仕様ページ（EH-NC80）",
        url: "https://panasonic.jp/hair/products/EH-NC80/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（EH-NC50）",
        url: "https://panasonic.jp/hair/products/EH-NC50.html",
      },
      {
        label: "Panasonic公式仕様ページ（EH-NC50）",
        url: "https://panasonic.jp/hair/products/EH-NC50/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "メニュー数",
        left: "4つ：MOIST/STRAIGHT/AIRY/SMOOTH",
        right: "3つのパーソナルメニュー",
      },
      {
        label: "ケア機能",
        left: "第2世代高浸透ナノイー、ミネラル、UV/摩擦ケア等",
        right: "第2世代高浸透ナノイー、ミネラル等",
      },
      {
        label: "風の特徴",
        left: "高回転モーター、高圧・高速、速乾性能約1.5倍",
        right: "高回転モーター、高圧・高速",
      },
      {
        label: "付属品・表示",
        left: "アタッチメント、スタンド、液晶表示の公式説明あり",
        right: "公式ページで本体機能・モードを説明",
      },
      {
        label: "数値仕様",
        left: "商品ページ本文で寸法・質量・風量数値を確認できず",
        right: "商品ページ本文で寸法・質量・風量数値を確認できず",
      },
    ],
  },
  {
    id: "panasonic-eh-na0k-vs-eh-ne9n",
    title: "パナソニック EH-NA0KとEH-NE9N、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック EH-NA0KとEH-NE9N、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック EH-NA0Kとパナソニック EH-NE9Nを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "上位モデルと標準モデルのドライヤー機能差を確認したい人",
      "Care機能と風量で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック EH-NA0KとEH-NE9Nを、風量・モード・段階・質量・ノズルの公式説明で比較します。",
    leftProduct: "パナソニック EH-NA0K",
    rightProduct: "パナソニック EH-NE9N",
    leftPoint: "最大風量1.6m³/分と4つの多彩なモードを重視する人向け",
    rightPoint: "風温4段階・風量3段階と温風リズムヘッドスパを重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Panasonic公式商品ページ（EH-NA0K）",
        url: "https://panasonic.jp/hair/products/EH-NA0K.html",
      },
      {
        label: "Panasonic公式仕様ページ（EH-NA0K）",
        url: "https://panasonic.jp/hair/products/EH-NA0K/spec.html",
      },
      {
        label: "Panasonic公式商品ページ（EH-NE9N）",
        url: "https://panasonic.jp/hair/products/EH-NE9N.html",
      },
      {
        label: "Panasonic公式仕様ページ（EH-NE9N）",
        url: "https://panasonic.jp/hair/products/EH-NE9N/spec.html",
      },
    ],
    verifiedRows: [
      {
        label: "風量",
        left: "最大1.6m³/分",
        right: "風量3段階（数値は本文で確認できず）",
      },
      {
        label: "モード・段階",
        left: "4つの多彩なモード、スキン/毛先集中ケア",
        right: "風温4段階・風量3段階、温風リズムヘッドスパ",
      },
      {
        label: "質量",
        left: "本文で数値を確認できず",
        right: "約455g（ヘッドスパノズル未装着時）",
      },
      {
        label: "ケア機能",
        left: "スキンモード、ヘアカラー退色抑制",
        right: "温風リズムヘッドスパ、UVケア",
      },
      {
        label: "寸法・消費電力",
        left: "本文で数値を確認できず",
        right: "本文で数値を確認できず",
      },
    ],
  },
  {
    id: "panasonic-ep-ma110-vs-ep-ma121",
    title:
      "パナソニック リアルプロ EP-MA110とEP-MA121、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック リアルプロ EP-MA110とEP-MA121、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック リアルプロ EP-MA110とパナソニック リアルプロ EP-MA121を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "マッサージチェアのコース内容を比較したい人",
      "設置性と張地で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック リアルプロ EP-MA110とEP-MA121を、外形寸法・質量・張地・コースの公式specで比較します。",
    leftProduct: "パナソニック リアルプロ EP-MA110",
    rightProduct: "パナソニック リアルプロ EP-MA121",
    leftPoint: "幅68cm・約65kgで設置しやすいモデルを選びたい人向け",
    rightPoint: "幅85cm・約91kgで施療コースを重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "パナソニック リアルプロ EP-MA110 公式商品ページ",
        url: "https://panasonic.jp/massage/products/EP-MA110.html",
      },
      {
        label: "パナソニック リアルプロ EP-MA121 公式商品ページ",
        url: "https://panasonic.jp/massage/products/EP-MA121.html",
      },
    ],
    verifiedRows: [
      {
        label: "外形寸法（非リクライニング）",
        left: "高さ約122×幅約68×奥行約118cm",
        right: "高さ約122×幅約85×奥行約135cm",
      },
      { label: "質量", left: "約65kg", right: "約91kg" },
      { label: "張地", left: "ファブリック", right: "合成皮革" },
      {
        label: "自動コース",
        left: "さすり・もみ揉ねつ・指圧等",
        right: "さすり・もみ揉ねつ・指圧・ストレッチ等",
      },
      {
        label: "設置性",
        left: "リクライニング時最大奥行約180cm",
        right: "リクライニング時奥行約200cm",
      },
    ],
  },
  {
    id: "panasonic-es-wp9b-vs-es-wg0b",
    title:
      "パナソニック スムースエピ ES-WP9BとES-WG0B、どっち？｜くらべる商品メモ",
    headline:
      "パナソニック スムースエピ ES-WP9BとES-WG0B、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "パナソニック スムースエピ ES-WP9Bとパナソニック スムースエピ ES-WG0Bを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "美容・健康",
    tags: ["美容・健康", "比較", "公式仕様"],
    audiences: [
      "レイザー式シェーバーの出力とモードを比較したい人",
      "アタッチメント数で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "パナソニック スムースエピ ES-WP9BとES-WG0Bを、出力段階・モード・照射回数・アタッチメント・質量の公式specで比較します。",
    leftProduct: "パナソニック スムースエピ ES-WP9B",
    rightProduct: "パナソニック スムースエピ ES-WG0B",
    leftPoint: "4種アタッチメントと2モード、約390gを重視する人向け",
    rightPoint:
      "3モードとワイドアタッチメント、据え置き型の構成を重視する人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "パナソニック スムースエピ ES-WP9B 公式商品ページ",
        url: "https://panasonic.jp/body/products/ES-WP9B.html",
      },
      {
        label: "パナソニック スムースエピ ES-WG0B 公式商品ページ",
        url: "https://panasonic.jp/body/products/ES-WG0B.html",
      },
    ],
    verifiedRows: [
      {
        label: "出力・モード",
        left: "5段階出力・2モード",
        right: "5段階出力・3モード",
      },
      {
        label: "連続使用回数",
        left: "約600回（スピードモード時約350回）",
        right: "約600回（クール/ハイパワー時約100回）",
      },
      {
        label: "アタッチメント",
        left: "ボディ/Vゾーン、スポット、フェイス、I/Oゾーン用",
        right: "フェイス＆ボディ、I/Oゾーン、ワイド",
      },
      {
        label: "質量",
        left: "約390g（ボディ/Vゾーン用装着時）",
        right: "照射部約380g、アタッチメント装着時約890g",
      },
      {
        label: "寸法",
        left: "高さ22.3×幅4.6×奥行11.2cm",
        right: "照射部高さ23.2×幅7.5×奥行5.6cm、コントローラーあり",
      },
    ],
  },
  {
    id: "logicool-mx-keys-s-vs-mx-keys-mini",
    title: "Logicool MX Keys SとMX Keys Mini、どっち？｜くらべる商品メモ",
    headline:
      "Logicool MX Keys SとMX Keys Mini、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "Logicool MX Keys SとMX Keys Miniを、キー配列・サイズ・接続・バッテリーで比較します。",
    category: "PC周辺機器",
    tags: ["キーボード", "Logicool", "リモートワーク"],
    audiences: [
      "テンキー付きフルサイズのキーボードを探している人",
      "コンパクトな省スペースキーボードを探している人",
    ],
    uses: ["デスクワーク", "リモートワーク", "キーボード選び"],
    summary:
      "Logicoolのワイヤレスキーボード2機種を、キー数・サイズ・接続方式・バッテリーで比べます。",
    leftProduct: "Logicool MX Keys S",
    rightProduct: "Logicool MX Keys Mini",
    leftPoint:
      "テンキー・ナビキー付きフルサイズで効率的にタイピングしたい人向け",
    rightPoint: "デスクのスペースを抑えたい・持ち運びもしたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Logicool MX Keys S 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/mx-keys-s",
      },
      {
        label: "Logicool MX Keys Mini 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/mx-keys-mini",
      },
    ],
    verifiedRows: [
      {
        label: "キー配列",
        left: "フルサイズ（テンキー・ナビキー付き）",
        right: "コンパクト（テンキー・ファンクションキー省略）",
      },
      {
        label: "キー数",
        left: "約108キー",
        right: "約84キー",
      },
      {
        label: "サイズ（幅×奥行）",
        left: "約430×131mm",
        right: "约296×117mm",
      },
      {
        label: "重量",
        left: "約570g",
        right: "約506g",
      },
      {
        label: "smart actions",
        left: "搭載（Logi Options+でカスタマイズ可能）",
        right: "搭載（Logi Options+でカスタマイズ可能）",
      },
      {
        label: "バックライト",
        left: "センサー自動調整",
        right: "センサー自動調整",
      },
      {
        label: "充電方式",
        left: "USB-C",
        right: "USB-C",
      },
      {
        label: "接続",
        left: "Bolt/Bluetooth/USB-C",
        right: "Bolt/Bluetooth/USB-C",
      },
    ],
    lead: "Logicoolのワイヤレスキーボード、フルサイズのMX Keys S（約430mm・テンキー付き）とコンパクトなMX Keys Mini（約296mm）を比較します。キー数・サイズ・smart actionsの違いを公式仕様で確認します。",
    faqEntries: [
      {
        question: "テンキーが必要ならどっち？",
        answer:
          "MX Keys Sはテンキー・ナビキー付きのフルサイズです。数値入力が多い場合はMX Keys Sが適しています。MX Keys Miniはファンクションキーも省略されたコンパクト設計です。",
      },
      {
        question: "デスクのスペースが狭い場合は？",
        answer:
          "MX Keys Miniは幅約296mmと約134mm短く、マウスとの並べやすいサイズです。MX Keys Sは幅約430mmで、フルサイズキーボードのスペースが必要です。",
      },
      {
        question: "smart actionsは同じ？",
        answer:
          "両機種ともLogi Options+でsmart actionsのカスタマイズが可能です。バックライトもセンサー自動調整で共通です。",
      },
    ],
    decisionGuideSteps: [
      "テンキー・ナビキーの必要性を確認する。",
      "デスクのスペースとキーボードの置き方を考える。",
      "smart actionsやマルチデバイス接続は両機種で共通なので、サイズとキー数で選ぶ。",
      "価格・在庫を販売ページで確認する。",
    ],
  },
  {
    id: "logicool-mx-keys-s-for-mac-vs-k780",
    title: "Logicool MX Keys S for MacとK780、どっち？｜くらべる商品メモ",
    headline:
      "Logicool MX Keys S for MacとK780、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "Logicool MX Keys S for MacとLogicool K780を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "PC周辺機器",
    tags: ["PC周辺機器", "比較", "公式仕様"],
    audiences: [
      "Mac対応のワイヤレスキーボードを探している人",
      "マルチデバイス切り替えを重視する人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "Logicool MX Keys S for MacとLogicool K780について、公式ページで確認できる項目と購入時に確認したい条件を整理します。",
    leftProduct: "Logicool MX Keys S for Mac",
    rightProduct: "Logicool K780",
    leftPoint: "公式仕様とサイズを確認して選びたい人向け",
    rightPoint: "公式仕様と用途を確認して選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Logicool MX Keys S for Mac 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/mx-keys-s-for-mac",
      },
      {
        label: "Logicool K780 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/k780-multi-device-wireless-keyboard",
      },
    ],
    verifiedRows: [
      { label: "幅", left: "430.2 mm", right: "380 mm" },
      { label: "重量", left: "810 g", right: "875 g" },
    ],
  },
  {
    id: "logicool-k650-vs-k580",
    title: "Logicool K650とK580、どっち？｜くらべる商品メモ",
    headline:
      "Logicool K650とK580、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "Logicool K650 Signature Wireless KeyboardとLogicool K580を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "PC周辺機器",
    tags: ["PC周辺機器", "比較", "公式仕様"],
    audiences: [
      "リラックスしたタイピングのキーボードを探している人",
      "価格と機能のバランスで選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "Logicool K650 Signature Wireless KeyboardとLogicool K580について、公式ページで確認できる項目と購入時に確認したい条件を整理します。",
    leftProduct: "Logicool K650 Signature Wireless Keyboard",
    rightProduct: "Logicool K580",
    leftPoint: "公式仕様とサイズを確認して選びたい人向け",
    rightPoint: "公式仕様と用途を確認して選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Logicool K650 Signature Wireless Keyboard 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/k650-signature-wireless-keyboard",
      },
      {
        label: "Logicool K580 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/k580-multi-device-wireless-keyboard",
      },
    ],
    verifiedRows: [
      { label: "幅", left: "457.3 mm", right: "373.5 mm" },
      { label: "重量", left: "700.23 g", right: "558 g" },
    ],
  },
  {
    id: "logicool-mx-master-3s-vs-m650",
    title: "Logicool MX Master 3SとM650、どっち？｜くらべる商品メモ",
    headline:
      "Logicool MX Master 3SとM650、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "Logicool MX Master 3SとLogicool Signature M650を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "PC周辺機器",
    tags: ["PC周辺機器", "比較", "公式仕様"],
    audiences: [
      "プロ向けマウスの機能差を確認したい人",
      "スクロールとボタンカスタマイズで選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "Logicool MX Master 3SとLogicool Signature M650について、公式ページで確認できる項目と購入時に確認したい条件を整理します。",
    leftProduct: "Logicool MX Master 3S",
    rightProduct: "Logicool Signature M650",
    leftPoint: "公式仕様とサイズを確認して選びたい人向け",
    rightPoint: "公式仕様と用途を確認して選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Logicool MX Master 3S 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/mx-master-3s",
      },
      {
        label: "Logicool Signature M650 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/m650-signature-wireless-mouse",
      },
    ],
    verifiedRows: [
      { label: "幅", left: "84.3 mm", right: "61 mm（Mサイズ）" },
      { label: "重量", left: "141 g", right: "101.4 g（Mサイズ）" },
    ],
  },
  {
    id: "logicool-lift-vs-m550",
    title: "Logicool LIFTとM550、どっち？｜くらべる商品メモ",
    headline:
      "Logicool LIFTとM550、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "Logicool LIFT Vertical Ergonomic MouseとLogicool Signature M550を、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "PC周辺機器",
    tags: ["PC周辺機器", "比較", "公式仕様"],
    audiences: [
      "中小手向けマウスのサイズと重さを比較したい人",
      "価格とロジカルロールで選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "Logicool LIFT Vertical Ergonomic MouseとLogicool Signature M550について、公式ページで確認できる項目と購入時に確認したい条件を整理します。",
    leftProduct: "Logicool LIFT Vertical Ergonomic Mouse",
    rightProduct: "Logicool Signature M550",
    leftPoint: "公式仕様とサイズを確認して選びたい人向け",
    rightPoint: "公式仕様と用途を確認して選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Logicool LIFT Vertical Ergonomic Mouse 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/lift-vertical-ergonomic-mouse",
      },
      {
        label: "Logicool Signature M550 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/m550-signature-wireless-mouse",
      },
    ],
    verifiedRows: [
      { label: "幅", left: "70 mm", right: "61 mm（Mサイズ）" },
      { label: "重量", left: "125 g", right: "97.4 g（Mサイズ）" },
    ],
  },
  {
    id: "logicool-zone-vibe-100-vs-zone-300",
    title: "Logicool Zone Vibe 100とZone 300、どっち？｜くらべる商品メモ",
    headline:
      "Logicool Zone Vibe 100とZone 300、どっち？ 公式仕様で比較。違いと選び方を整理",
    description:
      "Logicool Zone Vibe 100 WirelessとLogicool Zone 300 Wirelessを、メーカー公式ページで確認できる仕様・サイズ・使い方から比較します。",
    category: "オーディオ",
    tags: ["オーディオ", "比較", "公式仕様"],
    audiences: [
      "ワイヤレスヘッドセットの装着感を比較したい人",
      "マイク品質と用途で選びたい人",
    ],
    uses: ["購入前の比較", "仕様確認", "選び方の整理"],
    summary:
      "Logicool Zone Vibe 100 WirelessとLogicool Zone 300 Wirelessについて、公式ページで確認できる項目と購入時に確認したい条件を整理します。",
    leftProduct: "Logicool Zone Vibe 100 Wireless",
    rightProduct: "Logicool Zone 300 Wireless",
    leftPoint: "公式仕様とサイズを確認して選びたい人向け",
    rightPoint: "公式仕様と用途を確認して選びたい人向け",
    productInfoCheckedAt: "2026-08-18",
    modifiedAt: "2026-08-18",
    purchaseLinkStatus: "unverified",
    officialSources: [
      {
        label: "Logicool Zone Vibe 100 Wireless 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/zone-vibe-100-wireless",
      },
      {
        label: "Logicool Zone 300 Wireless 公式商品ページ",
        url: "https://www.logicool.co.jp/ja-jp/shop/p/zone-300-wireless-headset",
      },
    ],
    verifiedRows: [
      { label: "幅", left: "169.7 mm", right: "166.7 mm" },
      { label: "重量", left: "185 g", right: "122 g" },
    ],
  },
];

export const commercialArticleImages: Readonly<
  Record<string, { left?: `/${string}`; right?: `/${string}` }>
> = {
  "roborock-qrevo-curv-vs-dreame-x50": {
    left: "/products/roborock-qrevo-curv-vs-dreame-x50-left.jpg",
    right: "/products/roborock-qrevo-curv-vs-dreame-x50-right.jpg",
  },
  "makita-cl107-vs-cl286": {
    left: "/products/makita-cl107-vs-cl286-left.jpg",
    right: "/products/makita-cl107-vs-cl286-right.jpg",
  },
  "iris-airfryer-fvx-d3-vs-tefal-ey201": {
    left: "/products/iris-airfryer-fvx-d3-vs-tefal-ey201-left.jpg",
    right: "/products/iris-airfryer-fvx-d3-vs-tefal-ey201-right.jpg",
  },
  "recolte-automatic-cooker-vs-panasonic-nf-pc400": {
    left: "/products/recolte-automatic-cooker-vs-panasonic-nf-pc400-left.jpg",
    right: "/products/recolte-automatic-cooker-vs-panasonic-nf-pc400-right.jpg",
  },
  "brita-marella-vs-zero-water": {
    left: "/products/brita-marella-vs-zero-water-left.jpg",
    right: "/products/brita-marella-vs-zero-water-right.jpg",
  },
  "tiger-jpv-l100-vs-zojirushi-nw-fc10": {
    left: "/products/tiger-jpv-l100-vs-zojirushi-nw-fc10-left.jpg",
    right: "/products/tiger-jpv-l100-vs-zojirushi-nw-fc10-right.jpg",
  },
  "sharp-kc-s50-vs-panasonic-f-vxw55": {
    left: "/products/sharp-kc-s50-vs-panasonic-f-vxw55-left.jpg",
    right: "/products/sharp-kc-s50-vs-panasonic-f-vxw55-right.jpg",
  },
  "anker-soundcore-liberty-4-nc-vs-sony-wf-c710n": {
    left: "/products/anker-soundcore-liberty-4-nc-vs-sony-wf-c710n-left.jpg",
    right: "/products/anker-soundcore-liberty-4-nc-vs-sony-wf-c710n-right.jpg",
  },
  "xiaomi-redmi-watch-5-vs-huawei-band-10": {
    left: "/products/xiaomi-redmi-watch-5-vs-huawei-band-10-left.jpg",
    right: "/products/xiaomi-redmi-watch-5-vs-huawei-band-10-right.jpg",
  },
  "panasonic-eh-na9m-vs-refa-beautech": {
    left: "/products/panasonic-eh-na9m-vs-refa-beautech-left.jpg",
    right: "/products/panasonic-eh-na9m-vs-refa-beautech-right.jpg",
  },
  "philips-s9000-vs-braun-series9pro": {
    left: "/products/philips-s9000-vs-braun-series9pro-left.jpg",
    right: "/products/philips-s9000-vs-braun-series9pro-right.jpg",
  },
  "anessa-perfect-uv-vs-biore-aqua-rich": {
    left: "/products/anessa-perfect-uv-vs-biore-aqua-rich-left.jpg",
    right: "/products/anessa-perfect-uv-vs-biore-aqua-rich-right.jpg",
  },
  "tempur-original-vs-nishikawa-air-pillow": {
    left: "/products/tempur-original-vs-nishikawa-air-pillow-left.jpg",
    right: "/products/tempur-original-vs-nishikawa-air-pillow-right.jpg",
  },
  "samsonite-c-lite-vs-proteca-maxpass": {
    left: "/products/samsonite-c-lite-vs-proteca-maxpass-left.jpg",
    right: "/products/samsonite-c-lite-vs-proteca-maxpass-right.jpg",
  },
  "montbell-tri-pack-vs-anello-backpack": {
    left: "/products/montbell-tri-pack-vs-anello-backpack-left.jpg",
    right: "/products/montbell-tri-pack-vs-anello-backpack-right.jpg",
  },
  "thermos-jdp-501-vs-zojirushi-sm-za48": {
    left: "/products/thermos-jdp-501-vs-zojirushi-sm-za48-left.jpg",
    right: "/products/thermos-jdp-501-vs-zojirushi-sm-za48-right.jpg",
  },
  "panasonic-washer-na-lx129c-vs-hitachi-bd-sx130k": {
    left: "/products/panasonic-washer-na-lx129c-vs-hitachi-bd-sx130k-left.jpg",
    right:
      "/products/panasonic-washer-na-lx129c-vs-hitachi-bd-sx130k-right.jpg",
  },
  "sharp-heater-hv-r55-vs-iris-uhk500": {
    left: "/products/sharp-heater-hv-r55-vs-iris-uhk500-left.jpg",
    right: "/products/sharp-heater-hv-r55-vs-iris-uhk500-right.jpg",
  },
  "dyson-v12-detect-slim-vs-shark-evo-power": {
    left: "/products/dyson-v12-detect-slim-vs-shark-evo-power-left.jpg",
    right: "/products/dyson-v12-detect-slim-vs-shark-evo-power-right.jpg",
  },
  "t-fal-ko5901jp-vs-zoujirushi-ck-pa08": {
    left: "/products/t-fal-ko5901jp-vs-zoujirushi-ck-pa08-left.jpg",
    right: "/products/t-fal-ko5901jp-vs-zoujirushi-ck-pa08-right.jpg",
  },
  "re-fa-straight-iron-vs-panasonic-eh-hs0e": {
    left: "/products/re-fa-straight-iron-vs-panasonic-eh-hs0e-left.jpg",
    right: "/products/re-fa-straight-iron-vs-panasonic-eh-hs0e-right.jpg",
  },
  "nitori-n-sleep-vs-nishikawa-air-mattress": {
    left: "/products/nitori-n-sleep-vs-nishikawa-air-mattress-left.jpg",
    right: "/products/nitori-n-sleep-vs-nishikawa-air-mattress-right.jpg",
  },
  "apple-watch-se-vs-xiaomi-redmi-watch-5": {
    left: "/products/apple-watch-se-vs-xiaomi-redmi-watch-5-left.jpg",
    right: "/products/apple-watch-se-vs-xiaomi-redmi-watch-5-right.jpg",
  },
  "sony-bravia-55-xr80-vs-regza-55z870n": {
    left: "/products/sony-bravia-55-xr80-vs-regza-55z870n-left.jpg",
    right: "/products/sony-bravia-55-xr80-vs-regza-55z870n-right.jpg",
  },
  "hitachi-bd-sx130k-vs-bd-stx130k": {
    left: "/products/hitachi-bd-sx130k.png",
    right: "/products/hitachi-bd-stx130k.png",
  },
  "panasonic-nt-t501-vs-nt-d700": {
    left: "/products/panasonic-nt-t501-vs-nt-d700-left.jpg",
    right: "/products/panasonic-nt-t501-vs-nt-d700-right.jpg",
  },
  "panasonic-ne-bs9c-vs-ne-ubs10c": {
    left: "/products/panasonic-ne-bs9c-vs-ne-ubs10c-left.jpg",
    right: "/products/panasonic-ne-bs9c-vs-ne-ubs10c-right.jpg",
  },
  "panasonic-mc-jp860k-vs-mc-sb70km": {
    left: "/products/panasonic-mc-jp860k-vs-mc-sb70km-left.jpg",
    right: "/products/panasonic-mc-jp860k-vs-mc-sb70km-right.jpg",
  },
  "panasonic-sq-ld560-vs-sq-ld540": {
    left: "/products/panasonic-sq-ld560-vs-sq-ld540-left.jpg",
    right: "/products/panasonic-sq-ld560-vs-sq-ld540-right.jpg",
  },
  "panasonic-ni-fs70a-vs-ni-fs60b": {
    left: "/products/panasonic-ni-fs70a-vs-ni-fs60b-left.jpg",
    right: "/products/panasonic-ni-fs70a-vs-ni-fs60b-right.jpg",
  },
  "panasonic-eh-na0j-vs-eh-na0g": {
    left: "/products/panasonic-eh-na0j-vs-eh-na0g-left.jpg",
    right: "/products/panasonic-eh-na0j-vs-eh-na0g-right.jpg",
  },
  "panasonic-mc-sb53k-vs-mc-sb33j": {
    left: "/products/panasonic-mc-sb53k-vs-mc-sb33j-left.jpg",
    right: "/products/panasonic-mc-sb53k-vs-mc-sb33j-right.jpg",
  },
  "panasonic-ew-dp57-vs-ew-dt73": {
    left: "/products/panasonic-ew-dp57-vs-ew-dt73-left.jpg",
    right: "/products/panasonic-ew-dp57-vs-ew-dt73-right.jpg",
  },
  "panasonic-ew-da19-vs-ew-da49": {
    left: "/products/panasonic-ew-da19-vs-ew-da49-left.jpg",
    right: "/products/panasonic-ew-da19-vs-ew-da49-right.jpg",
  },
  "panasonic-es-lv9w-vs-es-lv7w": {
    left: "/products/panasonic-es-lv9w-vs-es-lv7w-left.jpg",
    right: "/products/panasonic-es-lv9w-vs-es-lv7w-right.jpg",
  },
  "panasonic-eh-nc80-vs-eh-nc50": {
    left: "/products/panasonic-eh-nc80-vs-eh-nc50-left.jpg",
    right: "/products/panasonic-eh-nc80-vs-eh-nc50-right.jpg",
  },
  "panasonic-eh-na0k-vs-eh-ne9n": {
    left: "/products/panasonic-eh-na0k-vs-eh-ne9n-left.jpg",
    right: "/products/panasonic-eh-na0k-vs-eh-ne9n-right.jpg",
  },
  "panasonic-ep-ma110-vs-ep-ma121": {
    left: "/products/panasonic-ep-ma110-vs-ep-ma121-left.jpg",
    right: "/products/panasonic-ep-ma110-vs-ep-ma121-right.jpg",
  },
  "panasonic-es-wp9b-vs-es-wg0b": {
    left: "/products/panasonic-es-wp9b-vs-es-wg0b-left.jpg",
    right: "/products/panasonic-es-wp9b-vs-es-wg0b-right.jpg",
  },
  "logicool-mx-keys-s-vs-mx-keys-mini": {
    left: "/products/logicool-mx-keys-s-vs-mx-keys-mini-left.jpg",
    right: "/products/logicool-mx-keys-s-vs-mx-keys-mini-right.jpg",
  },
  "logicool-mx-keys-s-for-mac-vs-k780": {
    left: "/products/logicool-mx-keys-s-for-mac-vs-k780-left.jpg",
    right: "/products/logicool-mx-keys-s-for-mac-vs-k780-right.jpg",
  },
  "logicool-k650-vs-k580": {
    left: "/products/logicool-k650-vs-k580-left.jpg",
    right: "/products/logicool-k650-vs-k580-right.jpg",
  },
  "logicool-mx-master-3s-vs-m650": {
    left: "/products/logicool-mx-master-3s-vs-m650-left.jpg",
    right: "/products/logicool-mx-master-3s-vs-m650-right.jpg",
  },
  "logicool-lift-vs-m550": {
    left: "/products/logicool-lift-vs-m550-left.jpg",
    right: "/products/logicool-lift-vs-m550-right.jpg",
  },
  "logicool-zone-vibe-100-vs-zone-300": {
    left: "/products/logicool-zone-vibe-100-vs-zone-300-left.jpg",
    right: "/products/logicool-zone-vibe-100-vs-zone-300-right.jpg",
  },
};

const createCommercialArticle = (
  seed: CommercialArticleSeed,
): ArticleMetadata =>
  defineArticleMetadata({
    id: seed.id,
    productCount: 2,
    path: `/articles/${seed.id}/`,
    title: seed.title,
    headline: seed.headline,
    description: seed.description,
    category: seed.category,
    tags: seed.tags,
    audiences: seed.audiences,
    uses: seed.uses,
    summary: seed.summary,
    publishedAt: "2026-08-17",
    modifiedAt: seed.modifiedAt ?? "2026-08-17",
    productInfoCheckedAt: seed.productInfoCheckedAt,
    purchaseLinksCheckedAt: seed.purchaseLinksCheckedAt,
    purchaseLinkStatus: seed.purchaseLinkStatus ?? "unverified",
    officialSources: seed.officialSources,
    verifiedRows: seed.verifiedRows,
    imagePath:
      commercialArticleImages[seed.id]?.left ??
      commercialArticleImages[seed.id]?.right,
    aboutProductNames: [seed.leftProduct, seed.rightProduct],
    changeLog: [
      {
        date: "2026-08-17",
        summary:
          "公式仕様の比較表を更新。購入前に公式仕様と販売ページを確認する構成。",
      },
    ],
  });

export const tigerKettlePcjVsPcmArticle = defineArticleMetadata({
  id: "tiger-pcj-a080-vs-pcm-a080",
  productCount: 2,
  path: "/articles/tiger-pcj-a080-vs-pcm-a080/",
  title: "タイガー PCJ-A080 と PCM-A080、どっち？｜くらべる商品メモ",
  headline: "タイガーの電気ケトル、どっち？「PCJ-A080」と「PCM-A080」を比較",
  description:
    "タイガー PCJ-A080とPCM-A080を、公式の容量・沸とう時間・サイズ・質量・安全設計で比較",
  category: "キッチン家電",
  tags: ["電気ケトル", "タイガー", "蒸気レス"],
  audiences: ["電気ケトルを買い替えたい人", "蒸気レスと本体形状で選びたい人"],
  uses: ["毎日使う", "カップ1杯をすばやく沸かす", "安全設計で選ぶ"],
  summary:
    "PCJ-A080とPCM-A080を、タイガー公式の商品ページで確認できる容量・沸とう時間・サイズ・質量・安全設計に分けて比較します。",
  publishedAt: "2026-08-17",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-17",
  purchaseLinksCheckedAt: "2026-08-17",
  purchaseLinkStatus: "verified",
  imagePath: "/products/tiger-pcj-a080.jpg",
  aboutProductNames: ["タイガー PCJ-A080", "タイガー PCM-A080"],
  changeLog: [
    {
      date: "2026-08-17",
      summary:
        "タイガー公式の商品ページで仕様・画像を確認し、楽天アフィリエイト短縮URLを生成して初稿を追加。",
    },
  ],
});

export const additionalCommercialArticles = Object.freeze(
  commercialArticleSeeds.map(createCommercialArticle),
);

export const additionalCommercialArticleSeeds = commercialArticleSeeds;

export const yamajitsuFilmHolderArticle = defineArticleMetadata({
  id: "yamajitsu-film-holder-242286-vs-242287",
  productCount: 2,
  path: "/articles/yamajitsu-film-holder-242286-vs-242287/",
  title:
    "山崎実業 フィルムフックまな板ホルダーと鍋蓋ホルダー、どっち？｜くらべる商品メモ",
  headline:
    "山崎実業のフィルムフック収納、どっち？まな板ホルダーと鍋蓋ホルダーを比較",
  description:
    "山崎実業の242286と242287を、公式の収納対象・対応サイズ・寸法・重量・耐荷重で比較",
  category: "キッチン用品",
  tags: ["山崎実業", "tower", "キッチン収納"],
  audiences: [
    "まな板や鍋蓋の収納を見直したい人",
    "フィルムフック収納を公式仕様で比べたい人",
  ],
  uses: ["まな板を収納する", "鍋蓋を収納する", "壁面収納を選ぶ"],
  summary:
    "山崎実業のフィルムフックまな板ホルダー242286とフィルムフック鍋蓋ホルダー242287を、収納対象・対応サイズ・寸法・重量・耐荷重で比較します。",
  publishedAt: "2026-08-19",
  modifiedAt: "2026-08-19",
  productInfoCheckedAt: "2026-08-19",
  purchaseLinksCheckedAt: "2026-08-19",
  purchaseLinkStatus: "verified",
  imagePath: "/products/yamazaki-film-holder-242286.jpg",
  aboutProductNames: [
    "山崎実業 フィルムフックまな板ホルダー タワー 242286",
    "山崎実業 フィルムフック鍋蓋ホルダー タワー 242287",
  ],
  changeLog: [
    {
      date: "2026-08-19",
      summary:
        "山崎実業公式の商品ページで仕様・画像を確認し、楽天公式UIで短縮URLを生成して初稿を追加。",
    },
  ],
});

export const articleMetadata = Object.freeze([
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
  panasonicShaverEsLt4bVsEsLv7jArticle,
  sharpKcS50VsFuS50Article,
  thermosTigerBottleArticle,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  yamazakiFreeBroomArticle,
  yamazakiDustWagonArticle,
  zojirushiElectricKettleArticle,
  zojirushiEqSb22VsAh22Article,
  zojirushiToasterArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicBabyMonitorArticle,
  panasonicEhNa9mGuideArticle,
  thermosKfm020VsKfi020Article,
  tigerMtaJ050GuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  tigerKettlePcjVsPcmArticle,
  yamajitsuFilmHolderArticle,
  ...additionalCommercialArticles,
]);

const commercialArticleIds = new Set(
  additionalCommercialArticleSeeds.map((article) => article.id),
);

// 初稿の共通テンプレート記事は、商品情報の確認日が入るまで公開対象から外す。
export const publicArticleMetadata = Object.freeze(
  articleMetadata.filter(
    (article) =>
      !commercialArticleIds.has(article.id) ||
      Boolean(article.productInfoCheckedAt),
  ),
);
