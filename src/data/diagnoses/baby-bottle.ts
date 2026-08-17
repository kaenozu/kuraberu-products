/**
 * 哺乳瓶サイズ・素材 診断設定。
 *
 * 質問とルールの定義。ルールは公式情報（製品ページで確認できる属性）だけを
 * 参照し、口コミ・価格・推測値はスコアに使わない。
 *
 * 対象: 母乳実感 160ml/240ml × 耐熱ガラス/PPSU（4候補）
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
} from "../../domain/diagnosis/types";
import { babyBottleProducts } from "../products/baby-bottles";

/** 理由コード → 表示文言 の辞書（reasonCode と表示を分離する） */
export const babyBottleReasonDictionary: Record<string, string> = {
  NEWBORN_STAGE: "新生児期の少量授乳に合っています。",
  LONG_TERM_USE: "長く使える容量を重視する条件に合っています。",
  LIGHTWEIGHT_PRIORITY: "軽さを重視する条件に合っています。",
  PORTABLE_PRIORITY: "外出先で使いやすい軽さ・割れにくさに合っています。",
  GLASS_NOT_WANTED: "ガラス製を避けたい条件に合いません（除外）。",
  GLASS_IS_HEAVY: "ガラス製はPPSUより重く、持ち運びには不向きです。",
  GLASS_CLEANING: "耐熱ガラス製は汚れ落ちを重視する条件に合っています。",
  PPSU_PORTABLE_NOTE:
    "PPSU製は軽い一方、ガラス製より傷がつきやすい場合があります。",
  GLASS_FRAGILE_NOTE:
    "耐熱ガラス製は落とした場合に割れる可能性があります。取り扱いには注意が必要です。",
  SMALL_NOT_ENOUGH: "160mlは哺乳量が増えると容量が不足する場合があります。",
  LARGE_IS_HEAVY:
    "240mlは160mlより容量が大きく、新生児期の少量授乳には大きめです。",
};

export const babyBottleDiagnosis: DiagnosisConfig = {
  id: "baby-bottle-size-material",
  categoryId: "baby-bottle",
  categoryLabel: "授乳用品",
  title: "母乳実感 160ml/240ml・素材 選び方診断",
  description:
    "ピジョン母乳実感（160ml/240ml × 耐熱ガラス/PPSU）から、あなたの使い方に合う1本を診断します。",
  productIds: babyBottleProducts.map((product) => product.id),
  questions: [
    {
      id: "main-usage-period",
      type: "single",
      label: "主にいつ使いますか？",
      description:
        "新生児期中心なら小容量、長く使いたいなら大容量が候補になります。",
      required: true,
      options: [
        {
          id: "newborn",
          label: "新生児期中心",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "capacity",
                operator: "lte",
                value: 160,
              },
              score: 3,
              reasonCode: "NEWBORN_STAGE",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "capacity",
                operator: "gt",
                value: 160,
              },
              score: -1,
              reasonCode: "LARGE_IS_HEAVY",
            },
          ],
        },
        {
          id: "long-term",
          label: "長く使いたい",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "capacity",
                operator: "gte",
                value: 240,
              },
              score: 3,
              reasonCode: "LONG_TERM_USE",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "capacity",
                operator: "lt",
                value: 240,
              },
              score: -1,
              reasonCode: "SMALL_NOT_ENOUGH",
            },
          ],
        },
        {
          id: "mobile",
          label: "外出中心",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "portable",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "PORTABLE_PRIORITY",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "portable",
                operator: "eq",
                value: false,
              },
              score: -2,
              reasonCode: "GLASS_IS_HEAVY",
            },
          ],
        },
      ],
    },
    {
      id: "lightweight-important",
      type: "boolean",
      label: "軽さを重視しますか？",
      description: "「はい」ならPPSU製が候補になります。",
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
                key: "lightweight",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "LIGHTWEIGHT_PRIORITY",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "lightweight",
                operator: "eq",
                value: false,
              },
              score: -2,
              reasonCode: "GLASS_IS_HEAVY",
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
      id: "glass-ok",
      type: "boolean",
      label: "ガラス製でも問題ありませんか？",
      description: "「いいえ」なら耐熱ガラス製は候補から外れます。",
      required: true,
      options: [
        {
          id: "yes",
          label: "はい",
          rules: [],
        },
        {
          id: "no",
          label: "いいえ",
          rules: [
            {
              type: "exclude",
              match: {
                field: "attributes",
                key: "material",
                operator: "eq",
                value: "glass",
              },
              reasonCode: "GLASS_NOT_WANTED",
            },
          ],
        },
      ],
    },
    {
      id: "clean-important",
      type: "boolean",
      label: "汚れの落ちやすさを重視しますか？",
      description: "「はい」なら耐熱ガラス製が候補になります。",
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
                key: "easyToClean",
                operator: "eq",
                value: true,
              },
              score: 2,
              reasonCode: "GLASS_CLEANING",
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
      id: "outdoor-use",
      type: "boolean",
      label: "外出先でよく使いますか？",
      description: "「はい」ならPPSU製が候補になります。",
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
                key: "portable",
                operator: "eq",
                value: true,
              },
              score: 2,
              reasonCode: "PORTABLE_PRIORITY",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "portable",
                operator: "eq",
                value: false,
              },
              score: -1,
              reasonCode: "GLASS_IS_HEAVY",
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
  tieBreaker: [{ type: "attribute", key: "capacity", direction: "asc" }],
  resultConfig: {
    topHeadingTemplate: "あなたには「{productName}」が最も合いそうです",
    disclaimer:
      "この診断は、メーカー公式情報と回答条件をもとに商品候補を整理するものです。使用感や個人差を保証するものではありません。",
  },
};

/** 診断ページの静的コンテンツ（SEO用） */
export const babyBottlePageContent: DiagnosisPageContent = {
  pageTitle:
    "母乳実感 160ml/240ml どっち？｜30秒で選べる哺乳瓶診断｜くらべる商品メモ",
  headline: "母乳実感 160ml/240ml・素材、どっち？30秒で診断",
  pageDescription:
    "ピジョン母乳実感（160ml/240ml × 耐熱ガラス/PPSU）から、あなたの使い方に合う哺乳瓶を30秒で診断。公式情報に基づくスコアリングで、理由つきでおすすめを表示します。",
  lead: "ピジョン母乳実感の「160ml/240ml」と「耐熱ガラス/PPSU」の組み合わせ4商品から、あなたの使い方に合う1本を、公式情報にもとづいて診断します。5問に答えるだけです。",
  audience:
    "出産準備中の人や新生児の保護者で、母乳実感の容量・素材どちらを選べばいいか迷っている人向けの診断です。",
  targetItems: [
    "母乳実感 哺乳びん 耐熱ガラス製 160ml（対象月齢目安 0ヵ月から・SSサイズ乳首付属）",
    "母乳実感 哺乳びん プラスチック製（PPSU）160ml（対象月齢目安 0ヵ月から・SSサイズ乳首付属）",
    "母乳実感 哺乳びん 耐熱ガラス製 240ml（対象月齢目安 3ヵ月頃から・Mサイズ乳首付属）",
    "母乳実感 哺乳びん プラスチック製（PPSU）240ml（対象月齢目安 3ヵ月頃から・Mサイズ乳首付属）",
  ],
  guideSections: [
    {
      heading: "1. 容量（160ml / 240ml）で選ぶ",
      body: "新生児期から使うなら、対象月齢目安0ヵ月から・SSサイズ乳首（丸穴）付属の160mlが候補です。哺乳量が増えて長く使いたいなら240mlで、対象月齢目安は3ヵ月頃から、付属乳首はMサイズ（Y字形）です。",
    },
    {
      heading: "2. 素材（耐熱ガラス / PPSU）で選ぶ",
      body: "汚れの落ちやすさを重視するなら耐熱ガラス製、軽さ・割れにくさ・持ち運びやすさを重視するならプラスチック製（PPSU）が候補です。ガラス製は落とした場合に割れる可能性があります。どちらも煮沸・スチーム・薬液消毒に対応し、電子レンジ除菌は不可です。",
    },
    {
      heading: "3. 診断の判定基準",
      body: "判定は、ピジョン公式商品ページで確認できる情報（容量・素材・対象月齢目安・付属乳首）と、あなたの回答（使う時期・軽さ・ガラスの可否・汚れ落ち・外出）だけを使います。各商品のスコアを加減点方式で計算し、必須条件（例：ガラスを避けたい）を満たさない商品は候補から外します。口コミや推測値は判定に使いません。",
    },
  ],
  faq: [
    {
      question: "160ml と 240ml はどっちを選べばいい？",
      answer:
        "新生児期から使うなら対象月齢目安が0ヵ月からでSSサイズ乳首（丸穴）が付属する160ml、哺乳量が増えて長く使いたいなら240mlが候補です。240mlは対象月齢目安が3ヵ月頃からで、Mサイズ乳首（Y字形）が付属します。診断では、主に使う時期の回答をもとに容量をスコアリングします。",
    },
    {
      question: "耐熱ガラス製とPPSU製はどっち？",
      answer:
        "汚れの落ちやすさを重視するなら耐熱ガラス製、軽さ・割れにくさ・持ち運びやすさを重視するならプラスチック製（PPSU）が候補です。両方とも煮沸・スチーム・薬液消毒に対応し、電子レンジ除菌は不可です（2026年8月時点のピジョン公式商品ページで確認）。",
    },
    {
      question: "診断の判定根拠は何ですか？",
      answer:
        "ピジョン公式商品ページで確認できる情報（容量・素材・対象月齢目安・付属乳首）だけを判定に使います。口コミや推測値はスコアに使わず、確認日と参照先を商品データに保持しています。",
    },
    {
      question: "診断はどのくらいの時間がかかりますか？",
      answer:
        "5問の質問に答えるだけで、30〜60秒程度で結果が表示されます。回答はブラウザ内だけで処理され、サーバーへ送信されません。",
    },
  ],
  relatedArticles: [
    {
      path: "/articles/pigeon-bottle-160-240/",
      label: "母乳実感 160ml vs 240ml の違いを詳しく見る",
    },
    {
      path: "/articles/pigeon-bottle-240/",
      label: "母乳実感 240ml ガラス vs PPSU の違いを詳しく見る",
    },
    {
      path: "/articles/pigeon-slim-240/",
      label: "母乳実感 vs スリムタイプ の違いを詳しく見る",
    },
  ],
};
