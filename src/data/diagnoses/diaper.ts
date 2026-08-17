/**
 * ムーニー テープタイプ Mサイズ 診断設定。
 *
 * ルールは公式情報（jp.moony.com の商品ページ）で確認できる属性だけを参照し、
 * 口コミ・価格・推測値はスコアに使わない。
 *
 * 対象: ムーニー 低刺激であんしん / マシュマロ肌ごこちモレ安心（テープ・M）
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
} from "../../domain/diagnosis/types";
import { diaperProducts } from "../products/diapers";

/** 理由コード → 表示文言 の辞書 */
export const diaperReasonDictionary: Record<string, string> = {
  UNADDITIVE_STRICT: "無添加成分が多い（4成分）条件に合っています。",
  UNADDITIVE_STANDARD: "3成分無添加の条件に合っています。",
  POOP_ABSORPTION: "ゆるうんちの水分吸収を重視する条件に合っています。",
  POOP_STOPPER:
    "背中・足回りのゆるうんちストッパーを重視する条件に合っています。",
  LONG_HOURS: "長い時間の吸収を重視する条件に合っています。",
  COUNT_MATTERS: "1パックあたりの枚数を重視する条件に合っています。",
  TEISHIGEKI_NOTE:
    "低刺激であんしん（M）は、うんち水分吸収シートとおしりガイドが案内されています。",
  MASHUMARO_NOTE:
    "マシュマロ肌ごこちモレ安心（M）は54枚入りで、ゆるうんちストッパーと最大12時間吸収が案内されています。",
};

export const diaperDiagnosis: DiagnosisConfig = {
  id: "moony-m-tape",
  categoryId: "diaper",
  categoryLabel: "紙おむつ",
  title: "ムーニー テープMサイズ 選び方診断",
  description:
    "ムーニーのテープタイプMサイズ「低刺激であんしん」と「マシュマロ肌ごこちモレ安心」から、あなたの使い方に合う1つを診断します。",
  productIds: diaperProducts.map((product) => product.id),
  questions: [
    {
      id: "priority",
      type: "single",
      label: "おむつ選びで一番重視するのは？",
      description:
        "公式で案内されている機能差のうち、優先したいものを選んでください。",
      required: true,
      options: [
        {
          id: "poop-measures",
          label: "ゆるうんちへの対策",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "poopStopper",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "POOP_STOPPER",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "poopAbsorption",
                operator: "eq",
                value: true,
              },
              score: 3,
              reasonCode: "POOP_ABSORPTION",
            },
          ],
        },
        {
          id: "unadditive",
          label: "無添加成分の多さ",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "unadditive",
                operator: "gte",
                value: 4,
              },
              score: 3,
              reasonCode: "UNADDITIVE_STRICT",
            },
            {
              type: "score",
              match: {
                field: "attributes",
                key: "unadditive",
                operator: "lte",
                value: 3,
              },
              score: 1,
              reasonCode: "UNADDITIVE_STANDARD",
            },
          ],
        },
        {
          id: "long-hours",
          label: "長時間の吸収",
          rules: [
            {
              type: "score",
              match: {
                field: "attributes",
                key: "maxHourAbsorption",
                operator: "gte",
                value: 12,
              },
              score: 3,
              reasonCode: "LONG_HOURS",
            },
          ],
        },
      ],
    },
    {
      id: "unadditive-important",
      type: "boolean",
      label: "無添加成分の多い方を選びたいですか？",
      description:
        "「はい」なら、4成分無添加のマシュマロ肌ごこちモレ安心が候補になります。",
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
                key: "unadditive",
                operator: "gte",
                value: 4,
              },
              score: 2,
              reasonCode: "UNADDITIVE_STRICT",
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
      id: "count-important",
      type: "boolean",
      label: "1パックの枚数が多い方を重視しますか？",
      description:
        "「はい」なら、54枚入りのマシュマロ肌ごこちモレ安心が候補になります。",
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
                key: "count",
                operator: "gte",
                value: 50,
              },
              score: 2,
              reasonCode: "COUNT_MATTERS",
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
  tieBreaker: [{ type: "attribute", key: "count", direction: "desc" }],
  resultConfig: {
    topHeadingTemplate: "あなたには「{productName}」が最も合いそうです",
    disclaimer:
      "この診断は、メーカー公式情報と回答条件をもとに商品候補を整理するものです。使用感や個人差を保証するものではありません。",
  },
};

/** 診断ページの静的コンテンツ（SEO用） */
export const diaperPageContent: DiagnosisPageContent = {
  pageTitle:
    "ムーニー テープMサイズ、どっち？｜30秒で選べるおむつ診断｜くらべる商品メモ",
  headline: "ムーニーのテープM、どっち？30秒で診断",
  pageDescription:
    "ムーニーのテープタイプMサイズ「低刺激であんしん」と「マシュマロ肌ごこちモレ安心」から、あなたの使い方に合う1つを30秒で診断。公式情報に基づくスコアリングです。",
  lead: "ムーニーのテープタイプMサイズには「低刺激であんしん」と「マシュマロ肌ごこちモレ安心」があります。どちらも体重6〜11kg向けですが、無添加成分やうんちへの対策に違いがあります。3問に答えるだけです。",
  audience:
    "体重6〜11kgの赤ちゃんの保護者で、ムーニーのテープタイプMサイズどちらを選べばいいか迷っている人向けの診断です。",
  targetItems: [
    "ムーニー 低刺激であんしん（テープ・M）：6〜11kg向け・46枚入り・3成分無添加・うんち水分吸収シート搭載",
    "ムーニー マシュマロ肌ごこちモレ安心（テープ・M）：6〜11kg向け・54枚入り・4成分無添加・ゆるうんちストッパー搭載",
  ],
  guideSections: [
    {
      heading: "1. うんちへの対策で選ぶ",
      body: "「低刺激であんしん」はうんち水分吸収シートでゆるうんちの水分を下層へ吸収し、肌への付着を抑える設計です。「マシュマロ肌ごこちモレ安心」は背中と足回りにゆるうんちストッパーを搭載しています（2026年8月9日時点の公式案内）。",
    },
    {
      heading: "2. 無添加成分で選ぶ",
      body: "「低刺激であんしん」の新生児〜Mは、香料・ラテックス・合成着色料の3成分無添加です。「マシュマロ肌ごこちモレ安心」は全サイズで、石油由来油剤・香料・ラテックス・合成着色料の4成分無添加です。",
    },
    {
      heading: "3. 内容量・機能で選ぶ",
      body: "Mサイズはどちらも6〜11kg向けで、「低刺激であんしん」は46枚入り、「マシュマロ肌ごこちモレ安心」は54枚入りです。後者には最大12時間吸収の案内もあります（吸収量の目安であり、12時間の連続使用を推奨するものではありません）。",
    },
  ],
  faq: [
    {
      question: "ムーニーのテープMはどっちを選べばいい？",
      answer:
        "うんち水分吸収シート（ゆるうんちの水分を吸収して肌への付着を抑える）を重視するなら「低刺激であんしん」、背中・足回りのゆるうんちストッパーや4成分無添加、54枚入りを重視するなら「マシュマロ肌ごこちモレ安心」が候補です。どちらも体重6〜11kg向けです。",
    },
    {
      question: "無添加成分の数はどう違いますか？",
      answer:
        "「低刺激であんしん」の新生児〜Mは香料・ラテックス・合成着色料の3成分無添加、「マシュマロ肌ごこちモレ安心」は石油由来油剤・香料・ラテックス・合成着色料の4成分無添加です（2026年8月9日時点の公式案内）。",
    },
    {
      question: "「最大12時間吸収」は12時間交換しなくてよい意味ですか？",
      answer:
        "違います。「マシュマロ肌ごこちモレ安心」の最大12時間吸収は吸収量の目安であり、12時間の連続使用を推奨する表示ではありません。",
    },
    {
      question: "診断の判定根拠は何ですか？",
      answer:
        "ユニ・チャーム公式の商品ページで確認できる情報（サイズ・内容量・無添加成分・うんちへの対策）だけを判定に使います。口コミや推測値はスコアに使いません。",
    },
  ],
  relatedArticles: [
    {
      path: "/articles/moony-m/",
      label: "ムーニーのテープM、2商品の違いを詳しく見る",
    },
  ],
};
