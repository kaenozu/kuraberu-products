import { describe, expect, it } from "vitest";

import { onRequestPost } from "../functions/api/rakuten-perf";

describe("POST /api/rakuten-perf", () => {
  it("fails closed with 405 and advertises GET only", async () => {
    const response = await onRequestPost(
      {} as Parameters<typeof onRequestPost>[0],
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "method not allowed",
    });
  });
});
