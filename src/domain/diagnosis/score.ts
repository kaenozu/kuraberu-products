/**
 * スコアリング。
 *
 * 回答ごとに定義された ScoreRule を商品へ適用し、加点・減点と理由コードを
 * 収集する。スコアは絶対値ではなく相対順位のための値で、ルール設計では
 * 一問で -5〜+5 程度に収めることを前提とする。
 */

import type {
  DiagnosisAnswers,
  DiagnosisRule,
  Product,
  ProductScore,
} from "./types";
import { matchesCondition } from "./filter";

type AnswerValue = string | string[] | number | boolean;

function hasAnswer(answer: AnswerValue | undefined): answer is AnswerValue {
  if (answer === undefined || answer === null) return false;
  if (typeof answer === "string") return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
}

/**
 * 回答IDが選択されているかを判定する。
 * - single / boolean: answer === optionId
 * - multi: answer 配列に optionId が含まれる
 */
export function optionIsSelected(
  answer: AnswerValue | undefined,
  optionId: string,
): boolean {
  if (!hasAnswer(answer)) return false;
  if (Array.isArray(answer)) return answer.includes(optionId);
  return answer === optionId;
}

/**
 * 回答に含まれる選択肢IDの一覧を返す。
 * - single: [answer]（前後空白は trim）
 * - multi: answer 配列そのもの
 * - boolean: ["true"] or ["false"]
 *   ⚠ QuestionType: "boolean" の質問は、option.id を "true" / "false" 文字列で
 *   定義する必要がある。`true` / `false` 以外の option.id を持つ boolean 質問は
 *   マッチしない（#561 で仕様として確認）。
 * - number: 常に []
 *   ⚠ QuestionType: "number" は未実装 (#561)。将来 `selectedOptionIds` が
 *   number 回答を文字列化（例: String(answer)）する拡張を行うまで空配列を返す。
 */
export function selectedOptionIds(answer: AnswerValue | undefined): string[] {
  if (!hasAnswer(answer)) return [];
  if (Array.isArray(answer)) return answer;
  if (typeof answer === "boolean") return answer ? ["true"] : ["false"];
  if (typeof answer === "number") return [];
  return [answer.trim()];
}

/** 質問IDごとに「選択肢ID → ルール群」をまとめた形 */
export type QuestionRuleMap = Record<string, Record<string, DiagnosisRule[]>>;

/** 質問ID → 重み（既定: 1） */
export type QuestionWeightMap = Record<string, number>;

const DEFAULT_QUESTION_WEIGHT = 1;

/**
 * 質問IDごとの exclude ルール。質問単位でグルーピング (#561) することで
 * ランキング表示で「どの質問で除外されたか」を表示しやすくなる。
 */
export type ExclusionsByQuestion = Record<
  string,
  readonly {
    match: Extract<DiagnosisRule, { type: "exclude" }>["match"];
    reasonCode: string;
  }[]
>;

/**
 * 回答から選択された選択肢のルールを集める。
 * exclude ルールと score ルールを分けて返す。
 * exclude ルールは質問単位 (`exclusionsByQuestion`) でも返す (#561)。
 * 質問ごとの重みも併せて返す（未指定は 1）。
 */
export function collectSelectedRules(
  questions: readonly {
    id: string;
    weight?: number;
    options?: readonly { id: string; rules: DiagnosisRule[] }[];
  }[],
  answers: DiagnosisAnswers,
): {
  /** フラットな exclude ルール一覧 (後方互換)。 */
  exclusions: readonly {
    match: Extract<DiagnosisRule, { type: "exclude" }>["match"];
    reasonCode: string;
  }[];
  /** 質問IDでグルーピングされた exclude ルール (#561)。 */
  exclusionsByQuestion: ExclusionsByQuestion;
  rulesByQuestion: QuestionRuleMap;
  questionWeights: QuestionWeightMap;
} {
  const exclusions: {
    match: Extract<DiagnosisRule, { type: "exclude" }>["match"];
    reasonCode: string;
  }[] = [];
  const exclusionsByQuestion: ExclusionsByQuestion = {};
  const rulesByQuestion: QuestionRuleMap = {};
  const questionWeights: QuestionWeightMap = {};

  for (const question of questions) {
    questionWeights[question.id] = question.weight ?? DEFAULT_QUESTION_WEIGHT;
    const answer = answers[question.id];
    const optionIds = selectedOptionIds(answer);
    const questionExclusions: {
      match: Extract<DiagnosisRule, { type: "exclude" }>["match"];
      reasonCode: string;
    }[] = [];
    for (const option of question.options ?? []) {
      if (!optionIds.includes(option.id)) continue;
      for (const rule of option.rules) {
        if (rule.type === "exclude") {
          const entry = { match: rule.match, reasonCode: rule.reasonCode };
          exclusions.push(entry);
          questionExclusions.push(entry);
        } else {
          const questionRules = rulesByQuestion[question.id] ?? {};
          const optionRules = questionRules[option.id] ?? [];
          optionRules.push(rule);
          questionRules[option.id] = optionRules;
          rulesByQuestion[question.id] = questionRules;
        }
      }
    }
    if (questionExclusions.length > 0) {
      exclusionsByQuestion[question.id] = questionExclusions;
    }
  }

  return { exclusions, exclusionsByQuestion, rulesByQuestion, questionWeights };
}

/**
 * 全回答をスコアへ反映する。
 * 実装メモ (#561): 既に `scores` Map に `excluded === true` で登録されている
 * 商品（exclude ルールで除外済み）は `score` 未設定のため、`scores.get(product.id)` が
 * `undefined` となり `if (!score) continue;` で skip される。これにより
 * exclude 済み商品への重複加算は発生しない。ランキング側 (`rankProducts`) でも
 * `!score.excluded` で二重にフィルタされる。
 * 質問ごとの weight を適用する: 実際の加点は rule.score × weight となる。
 * weight は ScoreRule（加点・減点）にのみ適用され、ExcludeRule には影響しない。
 */
export function applyScores(
  scores: Map<string, ProductScore>,
  products: readonly Product[],
  rulesByQuestion: QuestionRuleMap,
  questionWeights: QuestionWeightMap = {},
): void {
  for (const [questionId, options] of Object.entries(rulesByQuestion)) {
    const weight = questionWeights[questionId] ?? DEFAULT_QUESTION_WEIGHT;
    for (const rules of Object.values(options)) {
      for (const rule of rules) {
        if (rule.type !== "score") continue;
        const weightedScore = rule.score * weight;
        for (const product of products) {
          if (rule.productId && rule.productId !== product.id) continue;
          if (rule.match && !matchesCondition(product, rule.match)) continue;
          const score = scores.get(product.id);
          if (!score) continue;
          score.score += weightedScore;
          if (rule.reasonCode) {
            if (weightedScore > 0) {
              score.positiveReasons.push(rule.reasonCode);
            } else if (weightedScore < 0) {
              score.negativeReasons.push(rule.reasonCode);
            }
          }
        }
      }
    }
  }
}
