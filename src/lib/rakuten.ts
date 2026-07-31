export type RakutenProduct = {
  id: string;
  name: string;
  url: string;
  affiliateUrl?: string;
  price: number;
};
const cache = new Map<string, Promise<RakutenProduct[]>>();

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
  const data = (await response.json()) as {
    Items?: Array<{ Item?: Record<string, unknown> }>;
  };
  return (data.Items ?? [])
    .map(({ Item }) => ({
      id: String(Item?.itemCode ?? ""),
      name: String(Item?.itemName ?? ""),
      url: String(Item?.itemUrl ?? ""),
      affiliateUrl: Item?.affiliateUrl ? String(Item.affiliateUrl) : undefined,
      price: Number(Item?.itemPrice ?? 0),
    }))
    .filter((item) => item.id && item.url);
}
