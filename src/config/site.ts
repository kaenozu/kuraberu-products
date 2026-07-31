export const DEFAULT_SITE_URL = "https://kuraberu-products.pages.dev";

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const site = {
  name: "くらべる商品メモ",
  description: "暮らしの商品を、公式情報と確認状況を分けて比べるサイト",
  url: withoutTrailingSlash(
    import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  ),
  contactUrl: import.meta.env.PUBLIC_CONTACT_URL,
};
