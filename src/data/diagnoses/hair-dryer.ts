/**
 * ドライヤー（パナソニック ナノケア）診断設定。
 *
 * ルールは公式情報（パナソニックの商品ページ・仕様ページで確認できる仕様）だけを
 * 参照し、口コミ・価格・推測値はスコアに使わない。
 *
 * 対象: パナソニック ナノケア EH-NA9M / EH-NA7M
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
} from "../../domain/diagnosis/types";

/** 理由コード → 表示文言 の辞書（reasonCode と表示を分離する） */
export const hairDryerReasonDictionary: Record<string, string> = {
  CARE_FEATURES:
    "ミネラル・UVケア・複数モードなど髪のケア機能を重視する条件に合っています。",
  PORTABLE_FOLD:
    "折りたためるタイプで、持ち運び・収納性を重視する条件に合っています。",
  LIGHT_WEIGHT: "軽さを重視する条件に合っています（本体約565g）。",
  WIND_SAME:
    "風量（TURBO時）は両モデルとも公式仕様で1.5㎥/分のため、判定には使いません。",
  NA9M_NOTE:
    "EH-NA9Mは、ミネラル・UVケア・ナノイーイオンチャージPLUSと複数モードが特徴です。",
  NA7M_NOTE:
    "EH-NA7Mは、折りたたみタイプ・約565gで、静電気抑制とナノイーイオンチャージが特徴です。",
};

export const hairDryerDiagnosis: DiagnosisConfig = {
  id: "hair-dryer-panasonic-nanocare",
  categoryId: "hair-dryer",
  categoryLabel: "ドライヤー",
  title: "パナソニック ナノケア EH-NA9M vs EH-NA7M 選び方診断",
  description:
    "パナソニック ナノケアのEH-NA9MとEH-NA7Mから、あなたの使い方に合う1台を診断します。",
  productIds: ["panasonic-eh-na9m", "panasonic-eh-na7m"],
  questions: [
    {
      id: "priority",
      type: "single",
      label: "ドライヤー選びで一番重視するのは？",
      description:
        "公式仕様で差がある項目から、優先したいものを選んでください。",
      required: true,
      options: [
        {
          id: "care",
          label: "髪のケア機能（ミネラル・UV・モード）",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "careModes",
                operator: "gte",
                value: 3,
              },
              score: 3,
              reasonCode: "CARE_FEATURES",
            },
          ],
        },
        {
          id: "portable",
          label: "持ち運びやすさ（折りたたみ・軽さ）",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "foldable",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "PORTABLE_FOLD",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "weightG",
                operator: "lte",
                value: 570,
              },
              score: 1,
              reasonCode: "LIGHT_WEIGHT",
            },
          ],
        },
        {
          id: "wind",
          label: "大風量（どちらも同じ）",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "airflowM3PerMin",
                operator: "gte",
                value: 1.5,
              },
              score: 1,
              reasonCode: "WIND_SAME",
            },
          ],
        },
      ],
    },
    {
      id: "fold-important",
      type: "boolean",
      label: "折りたためるタイプがいいですか？",
      description: "「はい」なら折りたたみタイプのEH-NA7Mが候補になります。",
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
                key: "foldable",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "PORTABLE_FOLD",
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
      id: "care-important",
      type: "boolean",
      label: "ミネラル・UVケアなど複数モードを使いたいですか？",
      description: "「はい」ならEH-NA9Mが候補になります。",
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
                key: "careModes",
                operator: "gte",
                value: 3,
              },
              score: 3,
              reasonCode: "CARE_FEATURES",
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
      id: "light-important",
      type: "boolean",
      label: "軽さを重視しますか？",
      description:
        "「はい」なら約565gのEH-NA7Mが候補になります（EH-NA9Mは約580g）。",
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
                key: "weightG",
                operator: "lte",
                value: 570,
              },
              score: 2,
              reasonCode: "LIGHT_WEIGHT",
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
  tieBreaker: [{ type: "attribute", key: "weightG", direction: "asc" }],
  resultConfig: {
    topHeadingTemplate: "あなたには「{productName}」が最も合いそうです",
    disclaimer:
      "この診断は、メーカー公式情報と回答条件をもとに商品候補を整理するものです。使用感や個人差を保証するものではありません。",
  },
};

/** 診断ページの静的コンテンツ（SEO用） */
export const hairDryerPageContent: DiagnosisPageContent = {
  pageTitle:
    "パナソニック ナノケア EH-NA9M vs EH-NA7M、どっち？｜30秒で選べるドライヤー診断｜くらべる商品メモ",
  headline: "ナノケアドライヤー、どっち？30秒で診断",
  pageDescription:
    "パナソニック ナノケアのEH-NA9MとEH-NA7Mから、あなたの使い方に合うドライヤーを30秒で診断。公式情報に基づくスコアリングです。",
  lead: "パナソニック ナノケアのEH-NA9MとEH-NA7Mは、搭載機能・モード・質量・折りたたみの有無が公式仕様で異なります。4問に答えるだけです。",
  audience:
    "ドライヤーを買い替えたい人で、髪のケア機能（ミネラル・UV・モード）と持ち運びやすさ（折りたたみ・軽さ）のどちらを優先するか迷っている人向けの診断です。",
  targetItems: [
    "パナソニック ナノケア EH-NA9M：ミネラル・UVケア・ナノイーイオンチャージPLUS・複数モード（温冷リズム/毛先集中ケア/スカルプ/スキン）・約580g・折りたたみ案内なし",
    "パナソニック ナノケア EH-NA7M：静電気抑制・ナノイーイオンチャージ・約565g・折りたためるタイプ",
  ],
  guideSections: [
    {
      heading: "1. 髪のケア機能で選ぶ",
      body: "公式仕様では、EH-NA9Mはミネラル・UVケア・ナノイーイオンチャージPLUSに加え、温冷リズム・毛先集中ケア・スカルプ・スキンの複数モードが案内されています。EH-NA7Mは静電気抑制とナノイーイオンチャージです。",
    },
    {
      heading: "2. 持ち運び・収納性で選ぶ",
      body: "公式比較では、EH-NA7Mが折りたためるタイプとして案内されています。質量はEH-NA7Mが約565g、EH-NA9Mが約580gで、差は約15gです。",
    },
    {
      heading: "3. 風量について",
      body: "風量（TURBO時）は両モデルとも公式仕様で1.5㎥/分と確認できます。風量だけでは大きな差がないため、診断では機能や収納性の回答を優先して判定します。",
    },
  ],
  faq: [
    {
      question: "ナノケアのEH-NA9MとEH-NA7Mはどっちを選べばいい？",
      answer:
        "ミネラル・UVケア・複数モードなど髪のケア機能を重視するならEH-NA9M、折りたたみやすさと軽さ・持ち運びやすさを重視するならEH-NA7Mが候補です。風量（TURBO時）は両モデルとも1.5㎥/分です（2026年8月16日時点の公式仕様で確認）。",
    },
    {
      question: "軽いのはどっち？",
      answer:
        "公式仕様では、EH-NA7Mが約565g、EH-NA9Mが約580gです。差は約15gなので、重さだけでなく搭載機能や折りたたみの有無も確認してください。",
    },
    {
      question: "診断の判定根拠は何ですか？",
      answer:
        "パナソニック公式の商品ページ・仕様ページで確認できる情報（搭載機能・モード・質量・折りたたみの有無・風量）だけを判定に使います。口コミや推測値はスコアに使いません。",
    },
    {
      question: "価格は判定に使われますか？",
      answer:
        "今回のナノケア2モデルは価格がオープン価格のため、価格は判定に使いません。判定は公式に確認できる機能・仕様の差だけを対象にします。",
    },
  ],
  relatedArticles: [
    {
      path: "/articles/panasonic-eh-na9m-vs-eh-na7m/",
      label: "EH-NA9M vs EH-NA7M の違いを詳しく見る",
    },
    {
      path: "/articles/panasonic-eh-na9m-guide/",
      label: "EH-NA9M の商品ガイドを見る",
    },
  ],
};
