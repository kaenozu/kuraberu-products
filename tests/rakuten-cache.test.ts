import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRakutenCacheForTests,
  fetchRakutenProducts,
  RAKUTEN_CACHE_TTL_MS,
} from "../src/lib/rakuten";

const product = {
  itemCode: "shop:item-1",
  itemName: "パンパース 新生児用",
  itemUrl: "https://item.rakuten.co.jp/shop/item-1/",
  itemPrice: 1000,
};

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  // モジュールスコープのキャッシュを破棄し、テスト間の共有を防ぐ。
  clearRakutenCacheForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("fetchRakutenProducts cache", () => {
  it("deduplicates simultaneous requests and reuses a successful result", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "access");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "affiliate");
    const fetchImpl = vi.fn(async () =>
      response({ items: [{ item: product }] }),
    );

    const first = fetchRakutenProducts("cache-success", 1, { fetchImpl });
    const second = fetchRakutenProducts("cache-success", 1, { fetchImpl });
    expect(await Promise.all([first, second])).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    await fetchRakutenProducts("cache-success", 1, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["timeout", () => Promise.reject(new Error("timeout"))],
    ["429", () => Promise.resolve(response({}, false, 429))],
    ["5xx", () => Promise.resolve(response({}, false, 503))],
    ["network error", () => Promise.reject(new Error("network"))],
    ["invalid json", () => Promise.resolve(response("{invalid"))],
    ["empty result", () => Promise.resolve(response({ items: [] }))],
  ])("does not cache %s failures", async (name, result) => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", `app-${name}`);
    vi.stubEnv("RAKUTEN_ACCESS_KEY", `access-${name}`);
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", `affiliate-${name}`);
    const fetchImpl = vi.fn(result);

    await fetchRakutenProducts(`cache-failure-${name}`, 1, { fetchImpl });
    await fetchRakutenProducts(`cache-failure-${name}`, 1, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not delete a newer request when an older request settles", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "app-race");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "access-race");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "affiliate-race");
    let resolveFirst!: (value: Response) => void;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchImpl = vi
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(response({ items: [{ item: product }] }));

    const first = fetchRakutenProducts("cache-race", 1, { fetchImpl });
    resolveFirst(response({ items: [] }));
    await first;
    const second = fetchRakutenProducts("cache-race", 1, { fetchImpl });
    await second;
    await fetchRakutenProducts("cache-race", 1, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("fetchRakutenProducts cache TTL", () => {
  function stubEnvWithSuffix(suffix: string): void {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", `app-${suffix}`);
    vi.stubEnv("RAKUTEN_ACCESS_KEY", `access-${suffix}`);
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", `affiliate-${suffix}`);
  }

  it("reuses a cached result within the TTL", async () => {
    stubEnvWithSuffix("ttl-hit");
    let currentTime = 1_000_000;
    const clock = () => currentTime;
    const fetchImpl = vi.fn(async () =>
      response({ items: [{ item: product }] }),
    );
    const options = { fetchImpl, clock };

    await fetchRakutenProducts("cache-ttl-hit", 1, options);
    currentTime += RAKUTEN_CACHE_TTL_MS - 1;
    await fetchRakutenProducts("cache-ttl-hit", 1, options);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL has elapsed", async () => {
    stubEnvWithSuffix("ttl-expired");
    let currentTime = 1_000_000;
    const clock = () => currentTime;
    const fetchImpl = vi.fn(async () =>
      response({ items: [{ item: product }] }),
    );
    const options = { fetchImpl, clock };

    await fetchRakutenProducts("cache-ttl-expired", 1, options);
    currentTime += RAKUTEN_CACHE_TTL_MS;
    await fetchRakutenProducts("cache-ttl-expired", 1, options);
    // 取り直した結果もTTL内なら再利用される
    currentTime += RAKUTEN_CACHE_TTL_MS - 1;
    await fetchRakutenProducts("cache-ttl-expired", 1, options);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["just before the TTL boundary reuses the cache", -1, 1],
    ["exactly at the TTL boundary refetches", 0, 2],
  ])("%s", async (_name, offsetFromExpiry, expectedCalls) => {
    stubEnvWithSuffix(`ttl-boundary-${offsetFromExpiry}`);
    let currentTime = 1_000_000;
    const clock = () => currentTime;
    const fetchImpl = vi.fn(async () =>
      response({ items: [{ item: product }] }),
    );
    const options = { fetchImpl, clock };

    await fetchRakutenProducts(
      `cache-boundary-${offsetFromExpiry}`,
      1,
      options,
    );
    currentTime += RAKUTEN_CACHE_TTL_MS + offsetFromExpiry;
    await fetchRakutenProducts(
      `cache-boundary-${offsetFromExpiry}`,
      1,
      options,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(expectedCalls);
  });

  it("does not extend failure caching via the TTL (empty results stay uncached)", async () => {
    stubEnvWithSuffix("ttl-failure");
    let currentTime = 1_000_000;
    const clock = () => currentTime;
    const fetchImpl = vi.fn(async () => response({ items: [] }));
    const options = { fetchImpl, clock };

    await fetchRakutenProducts("cache-ttl-failure", 1, options);
    currentTime += 1; // TTL内でも失敗（空結果）は再取得される
    await fetchRakutenProducts("cache-ttl-failure", 1, options);
    currentTime += RAKUTEN_CACHE_TTL_MS * 10;
    await fetchRakutenProducts("cache-ttl-failure", 1, options);

    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
