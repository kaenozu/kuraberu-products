const DEPLOYMENT_ENVIRONMENTS = new Set([
  "development",
  "preview",
  "production",
]);

export const DEFAULT_SITE_URL = "https://kuraberu-products.pages.dev";

export const CONFIGURED_ENVIRONMENT_VARIABLES = Object.freeze([
  "DEPLOYMENT_ENV",
  "PUBLIC_SITE_URL",
  "PUBLIC_RAKUTEN_PREMIUM_URL",
  "PUBLIC_RAKUTEN_SARASARA_URL",
  "RAKUTEN_APPLICATION_ID",
  "RAKUTEN_ACCESS_KEY",
  "RAKUTEN_AFFILIATE_ID",
  "PUBLIC_RAKUTEN_AFFILIATE_REDIRECT",
  "PUBLIC_CONTACT_URL",
]);

const RAKUTEN_API_CREDENTIALS = Object.freeze([
  "RAKUTEN_APPLICATION_ID",
  "RAKUTEN_ACCESS_KEY",
  "RAKUTEN_AFFILIATE_ID",
]);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseHttpsUrl(value, name) {
  if (!nonEmpty(value)) {
    throw new Error(`${name} must be a non-empty HTTPS URL`);
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${name} must use https`);
  }
  if (url.username || url.password) {
    throw new Error(`${name} must not contain credentials`);
  }

  return url;
}

export function normalizeSiteUrl(value, name = "PUBLIC_SITE_URL") {
  const url = parseHttpsUrl(value, name);
  if (url.search || url.hash) {
    throw new Error(`${name} must not contain a query or fragment`);
  }
  if (url.pathname !== "/") {
    throw new Error(`${name} must point to the site root`);
  }
  return url.origin;
}

export function normalizeOptionalPublicUrl(value, name = "PUBLIC_CONTACT_URL") {
  if (!nonEmpty(value)) return undefined;
  return parseHttpsUrl(value, name).toString();
}

export function isAllowedRakutenUrl(value) {
  if (!nonEmpty(value)) return false;

  let url;
  try {
    url = parseHttpsUrl(value, "Rakuten URL");
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  return (
    hostname === "rakuten.co.jp" ||
    hostname.endsWith(".rakuten.co.jp") ||
    hostname === "r10.to" ||
    hostname.endsWith(".r10.to")
  );
}

// 楽天アフィリエイトリダイレクトの共通プレフィックス（hb.afl 経由）。
// AffiliateButton と NextStepBlock の両方が購入リンクの変換に使う。
// リダイレクトIDは RAKUTEN_AFFILIATE_ID 環境変数を優先して組み立て、
// 未設定・形式不正時は現行値へフォールバックする（CI / ローカルビルドが
// 環境変数なしでも壊れないため）。商品ソース側に hb.afl を直書きしない。
const DEFAULT_RAKUTEN_AFFILIATE_ID = "34e76967.d5cc3ae1.34e76968.3eade5e6";
const RAKUTEN_AFFILIATE_ID_PATTERN =
  /^[0-9a-f]{16}\.[0-9a-f]{8}\.[0-9a-f]{16}\.[0-9a-f]{8}$/i;

function rakutenAffiliateRedirectPrefix(environment = process.env) {
  const defaultPrefix = `https://hb.afl.rakuten.co.jp/hgc/${DEFAULT_RAKUTEN_AFFILIATE_ID}/?pc=`;
  const affiliateId = environment.RAKUTEN_AFFILIATE_ID?.trim();
  if (!affiliateId) return defaultPrefix;
  if (!RAKUTEN_AFFILIATE_ID_PATTERN.test(affiliateId)) {
    console.warn(
      "RAKUTEN_AFFILIATE_ID の形式が不正なため既定のアフィリエイトIDへフォールバックします",
    );
    return defaultPrefix;
  }
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=`;
}

// 購入リンクをアフィリエイトURLへ正規化する。
// - 既にアフィリエイトURL（hb.afl / r10.to / a.r10.to）: そのまま返す
// - 楽天の検索URL（search.rakuten.co.jp 等）: hb.afl のリダイレクトへ変換
// - それ以外: そのまま返す（呼び出し側で isAllowedRakutenUrl により弾く）
export function toAffiliateRakutenUrl(
  value,
  redirectPrefix,
  environment = process.env,
) {
  if (!nonEmpty(value)) return undefined;
  if (isAffiliateRakutenUrl(value)) return value;
  if (/^https:\/\/(?:search\.|www\.)?rakuten\.co\.jp\//i.test(value)) {
    const prefix =
      redirectPrefix || rakutenAffiliateRedirectPrefix(environment);
    return `${prefix}${encodeURIComponent(value)}&link_type=text`;
  }
  return value;
}

/**
 * 型番・商品名クエリから楽天市場の検索→アフィリエイトURLを生成する。
 * 商品レジストリ（src/lib/products.ts など）で hb.afl を直書きしないための
 * 唯一の生成口。クエリは encodeURIComponent で検索URLへ埋め込んでから変換する。
 */
export function toAffiliateRakutenSearchUrl(query, environment = process.env) {
  const keyword = typeof query === "string" ? query.trim() : "";
  if (!keyword) return undefined;
  return toAffiliateRakutenUrl(
    `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}`,
    undefined,
    environment,
  );
}

// アフィリエイトURL（hb.afl / r10.to / a.r10.to）かどうか。
// 広告表示（（広告））と rel="sponsored" の付与条件。
export function isAffiliateRakutenUrl(value) {
  if (!nonEmpty(value)) return false;
  return /^https:\/\/(?:[^./]+\.)?(?:hb\.afl\.rakuten\.co\.jp|r10\.to|a\.r10\.to)(?:\/|$)/i.test(
    value,
  );
}

export function normalizeOptionalRakutenUrl(value, name) {
  if (!nonEmpty(value)) return undefined;
  if (!isAllowedRakutenUrl(value)) {
    throw new Error(`${name} must use an approved Rakuten host over https`);
  }
  return new URL(value.trim()).toString();
}

export function validateBuildEnvironment(environment = process.env) {
  const deploymentEnv = environment.DEPLOYMENT_ENV ?? "preview";
  if (!DEPLOYMENT_ENVIRONMENTS.has(deploymentEnv)) {
    throw new Error(
      `DEPLOYMENT_ENV must be development, preview, or production: ${deploymentEnv}`,
    );
  }

  const siteUrl = nonEmpty(environment.PUBLIC_SITE_URL)
    ? normalizeSiteUrl(environment.PUBLIC_SITE_URL)
    : undefined;
  const contactUrl = normalizeOptionalPublicUrl(environment.PUBLIC_CONTACT_URL);
  const rakutenPremiumUrl = normalizeOptionalRakutenUrl(
    environment.PUBLIC_RAKUTEN_PREMIUM_URL,
    "PUBLIC_RAKUTEN_PREMIUM_URL",
  );
  const rakutenSarasaraUrl = normalizeOptionalRakutenUrl(
    environment.PUBLIC_RAKUTEN_SARASARA_URL,
    "PUBLIC_RAKUTEN_SARASARA_URL",
  );

  const configuredApiCredentials = RAKUTEN_API_CREDENTIALS.filter((name) =>
    nonEmpty(environment[name]),
  );
  const rakutenApiReady =
    configuredApiCredentials.length === RAKUTEN_API_CREDENTIALS.length;
  if (
    configuredApiCredentials.length > 0 &&
    configuredApiCredentials.length < RAKUTEN_API_CREDENTIALS.length
  ) {
    throw new Error(
      `Rakuten API credentials must be configured together: ${RAKUTEN_API_CREDENTIALS.join(", ")}`,
    );
  }

  if (deploymentEnv === "production") {
    if (!siteUrl) {
      throw new Error("Missing required production variable: PUBLIC_SITE_URL");
    }

    const directUrlsReady = Boolean(rakutenPremiumUrl && rakutenSarasaraUrl);
    if (!directUrlsReady && !rakutenApiReady) {
      throw new Error(
        "Production purchase links require both direct Rakuten URLs or all Rakuten API credentials",
      );
    }
  }

  return {
    deploymentEnv,
    siteUrl,
    contactUrl,
    rakutenPremiumUrl,
    rakutenSarasaraUrl,
    rakutenApiReady,
  };
}
