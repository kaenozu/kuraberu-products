import {
  DEFAULT_SITE_URL,
  normalizeOptionalPublicUrl,
  normalizeSiteUrl,
} from "../../config/runtime-env.mjs";

// config 配置の原則（Issue #703）:
// - リポジトリ直下の config/*.mjs は環境・ビルド由来のプリミティブ
//   （Astro コンポーネント・scripts・Functions のいずれからも import 可）。
// - src/config/site.ts はサイト固有の合成層（サイト名・説明・URL 解決）。
// 新しい設定はこの2層のどちらかに置き、直下と src の両方に分散させない。

export { DEFAULT_SITE_URL };

export const site = {
  name: "くらべる商品メモ",
  description: "商品やサービスを、公式情報と確認状況を分けて比べるサイト",
  url: normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL),
  contactUrl: normalizeOptionalPublicUrl(import.meta.env.PUBLIC_CONTACT_URL),
};
