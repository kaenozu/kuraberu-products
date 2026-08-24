/**
 * 楽天アフィリエイトURLの生成口（商品データ用）。
 *
 * アフィリエイトリダイレクトID（hb.afl /hgc/<ID>/）は
 * RAKUTEN_AFFILIATE_ID 環境変数を優先し、未設定時は現行値へ
 * フォールバックする（config/runtime-env.mjs 参照）。
 * 商品レジストリに hb.afl を直書きしないための唯一の入口。
 */
import { toAffiliateRakutenSearchUrl } from "../../config/runtime-env.mjs";

/** 型番・商品名クエリから楽天アフィリエイトURLを生成する。空クエリは実装ミスなので例外。 */
export function rakutenAffiliateSearchUrl(query: string): string {
  const url = toAffiliateRakutenSearchUrl(query);
  if (!url) {
    throw new Error(`Failed to build a Rakuten affiliate URL for: ${query}`);
  }
  return url;
}
