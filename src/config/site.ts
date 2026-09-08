/**
 * Astro 側のサイト設定（Astro コンポーネント向けの薄いラッパー）。
 *
 * 実行環境・公開URL の正規化ロジック自体は、リポジトリ直下の
 * config/runtime-env.mjs（node スクリプトと Astro の共有モジュール）に置く。
 * 新しい環境変数を足すときは config/runtime-env.mjs が正規の編集対象で、
 * こちらは表示用の組み立てだけを行う。
 */
import {
  DEFAULT_SITE_URL,
  normalizeOptionalPublicUrl,
  normalizeSiteUrl,
} from "../../config/runtime-env.mjs";

export { DEFAULT_SITE_URL };

export const site = {
  name: "くらべる商品メモ",
  description: "商品やサービスを、公式情報と確認状況を分けて比べるサイト",
  url: normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL),
  contactUrl: normalizeOptionalPublicUrl(import.meta.env.PUBLIC_CONTACT_URL),
};
