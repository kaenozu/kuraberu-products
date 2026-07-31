import {
  DEFAULT_SITE_URL,
  normalizeOptionalPublicUrl,
  normalizeSiteUrl,
} from "../../config/runtime-env.mjs";

export { DEFAULT_SITE_URL };

export const site = {
  name: "くらべる商品メモ",
  description: "暮らしの商品を、公式情報と確認状況を分けて比べるサイト",
  url: normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL),
  contactUrl: normalizeOptionalPublicUrl(import.meta.env.PUBLIC_CONTACT_URL),
};
