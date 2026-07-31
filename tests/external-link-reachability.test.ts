import { describe, expect, it, vi } from "vitest";
import {
  classifyExternalStatus,
  probeExternalUrl,
} from "../scripts/check-external-link-reachability.mjs";

describe("external link reachability classification", () => {
  it("treats success and redirects as reachable", () => {
    expect(classifyExternalStatus(200)).toBe("reachable");
    expect(classifyExternalStatus(301)).toBe("reachable");
  });

  it("treats confirmed missing resources as broken", () => {
    expect(classifyExternalStatus(404)).toBe("broken");
    expect(classifyExternalStatus(410)).toBe("broken");
  });

  it("keeps blocking and transient responses inconclusive", () => {
    expect(classifyExternalStatus(403)).toBe("inconclusive");
    expect(classifyExternalStatus(429)).toBe("inconclusive");
    expect(classifyExternalStatus(503)).toBe("inconclusive");
  });
});

describe("external link probe", () => {
  it("uses HEAD when the provider supports it", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(null, { status: 204 }),
    ) as unknown as typeof fetch;

    const result = await probeExternalUrl("https://example.test/resource", {
      fetchImpl,
      timeoutMs: 100,
    });

    expect(result.outcome).toBe("reachable");
    expect(result.status).toBe(204);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD" });
  });

  it("falls back to a bounded GET when HEAD is unsupported", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response("x", { status: 200 })) as unknown as typeof fetch;

    const result = await probeExternalUrl("https://example.test/resource", {
      fetchImpl,
      timeoutMs: 100,
    });

    expect(result.outcome).toBe("reachable");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1]?.[1]).toMatchObject({
      method: "GET",
      headers: expect.objectContaining({ range: "bytes=0-0" }),
    });
  });

  it("returns inconclusive for timeouts without throwing", async () => {
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              const error = new Error("aborted");
              error.name = "AbortError";
              reject(error);
            },
            { once: true },
          );
        }),
    ) as unknown as typeof fetch;

    await expect(
      probeExternalUrl("https://example.test/resource", {
        fetchImpl,
        timeoutMs: 5,
      }),
    ).resolves.toMatchObject({ outcome: "inconclusive", reason: "timeout" });
  });
});
