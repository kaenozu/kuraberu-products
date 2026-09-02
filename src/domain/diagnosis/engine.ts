/**
 * 診断エンジン。
 *
 * 判定順序:
 * 1. 商品候補取得
 * 2. 必須条件判定（exclude）
 * 3. 除外商品を削除
 * 4. スコア計算
 * 5. 同点処理
 * 6. 結果理由生成
 * 7. ランキング生成
 *
 * このエンジンはカテゴリ非依存。新カテゴリは商品データと DiagnosisConfig と
 * 理由辞書を追加するだけで動作する。
 */

import type {
  DiagnosisAnswers,
  DiagnosisConfig,
  DiagnosisResult,
  Product,
  RankedProduct,
} from "./types";
import { applyExclusions, initializeScores } from "./filter";
import { applyScores, collectSelectedRules, selectedOptionIds } from "./score";
import { rankProducts } from "./rank";

/** 指定された商品IDの商品を診断対象から取得する（設定ミスはビルド時検証で防ぐ） */
function resolveProducts(
  config: DiagnosisConfig,
  products: readonly Product[],
): Product[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return config.productIds
    .map((productId) => byId.get(productId))
    .filter((product): product is Product => product !== undefined);
}

/**
 * 診断を実行する。
 * - 候補が0件の場合: rankedProducts は空配列
 * - 全商品が除外された場合: rankedProducts は空配列、excludedProducts に全商品を返す
 */
export function runDiagnosis(
  config: DiagnosisConfig,
  products: readonly Product[],
  answers: DiagnosisAnswers,
): DiagnosisResult {
  const candidates = resolveProducts(config, products);
  const scores = initializeScores(candidates);
  const { exclusions, rulesByQuestion, questionWeights } = collectSelectedRules(
    config.questions,
    answers,
  );

  applyExclusions(scores, candidates, exclusions);
  applyScores(scores, candidates, rulesByQuestion, questionWeights);

  const ranked = rankProducts(candidates, scores, config.tieBreaker ?? []);

  const rankedProducts: RankedProduct[] = ranked.map((entry) => ({
    productId: entry.productId,
    rank: entry.rank,
    score: entry.score,
    positiveReasons: entry.positiveReasons,
    cautions: entry.negativeReasons,
  }));

  const excludedProducts = candidates
    .filter((product) => scores.get(product.id)?.excluded)
    .map((product) => {
      const score = scores.get(product.id);
      return {
        productId: product.id,
        reasonCode: score?.excludeReasonCode ?? "EXCLUDED",
      };
    });

  // 「回答済み」= 1つ以上の option.id に解決できた質問 (#561)。
  // 現状の `QuestionType: "number"` は `selectedOptionIds` が常に [] を返すため
  // answered count には含まれない（#561 で未実装として確認）。
  const answeredQuestionCount = config.questions.filter(
    (question) => selectedOptionIds(answers[question.id]).length > 0,
  ).length;

  return {
    categoryId: config.categoryId,
    rankedProducts,
    excludedProducts,
    answeredQuestionCount,
  };
}
