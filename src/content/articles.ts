export interface ArticleChangeLogEntry {
  date: string;
  summary: string;
}

export interface ArticleMetadata {
  id: string;
  productCount: number;
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

// Build-time reference date to prevent future dates
const buildReferenceDate = new Date().toISOString().slice(0, 10);

export function defineArticleMetadata(
  metadata: ArticleMetadata,
): ArticleMetadata {
  if (!Number.isInteger(metadata.productCount) || metadata.productCount < 1) {
    throw new TypeError("productCount must be a positive integer");
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-07-31",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pampers-premium-newborn.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-08",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/merries-fp-newborn.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-glass240.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-glass240.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-09",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/moony-teishigeki-m.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/shupot-dendo.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-harmony.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-onekai.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-bouncer-bliss.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-cradle.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/babybjorn-smart-potty.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-11",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/pigeon-bottle-160-240-160ml.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-12",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/thermos-jnl-s500.jpg",
  changeLog: [
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
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-14",
  purchaseLinkStatus: "unverified",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "初回公開。パナソニック公式の商品機能と仕様を確認。単一商品記事のサンプルとして追加。",
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
  panasonicVacuumArticle,
  panasonicHairDryerArticle,
  tefalKettleArticle,
  sharpKcS50VsFuS50Article,
  thermosTigerBottleArticle,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  zojirushiElectricKettleArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicBabyMonitorArticle,
]);
