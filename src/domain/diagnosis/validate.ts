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
 */

import type { DiagnosisConfig, Product, ReasonDictionary } from "./types";

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

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new TypeError(message);
}

/**
 * 診断データの整合性を検証する。問題があれば throw する。
 * 成功時は検証済みの設定を返す。
 */
export function validateDiagnosisData(
  config: DiagnosisConfig,
  products: readonly Product[],
  reasonDictionary: ReasonDictionary,
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
  }

  return config;
}
