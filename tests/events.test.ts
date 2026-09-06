import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../functions/api/events";
import { ARTICLE_LAYOUT } from "../config/article-layout.mjs";

const SITE_URL = "https://kuraberu-products.pages.dev";

function postRequest(
  body: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(`${SITE_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: SITE_URL,
      ...headers,
    },
    body,
  });
}

function validPayload(overrides: Record<string, string> = {}): string {
  return JSON.stringify({
    event: "purchase",
    productId: "moony-teishigeki-m",
    placement: "article-end",
    path: "/articles/moony-m/",
    ...overrides,
  });
}

function makeLimiter(
  overrides: { success?: boolean; reset_after?: number; error?: boolean } = {},
) {
  const keys: string[] = [];
  const limiter: ContactRateLimiter = {
    async limit({ key }: { key: string }) {
      keys.push(key);
      if (overrides.error) throw new Error("rate limiter unavailable");
      return {
        success: overrides.success ?? true,
        ...(overrides.reset_after !== undefined
          ? { reset_after: overrides.reset_after }
          : {}),
      };
    },
  };
  return { limiter, keys };
}

function makeKv() {
  const put = vi.fn(
    async (
      _key: string,
      _value: string,
      _options?: { expirationTtl: number },
    ) => {},
  );
  const kv: AnalyticsKv = { put };
  return { kv, put };
}

function baseEnv(limiter?: ContactRateLimiter, kv?: AnalyticsKv): Env {
  return {
    ...(limiter ? { ANALYTICS_RATE_LIMITER: limiter } : {}),
    ...(kv ? { ANALYTICS_KV: kv } : {}),
  };
}

function context(request: Request, env: Env) {
  return { request, env, params: {}, data: {} };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("click analytics endpoint", () => {
  it("accepts a valid purchase click and persists it to KV", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(postRequest(validPayload()), baseEnv(undefined, kv)),
    );

    expect(response.status).toBe(204);
    expect(put).toHaveBeenCalledTimes(1);
    const [key, value, options] = put.mock.calls[0] as [
      string,
      string,
      { expirationTtl: number },
    ];
    expect(key).toMatch(/^v1:events:\d{4}-\d{2}-\d{2}:[0-9a-f-]{36}$/);
    const parsed = JSON.parse(value);
    expect(parsed.event).toBe("purchase");
    expect(parsed.productId).toBe("moony-teishigeki-m");
    expect(parsed.placement).toBe("article-end");
    expect(parsed.path).toBe("/articles/moony-m/");
    expect(parsed.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(options.expirationTtl).toBe(90 * 24 * 60 * 60);
  });

  // config/article-layout.mjs を唯一の情報源として、purchase イベントに
  // 許可される placement を網羅検証する（レイアウト変更時は自動追随する）。
  it.each([...ARTICLE_LAYOUT.placements, ARTICLE_LAYOUT.diagnosisPlacement])(
    "accepts a purchase click with the %s placement and preserves it in KV",
    async (placement) => {
      const { kv, put } = makeKv();
      const response = await onRequestPost(
        context(
          postRequest(validPayload({ placement })),
          baseEnv(undefined, kv),
        ),
      );

      expect(response.status).toBe(204);
      expect(put).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(put.mock.calls[0][1] as string);
      expect(parsed.event).toBe("purchase");
      expect(parsed.placement).toBe(placement);
    },
  );

  it("rejects an unknown event name", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload({ event: "bogus" })),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a placement not allowed by the layout config", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload({ placement: "sidebar" })),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects an invalid product id", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload({ productId: "Moony-M" })),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a path that is not site-relative", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload({ path: "https://evil.com/" })),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request before any rate limit or persistence", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload(), { Origin: "https://evil.com" }),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(403);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a spoofed lookalike origin", async () => {
    const response = await onRequestPost(
      context(
        postRequest(validPayload(), {
          Origin: "https://kuraberu-products.pages.dev.evil.com",
        }),
        baseEnv(),
      ),
    );
    expect(response.status).toBe(403);
  });

  it("accepts the exact site origin", async () => {
    const response = await onRequestPost(
      context(postRequest(validPayload(), { Origin: SITE_URL }), baseEnv()),
    );
    expect(response.status).toBe(204);
  });

  it("rejects malformed JSON", async () => {
    const response = await onRequestPost(
      context(postRequest("{not json"), baseEnv()),
    );
    expect(response.status).toBe(400);
  });

  it("rejects an oversized payload", async () => {
    const big = JSON.stringify({
      event: "purchase",
      productId: "x".repeat(5000),
      placement: "article-end",
    });
    const response = await onRequestPost(context(postRequest(big), baseEnv()));
    expect(response.status).toBe(413);
  });

  it("aborts an oversized chunked body without Content-Length (#390)", async () => {
    // ヘッダー無しの巨大本文でも、フル読込せず累積上限で中断して 413 を返す。
    const { kv, put } = makeKv();
    const big = JSON.stringify({
      event: "purchase",
      productId: "x".repeat(8000),
      placement: "article-end",
    });
    const response = await onRequestPost(
      context(postRequest(big), baseEnv(undefined, kv)),
    );
    expect(response.status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });

  it("accepts a payload just under the cumulative limit", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(
          JSON.stringify({
            event: "purchase",
            productId: "x".repeat(64),
            placement: "article-end",
            path: "/articles/moony-m/",
            // 未検証の追加フィールドで上限直下まで本文を膨らませる
            pad: "x".repeat(3900),
          }),
        ),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(204);
    expect(put).toHaveBeenCalledTimes(1);
  });

  it("returns 429 with Retry-After when rate limited and does not persist", async () => {
    const { limiter } = makeLimiter({ success: false, reset_after: 30 });
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload(), { "CF-Connecting-IP": "203.0.113.9" }),
        baseEnv(limiter, kv),
      ),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(put).not.toHaveBeenCalled();
  });

  it("scopes the rate limit key per endpoint and IP", async () => {
    const { limiter, keys } = makeLimiter({ success: false });
    await onRequestPost(
      context(
        postRequest(validPayload(), { "CF-Connecting-IP": "203.0.113.5" }),
        baseEnv(limiter),
      ),
    );
    expect(keys).toEqual(["kuraberu-events:203.0.113.5"]);
  });

  it("still accepts events without a rate limiter or KV binding", async () => {
    const response = await onRequestPost(
      context(postRequest(validPayload()), baseEnv()),
    );
    expect(response.status).toBe(204);
  });

  it("still accepts events when the rate limiter fails", async () => {
    const { limiter } = makeLimiter({ error: true });
    const response = await onRequestPost(
      context(postRequest(validPayload()), baseEnv(limiter)),
    );
    expect(response.status).toBe(204);
  });

  it("still responds 204 when KV persistence fails", async () => {
    const put = vi.fn(
      async (
        _key: string,
        _value: string,
        _options?: { expirationTtl: number },
      ) => {
        throw new Error("kv unavailable");
      },
    );
    const kv: AnalyticsKv = { put };
    const response = await onRequestPost(
      context(postRequest(validPayload()), baseEnv(undefined, kv)),
    );
    expect(response.status).toBe(204);
  });

  it("accepts a diagnosis-result placement click with rank and persists it", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(
          validPayload({
            productId: "bo160-ppsu",
            placement: "diagnosis-result",
            path: "/tools/product-finder/baby-bottle/",
            rank: "1",
          }),
        ),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(204);
    expect(put).toHaveBeenCalledTimes(1);
    const value = JSON.parse(put.mock.calls[0][1] as string);
    expect(value.placement).toBe("diagnosis-result");
    expect(value.productId).toBe("bo160-ppsu");
    expect(value.rank).toBe("1");
    expect(value.path).toBe("/tools/product-finder/baby-bottle/");
  });

  it("persists a diagnosis-result placement without rank when rank is invalid", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(
          validPayload({
            placement: "diagnosis-result",
            rank: "abc",
          }),
        ),
        baseEnv(undefined, kv),
      ),
    );
    // rank は任意属性のため、不正な場合は rank だけ除外して保存し 204 で続行する
    expect(response.status).toBe(204);
    expect(put).toHaveBeenCalledTimes(1);
    const value = JSON.parse(put.mock.calls[0][1] as string);
    expect(value.placement).toBe("diagnosis-result");
    expect(value.rank).toBeUndefined();
  });

  // 診断フローイベントは placement なしで受け付ける。イベント名の許可リストも
  // config（diagnosisEvents、result_affiliate_click を含む）から導出する。
  it.each(ARTICLE_LAYOUT.diagnosisEvents)(
    "accepts the %s diagnosis event without a placement",
    async (event) => {
      const { kv, put } = makeKv();
      const response = await onRequestPost(
        context(
          postRequest(
            JSON.stringify({
              event,
              path: "/tools/product-finder/baby-bottle/",
            }),
          ),
          baseEnv(undefined, kv),
        ),
      );
      expect(response.status).toBe(204);
      expect(put).toHaveBeenCalledTimes(1);
      const value = JSON.parse(put.mock.calls[0][1] as string);
      expect(value.event).toBe(event);
      expect(value.placement).toBeUndefined();
    },
  );

  it("accepts a result_article_click event with productId and rank", async () => {
    const { kv, put } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(
          JSON.stringify({
            event: "result_article_click",
            productId: "bo240-ppsu",
            rank: "2",
            path: "/tools/product-finder/baby-bottle/",
          }),
        ),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(204);
    expect(put).toHaveBeenCalledTimes(1);
    const value = JSON.parse(put.mock.calls[0][1] as string);
    expect(value.event).toBe("result_article_click");
    expect(value.productId).toBe("bo240-ppsu");
    expect(value.rank).toBe("2");
  });
});
