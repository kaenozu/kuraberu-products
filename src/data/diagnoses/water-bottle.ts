/**
 * 水筒（0.5L ワンタッチ式）診断設定。
 *
 * ルールは公式情報（サーモス・タイガーの商品ページで確認できる仕様）だけを
 * 参照し、口コミ・価格・推測値はスコアに使わない。
 *
 * 対象: サーモス JNL-S500 / タイガー MTA-J050
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
} from "../../domain/diagnosis/types";

/** 理由コード → 表示文言 の辞書（reasonCode と表示を分離する） */
export const waterBottleReasonDictionary: Record<string, string> = {
  LIGHT_PRIORITY: "軽さを重視する条件に合っています（本体約0.2kg）。",
  COLD_PRIORITY: "保冷力を重視する条件に合っています（6時間で8℃以下）。",
  COLD_SECOND:
    "保冷効力（6時間）10℃以下で、夏場の氷持ちはタイガーより控えめです。",
  BIG_MOUTH:
    "大きめの飲み口（口径約4.8cm）で、氷を入れやすさを重視する条件に合っています。",
  DISHWASHER: "全パーツ食洗機対応を重視する条件に合っています。",
  HANDLE: "ハンドル付き（スラントハンドル）を重視する条件に合っています。",
  COLOR_VARIETY: "カラーバリエーション（12色）を重視する条件に合っています。",
  THERMOS_NOTE:
    "サーモスJNL-S500は、本体約0.2kg・全パーツ食洗機対応・カラー12色が特徴です。",
  TIGER_NOTE:
    "タイガーMTA-J050は、保冷効力8℃以下・ハンドル付き・口径約4.8cmが特徴です。",
};

export const waterBottleDiagnosis: DiagnosisConfig = {
  id: "water-bottle-thermos-tiger",
  categoryId: "water-bottle",
  categoryLabel: "水筒",
  title: "サーモス vs タイガー 0.5L水筒 選び方診断",
  description:
    "サーモスJNL-S500とタイガーMTA-J050の0.5Lワンタッチ式水筒から、あなたの使い方に合う1本を診断します。",
  productIds: ["thermos-jnl-s500", "tiger-mta-j050"],
  questions: [
    {
      id: "priority",
      type: "single",
      label: "持ち歩きで一番重視するのは？",
      description:
        "公式仕様で差がある項目から、優先したいものを選んでください。",
      required: true,
      options: [
        {
          id: "light",
          label: "軽さ",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "weightKg",
                operator: "lte",
                value: 0.2,
              },
              score: 3,
              reasonCode: "LIGHT_PRIORITY",
            },
          ],
        },
        {
          id: "cold",
          label: "保冷力",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "coldEfficiencyC",
                operator: "lte",
                value: 8,
              },
              score: 3,
              reasonCode: "COLD_PRIORITY",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "coldEfficiencyC",
                operator: "gt",
                value: 8,
              },
              score: -1,
              reasonCode: "COLD_SECOND",
            },
          ],
        },
        {
          id: "mouth",
          label: "飲みやすさ（大きめの飲み口）",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "mouthDiameterCm",
                operator: "gte",
                value: 4.5,
              },
              score: 2,
              reasonCode: "BIG_MOUTH",
            },
          ],
        },
      ],
    },
    {
      id: "dishwasher-important",
      type: "boolean",
      label: "食洗機で丸洗いしたいですか？",
      description:
        "「はい」なら全パーツ食洗機対応のサーモスJNL-S500が候補になります。",
      required: true,
      options: [
        {
          id: "yes",
          label: "はい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "dishwasherSafe",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "DISHWASHER",
            },
          ],
        },
        {
          id: "no",
          label: "いいえ",
          rules: [],
        },
      ],
    },
    {
      id: "handle-important",
      type: "boolean",
      label: "ハンドル付きがいいですか？",
      description:
        "「はい」ならハンドル付きのタイガーMTA-J050が候補になります。",
      required: true,
      options: [
        {
          id: "yes",
          label: "はい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "handle",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "HANDLE",
            },
          ],
        },
        {
          id: "no",
          label: "いいえ",
          rules: [],
        },
      ],
    },
    {
      id: "color-important",
      type: "boolean",
      label: "カラーバリエーションを重視しますか？",
      description: "「はい」なら12色展開のサーモスJNL-S500が候補になります。",
      required: false,
      options: [
        {
          id: "yes",
          label: "はい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "colors",
                operator: "gte",
                value: 10,
              },
              score: 2,
              reasonCode: "COLOR_VARIETY",
            },
          ],
        },
        {
          id: "no",
          label: "いいえ",
          rules: [],
        },
      ],
    },
  ],
  tieBreaker: [{ type: "attribute", key: "weightKg", direction: "asc" }],
  resultConfig: {
    topHeadingTemplate: "あなたには「{productName}」が最も合いそうです",
    disclaimer:
      "この診断は、メーカー公式情報と回答条件をもとに商品候補を整理するものです。使用感や個人差を保証するものではありません。",
  },
};

/** 診断ページの静的コンテンツ（SEO用） */
export const waterBottlePageContent: DiagnosisPageContent = {
  pageTitle:
    "サーモス vs タイガーの水筒、どっち？｜30秒で選べる水筒診断｜くらべる商品メモ",
  headline: "0.5Lの水筒、どっち？30秒で診断",
  pageDescription:
    "サーモスJNL-S500とタイガーMTA-J050の0.5Lワンタッチ式水筒から、あなたの使い方に合う1本を30秒で診断。公式情報に基づくスコアリングです。",
  lead: "サーモスJNL-S500とタイガーMTA-J050は、どちらも0.5Lのワンタッチ式水筒です。軽さ・保冷力・飲み口・お手入れ・ハンドルの公式仕様が異なります。4問に答えるだけです。",
  audience:
    "通勤・通学やお出かけ用の0.5L水筒を買い替えたい人で、軽さ・保冷力・お手入れのどれを優先するか迷っている人向けの診断です。",
  targetItems: [
    "サーモス 真空断熱ケータイマグ JNL-S500：本体約0.2kg・保冷効力10℃以下・全パーツ食洗機対応・カラー12色・ハンドルなし",
    "タイガー 真空断熱ボトル MTA-J050：本体約0.26kg・保冷効力8℃以下・らくらくキャップ（パッキン一体型）・口径約4.8cm・ハンドル付き",
  ],
  guideSections: [
    {
      heading: "1. 軽さ・コンパクトで選ぶ",
      body: "公式の本体重量は、サーモスJNL-S500が約0.2kg、タイガーMTA-J050が約0.26kgです。本体寸法もサーモス（6.5×8.0×22.0cm）の方がタイガー（7.5×8.6×23.3cm）よりコンパクトです。持ち歩きの軽さを重視するならサーモスJNL-S500です。",
    },
    {
      heading: "2. 保冷力で選ぶ",
      body: "公式の保冷効力（6時間）は、タイガーMTA-J050が8℃以下、サーモスJNL-S500が10℃以下です。夏場に氷を長持ちさせたい場合は、数値上はタイガーMTA-J050が有利です。",
    },
    {
      heading: "3. お手入れ・飲み口・ハンドルで選ぶ",
      body: "サーモスJNL-S500は全パーツ食洗機対応です。タイガーMTA-J050は、せんとパッキンが一体になった「らくらくキャップ」でパッキン着脱の手間がなく、口径約4.8cmの大きめの飲み口とハンドル付きが公式に案内されています。",
    },
  ],
  faq: [
    {
      question: "0.5Lの水筒はサーモスとタイガーどっちを選べばいい？",
      answer:
        "軽さ・コンパクト・食洗機での丸洗い・カラーの豊富さを重視するならサーモスJNL-S500、保冷力・ハンドル・大きめの飲み口・スポーツドリンク対応（スーパークリーンPlus）を重視するならタイガーMTA-J050が候補です。どちらも0.5Lのワンタッチ式です。",
    },
    {
      question: "保冷力が強いのはどっち？",
      answer:
        "公式の保冷効力（6時間）は、タイガーMTA-J050が8℃以下、サーモスJNL-S500が10℃以下です。夏場に氷を長持ちさせたい場合はタイガーMTA-J050の方が数値上は有利です（2026年8月12日時点の公式商品ページで確認）。",
    },
    {
      question: "診断の判定根拠は何ですか？",
      answer:
        "サーモス・タイガー公式の商品ページで確認できる情報（本体重量・保冷効力・口径・お手入れ方法・ハンドル・カラー数）だけを判定に使います。口コミや推測値はスコアに使いません。",
    },
    {
      question: "スポーツドリンクを入れたい場合は？",
      answer:
        "タイガーMTA-J050の内面は「スーパークリーンPlus」で、公式案内では塩分を含むスポーツドリンクを入れてもOKとされています（使用後はすぐに水ですすぐなどお手入れが必要）。サーモスJNL-S500のスポーツドリンク対応は、今回確認した公式ページには明記されていません。",
    },
  ],
  relatedArticles: [
    {
      path: "/articles/thermos-tiger-bottle/",
      label: "サーモス JNL-S500 vs タイガー MTA-J050 の違いを詳しく見る",
    },
    {
      path: "/articles/tiger-mta-j050-guide/",
      label: "タイガー MTA-J050 の商品ガイドを見る",
    },
  ],
};
