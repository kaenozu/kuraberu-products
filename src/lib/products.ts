/**
 * 商品マスタ（共通データ）の互換エントリ。
 *
 * 実体は src/content/products/ に分割している（Issue #703）。
 * - 型: src/content/products/types.ts
 * - 商品定数: src/content/products/bottles.ts
 * - 購入URLレジストリ: src/content/products/purchase-links.ts
 * 既存の `../lib/products` import はそのまま使える。
 */
export type {
  ArticlePurchaseLink,
  Product,
  ProductSpec,
} from "../content/products/types";
export {
  thermosJnlS500,
  thermosTigerBottlePair,
  tigerMtaJ050,
} from "../content/products/bottles";
export { articlePurchaseLinks } from "../content/products/purchase-links";
