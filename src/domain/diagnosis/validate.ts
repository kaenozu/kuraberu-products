/**
 * 診断データのビルド時検証。
 *
 * 商品データと診断設定の不整合をビルド時に検出する。既存の
 * defineArticleMetadata（ビルド時に throw）と同じパターンで、
 * 診断ページから呼び出される。
 *
 * 検証項目:
 * - productId の重複がない
 * - diagnosis が存在しない商品を参照していない
 * - reasonCode が理由辞書に存在する
 * - 商品に公式ソースが最低1件存在する
 * - verifiedAt が存在する
 * - affiliate URL が https である
 * - ルール内 attributes.key が対象カテゴリの商品に実在する（タイポ検出）
 * - ルール内 field:"tags" の value が商品タグに実在する
 * - ScoreRule.productId / editorialPriority.productIds の商品IDが実在する
 * - purchaseLinks（rakuten）が https + 楽天許可ホストである
 * - articleUrls / pageContent.relatedArticles.path が実在記事パスと一致する
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
  DiagnosisRule,
  Product,
  ReasonDictionary,
} from "./types";

/** validateDiagnosisData のオプション（純粋保持のため外部データは引数で受ける） */
export type DiagnosisValidationOptions = {
  /** 実在する記事パスの集合（src/content/articles の articleMetadata 由来） */
  knownArticlePaths?: readonly string[];
  /** 診断ページコンテンツ（relatedArticles.path の検証に使う） */
  pageContent?: Pick<DiagnosisPageContent, "relatedArticles">;
};

function collectReasonCodes(config: DiagnosisConfig): Set<string> {
  const codes = new Set<string>();
  for (const question of config.questions) {
    for (const option of question.options ?? []) {
      for (const rule of option.rules) {
        if (rule.type === "exclude") {
          codes.add(rule.reasonCode);
        } else if (rule.reasonCode) {
          codes.add(rule.reasonCode);
        }
      }
    }
  }
  return codes;
}

function collectRules(config: DiagnosisConfig): DiagnosisRule[] {
  const rules: DiagnosisRule[] = [];
  for (const question of config.questions) {
    for (const option of question.options ?? []) {
      rules.push(...option.rules);
    }
  }
  return rules;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new TypeError(message);
}

// 楽天許可ホストの検証は `config/runtime-env.mjs` の `isAllowedRakutenUrl` を
// 正準実装として使う。domain 層から lib を import すると循環するため
// （lib → domain/types の依存）、config 層を経由する。
// ホスト集合を二重管理すると drift するため、build-time テストで両者が一致
// することを担保する (#554)。
import { isAllowedRakutenUrl as isAllowedRakutenUrlFromConfig } from "../../../config/runtime-env.mjs";
const isAllowedRakutenHost = (url: string): boolean =>
  isAllowedRakutenUrlFromConfig(url);

/**
 * 診断データの整合性を検証する。問題があれば throw する。
 * 成功時は検証済みの設定を返す。
 */
export function validateDiagnosisData(
  config: DiagnosisConfig,
  products: readonly Product[],
  reasonDictionary: ReasonDictionary,
  options: DiagnosisValidationOptions = {},
): DiagnosisConfig {
  const productIds = new Set(products.map((product) => product.id));
  assert(
    productIds.size === products.length,
    `diagnosis[${config.id}]: productId が重複しています`,
  );

  for (const product of products) {
    assert(
      product.categoryId === config.categoryId,
      `product[${product.id}]: categoryId が診断（${config.categoryId}）と一致しません`,
    );
    assert(
      product.sources.length > 0,
      `product[${product.id}]: 公式ソースが最低1件必要です`,
    );
    assert(
      /^\d{4}-\d{2}-\d{2}$/.test(product.verifiedAt),
      `product[${product.id}]: verifiedAt が不正です（${product.verifiedAt}）`,
    );
    for (const link of product.purchaseLinks) {
      assert(
        /^https:\/\//.test(link.url),
        `product[${product.id}]: purchase link は https である必要があります`,
      );
      // 楽天購入リンクは許可ホストのみ（タイポ・不正ホストの混入を防ぐ）。
      if (link.provider === "rakuten") {
        assert(
          isAllowedRakutenHost(link.url),
          `product[${product.id}]: 楽天購入リンクが許可されたホストではありません（${link.url}）`,
        );
      }
    }
  }

  for (const productId of config.productIds) {
    assert(
      productIds.has(productId),
      `diagnosis[${config.id}]: 存在しない商品を参照しています（${productId}）`,
    );
  }

  const reasonCodes = collectReasonCodes(config);
  for (const code of reasonCodes) {
    assert(
      code in reasonDictionary,
      `diagnosis[${config.id}]: reasonCode「${code}」が理由辞書に存在しません`,
    );
  }

  // 質問IDの重複チェック
  const questionIds = new Set<string>();
  for (const question of config.questions) {
    assert(
      !questionIds.has(question.id),
      `diagnosis[${config.id}]: 質問IDが重複しています（${question.id}）`,
    );
    questionIds.add(question.id);
    const optionIds = new Set<string>();
    for (const option of question.options ?? []) {
      assert(
        !optionIds.has(option.id),
        `diagnosis[${config.id}]: 質問「${question.id}」の選択肢IDが重複しています（${option.id}）`,
      );
      optionIds.add(option.id);
    }
    // weight の範囲検証（未指定は既定値1として扱い、検証をスキップ）
    if (question.weight !== undefined) {
      assert(
        Number.isInteger(question.weight) &&
          question.weight >= 1 &&
          question.weight <= 10,
        `diagnosis[${config.id}]: 質問「${question.id}」の weight は1〜10の正の整数である必要があります（${question.weight}）`,
      );
    }
  }

  // ルール内 attributes.key / tags.value の実在チェック。
  // filter.ts の neq/eq は undefined を不一致として扱うため、キーのタイポ
  //（例: capasity）はスコア崩壊するが黙って通過してしまう。それを検出する。
  const rules = collectRules(config);
  for (const rule of rules) {
    if (rule.type === "score" && rule.productId !== undefined) {
      assert(
        productIds.has(rule.productId),
        `diagnosis[${config.id}]: score ルールが存在しない商品を参照しています（${rule.productId}）`,
      );
    }
    if (!("match" in rule) || !rule.match) continue;
    const match = rule.match;
    if (match.field === "attributes") {
      for (const product of products) {
        assert(
          match.key in product.attributes,
          `diagnosis[${config.id}]: attributes.key「${match.key}」が商品 ${product.id} に存在しません（タイポの可能性）`,
        );
      }
    } else if (match.field === "tags") {
      const tagExists = products.some((product) =>
        product.tags.includes(match.value),
      );
      assert(
        tagExists,
        `diagnosis[${config.id}]: tags 条件の値「${match.value}」がどの商品タグにも存在しません（タイポの可能性）`,
      );
    }
  }

  // タイブレークの実在チェック（属性キー・ editorialPriority の商品ID）
  for (const tieBreaker of config.tieBreaker ?? []) {
    if (tieBreaker.type === "attribute") {
      for (const product of products) {
        assert(
          tieBreaker.key in product.attributes,
          `diagnosis[${config.id}]: tieBreaker の属性キー「${tieBreaker.key}」が商品 ${product.id} に存在しません（タイポの可能性）`,
        );
      }
    } else {
      for (const productId of tieBreaker.productIds) {
        assert(
          productIds.has(productId),
          `diagnosis[${config.id}]: editorialPriority が存在しない商品を参照しています（${productId}）`,
        );
      }
    }
  }

  // 商品の articleUrls と関連記事パスが実在記事と一致するか。
  // 許容パス集合は呼び出し元（src/data/diagnoses/index.ts）が
  // articleMetadata から渡す（validate.ts を純粋保つため import しない）。
  const { knownArticlePaths, pageContent } = options;
  if (knownArticlePaths) {
    const known = new Set(knownArticlePaths);
    for (const product of products) {
      for (const path of product.articleUrls) {
        assert(
          known.has(path),
          `product[${product.id}]: articleUrls の「${path}」は実在する記事パスではありません`,
        );
      }
    }
    for (const related of pageContent?.relatedArticles ?? []) {
      assert(
        known.has(related.path),
        `diagnosis[${config.id}]: relatedArticles の「${related.path}」は実在する記事パスではありません`,
      );
    }
  }

  return config;
}
