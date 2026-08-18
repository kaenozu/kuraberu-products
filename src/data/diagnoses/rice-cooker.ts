/**
 * 炊飯器（タイガー 圧力IH 5.5合）診断設定。
 *
 * ルールは公式情報（タイガーの商品ページで確認できる仕様）だけを参照し、
 * 口コミ・推測値はスコアに使わない。
 *
 * 対象: タイガー JPV-L100 / JPV-M100
 * 注意: 今回確認した5.5合モデルは容量・サイズ・質量が同一。差があるのは
 * 公式でのモデル位置づけ（上位/エントリー）と公式オンライン価格のみ。
 * この診断は「価格・位置づけのどちらを優先するか」を整理する。
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
} from "../../domain/diagnosis/types";

/** 理由コード → 表示文言 の辞書（reasonCode と表示を分離する） */
export const riceCookerReasonDictionary: Record<string, string> = {
  PRICE_FIRST: "価格を抑えたい条件に合っています。",
  PREMIUM_FEATURES: "上位モデルの機能を確認したい条件に合っています。",
  BUDGET_UNDER_50K: "予算5万円以下という条件に合っています。",
  BUDGET_50_60K: "予算5〜6万円という条件に合っています。",
  ENTRY_OK: "エントリーモデルで十分という条件に合っています。",
  PREMIUM_WANT: "上位モデルを検討したい条件に合っています。",
  SAME_SPEC_NOTE:
    "今回確認した5.5合モデルは、容量・サイズ・質量が両モデルとも同じです。",
  L100_NOTE:
    "JPV-L100は公式で上位モデルと案内され、公式オンライン価格は57,800円からです。",
  M100_NOTE:
    "JPV-M100は公式でエントリーモデルと案内され、公式オンライン価格は49,800円からです。",
};

export const riceCookerDiagnosis: DiagnosisConfig = {
  id: "rice-cooker-tiger-jpv",
  categoryId: "rice-cooker",
  categoryLabel: "炊飯器",
  title: "タイガー JPV-L100 vs JPV-M100 選び方診断",
  description:
    "タイガーの圧力IH炊飯器（5.5合）JPV-L100とJPV-M100から、価格・モデル位置づけのどちらを優先するかを整理して、あなたに合う1台を診断します。",
  productIds: ["tiger-jpv-l100", "tiger-jpv-m100"],
  questions: [
    {
      id: "priority",
      type: "single",
      label: "炊飯器選びで一番重視するのは？",
      description:
        "公式ページで確認できる差（モデル位置づけ・価格）から、優先したいものを選んでください。",
      required: true,
      options: [
        {
          id: "price",
          label: "価格を抑えたい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "priceOfficialYen",
                operator: "lte",
                value: 50000,
              },
              score: 3,
              reasonCode: "PRICE_FIRST",
            },
          ],
        },
        {
          id: "premium",
          label: "上位モデルの機能を確認したい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "positioning",
                operator: "eq",
                value: "premium",
              },
              score: 3,
              reasonCode: "PREMIUM_FEATURES",
            },
          ],
        },
        {
          id: "same-spec",
          label: "容量・サイズ重視（どちらも同じ）",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "capacityGo",
                operator: "gte",
                value: 5.5,
              },
              score: 1,
              reasonCode: "SAME_SPEC_NOTE",
            },
          ],
        },
      ],
    },
    {
      id: "budget",
      type: "single",
      label: "予算の目安は？",
      description:
        "公式オンライン価格はJPV-L100が57,800円から、JPV-M100が49,800円からです。",
      required: true,
      options: [
        {
          id: "under-50k",
          label: "5万円以下に抑えたい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "priceOfficialYen",
                operator: "lte",
                value: 50000,
              },
              score: 3,
              reasonCode: "BUDGET_UNDER_50K",
            },
          ],
        },
        {
          id: "50-60k",
          label: "5〜6万円なら出せる",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "priceOfficialYen",
                operator: "lte",
                value: 58000,
              },
              score: 2,
              reasonCode: "BUDGET_50_60K",
            },
          ],
        },
        {
          id: "undecided",
          label: "まだ決めていない",
          rules: [],
        },
      ],
    },
    {
      id: "entry-ok",
      type: "boolean",
      label: "エントリーモデルで十分ですか？",
      description:
        "「はい」ならエントリーモデルのJPV-M100、「いいえ」なら上位モデルのJPV-L100が候補になります。",
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
                key: "positioning",
                operator: "eq",
                value: "entry",
              },
              score: 2,
              reasonCode: "ENTRY_OK",
            },
          ],
        },
        {
          id: "no",
          label: "いいえ",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "positioning",
                operator: "eq",
                value: "premium",
              },
              score: 2,
              reasonCode: "PREMIUM_WANT",
            },
          ],
        },
      ],
    },
  ],
  tieBreaker: [
    { type: "attribute", key: "priceOfficialYen", direction: "asc" },
  ],
  resultConfig: {
    topHeadingTemplate: "あなたには「{productName}」が最も合いそうです",
    disclaimer:
      "この診断は、メーカー公式情報と回答条件をもとに商品候補を整理するものです。価格は公式オンライン表示価格の目安で、販売店の価格・在庫は購入時点で確認してください。",
  },
};

/** 診断ページの静的コンテンツ（SEO用） */
export const riceCookerPageContent: DiagnosisPageContent = {
  pageTitle:
    "タイガー JPV-L100 vs JPV-M100、どっち？｜30秒で選べる炊飯器診断｜くらべる商品メモ",
  headline: "タイガーの圧力IH炊飯器、どっち？30秒で診断",
  pageDescription:
    "タイガーJPV-L100とJPV-M100（5.5合 圧力IH）から、価格・モデル位置づけのどちらを優先するかを整理して、あなたに合う炊飯器を30秒で診断。公式情報に基づくスコアリングです。",
  lead: "タイガーJPV-L100とJPV-M100は、どちらも5.5合の圧力IHジャー炊飯器です。容量・サイズ・質量は同じで、公式でのモデル位置づけ（上位/エントリー）と公式オンライン価格が異なります。3問に答えるだけです。",
  audience:
    "炊飯器を買い替えたい人で、5.5合の圧力IH炊飯器を検討していて、価格を抑えるか上位モデルを確認するか迷っている人向けの診断です。",
  targetItems: [
    "タイガー 圧力IHジャー炊飯器 JPV-L100：公式で上位モデル・公式オンライン価格57,800円から・0.5〜5.5合・約5.4kg",
    "タイガー 圧力IHジャー炊飯器 JPV-M100：公式でエントリーモデル・公式オンライン価格49,800円から・0.5〜5.5合・約5.4kg",
  ],
  guideSections: [
    {
      heading: "1. モデルの位置づけで選ぶ",
      body: "タイガー公式ページでは、JPV-L100は圧力IHジャー炊飯器の上位モデル、JPV-M100はエントリーモデルとして案内されています。上位モデルの機能を確認したいならJPV-L100、価格を抑えたいならJPV-M100が候補です。",
    },
    {
      heading: "2. 価格で選ぶ",
      body: "公式オンライン価格は、JPV-L100が57,800円から、JPV-M100が49,800円からです。販売店の価格・在庫・ポイント・送料は購入時点で確認してください。",
    },
    {
      heading: "3. 共通仕様について",
      body: "今回確認した5.5合モデルは、白米の炊飯・保温容量（0.5〜5.5合）、サイズ（25.7×38×21.4cm）、質量（約5.4kg）が両モデルとも同じです。差は主にモデル位置づけと価格です。",
    },
  ],
  faq: [
    {
      question: "タイガーJPV-L100とJPV-M100はどっちを選べばいい？",
      answer:
        "価格を抑えたいなら公式オンライン価格49,800円からのJPV-M100、上位モデルの機能を確認したいなら57,800円からのJPV-L100が候補です。容量・サイズ・質量はどちらも同じです（2026年8月13日時点の公式ページで確認）。",
    },
    {
      question: "容量やサイズは違いますか？",
      answer:
        "今回確認した5.5合モデルでは、容量はどちらも0.5〜5.5合、サイズは幅25.7×奥行38×高さ21.4cm、質量は約5.4kgです。差はモデル位置づけと価格が中心です。",
    },
    {
      question: "診断の判定根拠は何ですか？",
      answer:
        "タイガー公式の商品ページで確認できる情報（モデルの位置づけ・公式オンライン価格・容量・サイズ・質量）だけを判定に使います。口コミや推測値はスコアに使いません。",
    },
    {
      question: "価格は変動しますか？",
      answer:
        "公式オンライン価格は確認時点の表示で、販売店の価格・在庫・ポイント・送料は変動します。購入時点の公式ページと販売ページで確認してください。",
    },
  ],
  relatedArticles: [
    {
      path: "/articles/tiger-jpv-l100-vs-jpv-m100/",
      label: "JPV-L100 vs JPV-M100 の違いを詳しく見る",
    },
  ],
};
