import {
  isAllowedRakutenUrl,
  isAffiliateRakutenUrl,
  isRakutenProductDetailUrl,
  toAffiliateRakutenUrl,
} from "../../config/runtime-env.mjs";

export type RakutenProduct = {
  id: string;
  name: string;
  url: string;
  affiliateUrl?: string;
  imageUrl?: string;
  price: number;
};

export const RAKUTEN_API_TIMEOUT_MS = 5_000;

/** 楽天IchibaItem Search API のバージョン。キャッシュキーに含め、API仕様変更時に自動的にキャッシュを無効化する。 */
const RAKUTEN_API_VERSION = "20260701";

/**
 * 成功応答キャッシュの TTL。長時間プロセス（wrangler dev 等）で
 * 古い検索結果を使い続けないための上限。既定は60分。
 */
export const RAKUTEN_CACHE_TTL_MS = 60 * 60 * 1000;

type CacheEntry = {
  promise: Promise<RakutenProduct[]>;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

/**
 * モジュールスコープの検索キャッシュを破棄する。
 * テスト間でキャッシュが共有されるのを防ぐための専用入口
 * （tests/rakuten-cache.test.ts の afterEach から呼ぶ）。
 */
export function clearRakutenCacheForTests(): void {
  cache.clear();
}

type UnknownRecord = Record<string, unknown>;
type FetchImplementation = typeof fetch;

export type RakutenSelectionOptions = {
  excludedTerms?: readonly string[];
  exactItemCodes?: readonly string[];
  exactIdentifiers?: readonly string[];
};

type RequestRakutenOptions = {
  fetchImpl?: FetchImplementation;
  timeoutMs?: number;
  /**
   * 現在時刻を返す関数（ミリ秒）。キャッシュ TTL の判定に使う。
   * 既定は Date.now。テストで決定論的な時計を注入できる。
   */
  clock?: () => number;
};

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object"
    ? (value as UnknownRecord)
    : {};
}

function normalize(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function normalizeTerms(terms: readonly string[]): string[] | undefined {
  const normalized = terms.map(normalize);
  return normalized.some((term) => term.length === 0) ? undefined : normalized;
}

function containsExactIdentifier(
  product: RakutenProduct,
  identifier: string,
): boolean {
  const normalizedIdentifier = identifier
    .normalize("NFKC")
    .trim()
    .toLowerCase();
  if (!normalizedIdentifier) return false;
  if (normalize(product.id) === normalize(normalizedIdentifier)) return true;

  const isExactOccurrence = (value: string) => {
    const normalizedValue = value.normalize("NFKC").toLowerCase();
    const index = normalizedValue.indexOf(normalizedIdentifier);
    if (index < 0) return false;

    const before = normalizedValue[index - 1];
    const after = normalizedValue[index + normalizedIdentifier.length];
    const isAlphaNumeric = (character: string | undefined) =>
      character !== undefined && /[a-z0-9]/.test(character);
    return !isAlphaNumeric(before) && !isAlphaNumeric(after);
  };

  return isExactOccurrence(product.name) || isExactOccurrence(product.url);
}

function stableDuplicateRepresentative(
  products: RakutenProduct[],
): RakutenProduct {
  if (
    products.length === 1 &&
    (!products[0].affiliateUrl || isAllowedRakutenUrl(products[0].affiliateUrl))
  ) {
    return products[0];
  }

  const sorted = [...products].sort((left, right) => {
    const leftKey = `${left.id}\u0000${left.name}\u0000${left.url}\u0000${left.price}`;
    const rightKey = `${right.id}\u0000${right.name}\u0000${right.url}\u0000${right.price}`;
    return leftKey.localeCompare(rightKey, "en");
  });
  const representative = sorted[0];
  const affiliateUrl = sorted
    .map((product) => product.affiliateUrl)
    .filter((value): value is string => isAllowedRakutenUrl(value))
    .sort((left, right) => left.localeCompare(right, "en"))[0];

  return affiliateUrl
    ? { ...representative, affiliateUrl }
    : { ...representative, affiliateUrl: undefined };
}

/**
 * 楽天APIのformatVersion=2形式を優先し、旧ネスト形式も安全に読み取る。
 * itemPrice が欠損・不正な候補は price:0 の誤表示を避けるため除外する
 * （fail-closed）。
 */
export function parseRakutenProducts(data: unknown): RakutenProduct[] {
  const root = asRecord(data);
  const entries = Array.isArray(root.items)
    ? root.items
    : Array.isArray(root.Items)
      ? root.Items
      : [];

  return entries
    .map((entry) => {
      const wrapper = asRecord(entry);
      const item = asRecord(wrapper.item ?? wrapper.Item ?? wrapper);
      const itemUrl = String(item.itemUrl ?? "");
      const affiliateUrl = item.affiliateUrl
        ? String(item.affiliateUrl)
        : undefined;
      const imageEntries = Array.isArray(item.mediumImageUrls)
        ? item.mediumImageUrls
        : Array.isArray(item.smallImageUrls)
          ? item.smallImageUrls
          : [];
      const firstImage = imageEntries[0];
      const imageUrl =
        typeof firstImage === "string"
          ? firstImage
          : String(asRecord(firstImage).imageUrl ?? "");

      // 欠損（undefined / null / 空文字）は NaN にして下段の filter で除外する。
      const hasPrice =
        item.itemPrice !== undefined &&
        item.itemPrice !== null &&
        item.itemPrice !== "";
      return {
        id: String(item.itemCode ?? ""),
        name: String(item.itemName ?? ""),
        url: itemUrl,
        affiliateUrl:
          affiliateUrl &&
          isAllowedRakutenUrl(affiliateUrl) &&
          isRakutenProductDetailUrl(itemUrl)
            ? affiliateUrl
            : undefined,
        imageUrl: /^https:\/\/(?:[^/]+\.)?image\.rakuten\.co\.jp\//i.test(
          imageUrl,
        )
          ? imageUrl
          : undefined,
        price: hasPrice ? Number(item.itemPrice) : Number.NaN,
      } satisfies RakutenProduct;
    })
    .filter(
      (item) =>
        item.id &&
        item.name &&
        Number.isFinite(item.price) &&
        isRakutenProductDetailUrl(item.url),
    );
}

/**
 * 商品名・識別子で候補を fail-closed に絞り、曖昧な候補は選択しない。
 * `requiredTerms` だけの既存呼び出しも維持する。
 */
export function selectRakutenProduct(
  products: RakutenProduct[],
  requiredTerms: readonly string[],
  options: RakutenSelectionOptions = {},
): RakutenProduct | undefined {
  const normalizedRequiredTerms = normalizeTerms(requiredTerms);
  const normalizedExcludedTerms = normalizeTerms(options.excludedTerms ?? []);
  const normalizedItemCodes = normalizeTerms(options.exactItemCodes ?? []);
  const normalizedIdentifiers = normalizeTerms(options.exactIdentifiers ?? []);
  if (
    !normalizedRequiredTerms ||
    !normalizedExcludedTerms ||
    !normalizedItemCodes ||
    !normalizedIdentifiers ||
    products.length === 0
  ) {
    return undefined;
  }

  const matches = products.filter((product) => {
    const name = normalize(product.name);
    const requiredMatch = normalizedRequiredTerms.every((term) =>
      name.includes(term),
    );
    const excludedMatch = normalizedExcludedTerms.some((term) =>
      name.includes(term),
    );
    const itemCodeMatch =
      normalizedItemCodes.length === 0 ||
      normalizedItemCodes.includes(normalize(product.id));
    const identifierMatch =
      normalizedIdentifiers.length === 0 ||
      normalizedIdentifiers.some((identifier) =>
        containsExactIdentifier(product, identifier),
      );
    return requiredMatch && !excludedMatch && itemCodeMatch && identifierMatch;
  });

  const identities = new Map<string, RakutenProduct[]>();
  for (const product of matches) {
    const identity = `${normalize(product.id)}\u0000${normalize(product.name)}\u0000${normalize(product.url)}`;
    const group = identities.get(identity) ?? [];
    group.push(product);
    identities.set(identity, group);
  }
  if (identities.size !== 1) return undefined;
  return stableDuplicateRepresentative([...identities.values()][0]);
}

export async function requestRakutenProducts(
  url: URL,
  accessKey: string,
  options: RequestRakutenOptions = {},
): Promise<RakutenProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs =
    Number.isFinite(options.timeoutMs) && Number(options.timeoutMs) > 0
      ? Number(options.timeoutMs)
      : RAKUTEN_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { accessKey },
      signal: controller.signal,
    });
  } catch {
    console.warn(
      "楽天API接続失敗またはタイムアウト: 購入リンクを未設定として続行します",
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.warn(`楽天APIエラー: HTTP ${response.status}`);
    return [];
  }

  try {
    return parseRakutenProducts(await response.json());
  } catch {
    console.warn(
      "楽天APIレスポンス解析失敗: 購入リンクを未設定として続行します",
    );
    return [];
  }
}

/** rakuten-x-automation と同じ IchibaItem Search API を利用する。 */
export async function fetchRakutenProducts(
  keyword: string,
  hits = 10,
  options: RequestRakutenOptions = {},
): Promise<RakutenProduct[]> {
  const cacheKey = `${keyword}\u0000${hits}\u0000${RAKUTEN_API_VERSION}`;
  const clock = options.clock ?? Date.now;
  const cached = cache.get(cacheKey);
  if (cached) {
    if (clock() < cached.expiresAt) return cached.promise;
    cache.delete(cacheKey);
  }
  const request = fetchRakutenProductsUncached(keyword, hits, options);
  cache.set(cacheKey, {
    promise: request,
    expiresAt: clock() + RAKUTEN_CACHE_TTL_MS,
  });

  // Keep only successful, non-empty results. Attach a rejection handler here
  // as well as returning the original promise so an unexpected failure can
  // evict the entry without creating an unhandled rejection. 失敗・空結果は
  // TTL を待たず即時失効する（次の呼び出しで再取得）。
  void request.then(
    (products) => {
      if (products.length === 0 && cache.get(cacheKey)?.promise === request) {
        cache.delete(cacheKey);
      }
    },
    () => {
      if (cache.get(cacheKey)?.promise === request) cache.delete(cacheKey);
    },
  );

  return request;
}

export type ResolvePurchaseHrefOptions = {
  /** Rakuten search keyword */
  keyword: string;
  /** Terms that must appear in the product name for selection */
  requiredTerms: readonly string[];
  /** Rakuten selection options (excluded terms, exact identifiers, etc.) */
  selection?: RakutenSelectionOptions;
  /**
   * Fallback URL when no product is selected.
   * Typically a Rakuten search URL that toAffiliateRakutenUrl will convert
   * to an hb.afl affiliate redirect.
   */
  fallbackUrl?: string;
};

export type ResolvedPurchaseHref = {
  /** The resolved URL (affiliate > product URL > fallback, normalized) */
  href: string;
  /** Whether the resolved URL is an affiliate link (for ad disclosure) */
  isAffiliate: boolean;
  /** The selected Rakuten product, if any */
  product?: RakutenProduct;
};

/**
 * 統一購入リンクリゾルバー。
 *
 * 楽天APIで商品を検索 → selectRakutenProduct で最適な候補を選択 →
 * affiliate URL > product URL > fallback URL の順で解決する。
 *
 * AffiliateButton と CommercialArticlePage の両方が使う。
 * articlePurchaseLinks レジストリは静的でAPI呼び出し不要のため、
 * この関数の外で直接参照する。
 */
export async function resolvePurchaseHref(
  options: ResolvePurchaseHrefOptions,
  fetchOptions?: RequestRakutenOptions,
): Promise<ResolvedPurchaseHref> {
  const products = await fetchRakutenProducts(
    options.keyword,
    10,
    fetchOptions,
  );
  const selected = selectRakutenProduct(
    products,
    options.requiredTerms,
    options.selection ?? {},
  );

  // Search URLs are never purchase destinations. A missing/ambiguous detail
  // page remains unset rather than becoming a misleading affiliate CTA.
  const rawHref = selected?.url;
  const resolvedHref =
    rawHref && isRakutenProductDetailUrl(rawHref)
      ? (toAffiliateRakutenUrl(
          selected?.affiliateUrl ?? rawHref,
          import.meta.env.PUBLIC_RAKUTEN_AFFILIATE_REDIRECT,
        ) ?? rawHref)
      : "";
  const fallbackHref = options.fallbackUrl
    ? toAffiliateRakutenUrl(
        options.fallbackUrl,
        import.meta.env.PUBLIC_RAKUTEN_AFFILIATE_REDIRECT,
      ) ?? options.fallbackUrl
    : "";
  const href = resolvedHref || fallbackHref;
  const isAffiliate = isAffiliateRakutenUrl(href);

  return { href, isAffiliate, product: selected };
}

async function fetchRakutenProductsUncached(
  keyword: string,
  hits: number,
  options: RequestRakutenOptions,
): Promise<RakutenProduct[]> {
  const applicationId = import.meta.env.RAKUTEN_APPLICATION_ID;
  const accessKey = import.meta.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = import.meta.env.RAKUTEN_AFFILIATE_ID;
  if (!applicationId || !accessKey || !affiliateId) return [];

  const url = new URL(
    `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/${RAKUTEN_API_VERSION}`,
  );
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", String(hits));
  url.searchParams.set("affiliateId", affiliateId);

  return requestRakutenProducts(url, accessKey, options);
}
