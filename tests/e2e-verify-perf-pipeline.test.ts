/**
 * E2E verification: exercises the REAL RakutenPerfCollector → drain → flush → KV → summary pipeline.
 * This is NOT a unit test — it drives the actual code paths a Worker would use.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordPerfEntry,
  drainPerfEntries,
  resetPerfCollectorForTests,
  hashKeywordSync,
  computeSummary,
  flushEntriesToKV,
  PERF_KV_PREFIX,
  type RakutenPerfEntry,
} from "../src/lib/rakuten-perf";

// Realistic FakeKV that actually stores and retrieves
function createRealKV() {
  const store = new Map<string, string>();
  return {
    async put(key: string, value: string) { store.set(key, value); },
    async get(key: string) { return store.get(key) ?? null; },
    async list(opts?: { prefix?: string }) {
      const prefix = opts?.prefix ?? "";
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys };
    },
    _store: store,
  };
}

describe("E2E: Perf collector full pipeline", () => {
  beforeEach(() => {
    resetPerfCollectorForTests();
  });

  it("record 3 entries → drain → flush to real KV → read back → compute summary", async () => {
    // Step 1: Record 3 entries with distinct timestamps
    recordPerfEntry(
      { keywordHash: "hash_a", durationMs: 100, httpStatus: 200, productCount: 5, cacheHit: false },
      "2026-09-01T10:00:00.000Z",
    );
    recordPerfEntry(
      { keywordHash: "hash_b", durationMs: 500, httpStatus: 200, productCount: 3, cacheHit: false },
      "2026-09-01T10:01:00.000Z",
    );
    recordPerfEntry(
      { keywordHash: "hash_c", durationMs: 50, httpStatus: 500, productCount: 0, cacheHit: false, error: "HTTP 500" },
      "2026-09-01T10:02:00.000Z",
    );

    // Step 2: Drain — must return all 3, collector must be empty after
    const entries = drainPerfEntries();
    expect(entries).toHaveLength(3);
    const afterDrain = drainPerfEntries();
    expect(afterDrain).toHaveLength(0);

    // Step 3: Flush to real KV
    const kv = createRealKV();
    const saved = await flushEntriesToKV(kv, entries);
    expect(saved).toBe(3);

    // Step 4: Read back from KV
    const list = await kv.list({ prefix: PERF_KV_PREFIX });
    expect(list.keys).toHaveLength(3);

    // Step 5: Each KV value must be parseable as a RakutenPerfEntry
    const readBack: RakutenPerfEntry[] = [];
    for (const key of list.keys) {
      const raw = await kv.get(key.name);
      expect(raw).toBeTruthy();
      readBack.push(JSON.parse(raw as string));
    }
    expect(readBack).toHaveLength(3);

    // Step 6: Compute summary from read-back entries
    const summary = computeSummary(readBack);
    expect(summary.totalRequests).toBe(3);
    expect(summary.successCount).toBe(2);
    expect(summary.errorCount).toBe(1);
    expect(summary.cacheHits).toBe(0);
    expect(summary.cacheHitRate).toBe(0);
    expect(summary.errorRate).toBeCloseTo(1 / 3, 4);
    expect(summary.avgDurationMs).toBe(217); // Math.round(650/3) = 217
    expect(summary.p50DurationMs).toBeGreaterThanOrEqual(50);
    expect(summary.p95DurationMs).toBeGreaterThanOrEqual(100);
    expect(summary.minDurationMs).toBe(50);
    expect(summary.maxDurationMs).toBe(500);
  });

  it("cache hit entries are tracked correctly through pipeline", async () => {
    recordPerfEntry(
      { keywordHash: "cached1", durationMs: 0, httpStatus: 200, productCount: 5, cacheHit: true },
      "2026-09-01T11:00:00.000Z",
    );
    recordPerfEntry(
      { keywordHash: "real1", durationMs: 200, httpStatus: 200, productCount: 3, cacheHit: false },
      "2026-09-01T11:01:00.000Z",
    );

    const entries = drainPerfEntries();
    const kv = createRealKV();
    await flushEntriesToKV(kv, entries);

    const list = await kv.list({ prefix: PERF_KV_PREFIX });
    const readBack: RakutenPerfEntry[] = [];
    for (const key of list.keys) {
      readBack.push(JSON.parse((await kv.get(key.name)) as string));
    }

    const summary = computeSummary(readBack);
    expect(summary.cacheHits).toBe(1);
    expect(summary.cacheHitRate).toBeCloseTo(0.5, 4);
    expect(summary.totalRequests).toBe(2);
  });

  it("hashKeywordSync is deterministic and produces 16-char hex", () => {
    const h1 = hashKeywordSync("ベビーボトル");
    const h2 = hashKeywordSync("ベビーボトル");
    const h3 = hashKeywordSync("おむつ");

    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{16}$/);
    expect(h3).toMatch(/^[0-9a-f]{16}$/);
    expect(h1).not.toBe(h3);
  });

  it("flushEntriesToKV is resilient to individual put failures", async () => {
    recordPerfEntry(
      { keywordHash: "a", durationMs: 100, httpStatus: 200, productCount: 1, cacheHit: false },
      "2026-09-01T12:00:00.000Z",
    );
    recordPerfEntry(
      { keywordHash: "b", durationMs: 200, httpStatus: 200, productCount: 2, cacheHit: false },
      "2026-09-01T12:00:01.000Z",
    );

    const entries = drainPerfEntries();

    // KV that fails on second put
    let putCount = 0;
    const flakyKV = {
      async put(key: string, value: string) {
        putCount++;
        if (putCount === 2) throw new Error("KV put failed");
      },
      async list() { return { keys: [] }; },
      async get() { return null; },
    };

    // Should NOT throw — fail-safe design
    const saved = await flushEntriesToKV(flakyKV, entries);
    expect(saved).toBe(1); // only 1 succeeded
  });

  it("empty drain returns empty array, flush returns 0", async () => {
    const entries = drainPerfEntries();
    expect(entries).toHaveLength(0);

    const kv = createRealKV();
    const saved = await flushEntriesToKV(kv, []);
    expect(saved).toBe(0);
  });
});
