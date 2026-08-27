import { describe, expect, it, vi } from "vitest";
import {
  classifyExternalStatus,
  decodeHtmlAttribute,
  INCONCLUSIVE_FAIL_THRESHOLD,
  INCONCLUSIVE_WARN_THRESHOLD,
  loadLinkState,
  probeExternalUrl,
  updateLinkEntry,
} from "../scripts/check-external-link-reachability.mjs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

describe("external link state tracking (P2 consecutive failures)", () => {
  it("loadLinkState returns empty state when file is missing", () => {
    const directory = mkdtempSync(join(tmpdir(), "link-state-"));
    try {
      const state = loadLinkState(join(directory, "nonexistent.json"));
      expect(state).toEqual({ urls: {} });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("loadLinkState loads valid state from disk", () => {
    const directory = mkdtempSync(join(tmpdir(), "link-state-valid-"));
    try {
      const statePath = join(directory, "state.json");
      writeFileSync(
        statePath,
        JSON.stringify({
          urls: {
            "https://example.com": {
              consecutiveInconclusive: 2,
              lastOutcome: "inconclusive",
            },
          },
        }),
      );
      const state = loadLinkState(statePath);
      expect(state.urls["https://example.com"].consecutiveInconclusive).toBe(2);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("updateLinkEntry resets counter on reachable", () => {
    const entry = { consecutiveInconclusive: 5, lastOutcome: "inconclusive" };
    const updated = updateLinkEntry(entry, "reachable", undefined);
    expect(updated.consecutiveInconclusive).toBe(0);
    expect(updated.lastOutcome).toBe("reachable");
  });

  it("updateLinkEntry increments counter on inconclusive", () => {
    const entry = { consecutiveInconclusive: 2, lastOutcome: "inconclusive" };
    const updated = updateLinkEntry(entry, "inconclusive", "timeout");
    expect(updated.consecutiveInconclusive).toBe(3);
    expect(updated.lastReason).toBe("timeout");
  });

  it("updateLinkEntry starts at 1 for first inconclusive", () => {
    const updated = updateLinkEntry(undefined, "inconclusive", "403");
    expect(updated.consecutiveInconclusive).toBe(1);
    expect(updated.lastReason).toBe("403");
  });

  it("updateLinkEntry resets counter on broken (404/410)", () => {
    const entry = { consecutiveInconclusive: 5, lastOutcome: "inconclusive" };
    const updated = updateLinkEntry(entry, "broken", undefined);
    expect(updated.consecutiveInconclusive).toBe(0);
    expect(updated.lastOutcome).toBe("broken");
  });

  it("thresholds are configured correctly", () => {
    expect(INCONCLUSIVE_WARN_THRESHOLD).toBe(3);
    expect(INCONCLUSIVE_FAIL_THRESHOLD).toBe(7);
    expect(INCONCLUSIVE_FAIL_THRESHOLD).toBeGreaterThan(
      INCONCLUSIVE_WARN_THRESHOLD,
    );
  });

  it("updateLinkEntry removes lastReason when outcome is not inconclusive", () => {
    const entry = {
      consecutiveInconclusive: 3,
      lastOutcome: "inconclusive",
      lastReason: "timeout",
    };
    const updated = updateLinkEntry(entry, "reachable", undefined);
    expect(updated.lastReason).toBeUndefined();
  });
});
