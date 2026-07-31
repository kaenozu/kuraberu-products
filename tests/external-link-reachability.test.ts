import { describe, expect, it, vi } from "vitest";
import {
  classifyExternalStatus,
  decodeHtmlAttribute,
  probeExternalUrl,
} from "../scripts/check-external-link-reachability.mjs";

describe("external link reachability classification", () => {
  it("decodes generated HTML attribute entities", () => {
    expect(decodeHtmlAttribute("https://example.test/?a=1&amp;b=2")).toBe(
      "https://example.test/?a=1&b=2",
    );
  });

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
    const requests: RequestInit[] = [];
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(init ?? {});
        return new Response(null, { status: 204 });
      },
    );

    const result = await probeExternalUrl("https://example.test/resource", {
      fetchImpl: fetchMock as unknown as typeof fetch,
      timeoutMs: 100,
    });

    expect(result.outcome).toBe("reachable");
    expect(result.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requests[0]).toMatchObject({ method: "HEAD" });
  });

  it("falls back to a bounded GET when HEAD is unsupported", async () => {
    const requests: RequestInit[] = [];
    let requestCount = 0;
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(init ?? {});
        requestCount += 1;
        return requestCount === 1
          ? new Response(null, { status: 405 })
          : new Response("x", { status: 200 });
      },
    );

    const result = await probeExternalUrl("https://example.test/resource", {
      fetchImpl: fetchMock as unknown as typeof fetch,
      timeoutMs: 100,
    });

    expect(result.outcome).toBe("reachable");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requests[1]).toMatchObject({
      method: "GET",
      headers: expect.objectContaining({ range: "bytes=0-0" }),
    });
  });

  it("returns inconclusive for timeouts without throwing", async () => {
    const fetchMock = vi.fn(
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
    );

    await expect(
      probeExternalUrl("https://example.test/resource", {
        fetchImpl: fetchMock as unknown as typeof fetch,
        timeoutMs: 5,
      }),
    ).resolves.toMatchObject({ outcome: "inconclusive", reason: "timeout" });
  });
});
