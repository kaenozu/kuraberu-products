/**
 * ArticleComparisonV2（比較シェル）の記事別データレジストリ（単一情報源）
 *
 * src/pages/articles/<slug>/index.astro の frontmatter に直書きされていた
 * V2 シェル（HeroComparison / VisualKeyDifferences / NextStepBlock / TrustLine）
 * の props を articleId で引けるように集約したもの。
 *
 * - 購入URLは lib/products.ts の articlePurchaseLinks（キー "<articleId>:left|right"）
 *   から解決し、ページ側の直書きをなくす
 * - 公式URL（officialHref）もこのレジストリに定義する。ただし spec-claims /
 *   official-links の各ソース検査（ページファイル内の公式URLリテラルを抽出する）
 *   との整合を保つため、ページ側にも同じ URL リテラルを1行だけ残す。
 *   両者の一致は tests/comparison-v2-registry.test.ts が検証する
 * - 確認日（checkedAt）・購入リンク状態（purchaseLinkStatus）はモノリス
 *   articles.ts のメタデータから解決する。かつて purchaseLinkStatus を
 *   渡していなかったページ（panasonic-es-lt4b-vs-es-lv7j /
 *   yamajitsu-film-holder-242286-vs-242287）もメタデータ上 verified のため、
 *   常に渡しても出力は変わらない
 *
 * defineArticleMetadata と同じく、定義時に検証して失敗させます（fail-fast）。
 */
import {
  articlePurchaseLinks,
  type ArticlePurchaseLink,
} from "../../lib/products";
import { articleMetadata } from "../articles";
import type { ComparisonRow } from "./types";

/** ArticleComparisonV2 の片側商品データ。purchaseHref はレジストリが解決するため不要。 */
export interface ComparisonV2Side {
  brand: string;
  line: string;
  tagline: string;
  image: string;
  imageAlt: string;
  officialHref: string;
  guidePoints: readonly string[];
  /** クリック計測用の商品ID（任意） */
  productId?: string;
}

/** 記事ページから宣言する比較シェルデータ。 */
export interface ComparisonV2EntryInput {
  left: ComparisonV2Side;
  right: ComparisonV2Side;
  /** 主な違い（VisualKeyDifferences の行）。少なくとも1行必須。 */
  rows: readonly ComparisonRow[];
  /** 診断カテゴリページURL（省略時は診断一覧） */
  diagnosisHref?: string;
  /** 「この一覧以外は両商品とも同じ」の注記 */
  commonNote?: string;
}

/** 解決済みの比較シェルデータ（購入URLとメタデータ解決結果を含む）。 */
export interface ComparisonV2Entry {
  readonly articleId: string;
  readonly left: Readonly<ComparisonV2Side>;
  readonly right: Readonly<ComparisonV2Side>;
  readonly rows: readonly ComparisonRow[];
  readonly diagnosisHref?: string;
  readonly commonNote?: string;
  /** articlePurchaseLinks の "<articleId>:left|right" から解決した購入URL */
  readonly purchaseHrefs: Readonly<{ left: string; right: string }>;
  /** モノリスメタデータの productInfoCheckedAt */
  readonly checkedAt?: string;
  /** モノリスメタデータの purchaseLinkStatus */
  readonly purchaseLinkStatus: "verified" | "unverified" | "unavailable";
}

const purchaseLinkIndex = new Map<string, ArticlePurchaseLink>(
  Object.entries(articlePurchaseLinks),
);

const requireSideText = (side: ComparisonV2Side, label: string): void => {
  for (const [field, value] of [
    ["brand", side.brand],
    ["line", side.line],
    ["tagline", side.tagline],
    ["image", side.image],
    ["imageAlt", side.imageAlt],
    ["officialHref", side.officialHref],
  ] as const) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError(
        `comparisonV2: ${label}.${field} must be a non-empty string`,
      );
    }
  }
  if (
    !Array.isArray(side.guidePoints) ||
    side.guidePoints.length === 0 ||
    side.guidePoints.some((point) => point.trim().length === 0)
  ) {
    throw new TypeError(
      `comparisonV2: ${label}.guidePoints must contain at least one non-empty value`,
    );
  }
};

/**
 * 比較シェルデータを検証して凍結する。
 * defineArticleMetadata と同じ規約（定義時の TypeError 送出）に従う。
 */
export function defineComparisonV2(
  articleId: string,
  input: ComparisonV2EntryInput,
): ComparisonV2Entry {
  if (!/^[a-z0-9-]+$/.test(articleId)) {
    throw new TypeError(
      `comparisonV2: articleId "${articleId}" must be a kebab-case slug`,
    );
  }
  const metadata = articleMetadata.find((article) => article.id === articleId);
  if (!metadata) {
    throw new TypeError(
      `comparisonV2: unknown articleId "${articleId}" (not found in content/articles metadata)`,
    );
  }
  if (!input.left || !input.right) {
    throw new TypeError("comparisonV2: left and right must both be declared");
  }
  requireSideText(input.left, "left");
  requireSideText(input.right, "right");
  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    throw new TypeError(
      "comparisonV2: rows must contain at least one comparison row",
    );
  }
  for (const row of input.rows) {
    for (const field of ["label", "left", "right"] as const) {
      if (typeof row[field] !== "string" || row[field].trim().length === 0) {
        throw new TypeError(
          `comparisonV2: rows[].${field} must be a non-empty string (articleId: ${articleId})`,
        );
      }
    }
  }
  if (
    input.diagnosisHref !== undefined &&
    !input.diagnosisHref.startsWith("/")
  ) {
    throw new TypeError(
      "comparisonV2: diagnosisHref must be root-relative when declared",
    );
  }
  const leftPurchaseUrl = purchaseLinkIndex.get(
    `${articleId}:left`,
  )?.purchaseUrl;
  const rightPurchaseUrl = purchaseLinkIndex.get(
    `${articleId}:right`,
  )?.purchaseUrl;
  if (!leftPurchaseUrl || !rightPurchaseUrl) {
    throw new TypeError(
      `comparisonV2: articlePurchaseLinks must declare "${articleId}:left" and "${articleId}:right"`,
    );
  }
  return Object.freeze({
    articleId,
    ...input,
    left: Object.freeze({ ...input.left }),
    right: Object.freeze({ ...input.right }),
    rows: Object.freeze([...input.rows]),
    diagnosisHref: input.diagnosisHref,
    commonNote: input.commonNote,
    purchaseHrefs: Object.freeze({
      left: leftPurchaseUrl,
      right: rightPurchaseUrl,
    }),
    checkedAt: metadata.productInfoCheckedAt,
    purchaseLinkStatus: metadata.purchaseLinkStatus,
  });
}

/** レジストリ本体。キーは記事スラグ。 */
export const comparisonV2 = Object.freeze({
  babybjorn: defineComparisonV2("babybjorn", {
    left: {
      brand: "ベビービョルン",
      line: "HARMONY",
      tagline: "新生児から長く使えて多彩な抱き方をしたい人の候補",
      image: "/products/babybjorn-harmony.jpg",
      imageAlt: "ベビービョルン HARMONY",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-harmony/grey-beige-3d-mesh/",
      guidePoints: ["新生児から長く使えて多彩な抱き方をしたい人の候補"],
      productId: "babybjorn-harmony",
    },
    right: {
      brand: "ベビービョルン",
      line: "MINI",
      tagline: "新生児期の手軽さと価格を優先したい人の候補",
      image: "/products/babybjorn-mini.jpg",
      imageAlt: "ベビービョルン MINI",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-mini/",
      guidePoints: ["新生児期の手軽さと価格を優先したい人の候補"],
      productId: "babybjorn-mini",
    },
    rows: [
      {
        label: "対象月齢・対象体重",
        left: "0カ月〜約36ヶ月。体重3.2〜15kg、ヒップ約〜160cm。",
        right: "0カ月〜約12ヶ月。体重3.2〜11kg、ヒップ約〜120cm。",
      },
      {
        label: "抱っこの種類",
        left: "4通り：対面抱っこ（ハイポジション）・対面抱っこ（ローポジション）・前向き抱っこ・おんぶ。",
        right: "2通り。対面と前向きを中心としたシンプル設計。",
      },
      {
        label: "肩と腰のサポート",
        left: "幅広なパッド入りショルダーベルト＋エルゴノミックランバーサポート付き幅広ウエストベルト。腰に荷重を分散し肩の負担を軽減。",
        right: "パッド入りショルダーベルト。ウエストベルトなし。",
      },
      { label: "製品重量", left: "約892g。", right: "約500g。" },
      {
        label: "素材",
        left: "メッシュ・3Dジャージー。",
        right: "コットン・メッシュ。",
      },
      {
        label: "保証期間",
        left: "2年（正規保証1年＋ユーザー登録1年）。",
        right: "2年（正規保証1年＋ユーザー登録1年）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "27,280円〜。",
        right: "9,680円〜。",
      },
    ],
  }),
  "babybjorn-bouncer": defineComparisonV2("babybjorn-bouncer", {
    left: {
      brand: "ベビービョルン",
      line: "Bliss",
      tagline: "最新モデルでデザインのバリエーションから選びたい人の候補",
      image: "/products/babybjorn-bouncer-bliss.jpg",
      imageAlt: "ベビービョルン Bliss",
      officialHref:
        "https://www.babybjorn.jp/products/baby-bouncers/bouncer-bliss/",
      guidePoints: ["最新モデルでデザインのバリエーションから選びたい人の候補"],
      productId: "babybjorn-bouncer-bliss",
    },
    right: {
      brand: "ベビービョルン",
      line: "バランスソフト",
      tagline: "2トーンの落ち着いたデザインを好む人の候補",
      image: "/products/babybjorn-bouncer-balance.jpg",
      imageAlt: "ベビービョルン バランスソフト",
      officialHref:
        "https://www.babybjorn.jp/products/baby-bouncers/bouncer-balance-soft/sky-blue-white-mesh-light-grey/",
      guidePoints: ["2トーンの落ち着いたデザインを好む人の候補"],
      productId: "babybjorn-bouncer-balance",
    },
    rows: [
      {
        label: "シートの素材とデザイン",
        left: "最新モデル。シートカバーをより柔らかく仕上げたモデル。3Dジャージー（放熱効果）・コットン・Air（メッシュ）・ウーブンの素材展開で20種類以上のバリエーション。",
        right:
          "2トーンの生地が特長。コットン・Air（メッシュ）・ウーブン/ジャージーの素材展開。直近カラーバリエーションが増加中。",
      },
      {
        label: "対象月齢・対象体重",
        left: "生後約1ヶ月〜2才くらい（最大体重13kg）。バウンサーとしての使用は体重9kgまで。",
        right:
          "生後約1ヶ月〜2才くらい（最大体重13kg）。バウンサーとしての使用は体重9kgまで。",
      },
      {
        label: "リクライニング",
        left: "3段階リクライニング。",
        right: "3段階リクライニング。「快適に長く使える」と案内。",
      },
      {
        label: "独自機能",
        left: "セルフバウンシング構造（赤ちゃん自身の動きでゆらゆら揺れる構造）。",
        right: "セルフバウンシング構造。",
      },
      {
        label: "製品サイズ・重量",
        left: "幅約39×奥行約89×高さ46〜58cm。約2.1kg。",
        right: "幅約39×奥行約89×高さ46〜58cm。約2.1kg。",
      },
      {
        label: "安全基準・保証",
        left: "SG認証。ASTM・ENに準拠。2年保証（公式楽天市場店の案内）。",
        right: "SG認証。ASTM・ENに準拠。2年保証（公式楽天市場店の案内）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "カラー限定SALE 17,600円〜19,800円（カラー・素材により変動）。",
        right: "カラー限定SALE 17,600円〜19,800円（カラー・素材により変動）。",
      },
    ],
  }),
  "babybjorn-cradle": defineComparisonV2("babybjorn-cradle", {
    left: {
      brand: "ベビービョルン",
      line: "クレードル",
      tagline: "新生児期の揺らして寝かしつけを重視する人の候補",
      image: "/products/babybjorn-cradle.jpg",
      imageAlt: "ベビービョルン クレードル",
      officialHref:
        "https://www.babybjorn.jp/products/baby-cradle-and-travel-crib/",
      guidePoints: ["新生児期の揺らして寝かしつけを重視する人の候補"],
      productId: "babybjorn-cradle",
    },
    right: {
      brand: "アップリカ",
      line: "ココネルエアー AB",
      tagline: "長く使えて折りたためるベビーベッドを探す人の候補",
      image: "/products/aprica-coconel-air.jpg",
      imageAlt: "アップリカ ココネルエアー AB",
      officialHref: "https://www.aprica.jp/products/home/bed/coconel_air/",
      guidePoints: ["長く使えて折りたためるベビーベッドを探す人の候補"],
      productId: "aprica-coconel-air",
    },
    rows: [
      {
        label: "使用できる期間",
        left: "新生児〜生後6か月（体重8kgまで）。使用期間は短めのゆりかご型。",
        right:
          "新生児（2.5kg）〜24カ月（13kgまで）。上段・下段の2段階で長く使える。",
      },
      {
        label: "揺れ（ゆりかご機能）",
        left: "両親が手や足で簡単に優しく揺らせることができる。「制御された、やさしい、はずみのある動き」を作り出す構造。",
        right: "公式案内に揺れ機能の記載なし（固定式）。",
      },
      {
        label: "サイズ",
        left: "本体 幅約79×奥行約58×高さ約65cm。マットレス 幅約71×奥行き約36×厚さ約3cm。",
        right:
          "開いた状態 幅約1052×奥行約704×高さ約951mm。閉じた状態 幅約260×奥行約260×高さ約951mm。",
      },
      {
        label: "重量・持ち運び",
        left: "約6kg。「軽量で女性でも簡単に移動させることができます」（公式案内）。",
        right:
          "約14.5kg（収納袋を除く）。キャスター付きで移動できるが、クレードルより大きく重い。",
      },
      {
        label: "折りたたみ・収納",
        left: "公式案内に折りたたみ・収納袋の記載なし（据え置き型）。",
        right:
          "カンタンに折りたたんで持ち運べる。収納袋付き。帰省・旅行にも使える。",
      },
      {
        label: "多用途（サークル兼用など）",
        left: "新生児期のベッド用途のみ。キャノピー（天蓋）は別売り。",
        right:
          "大きくなったらベビーサークルとしても使える。おむつ替えやお掃除のときの一時置きにも。",
      },
      {
        label: "安全基準・価格（2026-08-10確認）",
        left: "49,500円（送料無料）。",
        right:
          "PSCマーク・乳幼児用ベッドSG合格品。29,700円（他店26,000円台〜）。",
      },
    ],
  }),
  "babybjorn-onekai": defineComparisonV2("babybjorn-onekai", {
    left: {
      brand: "ベビービョルン",
      line: "ONE KAI",
      tagline: "新生児から長く使えて4WAYで多彩な抱き方をしたい人の候補",
      image: "/products/babybjorn-onekai.jpg",
      imageAlt: "ベビービョルン ONE KAI",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-one-air/",
      guidePoints: ["新生児から長く使えて4WAYで多彩な抱き方をしたい人の候補"],
      productId: "babybjorn-onekai",
    },
    right: {
      brand: "ベビービョルン",
      line: "MOVE",
      tagline: "通気性を重視して長めに使いたい人の候補",
      image: "/products/babybjorn-move.jpg",
      imageAlt: "ベビービョルン MOVE",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-move/navy-blue-3d-mesh/",
      guidePoints: ["通気性を重視して長めに使いたい人の候補"],
      productId: "babybjorn-move",
    },
    rows: [
      {
        label: "対象月齢・対象体重",
        left: "0カ月〜約36ヶ月。体重3.5〜15kg、ヒップ約〜160cm。",
        right: "0カ月〜約15ヶ月。体重3.2〜12kg、ヒップ約〜120cm。",
      },
      {
        label: "抱っこの種類",
        left: "4通り：対面抱っこ（ハイポジション）・対面抱っこ（ローポジション）・前向き抱っこ・おんぶ。",
        right: "2通り。",
      },
      {
        label: "ショルダーとウエストのサポート",
        left: "パッド入りショルダーベルト（スッキリ見え・肩にぴったりフィット）＋幅広ウエストベルト（おんぶ時にもスマート）。",
        right: "ショルダーパッド・ウェストベルトの項目は公式比較表で「ー」。",
      },
      {
        label: "素材",
        left: "メッシュ・コットン。",
        right: "メッシュ（フルメッシュ素材で通気性抜群）。",
      },
      { label: "製品重量", left: "約1000g。", right: "約860g。" },
      { label: "ヘッドサポート", left: "○", right: "○" },
      {
        label: "保証期間",
        left: "2年（正規保証1年＋ユーザー登録1年）。",
        right: "2年（正規保証1年＋ユーザー登録1年）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "27,500円。",
        right: "22,000円。",
      },
    ],
  }),
  "babybjorn-potty": defineComparisonV2("babybjorn-potty", {
    left: {
      brand: "ベビービョルン",
      line: "スマートポッティ",
      tagline: "コンパクトに収納できるおまるを探す人の候補",
      image: "/products/babybjorn-smart-potty.jpg",
      imageAlt: "ベビービョルン スマートポッティ",
      officialHref: "https://www.babybjorn.jp/products/bathroom/smart-potty/",
      guidePoints: ["コンパクトに収納できるおまるを探す人の候補"],
      productId: "babybjorn-smart-potty",
    },
    right: {
      brand: "ベビービョルン",
      line: "ポッティチェア",
      tagline: "長い時間座れるイス型おまるを探す人の候補",
      image: "/products/babybjorn-potty-chair.jpg",
      imageAlt: "ベビービョルン ポッティチェア",
      officialHref: "https://www.babybjorn.jp/products/bathroom/potty-chair/",
      guidePoints: ["長い時間座れるイス型おまるを探す人の候補"],
      productId: "babybjorn-potty-chair",
    },
    rows: [
      {
        label: "形状",
        left: "収納式のコンパクトなポッティ。公式の案内では「スペースの限られたバスルームに必要なデザインと機能をコンパクトにまとめた」と記載。",
        right:
          "イス型オマル。公式の案内では「お子さまが長い時間オマルに座る場合、イス型オマルが最適」と記載。柔らかいフォルムの人間工学デザイン。",
      },
      {
        label: "サイズ",
        left: "幅約25.5×奥行き約32×高さ約17.5cm。",
        right: "幅約32×奥行き約33×高さ約33cm。",
      },
      {
        label: "重量・素材",
        left: "約540g。素材はポリプロピレン。",
        right: "約870g。素材はポリプロピレン。",
      },
      {
        label: "中桶",
        left: "収納式の構造（中桶の有無は公式商品ページで確認）。",
        right: "中桶付き。中桶を取り外してそのまま流せる。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "3,080円。",
        right: "4,180円。",
      },
    ],
  }),
  "hitachi-bd-sx130k-vs-bd-stx130k": defineComparisonV2(
    "hitachi-bd-sx130k-vs-bd-stx130k",
    {
      left: {
        brand: "日立",
        line: "BD-SX130K",
        tagline: "ボタン操作を選ぶなら",
        image: "/products/hitachi-bd-sx130k.png",
        imageAlt: "日立 ビッグドラム BD-SX130K",
        officialHref: "https://kadenfan.hitachi.co.jp/wash/lineup/bd-sx130k/",
        guidePoints: [
          "プッシュボタン式操作パネルを確認したい",
          "温水機能を使わない構成を選びたい",
        ],
      },
      right: {
        brand: "日立",
        line: "BD-STX130K",
        tagline: "温水・タッチ操作なら",
        image: "/products/hitachi-bd-stx130k.png",
        imageAlt: "日立 ビッグドラム BD-STX130K",
        officialHref: "https://kadenfan.hitachi.co.jp/wash/lineup/bd-stx130k/",
        guidePoints: [
          "ワイドカラー液晶タッチパネルを使いたい",
          "温水やスチームアイロンコースを確認したい",
        ],
      },
      rows: [
        {
          label: "操作パネル",
          left: "プッシュボタン式操作パネル",
          right: "ワイドカラー液晶タッチパネル",
          highlight: "right",
          highlightNote: "カラー液晶タッチパネル",
        },
        {
          label: "温水機能",
          left: "ー",
          right: "60℃・40℃・30℃など",
          highlight: "right",
          highlightNote: "温水コースあり",
        },
        {
          label: "シワ伸ばし",
          left: "ー",
          right: "スチームアイロンコース",
          highlight: "right",
          highlightNote: "コースあり",
        },
        { label: "本体質量", left: "約92kg", right: "約93kg" },
        {
          label: "洗濯・乾燥容量",
          left: "洗濯・脱水13kg／洗濯～乾燥・乾燥7kg",
          right: "洗濯・脱水13kg／洗濯～乾燥・乾燥7kg",
        },
      ],
    },
  ),
  "kingjim-tepra-sr-r2500p-vs-sr-mk1": defineComparisonV2(
    "kingjim-tepra-sr-r2500p-vs-sr-mk1",
    {
      left: {
        brand: "キングジム テプラ PRO",
        line: "SR-R2500P",
        tagline: "軽さとコンパクトさなら",
        image: "/products/kingjim-sr-r2500p.jpg",
        imageAlt: "キングジム テプラ PRO SR-R2500P",
        officialHref: "https://www.kingjim.co.jp/products/tepra/sr-r2500p.html",
        guidePoints: ["コンパクトさと軽さ、18mmまでのテープ幅で使いたい人向け"],
      },
      right: {
        brand: "キングジム テプラ PRO",
        line: "SR-MK1",
        tagline: "24mm幅とAC電源なら",
        image: "/products/kingjim-sr-mk1.jpg",
        imageAlt: "キングジム テプラ PRO SR-MK1",
        officialHref: "https://www.kingjim.co.jp/products/tepra/sr-mk1.html",
        guidePoints: [
          "24mmまでの幅広いテープとACアダプター対応を使いたい人向け",
        ],
      },
      rows: [
        {
          label: "対応テープ幅",
          left: "4〜18mm",
          right: "4〜24mm",
          highlight: "right",
          highlightNote: "24mmまで",
        },
        {
          label: "質量（電池・テープ除く）",
          left: "約420g",
          right: "約470g",
          highlight: "left",
          highlightNote: "約50g軽い",
        },
        {
          label: "電源",
          left: "単3形電池×6本",
          right: "ACアダプター／単3形電池×6本",
          highlight: "right",
        },
        {
          label: "本体寸法",
          left: "約54×134×145mm",
          right: "約55×133×146mm",
          highlight: null,
        },
        {
          label: "カッター",
          left: "オートカッター",
          right: "オートカッター",
          highlight: null,
        },
      ],
    },
  ),
  "merries-newborn": defineComparisonV2("merries-newborn", {
    left: {
      brand: "メリーズ 新生児用",
      line: "ファーストプレミアム",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/merries-fp-newborn.jpg",
      imageAlt: "メリーズ 新生児用 ファーストプレミアム",
      officialHref: "https://www.kao.co.jp/merries/products/fp/",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "merries-fp-newborn",
    },
    right: {
      brand: "メリーズ 新生児用",
      line: "ずっと肌さらエアスルー",
      tagline: "ムレ・おしっこ対策の機能を確認したい人の候補",
      image: "/products/merries-airsle-newborn.jpg",
      imageAlt: "メリーズ 新生児用 ずっと肌さらエアスルー",
      officialHref: "https://www.kao.co.jp/merries/products/air/",
      guidePoints: ["ムレ・おしっこ対策の機能を確認したい人の候補"],
      productId: "merries-airsle-newborn",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "カシミヤタッチの肌ざわり、吸収面を抗菌、アルガンオイル配合（肌に触れるシート）",
        right:
          "シート表面に目に見えない穴が50億個以上（通気）、おしっこロック、縦横の溝で瞬間吸収",
      },
      {
        label: "新生児サイズ",
        left: "3,000gまで・5,000gまでの2展開。S・Mサイズもあり",
        right: "お誕生（5,000gまで）。S・Mサイズもあり",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  }),
  "merries-pants": defineComparisonV2("merries-pants", {
    left: {
      brand: "メリーズ パンツタイプ",
      line: "ファーストプレミアム",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/merries-fp-newborn.jpg",
      imageAlt: "メリーズ パンツタイプ ファーストプレミアム",
      officialHref: "https://www.kao.co.jp/merries/products/fp/",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "merries-fp-pants",
    },
    right: {
      brand: "メリーズ パンツタイプ",
      line: "ずっと肌さらエアスルー",
      tagline: "ムレ・おしっこ対策の機能を確認したい人の候補",
      image: "/products/merries-airsle-newborn.jpg",
      imageAlt: "メリーズ パンツタイプ ずっと肌さらエアスルー",
      officialHref: "https://www.kao.co.jp/merries/products/air/",
      guidePoints: ["ムレ・おしっこ対策の機能を確認したい人の候補"],
      productId: "merries-airsle-pants",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "カシミヤタッチの肌ざわり、吸収面を抗菌、アルガンオイル配合（肌に触れるシート）、100%通気素材",
        right:
          "シート表面に目に見えない穴が50億個以上（通気）、おしっこロック、縦横の溝で瞬間吸収",
      },
      {
        label: "パンツタイプのサイズ展開",
        left: "S（4〜8kg）・M（6〜12kg）・L（9〜14kg）・ビッグ（12〜22kg）",
        right: "S（4〜8kg）・M（6〜12kg）・L（9〜14kg）・ビッグ（12〜22kg）",
      },
      {
        label: "機能のサイズ別注記",
        left: "背中モレ安心のフィットギャザーはS・Mサイズで案内（足まわりガイド付き）",
        right:
          "通気穴・瞬間吸収の説明は「テープタイプ全サイズ、パンツタイプS/Mサイズ」の注記",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  }),
  "moony-m": defineComparisonV2("moony-m", {
    left: {
      brand: "ムーニー",
      line: "低刺激であんしん",
      tagline: "うんち水分吸収シートの機能を確認したい人の候補",
      image: "/products/moony-teishigeki-m.jpg",
      imageAlt: "ムーニー 低刺激であんしん",
      officialHref: "https://jp.moony.com/ja/products/nmn1.html",
      guidePoints: ["うんち水分吸収シートの機能を確認したい人の候補"],
      productId: "moony-teishigeki-m",
    },
    right: {
      brand: "ムーニー",
      line: "マシュマロ肌ごこちモレ安心",
      tagline: "無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補",
      image: "/products/moony-mashumaro-m.jpg",
      imageAlt: "ムーニー マシュマロ肌ごこちモレ安心",
      officialHref: "https://jp.moony.com/ja/products/mn.html",
      guidePoints: [
        "無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補",
      ],
      productId: "moony-mashumaro-m",
    },
    rows: [
      {
        label: "うんちへの対策",
        left: "うんち水分吸収シートで、ゆるうんちの水分を下層へ吸収し、肌への付着を抑える設計。おしりガイドも搭載。",
        right: "背中と足回りにゆるうんちストッパーを搭載。",
      },
      {
        label: "無添加の内容",
        left: "Mを含む新生児〜Mは、香料・ラテックス・合成着色料の3成分無添加。",
        right:
          "全サイズで、石油由来油剤・香料・ラテックス・合成着色料の4成分無添加。",
      },
      {
        label: "Mサイズの内容量と主な機能",
        left: "Mは6〜11kg、46枚入り。うんち水分吸収シートとおしりガイドが特徴。",
        right:
          "Mは6〜11kg、54枚入り。無添加弱酸性素材、ゆるうんちストッパー、お知らせサイン、最大12時間吸収が案内されている。",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  }),
  "pampers-newborn": defineComparisonV2("pampers-newborn", {
    left: {
      brand: "パンパース 新生児用",
      line: "肌へのいちばん",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/pampers-premium-newborn.jpg",
      imageAlt: "パンパース 新生児用 肌へのいちばん",
      officialHref:
        "https://www.jp.pampers.com/products/pampers-premium-line-tape",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "pampers-premium-newborn",
    },
    right: {
      brand: "パンパース 新生児用",
      line: "さらさらケア",
      tagline: "モレ・ムレ対策の機能を確認したい人の候補",
      image: "/products/pampers-sarasara-newborn.jpg",
      imageAlt: "パンパース 新生児用 さらさらケア",
      officialHref: "https://www.jp.pampers.com/products/pampers-mainline-tape",
      guidePoints: ["モレ・ムレ対策の機能を確認したい人の候補"],
      productId: "pampers-sarasara-newborn",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "ゆるうんちを素早く吸収、ワセリン配合シート、ふかふか肌ざわり",
        right: "ゆるうんちモレガード、のびのびフィットテープ、進化した吸収体",
      },
      {
        label: "新生児サイズ",
        left: "5kgまで。小さめ新生児3,000gも掲載",
        right: "5kgまで",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  }),
  "panasonic-es-lt4b-vs-es-lv7j": defineComparisonV2(
    "panasonic-es-lt4b-vs-es-lv7j",
    {
      left: {
        brand: "パナソニック",
        line: "ES-LT4B",
        tagline: "軽さと3枚刃なら",
        image: "/products/panasonic-es-lt4b.jpg",
        imageAlt: "パナソニック ラムダッシュ ES-LT4B",
        officialHref: "https://panasonic.jp/shaver/products/ES-LT4B.html",
        guidePoints: ["軽さと3枚刃、本体のコンパクトさを確認したい人向け"],
      },
      right: {
        brand: "パナソニック",
        line: "ES-LV7J",
        tagline: "5枚刃と洗浄充電器なら",
        image: "/products/panasonic-es-lv7j.jpg",
        imageAlt: "パナソニック ラムダッシュPRO ES-LV7J",
        officialHref: "https://panasonic.jp/shaver/products/ES-LV7J.html",
        guidePoints: ["5枚刃と全自動洗浄充電器を確認したい人向け"],
      },
      rows: [
        { label: "刃数", left: "3枚刃", right: "5枚刃", highlight: "right" },
        {
          label: "本体質量（キャップ除く）",
          left: "約155g",
          right: "約210g",
          highlight: "left",
          highlightNote: "約55g軽い",
        },
        {
          label: "本体寸法（高さ×幅×奥行）",
          left: "15.5×6.4×5.0cm",
          right: "16.7×7.2×5.9cm",
        },
        {
          label: "充電・付属品",
          left: "ACアダプター充電",
          right: "全自動洗浄充電器・ACアダプター充電",
          highlight: "right",
        },
      ],
    },
  ),
  "panasonic-ne-fl1a-vs-ne-fl1c": defineComparisonV2(
    "panasonic-ne-fl1a-vs-ne-fl1c",
    {
      left: {
        brand: "パナソニック",
        line: "NE-FL1A",
        tagline: "NE-FL1Aの仕様なら",
        image: "/products/panasonic-ne-fl1a.jpg",
        imageAlt: "パナソニック NE-FL1A",
        officialHref: "https://panasonic.jp/range/products/NE-FL1A.html",
        guidePoints: [
          "NE-FL1Aの公式仕様を確認して選びたい",
          "自動メニュー数2で足りる",
          "庫内幅321mmを確認して置きたい",
        ],
      },
      right: {
        brand: "パナソニック",
        line: "NE-FL1C",
        tagline: "軽さ・庫内幅なら",
        image: "/products/panasonic-ne-fl1c.png",
        imageAlt: "パナソニック NE-FL1C",
        officialHref: "https://panasonic.jp/range/products/NE-FL1C.html",
        guidePoints: [
          "本体を少しでも軽くしたい（8.9kg）",
          "庫内幅332mmを確認して選びたい",
          "自動メニュー数3を使いたい",
        ],
      },
      rows: [
        {
          label: "本体質量",
          left: "9.5kg",
          right: "8.9kg",
          highlight: "right",
          highlightNote: "0.6kg軽い",
          bar: { left: 9.5, right: 8.9 },
        },
        {
          label: "庫内幅",
          left: "321mm",
          right: "332mm",
          highlight: "right",
          highlightNote: "11mm広い",
          bar: { left: 321, right: 332 },
        },
        {
          label: "自動メニュー数",
          left: "自動メニュー数2",
          right: "自動メニュー数3",
          highlight: "right",
          highlightNote: "1つ多い",
          bar: { left: 2, right: 3 },
        },
        {
          label: "総庫内容量",
          left: "22L",
          right: "22L",
        },
      ],
      commonNote:
        "どちらも同じ：総庫内容量22L・フラット庫内・最高出力1000W（最大1分30秒）・外形寸法 幅488mm×奥行380mm×高さ298mm。",
    },
  ),
  "panasonic-nt-t501-vs-nt-d700": defineComparisonV2(
    "panasonic-nt-t501-vs-nt-d700",
    {
      left: {
        brand: "パナソニック",
        line: "NT-T501",
        tagline: "4枚焼きなら",
        image: "/products/panasonic-nt-t501.jpg",
        imageAlt: "パナソニック オーブントースター NT-T501",
        officialHref: "https://panasonic.jp/toaster/products/NT-T501.html",
        guidePoints: ["4枚焼きと火力5段階を確認して選びたい人向け"],
      },
      right: {
        brand: "パナソニック",
        line: "NT-D700",
        tagline: "温度調節なら",
        image: "/products/panasonic-nt-d700.jpg",
        imageAlt: "パナソニック オーブントースター ビストロ NT-D700",
        officialHref: "https://panasonic.jp/toaster/products/NT-D700.html",
        guidePoints: [
          "自動メニュー・温度調節・インテリジェント制御を確認したい人向け",
        ],
      },
      rows: [
        {
          label: "トースト枚数",
          left: "4枚",
          right: "2枚",
          highlight: "left",
          highlightNote: "2枚多い",
        },
        { label: "消費電力", left: "1200W", right: "1300W" },
        {
          label: "本体寸法",
          left: "幅34.5×奥行32.9×高さ21.9cm",
          right: "幅34.1×奥行32.8×高さ26.9cm",
        },
        {
          label: "火力・温度調節",
          left: "火力5段階",
          right: "120～260℃・8段階",
          highlight: "right",
          highlightNote: "温度調節あり",
        },
        { label: "本体質量", left: "3.5kg", right: "約4.3kg" },
      ],
    },
  ),
  "pigeon-bottle-160-240": defineComparisonV2("pigeon-bottle-160-240", {
    left: {
      brand: "母乳実感",
      line: "160ml",
      tagline: "新生児期から使う人、まず小容量を用意したい人",
      image: "/products/pigeon-bottle-160-240-160ml.jpg",
      imageAlt: "母乳実感 160ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2377.html",
      guidePoints: ["新生児期から使う人、まず小容量を用意したい人"],
      productId: "pigeon-160",
    },
    right: {
      brand: "母乳実感",
      line: "240ml",
      tagline: "哺乳量が増えてきた人、大きめの容量を用意したい人",
      image: "/products/pigeon-bottle-160-240-240ml.jpg",
      imageAlt: "母乳実感 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["哺乳量が増えてきた人、大きめの容量を用意したい人"],
      productId: "pigeon-ppsu-240",
    },
    rows: [
      { label: "容量", left: "160ml", right: "240ml" },
      {
        label: "付属の乳首",
        left: "母乳実感 乳首 SSサイズ・吸い穴 丸穴",
        right: "母乳実感 乳首 Mサイズ・吸い穴 Y字形",
      },
      {
        label: "対象月齢の目安",
        left: "0ヵ月から",
        right: "3ヵ月頃から",
      },
    ],
    diagnosisHref: "/tools/product-finder/baby-bottle/",
  }),
  "pigeon-bottle-240": defineComparisonV2("pigeon-bottle-240", {
    left: {
      brand: "母乳実感",
      line: "耐熱ガラス製（240ml）",
      tagline: "自宅中心で、汚れの落ちやすさを重視する人",
      image: "/products/pigeon-bottle-glass240.jpg",
      imageAlt: "母乳実感 耐熱ガラス製（240ml）",
      officialHref: "https://products.pigeon.co.jp/item/index-2382.html",
      guidePoints: ["自宅中心で、汚れの落ちやすさを重視する人"],
      productId: "pigeon-glass-240",
    },
    right: {
      brand: "母乳実感",
      line: "プラスチック製（PPSU）（240ml）",
      tagline: "外出時にも使い、軽さ・割れにくさを重視する人",
      image: "/products/pigeon-bottle-ppsu240.jpg",
      imageAlt: "母乳実感 プラスチック製（PPSU）（240ml）",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["外出時にも使い、軽さ・割れにくさを重視する人"],
      productId: "pigeon-ppsu-240",
    },
    rows: [
      {
        label: "びんの素材",
        left: "ほうけい酸ガラス",
        right: "ポリフェニルサルホン（PPSU）",
      },
      {
        label: "公式Q&Aで案内される長所",
        left: "汚れが落ちやすいので清潔",
        right: "軽い、落としても割れにくい",
      },
      {
        label: "公式Q&Aで案内される注意点",
        left: "重い／欠け・割れることがある",
        right: "ガラスに比べてキズがつきやすく、色やにおいなどが吸着しやすい",
      },
    ],
    diagnosisHref: "/tools/product-finder/baby-bottle/",
  }),
  "pigeon-slim-240": defineComparisonV2("pigeon-slim-240", {
    left: {
      brand: "ピジョン",
      line: "母乳実感 240ml",
      tagline: "広口タイプで調乳しやすさを重視する人",
      image: "/products/pigeon-bottle-ppsu240.jpg",
      imageAlt: "ピジョン 母乳実感 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["広口タイプで調乳しやすさを重視する人"],
      productId: "pigeon-ppsu-240",
    },
    right: {
      brand: "ピジョン",
      line: "スリムタイプ 240ml",
      tagline: "細身で持ちやすさ・転がりにくさを重視する人",
      image: "/products/pigeon-slim-pp240.jpg",
      imageAlt: "ピジョン スリムタイプ 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-1774.html",
      guidePoints: ["細身で持ちやすさ・転がりにくさを重視する人"],
      productId: "pigeon-slim-240",
    },
    rows: [
      {
        label: "ボトルの形状",
        left: "広口タイプ（公式「持ちやすい太さと使いやすい広口ボトル」）",
        right: "スリムタイプ（公式「転がりにくく、持ちやすい形」）",
      },
      {
        label: "付属乳首（240ml）",
        left: "Mサイズ・Y字形（3ヵ月頃から）",
        right: "Mサイズ・丸穴（4ヵ月頃〜）",
      },
      {
        label: "乳首のラインナップ",
        left: "6サイズ（SS・S・M・L・LL・3L）",
        right: "4サイズ（S・M・Y・L）",
      },
      {
        label: "乳首の互換性（公式の明記）",
        left: "母乳実感の乳首はスリムタイプ哺乳びんに使用不可と明記",
        right: "スリムタイプの乳首ページには母乳実感への使用可否の明記なし",
      },
    ],
    diagnosisHref: "/tools/product-finder/baby-bottle/",
  }),
  shupot: defineComparisonV2("shupot", {
    left: {
      brand: "ピジョン 電動鼻吸い器 シュポット",
      line: "電動 シュポット",
      tagline: "コンセントのある場所でパワフルに吸引したい人の候補",
      image: "/products/shupot-dendo.jpg",
      imageAlt: "ピジョン 電動鼻吸い器 シュポット 電動 シュポット",
      officialHref: "https://shop.pigeon.co.jp/products/1032018",
      guidePoints: ["コンセントのある場所でパワフルに吸引したい人の候補"],
      productId: "shupot-dendo",
    },
    right: {
      brand: "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル",
      line: "手動 シュポットポンプ",
      tagline: "電源不要・価格と気軽さを優先したい人の候補",
      image: "/products/shupot-shudo.jpg",
      imageAlt:
        "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル 手動 シュポットポンプ",
      officialHref: "https://shop.pigeon.co.jp/products/2000638s",
      guidePoints: ["電源不要・価格と気軽さを優先したい人の候補"],
      productId: "shupot-shudo",
    },
    rows: [
      {
        label: "電源と使える場所",
        left: "ACアダプター式で専用ACアダプター付属。コンセントのある水平で安定した場所で使用。",
        right:
          "電源不要。コンパクトサイズ・フード付き・チューブもなく、スッキリ収納・持ち運び便利。",
      },
      {
        label: "吸引力の調整とお手入れ",
        left: "鼻水の状態に合わせてダイヤルで吸引力を調整。鼻水キャッチャーを中心に洗い、電動部本体とACアダプターは水洗い・煮沸・レンジ消毒すべて不可。",
        right:
          "シリコーンポンプとフィット鼻ノズルで適した吸引力を再現。まるごと洗浄OK・消毒/除菌ができる。",
      },
      {
        label: "価格と安全面の注意",
        left: "公式ショップ価格13,585円（2026-08-10確認）。定格15分・1回片鼻5秒以内・弱い位置から段階的に調整を公式が案内。安全に関する重要なお知らせあり。",
        right:
          "公式ショップ価格3,762円（2026-08-10確認）。電源不要で大きな音がでない。",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  }),
  "tiger-mta-j050-guide": defineComparisonV2("tiger-mta-j050-guide", {
    left: {
      brand: "タイガー",
      line: "MTA-J050",
      tagline: "0.5L・軽さを優先するなら",
      image: "/products/tiger-mta-j050.jpg",
      imageAlt: "タイガー MTA-J050",
      officialHref:
        "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/",
      guidePoints: [
        "容量0.5Lで持ち歩きやすい",
        "本体質量約0.26kgで軽い",
        "通勤・通学など日常の持ち歩き向け",
      ],
      productId: "tiger-mta-j050",
    },
    right: {
      brand: "タイガー",
      line: "MTA-J080",
      tagline: "0.8L・容量を優先するなら",
      image:
        "https://www.tiger-corporation.com/wp-content/uploads/2025/07/MTA-J080_750x750-d1adb21a6e79c156ac1d5d974c9b75dd.jpg",
      imageAlt: "タイガー MTA-J080",
      officialHref:
        "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/",
      guidePoints: [
        "容量0.8Lで多めに入れられる",
        "保冷効力7℃以下の案内",
        "長時間の外出や水分補給向け",
      ],
      productId: "tiger-mta-j080",
    },
    rows: [
      {
        label: "容量",
        left: "0.5L",
        right: "0.8L",
        highlight: "right",
        highlightNote: "大容量",
        bar: { left: 0.5, right: 0.8 },
      },
      {
        label: "本体質量",
        left: "約0.26kg",
        right: "約0.36kg",
        highlight: "left",
        highlightNote: "約100g軽い",
        bar: { left: 0.26, right: 0.36 },
      },
      {
        label: "保冷効力（6時間）",
        left: "8℃以下",
        right: "7℃以下",
        highlight: "right",
        highlightNote: "低い温度を保つ",
        bar: { left: 8, right: 7 },
      },
      {
        label: "保温効力（6時間）",
        left: "68℃以上",
        right: "75℃以上",
        highlight: "right",
        highlightNote: "高い温度を保つ",
        bar: { left: 68, right: 75 },
      },
      {
        label: "本体寸法",
        left: "幅7.5×奥行8.6×高さ23.3cm",
        right: "幅7.5×奥行8.6×高さ31.4cm",
      },
    ],
  }),
  "yamajitsu-film-holder-242286-vs-242287": defineComparisonV2(
    "yamajitsu-film-holder-242286-vs-242287",
    {
      left: {
        brand: "山崎実業 tower",
        line: "フィルムフックまな板ホルダー 242286",
        tagline: "まな板2枚を浮かせて収納するなら",
        image: "/products/yamazaki-film-holder-242286.jpg",
        imageAlt: "山崎実業 フィルムフックまな板ホルダー タワー 242286",
        officialHref: "https://www.yamajitsu.co.jp/products/242286",
        guidePoints: [
          "厚みの異なるまな板を2枚、壁面に浮かせて収納したい人向け",
        ],
      },
      right: {
        brand: "山崎実業 tower",
        line: "フィルムフック鍋蓋ホルダー 242287",
        tagline: "鍋蓋を浮かせて収納するなら",
        image: "/products/yamazaki-film-holder-242287.jpg",
        imageAlt: "山崎実業 フィルムフック鍋蓋ホルダー タワー 242287",
        officialHref: "https://www.yamajitsu.co.jp/products/242287",
        guidePoints: ["直径14〜30cmの鍋蓋を壁面に収納したい人向け"],
      },
      rows: [
        {
          label: "収納するもの",
          left: "まな板2枚",
          right: "鍋蓋1枚",
          highlight: null,
        },
        {
          label: "対応サイズ",
          left: "厚み1.5cm・2.5cm以内を各1枚",
          right: "直径14〜30cm",
          highlight: null,
        },
        {
          label: "商品サイズ",
          left: "W12×D5.7×H12cm",
          right: "W13.5×D6.2×H14cm",
          highlight: null,
        },
        {
          label: "商品重量",
          left: "140g",
          right: "120g",
          highlight: "right",
          highlightNote: "20g軽い",
        },
        { label: "耐荷重", left: "2kg", right: "2kg", highlight: null },
      ],
    },
  ),
});

/** レジストリのキー型。articleId の typo はコンパイルエラーになる。 */
export type ComparisonV2ArticleId = keyof typeof comparisonV2;

/** 型安全にレジストリエントリを取り出すヘルパー。 */
export function getComparisonV2Entry(
  articleId: ComparisonV2ArticleId,
): ComparisonV2Entry {
  return comparisonV2[articleId];
}
