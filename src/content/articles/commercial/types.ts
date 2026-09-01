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
  purchaseLinkStatus?: "verified" | "direct" | "unverified";
  officialSources?: readonly {
    label: string;
    url: `https://${string}`;
  }[];
  verifiedRows?: readonly {
    label: string;
    left: string;
    right: string;
  }[];
  /** 左側商品の画像パス（"/products/..."）。省略時は hero セクションの画像をスキップ。 */
  leftImage?: `/${string}`;
  /** 右側商品の画像パス（"/products/..."）。省略時は hero セクションの画像をスキップ。 */
  rightImage?: `/${string}`;
  /** 商品固有のFAQ（省略時は汎用FAQ） */
  faqEntries?: readonly { question: string; answer: string }[];
  /** リード文の上書き（省略時は summary + 汎用文） */
  lead?: string;
  /** 選び方ガイドのステップ（省略時は汎用4ステップ） */
  decisionGuideSteps?: readonly string[];
  /** SNS ソーシャルプルーフ検索クエリ */
  socialProofQuery?: string;
  /** ソーシャルプルーフ確認日 */
  socialProofCheckedAt?: string;
  /** ソーシャルプルーフの投稿があるか */
  socialProofHasPosts?: boolean;
  /** 埋め込み投稿の採用基準ランク（model / series / brand） */
  socialProofBestMatch?: string;
  /** 外部埋め込み（X/Twitter等） */
  embeds?: readonly {
    provider: string;
    url: string;
    title: string;
    match: string;
    purpose?: string;
    tone?: string;
    autoload?: boolean;
    compact?: boolean;
  }[];
  /** 公式情報セクションの説明文（各商品ごとの詳細プロス） */
  officialProse?: readonly { heading: string; items: readonly string[] }[];
  /** 情報源リンク一覧 */
  sourceLinks?: readonly { label: string; url: string; date?: string }[];
  /** 免責事項テキスト */
  disclaimer?: string;
};

export type { CommercialArticleSeed };
