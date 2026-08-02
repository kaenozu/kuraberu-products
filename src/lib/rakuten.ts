import { isAllowedRakutenUrl } from "../../config/runtime-env.mjs";

export type RakutenProduct = {
  id: string;
  name: string;
  url: string;
  affiliateUrl?: string;
  price: number;
};

export const RAKUTEN_API_TIMEOUT_MS = 5_000;

const cache = new Map<string, Promise<RakutenProduct[]>>();

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

  const normalizedName = product.name.normalize("NFKC").toLowerCase();
  const index = normalizedName.indexOf(normalizedIdentifier);
  if (index < 0) return false;

  const before = normalizedName[index - 1];
  const after = normalizedName[index + normalizedIdentifier.length];
  const isAlphaNumeric = (value: string | undefined) =>
    value !== undefined && /[a-z0-9]/.test(value);
  return !isAlphaNumeric(before) && !isAlphaNumeric(after);
}

/**
 * 楽天APIのformatVersion=2形式を優先し、旧ネスト形式も安全に読み取る。
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

      return {
        id: String(item.itemCode ?? ""),
        name: String(item.itemName ?? ""),
        url: itemUrl,
        affiliateUrl:
          affiliateUrl && isAllowedRakutenUrl(affiliateUrl)
            ? affiliateUrl
            : undefined,
        price: Number(item.itemPrice ?? 0),
      } satisfies RakutenProduct;
    })
    .filter((item) => item.id && item.name && isAllowedRakutenUrl(item.url));
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

  const uniqueProducts = new Map(
    matches.map((product) => [
      `${normalize(product.id)}\u0000${normalize(product.name)}\u0000${normalize(product.url)}`,
      product,
    ]),
  );
  if (uniqueProducts.size !== 1) return undefined;
  return [...uniqueProducts.values()][0];
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
  const cacheKey = `${keyword}\u0000${hits}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const request = fetchRakutenProductsUncached(keyword, hits, options);
  cache.set(cacheKey, request);

  // Keep only successful, non-empty results. Attach a rejection handler here
  // as well as returning the original promise so an unexpected failure can
  // evict the entry without creating an unhandled rejection.
  void request.then(
    (products) => {
      if (products.length === 0 && cache.get(cacheKey) === request) {
        cache.delete(cacheKey);
      }
    },
    () => {
      if (cache.get(cacheKey) === request) cache.delete(cacheKey);
    },
  );

  return request;
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
    "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701",
  );
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", String(hits));
  url.searchParams.set("affiliateId", affiliateId);

  return requestRakutenProducts(url, accessKey, options);
}
