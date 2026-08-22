/**
 * 診断カテゴリのレジストリ。
 *
 * 新カテゴリを追加するときは、このファイルに
 *   - 商品データ（src/data/products/）
 *   - 診断設定・理由辞書・ページコンテンツ（src/data/diagnoses/）
 * を追加して、categories に1行足すだけでよい。
 * エンジン・ページ側のコード変更は不要。
 */

import type { DiagnosisCategory } from "../../domain/diagnosis/types";
import { validateDiagnosisData } from "../../domain/diagnosis/validate";
import { articleMetadata } from "../../content/articles";
import {
  babyBottleDiagnosis,
  babyBottlePageContent,
  babyBottleReasonDictionary,
} from "./baby-bottle";
import { babyBottleProducts } from "../products/baby-bottles";
import {
  diaperDiagnosis,
  diaperPageContent,
  diaperReasonDictionary,
} from "./diaper";
import { diaperProducts } from "../products/diapers";
import {
  waterBottleDiagnosis,
  waterBottlePageContent,
  waterBottleReasonDictionary,
} from "./water-bottle";
import { waterBottleProducts } from "../products/water-bottles";
import {
  hairDryerDiagnosis,
  hairDryerPageContent,
  hairDryerReasonDictionary,
} from "./hair-dryer";
import { hairDryerProducts } from "../products/hair-dryers";
import {
  riceCookerDiagnosis,
  riceCookerPageContent,
  riceCookerReasonDictionary,
} from "./rice-cooker";
import { riceCookerProducts } from "../products/rice-cookers";

// 実在する記事パスの集合（商品の articleUrls と関連記事の検証に使う）。
// validate.ts を純粋保つため、ここ（呼び出し元）で articleMetadata から渡す。
const knownArticlePaths = articleMetadata.map((article) => article.path);

export const diagnosisCategories: readonly DiagnosisCategory[] = [
  {
    slug: "baby-bottle",
    config: babyBottleDiagnosis,
    products: babyBottleProducts,
    reasons: babyBottleReasonDictionary,
    pageContent: babyBottlePageContent,
  },
  {
    slug: "diaper",
    config: diaperDiagnosis,
    products: diaperProducts,
    reasons: diaperReasonDictionary,
    pageContent: diaperPageContent,
  },
  {
    slug: "water-bottle",
    config: waterBottleDiagnosis,
    products: waterBottleProducts,
    reasons: waterBottleReasonDictionary,
    pageContent: waterBottlePageContent,
  },
  {
    slug: "hair-dryer",
    config: hairDryerDiagnosis,
    products: hairDryerProducts,
    reasons: hairDryerReasonDictionary,
    pageContent: hairDryerPageContent,
  },
  {
    slug: "rice-cooker",
    config: riceCookerDiagnosis,
    products: riceCookerProducts,
    reasons: riceCookerReasonDictionary,
    pageContent: riceCookerPageContent,
  },
];

// レジストリ読み込み時に全カテゴリを検証する（defineArticleMetadata と同じ
// ビルド時 fail-fast パターン。データ不整合はビルドを落とす）。
for (const category of diagnosisCategories) {
  validateDiagnosisData(category.config, category.products, category.reasons, {
    knownArticlePaths,
    pageContent: category.pageContent,
  });
}

export function findDiagnosisCategory(
  slug: string,
): DiagnosisCategory | undefined {
  return diagnosisCategories.find((category) => category.slug === slug);
}
