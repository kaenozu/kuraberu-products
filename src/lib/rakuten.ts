export type RakutenProduct = {
  id: string;
  name: string;
  url: string;
  affiliateUrl?: string;
  price: number;
};

const cache = new Map<string, Promise<RakutenProduct[]>>();

type UnknownRecord = Record<string, unknown>;

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
      return {
        id: String(item.itemCode ?? ""),
        name: String(item.itemName ?? ""),
        url: String(item.itemUrl ?? ""),
        affiliateUrl: item.affiliateUrl
          ? String(item.affiliateUrl)
          : undefined,
        price: Number(item.itemPrice ?? 0),
      } satisfies RakutenProduct;
    })
    .filter((item) => item.id && item.name && /^https:\/\//.test(item.url));
}

/** 必須語をすべて含む候補を選び、広告URLがある商品を優先する。 */
export function selectRakutenProduct(
  products: RakutenProduct[],
  requiredTerms: string[],
): RakutenProduct | undefined {
  const normalizedTerms = requiredTerms.map(normalize);
  const matches = products.filter((product) => {
    const name = normalize(product.name);
    return normalizedTerms.every((term) => name.includes(term));
  });
  return matches.find((item) => item.affiliateUrl) ?? matches[0];
}

/** rakuten-x-automation と同じ IchibaItem Search API を利用する。 */
export async function fetchRakutenProducts(
  keyword: string,
  hits = 10,
): Promise<RakutenProduct[]> {
  const cached = cache.get(keyword);
  if (cached) return cached;
  const request = fetchRakutenProductsUncached(keyword, hits);
  cache.set(keyword, request);
  return request;
}

async function fetchRakutenProductsUncached(
  keyword: string,
  hits: number,
): Promise<RakutenProduct[]> {
  const applicationId = import.meta.env.RAKUTEN_APPLICATION_ID;
  const accessKey = import.meta.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = import.meta.env.RAKUTEN_AFFILIATE_ID;
  if (!applicationId || !accessKey) return [];

  const url = new URL(
    "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701",
  );
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", String(hits));
  if (affiliateId) url.searchParams.set("affiliateId", affiliateId);

  let response: Response;
  try {
    response = await fetch(url, { headers: { accessKey } });
  } catch (error) {
    console.warn("楽天API接続失敗: 購入リンクを未設定として続行します", error);
    return [];
  }
  if (!response.ok) {
    console.warn(`楽天APIエラー: HTTP ${response.status}`);
    return [];
  }

  try {
    return parseRakutenProducts(await response.json());
  } catch (error) {
    console.warn("楽天APIレスポンス解析失敗: 購入リンクを未設定として続行します", error);
    return [];
  }
}
