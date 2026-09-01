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
 * - single / boolean: [answer] （boolean は "true" / "false" に変換）
 * - multi: answer 配列そのもの
 * - number: 空配列
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
 * 回答から選択された選択肢のルールを集める。
 * exclude ルールと score ルールを分けて返す。
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
  exclusions: readonly {
    match: Extract<DiagnosisRule, { type: "exclude" }>["match"];
    reasonCode: string;
  }[];
  rulesByQuestion: QuestionRuleMap;
  questionWeights: QuestionWeightMap;
} {
  const exclusions: {
    match: Extract<DiagnosisRule, { type: "exclude" }>["match"];
    reasonCode: string;
  }[] = [];
  const rulesByQuestion: QuestionRuleMap = {};
  const questionWeights: QuestionWeightMap = {};

  for (const question of questions) {
    questionWeights[question.id] =
      question.weight ?? DEFAULT_QUESTION_WEIGHT;
    const answer = answers[question.id];
    const optionIds = selectedOptionIds(answer);
    for (const option of question.options ?? []) {
      if (!optionIds.includes(option.id)) continue;
      for (const rule of option.rules) {
        if (rule.type === "exclude") {
          exclusions.push({ match: rule.match, reasonCode: rule.reasonCode });
        } else {
          const questionRules = rulesByQuestion[question.id] ?? {};
          const optionRules = questionRules[option.id] ?? [];
          optionRules.push(rule);
          questionRules[option.id] = optionRules;
          rulesByQuestion[question.id] = questionRules;
        }
      }
    }
  }

  return { exclusions, rulesByQuestion, questionWeights };
}

/**
 * 全回答をスコアへ反映する。
 * exclude 済みの商品もスコアは記録するが、ランキングからは除外される。
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
