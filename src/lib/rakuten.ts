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
    .filter(
      (item) => item.id && item.name && isAllowedRakutenUrl(item.url),
    );
}

/** 必須語をすべて含む候補を選び、広告URLがある商品を優先する。 */
export function selectRakutenProduct(
  products: RakutenProduct[],
  requiredTerms: readonly string[],
): RakutenProduct | undefined {
  const normalizedTerms = requiredTerms.map(normalize);
  const matches = products.filter((product) => {
    const name = normalize(product.name);
    return normalizedTerms.every((term) => name.includes(term));
  });
  return matches.find((item) => item.affiliateUrl) ?? matches[0];
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
): Promise<RakutenProduct[]> {
  const cacheKey = `${keyword}\u0000${hits}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const request = fetchRakutenProductsUncached(keyword, hits);
  cache.set(cacheKey, request);
  return request;
}

async function fetchRakutenProductsUncached(
  keyword: string,
  hits: number,
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

  return requestRakutenProducts(url, accessKey);
}
