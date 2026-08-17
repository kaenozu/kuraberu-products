export interface ArticleChangeLogEntry {
  date: string;
  summary: string;
}

export interface ArticleMetadata {
  id: string;
  productCount: number;
  /** 長文記事フラグ（true の記事だけ途中 CTA = after-decision を許容する。v3） */
  midArticleCta?: boolean;
  path: `/articles/${string}/`;
  title: string;
  headline: string;
  description: string;
  category: string;
  tags: readonly string[];
  audiences: readonly string[];
  uses: readonly string[];
  summary: string;
  publishedAt: string;
  modifiedAt: string;
  productInfoCheckedAt?: string;
  purchaseLinksCheckedAt?: string;
  purchaseLinkStatus: "verified" | "unverified" | "unavailable";
  changeLog: readonly ArticleChangeLogEntry[];
  imagePath?: `/${string}`;
  /**
   * JSON-LD の about（schema.org Product）に出す商品名。
   * 件数は productCount と一致させる（商品ガイド = 1、比較記事 = 2）。
   * 商品ガイド（productCount = 1）は必須。比較記事は未宣言なら about を出力しない。
   */
  aboutProductNames?: readonly string[];
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

// Build-time reference date to prevent future dates
const buildReferenceDate = new Date().toISOString().slice(0, 10);

export function defineArticleMetadata(
  metadata: ArticleMetadata,
): ArticleMetadata {
  if (!Number.isInteger(metadata.productCount) || metadata.productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
  }
  if (metadata.productCount === 1 && !metadata.aboutProductNames) {
    throw new TypeError(
      "aboutProductNames must be declared for single-product (guide) articles",
    );
  }
  if (
    metadata.aboutProductNames !== undefined &&
    (metadata.aboutProductNames.length !== metadata.productCount ||
      metadata.aboutProductNames.some((name) => name.trim().length === 0))
  ) {
    throw new TypeError(
      `aboutProductNames must have exactly ${metadata.productCount} non-empty entries (one per product)`,
    );
  }
  for (const [label, value] of [
    ["publishedAt", metadata.publishedAt],
    ["modifiedAt", metadata.modifiedAt],
    ...(metadata.productInfoCheckedAt
      ? [["productInfoCheckedAt", metadata.productInfoCheckedAt] as const]
      : []),
    ...(metadata.purchaseLinksCheckedAt
      ? [["purchaseLinksCheckedAt", metadata.purchaseLinksCheckedAt] as const]
      : []),
    ...metadata.changeLog.map(
      (entry) => ["changeLog.date", entry.date] as const,
    ),
  ] as const) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (
      !isoDate.test(value) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new TypeError(`${label} must be an ISO 8601 calendar date`);
    }
  }
  if (metadata.modifiedAt < metadata.publishedAt) {
    throw new TypeError("modifiedAt must not precede publishedAt");
  }
  if (
    metadata.productInfoCheckedAt &&
    metadata.productInfoCheckedAt > metadata.modifiedAt
  ) {
    throw new TypeError("productInfoCheckedAt must not exceed modifiedAt");
  }
  if (
    metadata.purchaseLinksCheckedAt &&
    metadata.purchaseLinksCheckedAt > metadata.modifiedAt
  ) {
    throw new TypeError("purchaseLinksCheckedAt must not exceed modifiedAt");
  }
  if (
    metadata.purchaseLinkStatus === "verified" &&
    !metadata.purchaseLinksCheckedAt
  ) {
    throw new TypeError("verified purchase links require a checked date");
  }
  // Prevent future dates relative to build time
  for (const [label, value] of [
    ["publishedAt", metadata.publishedAt],
    ["modifiedAt", metadata.modifiedAt],
    ...(metadata.productInfoCheckedAt
      ? [["productInfoCheckedAt", metadata.productInfoCheckedAt] as const]
      : []),
    ...(metadata.purchaseLinksCheckedAt
      ? [["purchaseLinksCheckedAt", metadata.purchaseLinksCheckedAt] as const]
      : []),
    ...metadata.changeLog.map(
      (entry) => ["changeLog.date", entry.date] as const,
    ),
  ] as const) {
    if (value > buildReferenceDate) {
      throw new TypeError(
        `${label} (${value}) must not be a future date relative to build (${buildReferenceDate})`,
      );
    }
  }
  for (const [label, values] of [
    ["tags", metadata.tags],
    ["audiences", metadata.audiences],
    ["uses", metadata.uses],
  ] as const) {
    if (values.length === 0) {
      throw new TypeError(`${label} must contain at least one value`);
    }
    const normalized = values.map((value) => value.normalize("NFKC").trim());
    if (normalized.some((value) => value.length === 0)) {
      throw new TypeError(`${label} must not contain empty values`);
    }
    if (new Set(normalized).size !== normalized.length) {
      throw new TypeError(`${label} must not contain duplicate values`);
    }
  }
  if (metadata.changeLog.length === 0) {
    throw new TypeError("changeLog must contain at least one factual entry");
  }
  for (const entry of metadata.changeLog) {
    if (!entry.summary.trim()) {
      throw new TypeError("changeLog summary must not be empty");
    }
  }
  if (!metadata.path.endsWith("/") || !metadata.path.startsWith("/articles/")) {
    throw new TypeError("article path must be a canonical /articles/.../ path");
  }
  if (metadata.imagePath && !metadata.imagePath.startsWith("/")) {
    throw new TypeError("imagePath must be root-relative");
  }
  return Object.freeze({ ...metadata });
}

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
};

const commercialArticleSeeds: readonly CommercialArticleSeed[] = [
  {
    id: "roborock-qrevo-curv-vs-dreame-x50",
    title:
      "ロボロック Qrevo CurvとDreame X50 Ultra、どっち？｜くらべる商品メモ",
    headline: "ロボット掃除機の人気モデルを比較。段差・モップ・自動化で選ぶ",
    description:
      "ロボット掃除機を、公式仕様で確認できる掃除方式・モップ・段差対応・ステーション機能から比較します。",
    category: "生活家電",
    tags: ["ロボット掃除機", "時短家電", "掃除"],
    audiences: ["掃除の手間を減らしたい人", "購入前に機能差を整理したい人"],
    uses: ["床掃除", "共働きの家事効率化", "ロボット掃除機選び"],
    summary:
      "ロボット掃除機の候補を、床掃除・モップ・段差・自動化の確認項目に分けて比べます。",
    leftProduct: "Roborock Qrevo Curv",
    rightProduct: "Dreame X50 Ultra",
    leftPoint: "モップ洗浄・乾燥や障害物回避の仕様を確認したい人向け",
    rightPoint: "段差対応や清掃ステーションの仕様を確認したい人向け",
  },
  {
    id: "makita-cl107-vs-cl286",
    title: "マキタ CL107FDSHWとCL286FD、どっち？｜くらべる商品メモ",
    headline: "マキタのコードレス掃除機を比較。軽さ・吸引・紙パックで選ぶ",
    description:
      "マキタのコードレス掃除機を、重量・電源・集じん方式・使い方で比較します。",
    category: "生活家電",
    tags: ["コードレス掃除機", "マキタ", "一人暮らし"],
    audiences: ["軽い掃除機を探している人", "マキタの型番を比較したい人"],
    uses: ["毎日の掃除", "階段掃除", "狭い部屋の掃除"],
    summary:
      "軽量モデルと上位モデルを、重量・バッテリー・集じん方式などの確認項目で整理します。",
    leftProduct: "マキタ CL107FDSHW",
    rightProduct: "マキタ CL286FD",
    leftPoint: "軽さと手軽さを優先する人向け",
    rightPoint: "吸引力や運転時間の選択肢を確認したい人向け",
  },
  {
    id: "iris-airfryer-fvx-d3-vs-tefal-ey201",
    title:
      "アイリスオーヤマ FVX-D3とティファール EY201、どっち？｜くらべる商品メモ",
    headline: "ノンフライヤーを比較。容量・温度設定・調理のしやすさで選ぶ",
    description:
      "ノンフライヤーの候補を、容量・温度設定・タイマー・お手入れの確認項目で比較します。",
    category: "キッチン家電",
    tags: ["ノンフライヤー", "時短調理", "キッチン家電"],
    audiences: ["揚げ物を手軽に作りたい人", "キッチン家電の容量を比べたい人"],
    uses: ["揚げ物調理", "冷凍食品の調理", "平日の時短"],
    summary:
      "ノンフライヤーを、容量・温度・タイマー・洗いやすさの確認項目に分けて比べます。",
    leftProduct: "アイリスオーヤマ FVX-D3",
    rightProduct: "ティファール EY201",
    leftPoint: "容量と操作方法を確認して選びたい人向け",
    rightPoint: "調理モードやブランドの使い勝手を確認したい人向け",
  },
  {
    id: "recolte-automatic-cooker-vs-panasonic-nf-pc400",
    title:
      "レコルト自動調理ポットとパナソニック NF-PC400、どっち？｜くらべる商品メモ",
    headline: "自動調理鍋を比較。容量・メニュー・洗いやすさで選ぶ",
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
  },
  {
    id: "brita-marella-vs-zero-water",
    title: "ブリタ マレーラとゼロウォーター、どっち？｜くらべる商品メモ",
    headline: "ポット型浄水器を比較。容量・カートリッジ・交換コストで選ぶ",
    description:
      "ポット型浄水器を、容量・ろ過方式・交換目安・注水方法で比較します。",
    category: "キッチン用品",
    tags: ["浄水器", "ブリタ", "水"],
    audiences: ["水道水を手軽に使いたい人", "カートリッジを比較したい人"],
    uses: ["飲み水", "料理", "冷蔵庫での保管"],
    summary: "ポット型浄水器を、容量・ろ過・交換・冷蔵庫収納の観点で比べます。",
    leftProduct: "ブリタ マレーラ",
    rightProduct: "ゼロウォーター 10カップ",
    leftPoint: "入手しやすい交換カートリッジを重視する人向け",
    rightPoint: "ろ過性能の確認を優先したい人向け",
  },
  {
    id: "tiger-jpv-l100-vs-zojirushi-nw-fc10",
    title: "タイガー JPV-L100と象印 NW-FC10、どっち？｜くらべる商品メモ",
    headline: "5.5合炊き炊飯器を比較。炊飯方式・メニュー・手入れで選ぶ",
    description:
      "5.5合炊き炊飯器を、炊飯方式・メニュー・内釜・お手入れで比較します。",
    category: "キッチン家電",
    tags: ["炊飯器", "5.5合", "家電"],
    audiences: ["毎日ごはんを炊く人", "炊飯器の上位モデルを比べたい人"],
    uses: ["家族のごはん", "冷凍ごはん", "炊き込みごはん"],
    summary:
      "人気の5.5合炊き候補を、炊飯方式・メニュー・内釜・清掃性で整理します。",
    leftProduct: "タイガー JPV-L100",
    rightProduct: "象印 NW-FC10",
    leftPoint: "土鍋系の炊き上がりと操作を確認したい人向け",
    rightPoint: "圧力・メニュー数と保温仕様を確認したい人向け",
  },
  {
    id: "sharp-kc-s50-vs-panasonic-f-vxw55",
    title: "シャープ KC-S50とパナソニック F-VXW55、どっち？｜くらべる商品メモ",
    headline: "加湿空気清浄機を比較。適用床面積・加湿・フィルターで選ぶ",
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
    rightPoint: "ナノイーや加湿運転の仕様を確認したい人向け",
  },
  {
    id: "anker-soundcore-liberty-4-nc-vs-sony-wf-c710n",
    title:
      "Soundcore Liberty 4 NCとソニー WF-C710N、どっち？｜くらべる商品メモ",
    headline: "ノイズキャンセリングイヤホンを比較。機能・電池・装着感で選ぶ",
    description:
      "完全ワイヤレスイヤホンを、ノイズキャンセリング・連続再生・防水・アプリで比較します。",
    category: "オーディオ",
    tags: ["ワイヤレスイヤホン", "ノイズキャンセリング", "通勤"],
    audiences: ["通勤中に音楽を聴く人", "1万円前後のイヤホンを比べたい人"],
    uses: ["通勤・通学", "オンライン会議", "動画視聴"],
    summary:
      "人気の完全ワイヤレス候補を、ANC・再生時間・防水・アプリ機能で整理します。",
    leftProduct: "Soundcore Liberty 4 NC",
    rightProduct: "ソニー WF-C710N",
    leftPoint: "機能数と長時間再生を確認したい人向け",
    rightPoint: "軽さとソニーの音質・装着設計を確認したい人向け",
  },
  {
    id: "xiaomi-redmi-watch-5-vs-huawei-band-10",
    title: "Redmi Watch 5とHUAWEI Band 10、どっち？｜くらべる商品メモ",
    headline: "スマートウォッチ・活動量計を比較。画面・電池・健康記録で選ぶ",
    description:
      "手頃なウェアラブル端末を、画面・バッテリー・通知・健康記録で比較します。",
    category: "スマート機器",
    tags: ["スマートウォッチ", "活動量計", "健康管理"],
    audiences: ["初めてスマート機器を買う人", "電池持ちを重視する人"],
    uses: ["歩数管理", "睡眠記録", "スマホ通知"],
    summary:
      "手頃なウェアラブル候補を、画面サイズ・電池・通知・記録機能で比べます。",
    leftProduct: "Xiaomi Redmi Watch 5",
    rightProduct: "HUAWEI Band 10",
    leftPoint: "大きな画面と時計らしい操作を優先する人向け",
    rightPoint: "軽さとバンド型の装着感を優先する人向け",
  },
  {
    id: "panasonic-eh-na9m-vs-refa-beautech",
    title: "パナソニック EH-NA9MとReFa BEAUTECH、どっち？｜くらべる商品メモ",
    headline: "高機能ドライヤーを比較。ケア機能・風量・重さで選ぶ",
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
    modifiedAt: "2026-08-17",
    productInfoCheckedAt: seed.productInfoCheckedAt,
    purchaseLinksCheckedAt: seed.purchaseLinksCheckedAt,
    purchaseLinkStatus: seed.purchaseLinkStatus ?? "unverified",
    imagePath:
      commercialArticleImages[seed.id]?.left ??
      commercialArticleImages[seed.id]?.right,
    aboutProductNames: [seed.leftProduct, seed.rightProduct],
    changeLog: [
      {
        date: "2026-08-17",
        summary:
          "売れ筋カテゴリの比較候補として初稿を追加。購入前に公式仕様と販売ページを確認する構成。",
      },
    ],
  });

export const additionalCommercialArticles = Object.freeze(
  commercialArticleSeeds.map(createCommercialArticle),
);

export const additionalCommercialArticleSeeds = commercialArticleSeeds;

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
  panasonicVacuumArticle,
  panasonicHairDryerArticle,
  tefalKettleArticle,
  panasonicNeFl1aVsNeFl1cArticle,
  sharpKcS50VsFuS50Article,
  thermosTigerBottleArticle,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  yamazakiFreeBroomArticle,
  yamazakiDustWagonArticle,
  zojirushiElectricKettleArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicBabyMonitorArticle,
  panasonicEhNa9mGuideArticle,
  thermosKfm020VsKfi020Article,
  tigerMtaJ050GuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  ...additionalCommercialArticles,
]);
