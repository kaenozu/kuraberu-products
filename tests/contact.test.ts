import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientIp,
  enforceContactRateLimit,
  isSameSiteOrigin,
  onRequestPost,
} from "../functions/api/contact";

const SITE_URL = "https://kuraberu-products.pages.dev";

function postRequest(
  body: string,
  headers: Record<string, string> = {},
): Request {
  return new Request(`${SITE_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body,
  });
}

function validForm(): string {
  return new URLSearchParams({
    name: "テスト",
    email: "test@example.com",
    message: "お問い合わせ本文",
  }).toString();
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

function baseEnv(limiter?: ContactRateLimiter): Env {
  // Default: a permissive limiter that always allows (simulates a working binding).
  const defaultLimiter: ContactRateLimiter = {
    async limit() {
      return { success: true };
    },
  };
  return {
    TELEGRAM_BOT_TOKEN: "123:token",
    TELEGRAM_CHAT_ID: "-100123",
    PUBLIC_SITE_URL: SITE_URL,
    CONTACT_RATE_LIMITER: limiter ?? defaultLimiter,
  };
}

function telegramOk(): ReturnType<typeof vi.fn> {
  const mock = vi.fn(async () => new Response("ok", { status: 200 }));
  vi.stubGlobal("fetch", mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isSameSiteOrigin", () => {
  it("allows the exact site origin", () => {
    expect(isSameSiteOrigin(SITE_URL, SITE_URL)).toBe(true);
  });

  it("tolerates a trailing slash in the configured site URL", () => {
    expect(isSameSiteOrigin(SITE_URL, `${SITE_URL}/`)).toBe(true);
  });

  it("rejects a lookalike subdomain that shares the prefix", () => {
    expect(
      isSameSiteOrigin(
        "https://kuraberu-products.pages.dev.evil.com",
        SITE_URL,
      ),
    ).toBe(false);
  });

  it("rejects an unrelated cross-origin", () => {
    expect(isSameSiteOrigin("https://evil.com", SITE_URL)).toBe(false);
  });

  it("rejects a different port", () => {
    expect(
      isSameSiteOrigin("https://kuraberu-products.pages.dev:8443", SITE_URL),
    ).toBe(false);
  });

  it("rejects a different scheme", () => {
    expect(
      isSameSiteOrigin("http://kuraberu-products.pages.dev", SITE_URL),
    ).toBe(false);
  });

  it("allows requests without an Origin header", () => {
    expect(isSameSiteOrigin(null, SITE_URL)).toBe(true);
    expect(isSameSiteOrigin("", SITE_URL)).toBe(true);
  });

  it("rejects a malformed origin", () => {
    expect(isSameSiteOrigin("not a url", SITE_URL)).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers CF-Connecting-IP", () => {
    const request = new Request("https://example.com/", {
      headers: {
        "CF-Connecting-IP": "203.0.113.5",
        "X-Forwarded-For": "198.51.100.7, 10.0.0.1",
      },
    });
    expect(clientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to the last X-Forwarded-For entry added by the nearest proxy", () => {
    const request = new Request("https://example.com/", {
      headers: { "X-Forwarded-For": "198.51.100.7, 10.0.0.1" },
    });
    expect(clientIp(request)).toBe("10.0.0.1");
  });

  it("ignores attacker-injected leading X-Forwarded-For entries", () => {
    // 先頭への偽値挿入でレート制限キーを無限生成できないこと
    const request = new Request("https://example.com/", {
      headers: { "X-Forwarded-For": `spoof ${"x".repeat(20)}, 198.51.100.9` },
    });
    expect(clientIp(request)).toBe("198.51.100.9");
  });

  it("uses a stable fallback when no usable IP header exists", () => {
    expect(clientIp(new Request("https://example.com/"))).toBe("unknown");
    // 形式検証に通らない値も単一バケットへ倒す
    const garbage = new Request("https://example.com/", {
      headers: { "CF-Connecting-IP": "<script>" },
    });
    expect(clientIp(garbage)).toBe("unknown");
  });
});

describe("enforceContactRateLimit", () => {
  it("allows when the limiter succeeds", async () => {
    const { limiter } = makeLimiter({ success: true });
    await expect(
      enforceContactRateLimit(limiter, "203.0.113.5"),
    ).resolves.toEqual({ allowed: true });
  });

  it("denies with the reported reset time", async () => {
    const { limiter } = makeLimiter({ success: false, reset_after: 37 });
    const result = await enforceContactRateLimit(limiter, "203.0.113.5");
    expect(result).toMatchObject({
      allowed: false,
      retryAfterSeconds: 37,
    });
  });

  it("falls back to the configured window when reset time is absent", async () => {
    const { limiter } = makeLimiter({ success: false });
    const result = await enforceContactRateLimit(limiter, "203.0.113.5");
    expect(result).toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("denies when the binding is not configured (fail-closed)", async () => {
    const result = await enforceContactRateLimit(undefined, "203.0.113.5");
    expect(result).toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
      reason: "unavailable",
    });
  });

  it("denies when the limiter throws (fail-closed)", async () => {
    const { limiter } = makeLimiter({ error: true });
    const result = await enforceContactRateLimit(limiter, "203.0.113.5");
    expect(result).toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
      reason: "unavailable",
    });
  });

  it("scopes the rate limit key per endpoint and IP", async () => {
    const { limiter, keys } = makeLimiter({ success: false });
    await enforceContactRateLimit(limiter, "203.0.113.5");
    expect(keys).toEqual(["kuraberu-contact:203.0.113.5"]);
  });
});

describe("onRequestPost", () => {
  it("forwards a valid submission to Telegram", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(telegram).toHaveBeenCalledTimes(1);
    const [url, init] = telegram.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain(
      "https://api.telegram.org/bot123:token/sendMessage",
    );
    const body = JSON.parse(String(init.body));
    expect(body.chat_id).toBe(-100123);
    expect(body.text).toContain("test@example.com");
    expect(body.text).toContain("お問い合わせ本文");
  });

  it("rejects a spoofed lookalike origin", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(validForm(), {
        Origin: "https://kuraberu-products.pages.dev.evil.com",
      }),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(403);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(validForm(), { Origin: "https://evil.com" }),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(403);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the rate limit is exceeded", async () => {
    const telegram = telegramOk();
    const { limiter } = makeLimiter({ success: false, reset_after: 42 });
    const response = await onRequestPost({
      request: postRequest(validForm(), { "CF-Connecting-IP": "203.0.113.9" }),
      env: baseEnv(limiter),
      params: {},
      data: {},
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(await response.json()).toEqual({
      ok: false,
      error: "too many requests",
    });
    expect(telegram).not.toHaveBeenCalled();
  });

  it("returns 503 when the rate limiter binding is absent (fail-closed)", async () => {
    const telegram = telegramOk();
    // Simulate missing CONTACT_RATE_LIMITER binding by casting to remove it
    const envWithoutLimiter = {
      TELEGRAM_BOT_TOKEN: "123:token",
      TELEGRAM_CHAT_ID: "-100123",
      PUBLIC_SITE_URL: SITE_URL,
    } as unknown as Env;
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: envWithoutLimiter,
      params: {},
      data: {},
    });

    expect(response.status).toBe(503);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("returns 503 when the rate limiter fails (fail-closed)", async () => {
    const telegram = telegramOk();
    const { limiter } = makeLimiter({ error: true });
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(limiter),
      params: {},
      data: {},
    });

    expect(response.status).toBe(503);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("rejects a submission without message and email", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(new URLSearchParams({ name: "テスト" }).toString()),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(400);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(
        new URLSearchParams({
          email: "not-an-email",
          message: "本文",
        }).toString(),
      ),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(400);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("rejects messages with too many URLs", async () => {
    const telegram = telegramOk();
    const urls = Array.from(
      { length: 6 },
      (_, index) => `https://example.com/${index}`,
    );
    const response = await onRequestPost({
      request: postRequest(
        new URLSearchParams({
          email: "test@example.com",
          message: urls.join(" "),
        }).toString(),
      ),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(400);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("returns 500 when Telegram is not configured", async () => {
    const telegram = telegramOk();
    // Env with a working limiter but missing Telegram tokens
    const { limiter } = makeLimiter({ success: true });
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: {
        PUBLIC_SITE_URL: SITE_URL,
        CONTACT_RATE_LIMITER: limiter,
      } as unknown as Env,
      params: {},
      data: {},
    });

    expect(response.status).toBe(500);
    expect(telegram).not.toHaveBeenCalled();
  });

  it("returns 502 when Telegram delivery fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bad gateway", { status: 502 })),
    );
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(502);
  });

  it("rejects an unsupported content type", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: new Request(`${SITE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "hello",
      }),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(415);
    expect(telegram).not.toHaveBeenCalled();
  });

  // ---- Content-Length size guard ----

  it("rejects payloads exceeding 10 KB before formData expansion", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(validForm(), {
        "Content-Length": String(10_001),
      }),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      ok: false,
      error: "payload too large",
    });
    expect(telegram).not.toHaveBeenCalled();
  });

  it("accepts payloads at exactly 10 KB", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(validForm(), {
        "Content-Length": String(10_000),
      }),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  it("treats missing Content-Length as zero (allows the request)", async () => {
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  // ---- Post- formData body size guard ----

  it.each([
    ["absent", {}],
    ["understated", { "Content-Length": "100" }],
  ])(
    "rejects oversized payload when Content-Length is %s",
    async (_label, headers) => {
      const telegram = telegramOk();
      // Build a form with a very long message (no trustworthy Content-Length)
      const longMessage = "a".repeat(12_000);
      const response = await onRequestPost({
        request: new Request(`${SITE_URL}/api/contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...headers,
          },
          body: new URLSearchParams({
            email: "test@example.com",
            message: longMessage,
          }).toString(),
        }),
        env: baseEnv(),
        params: {},
        data: {},
      });

      expect(response.status).toBe(413);
      expect(await response.json()).toEqual({
        ok: false,
        error: "payload too large",
      });
      expect(telegram).not.toHaveBeenCalled();
    },
  );

  it("rejects a multibyte payload whose byte size exceeds the limit even when Content-Length understates it", async () => {
    // 「あ」は UTF-8 で 3 バイト。3334 字 = 10002 バイト + フィールド名 7 バイトで
    // 上限超過。UTF-16 の .length（3334）ベースの旧判定では見逃されていたケース。
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(
        new URLSearchParams({ message: "あ".repeat(3334) }).toString(),
        {
          "Content-Length": "1", // 過少申告（formData 展開後の再チェックを通す）
        },
      ),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      ok: false,
      error: "payload too large",
    });
    expect(telegram).not.toHaveBeenCalled();
  });

  it("accepts a multibyte payload at exactly the 10_000-byte boundary", async () => {
    // フィールド名計 16B（message 7 + name 4 + email 5）+ email 値 16B +
    // message 値 9963B（3バイト文字 × 3321 字）= ちょうど 10000 バイト
    // （上限ちょうどは許可）。
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(
        new URLSearchParams({
          email: "test@example.com",
          message: "あ".repeat(3321),
        }).toString(),
        { "Content-Length": "1" },
      ),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  it("accepts an ASCII payload whose decoded size is exactly 10_000 bytes", async () => {
    // ASCII では .length とバイト数が一致するため、境界挙動は不変。
    const telegram = telegramOk();
    const response = await onRequestPost({
      request: postRequest(
        new URLSearchParams({
          email: "test@example.com",
          message: "a".repeat(9963),
        }).toString(),
        { "Content-Length": "1" },
      ),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  // ---- Telegram fetch timeout ----

  it("returns 504 when Telegram fetch hangs and the abort signal fires", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Mock fetch to hang forever until the AbortController signal fires,
    // then reject with an AbortError (mimicking real fetch behavior).
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () =>
              reject(
                new DOMException("The operation was aborted.", "AbortError"),
              ),
            { once: true },
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const responsePromise = onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(),
      params: {},
      data: {},
    });

    // Advance time past the 5 000 ms timeout to trigger AbortController.abort()
    await vi.advanceTimersByTimeAsync(5_000);

    const response = await responsePromise;
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      ok: false,
      error: "delivery timeout",
    });

    vi.useRealTimers();
  });

  it("clears the timeout after a successful Telegram response", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    telegramOk();

    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
