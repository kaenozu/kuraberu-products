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
  return {
    TELEGRAM_BOT_TOKEN: "123:token",
    TELEGRAM_CHAT_ID: "-100123",
    PUBLIC_SITE_URL: SITE_URL,
    ...(limiter ? { CONTACT_RATE_LIMITER: limiter } : {}),
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

  it("falls back to the first X-Forwarded-For entry", () => {
    const request = new Request("https://example.com/", {
      headers: { "X-Forwarded-For": "198.51.100.7, 10.0.0.1" },
    });
    expect(clientIp(request)).toBe("198.51.100.7");
  });

  it("uses a stable fallback when no IP header exists", () => {
    expect(clientIp(new Request("https://example.com/"))).toBe("unknown");
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
    await expect(
      enforceContactRateLimit(limiter, "203.0.113.5"),
    ).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 37,
    });
  });

  it("falls back to the configured window when reset time is absent", async () => {
    const { limiter } = makeLimiter({ success: false });
    await expect(
      enforceContactRateLimit(limiter, "203.0.113.5"),
    ).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("allows when the binding is not configured", async () => {
    await expect(
      enforceContactRateLimit(undefined, "203.0.113.5"),
    ).resolves.toEqual({ allowed: true });
  });

  it("allows when the limiter throws", async () => {
    const { limiter } = makeLimiter({ error: true });
    await expect(
      enforceContactRateLimit(limiter, "203.0.113.5"),
    ).resolves.toEqual({
      allowed: true,
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

  it("still accepts requests when the rate limiter binding is absent", async () => {
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

  it("still accepts requests when the rate limiter fails", async () => {
    const telegram = telegramOk();
    const { limiter } = makeLimiter({ error: true });
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: baseEnv(limiter),
      params: {},
      data: {},
    });

    expect(response.status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(1);
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
    const response = await onRequestPost({
      request: postRequest(validForm()),
      env: { PUBLIC_SITE_URL: SITE_URL },
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
});
