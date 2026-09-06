import { describe, expect, it } from "vitest";

import { onRequestPost } from "../functions/api/contact";

const SITE_URL = "https://kuraberu-products.pages.dev";

describe("POST /api/contact Origin fail-closed (#551)", () => {
  it("rejects a request with no Origin header before side effects", async () => {
    const request = new Request(`${SITE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email: "test@example.com",
        message: "お問い合わせ本文",
      }),
    });

    const response = await onRequestPost({
      request,
      env: { PUBLIC_SITE_URL: SITE_URL } as Env,
      params: {},
      data: {},
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "invalid origin",
    });
  });
});
