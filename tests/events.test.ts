import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../functions/api/events";

const SITE_URL = "https://kuraberu-products.pages.dev";

function postRequest(
  body: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(`${SITE_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

function validPayload(overrides: Record<string, string> = {}): string {
  return JSON.stringify({
    event: "purchase",
    productId: "moony-teishigeki-m",
    placement: "after-decision",
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
    expect(parsed.placement).toBe("after-decision");
    expect(parsed.path).toBe("/articles/moony-m/");
    expect(parsed.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(options.expirationTtl).toBe(90 * 24 * 60 * 60);
  });

  it("accepts any placement allowed by the layout config", async () => {
    const { kv } = makeKv();
    const response = await onRequestPost(
      context(
        postRequest(validPayload({ placement: "article-end" })),
        baseEnv(undefined, kv),
      ),
    );
    expect(response.status).toBe(204);
  });

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
      placement: "after-decision",
    });
    const response = await onRequestPost(context(postRequest(big), baseEnv()));
    expect(response.status).toBe(413);
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
});
