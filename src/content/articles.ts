export interface ArticleChangeLogEntry {
  date: string;
  summary: string;
}

export interface ArticleMetadata {
  id: string;
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
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function defineArticleMetadata(
  metadata: ArticleMetadata,
): ArticleMetadata {
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
  modifiedAt: "2026-07-31",
  productInfoCheckedAt: "2026-07-31",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pampers-premium-newborn.jpg",
  changeLog: [
    {
      date: "2026-07-31",
      summary: "初回公開。メーカー公式の商品機能とサイズ情報を確認。",
    },
  ],
});

export const merriesNewbornArticle = defineArticleMetadata({
  id: "merries-newborn",
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
  modifiedAt: "2026-08-08",
  productInfoCheckedAt: "2026-08-08",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/merries-fp-newborn.jpg",
  changeLog: [
    {
      date: "2026-08-08",
      summary: "初回公開。花王公式の商品機能とサイズ情報を確認。",
    },
  ],
});

export const pigeonBottle240Article = defineArticleMetadata({
  id: "pigeon-bottle-240",
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
  modifiedAt: "2026-08-09",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-glass240.jpg",
  changeLog: [
    {
      date: "2026-08-09",
      summary:
        "初回公開。ピジョン公式の商品情報・Q&Aをもとに素材の違いを整理。",
    },
  ],
});

export const pigeonSlim240Article = defineArticleMetadata({
  id: "pigeon-slim-240",
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
  modifiedAt: "2026-08-09",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-glass240.jpg",
  changeLog: [
    {
      date: "2026-08-09",
      summary:
        "初回公開。ピジョン公式の商品情報・乳首ページをもとに2シリーズの違いを整理。",
    },
  ],
});

export const moonyMArticle = defineArticleMetadata({
  id: "moony-m",
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
  modifiedAt: "2026-08-09",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/moony-teishigeki-m.jpg",
  changeLog: [
    {
      date: "2026-08-09",
      summary:
        "初回公開。ユニ・チャーム公式の商品ページをもとにサイズ別仕様を整理。",
    },
  ],
});

export const merriesPantsArticle = defineArticleMetadata({
  id: "merries-pants",
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
  modifiedAt: "2026-08-10",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  changeLog: [
    {
      date: "2026-08-10",
      summary: "初回公開。花王公式の商品機能とパンツタイプのサイズ展開を確認。",
    },
  ],
});

export const shupotArticle = defineArticleMetadata({
  id: "shupot",
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
  modifiedAt: "2026-08-10",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/shupot-dendo.jpg",
  changeLog: [
    {
      date: "2026-08-10",
      summary:
        "初回公開。ピジョン公式ショップの商品情報・安全に関するお知らせを確認。",
    },
  ],
});

export const babybjornArticle = defineArticleMetadata({
  id: "babybjorn",
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
  modifiedAt: "2026-08-10",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-harmony.jpg",
  changeLog: [
    {
      date: "2026-08-10",
      summary: "初回公開。ベビービョルン公式の比較表・製品ページを確認。",
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
]);
