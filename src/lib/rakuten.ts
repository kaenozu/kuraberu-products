export type RakutenProduct = { id: string; name: string; url: string; affiliateUrl?: string; price: number };

/** rakuten-x-automation と同じ IchibaItem Search API を利用する。 */
export async function fetchRakutenProducts(keyword: string, hits = 10): Promise<RakutenProduct[]> {
  const applicationId = import.meta.env.RAKUTEN_APPLICATION_ID;
  const accessKey = import.meta.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = import.meta.env.RAKUTEN_AFFILIATE_ID;
  if (!applicationId || !accessKey) return [];
  const url = new URL('https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701');
  url.searchParams.set('format', 'json'); url.searchParams.set('applicationId', applicationId); url.searchParams.set('accessKey', accessKey); url.searchParams.set('keyword', keyword); url.searchParams.set('hits', String(hits));
  if (affiliateId) url.searchParams.set('affiliateId', affiliateId);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`楽天APIエラー: HTTP ${response.status}`);
  const data = await response.json() as { Items?: Array<{ Item?: Record<string, unknown> }> };
  return (data.Items ?? []).map(({Item}) => ({ id: String(Item?.itemCode ?? ''), name: String(Item?.itemName ?? ''), url: String(Item?.itemUrl ?? ''), affiliateUrl: Item?.affiliateUrl ? String(Item.affiliateUrl) : undefined, price: Number(Item?.itemPrice ?? 0) })).filter((item) => item.id && item.url);
}
