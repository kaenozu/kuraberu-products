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
];

export function findDiagnosisCategory(
  slug: string,
): DiagnosisCategory | undefined {
  return diagnosisCategories.find((category) => category.slug === slug);
}
