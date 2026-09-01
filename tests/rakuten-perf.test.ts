import { describe, expect, it, beforeEach } from "vitest";
import {
  RakutenPerfCollector,
  hashKeywordSync,
  flushEntriesToKV,
  computeSummary,
  PERF_KV_PREFIX,
  BUFFER_MAX_SIZE,
  resetPerfCollectorForTests,
  drainPerfEntries,
  recordPerfEntry,
  type RakutenPerfEntry,
  type PerfKV,
} from "../src/lib/rakuten-perf";

// ─── Fake KV (in-memory) ──────────────────────────────────────────────────────

function createFakeKV(): PerfKV & {
  store: Map<string, string>;
  listKeys: (prefix?: string) => string[];
} {
  const store = new Map<string, string>();
  return {
    store,
    listKeys: (prefix = "") =>
      [...store.keys()].filter((k) => k.startsWith(prefix)).sort(),
    async put(key: string, value: string) {
      store.set(key, value);
    },
  };
}

// ─── hashKeywordSync ──────────────────────────────────────────────────────────

describe("hashKeywordSync", () => {
  it("returns consistent hash for same input", () => {
    expect(hashKeywordSync("テスト商品")).toBe(hashKeywordSync("テスト商品"));
  });

  it("returns different hash for different input", () => {
    expect(hashKeywordSync("商品A")).not.toBe(hashKeywordSync("商品B"));
  });

  it("returns 16-char hex string", () => {
    expect(hashKeywordSync("test")).toMatch(/^[a-f0-9]{16}$/);
  });

  it("handles empty string", () => {
    expect(hashKeywordSync("")).toMatch(/^[a-f0-9]{16}$/);
  });
});

// ─── RakutenPerfCollector ─────────────────────────────────────────────────────

describe("RakutenPerfCollector", () => {
  let collector: RakutenPerfCollector;

  beforeEach(() => {
    collector = new RakutenPerfCollector();
  });

  it("records entries with timestamp", () => {
    collector.record({
      keywordHash: "abc123",
      durationMs: 100,
      httpStatus: 200,
      productCount: 5,
      cacheHit: false,
    });
    expect(collector.size).toBe(1);
  });

  it("drain returns entries and clears buffer", () => {
    collector.record(
      {
        keywordHash: "abc",
        durationMs: 100,
        httpStatus: 200,
        productCount: 5,
        cacheHit: false,
      },
      "2026-09-01T10:00:00.000Z",
    );
    collector.record(
      {
        keywordHash: "def",
        durationMs: 200,
        httpStatus: 200,
        productCount: 3,
        cacheHit: true,
      },
      "2026-09-01T10:00:01.000Z",
    );

    const entries = collector.drain();
    expect(entries).toHaveLength(2);
    expect(collector.size).toBe(0);
    expect(entries[0].keywordHash).toBe("abc");
    expect(entries[1].keywordHash).toBe("def");
    expect(entries[0].timestamp).toBe("2026-09-01T10:00:00.000Z");
  });

  it("drops oldest entries when buffer exceeds max", () => {
    for (let i = 0; i < BUFFER_MAX_SIZE + 10; i++) {
      collector.record(
        {
          keywordHash: `hash${i}`,
          durationMs: i,
          httpStatus: 200,
          productCount: 0,
          cacheHit: false,
        },
        `2026-09-01T00:00:${String(i).padStart(2, "0")}Z`,
      );
    }
    expect(collector.size).toBe(BUFFER_MAX_SIZE);
    const entries = collector.drain();
    expect(entries[0].keywordHash).toBe("hash10");
  });
});

// ─── Module-level collector (drainPerfEntries / recordPerfEntry / reset) ────

describe("module-level collector", () => {
  beforeEach(() => {
    resetPerfCollectorForTests();
  });

  it("drainPerfEntries returns entries recorded via recordPerfEntry", () => {
    recordPerfEntry({
      keywordHash: "mod1",
      durationMs: 50,
      httpStatus: 200,
      productCount: 3,
      cacheHit: false,
    });
    recordPerfEntry({
      keywordHash: "mod2",
      durationMs: 0,
      httpStatus: 200,
      productCount: 0,
      cacheHit: true,
    });

    const entries = drainPerfEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].keywordHash).toBe("mod1");
    expect(entries[1].cacheHit).toBe(true);
  });

  it("drainPerfEntries clears the collector", () => {
    recordPerfEntry({
      keywordHash: "x",
      durationMs: 10,
      httpStatus: 200,
      productCount: 0,
      cacheHit: false,
    });
    drainPerfEntries();
    expect(drainPerfEntries()).toHaveLength(0);
  });
});

// ─── flushEntriesToKV ─────────────────────────────────────────────────────────

describe("flushEntriesToKV", () => {
  it("writes entries to KV with correct keys", async () => {
    const kv = createFakeKV();
    const entries: RakutenPerfEntry[] = [
      {
        timestamp: "2026-09-01T10:00:00.000Z",
        keywordHash: "abc",
        durationMs: 150,
        httpStatus: 200,
        productCount: 5,
        cacheHit: false,
      },
      {
        timestamp: "2026-09-01T10:00:01.000Z",
        keywordHash: "def",
        durationMs: 200,
        httpStatus: 200,
        productCount: 3,
        cacheHit: true,
      },
    ];

    const saved = await flushEntriesToKV(kv, entries);
    expect(saved).toBe(2);

    const keys = kv.listKeys(PERF_KV_PREFIX);
    expect(keys).toHaveLength(2);
    expect(keys).toContain(`${PERF_KV_PREFIX}2026-09-01T10:00:00.000Z`);
    expect(keys).toContain(`${PERF_KV_PREFIX}2026-09-01T10:00:01.000Z`);

    const stored = JSON.parse(kv.store.get(keys[0])!);
    expect(stored.keywordHash).toBe("abc");
    expect(stored.durationMs).toBe(150);
  });

  it("returns 0 for empty entries", async () => {
    const kv = createFakeKV();
    expect(await flushEntriesToKV(kv, [])).toBe(0);
  });

  it("does not throw if KV put fails", async () => {
    const kv = createFakeKV();
    kv.put = async () => {
      throw new Error("KV unavailable");
    };
    const entries: RakutenPerfEntry[] = [
      {
        timestamp: "2026-09-01T10:00:00.000Z",
        keywordHash: "x",
        durationMs: 10,
        httpStatus: 200,
        productCount: 0,
        cacheHit: false,
      },
    ];
    const saved = await flushEntriesToKV(kv, entries);
    expect(saved).toBe(0);
  });
});

// ─── Full pipeline: Collector → drain → flush → KV → read → summary ──────────

describe("full pipeline", () => {
  it("collects entries, flushes to KV, reads back, and computes summary", async () => {
    const kv = createFakeKV();
    const collector = new RakutenPerfCollector();

    collector.record(
      {
        keywordHash: "a1b2c3",
        durationMs: 120,
        httpStatus: 200,
        productCount: 10,
        cacheHit: false,
      },
      "2026-09-01T10:00:00.000Z",
    );
    collector.record(
      {
        keywordHash: "d4e5f6",
        durationMs: 350,
        httpStatus: 200,
        productCount: 5,
        cacheHit: false,
      },
      "2026-09-01T10:00:01.000Z",
    );
    collector.record(
      {
        keywordHash: "a1b2c3",
        durationMs: 0,
        httpStatus: 200,
        productCount: 0,
        cacheHit: true,
      },
      "2026-09-01T10:00:02.000Z",
    );

    const entries = collector.drain();
    expect(entries).toHaveLength(3);

    await flushEntriesToKV(kv, entries);

    const keys = kv.listKeys(PERF_KV_PREFIX);
    expect(keys).toHaveLength(3);
    const readBack: RakutenPerfEntry[] = keys.map((k) =>
      JSON.parse(kv.store.get(k)!),
    );

    const summary = computeSummary(readBack);
    expect(summary.totalRequests).toBe(3);
    expect(summary.cacheHits).toBe(1);
    expect(summary.cacheHitRate).toBeCloseTo(1 / 3);
    expect(summary.successCount).toBe(3);
    expect(summary.avgDurationMs).toBe(235);
    expect(summary.p50DurationMs).toBe(120);
    expect(summary.p95DurationMs).toBe(350);
    expect(summary.avgProductCount).toBe(5);
  });

  it("handles errors and flushes successfully", async () => {
    const kv = createFakeKV();
    const collector = new RakutenPerfCollector();

    collector.record(
      {
        keywordHash: "err1",
        durationMs: 5000,
        httpStatus: 0,
        productCount: 0,
        cacheHit: false,
        error: "timeout",
      },
      "2026-09-01T10:00:00.000Z",
    );
    collector.record(
      {
        keywordHash: "err2",
        durationMs: 200,
        httpStatus: 500,
        productCount: 0,
        cacheHit: false,
        error: "HTTP 500",
      },
      "2026-09-01T10:00:01.000Z",
    );
    collector.record(
      {
        keywordHash: "ok1",
        durationMs: 150,
        httpStatus: 200,
        productCount: 8,
        cacheHit: false,
      },
      "2026-09-01T10:00:02.000Z",
    );

    await flushEntriesToKV(kv, collector.drain());

    const keys = kv.listKeys(PERF_KV_PREFIX);
    const readBack: RakutenPerfEntry[] = keys.map((k) =>
      JSON.parse(kv.store.get(k)!),
    );

    const summary = computeSummary(readBack);
    expect(summary.totalRequests).toBe(3);
    expect(summary.errorCount).toBe(2);
    expect(summary.timeoutCount).toBe(1);
    expect(summary.successCount).toBe(1);
    expect(summary.errorRate).toBeCloseTo(2 / 3);
  });

  it("multiple flush cycles accumulate in KV", async () => {
    const kv = createFakeKV();

    const c1 = new RakutenPerfCollector();
    c1.record(
      {
        keywordHash: "r1",
        durationMs: 100,
        httpStatus: 200,
        productCount: 5,
        cacheHit: false,
      },
      "2026-09-01T10:00:00.000Z",
    );
    await flushEntriesToKV(kv, c1.drain());

    const c2 = new RakutenPerfCollector();
    c2.record(
      {
        keywordHash: "r2",
        durationMs: 200,
        httpStatus: 200,
        productCount: 3,
        cacheHit: false,
      },
      "2026-09-01T10:01:00.000Z",
    );
    await flushEntriesToKV(kv, c2.drain());

    const keys = kv.listKeys(PERF_KV_PREFIX);
    expect(keys).toHaveLength(2);

    const readBack: RakutenPerfEntry[] = keys.map((k) =>
      JSON.parse(kv.store.get(k)!),
    );
    const summary = computeSummary(readBack);
    expect(summary.totalRequests).toBe(2);
    expect(summary.avgDurationMs).toBe(150);
  });
});

// ─── Integration: recordPerfEntry → drain → flush → KV → summary (end-to-end) ─

describe("integration: recordPerfEntry → drain → flush → KV → summary", () => {
  beforeEach(() => {
    resetPerfCollectorForTests();
  });

  it("success + cache hit: records, drains, flushes, reads back summary", () => {
    // Simulate what rakuten.ts does after a successful API call
    recordPerfEntry(
      {
        keywordHash: hashKeywordSync("テスト商品"),
        durationMs: 150,
        httpStatus: 200,
        productCount: 5,
        cacheHit: false,
      },
      "2026-09-01T10:00:00.000Z",
    );
    // Simulate a cache hit
    recordPerfEntry(
      {
        keywordHash: hashKeywordSync("テスト商品"),
        durationMs: 0,
        httpStatus: 200,
        productCount: 0,
        cacheHit: true,
      },
      "2026-09-01T10:00:01.000Z",
    );

    // Drain (simulates Worker POST /api/rakuten-perf)
    const entries = drainPerfEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].httpStatus).toBe(200);
    expect(entries[0].cacheHit).toBe(false);
    expect(entries[1].cacheHit).toBe(true);

    // Flush to KV
    const kv = createFakeKV();
    return flushEntriesToKV(kv, entries).then((saved) => {
      expect(saved).toBe(2);

      // Read back (simulates GET /api/rakuten-perf)
      const keys = kv.listKeys(PERF_KV_PREFIX);
      expect(keys).toHaveLength(2);
      const readBack: RakutenPerfEntry[] = keys.map((k) =>
        JSON.parse(kv.store.get(k)!),
      );

      const summary = computeSummary(readBack);
      expect(summary.totalRequests).toBe(2);
      expect(summary.successCount).toBe(2);
      expect(summary.cacheHits).toBe(1);
      expect(summary.cacheHitRate).toBe(0.5);
      expect(summary.avgDurationMs).toBe(150);
      expect(summary.p50DurationMs).toBe(150);

      // Collector empty after drain
      expect(drainPerfEntries()).toHaveLength(0);
    });
  });

  it("error recording: timeout + HTTP error, then drain+flush+summary", () => {
    recordPerfEntry(
      {
        keywordHash: hashKeywordSync("bad-query"),
        durationMs: 5000,
        httpStatus: 0,
        productCount: 0,
        cacheHit: false,
        error: "Request timeout",
      },
      "2026-09-01T10:00:00.000Z",
    );
    recordPerfEntry(
      {
        keywordHash: hashKeywordSync("another-query"),
        durationMs: 200,
        httpStatus: 500,
        productCount: 0,
        cacheHit: false,
        error: "HTTP 500",
      },
      "2026-09-01T10:00:01.000Z",
    );

    const entries = drainPerfEntries();
    expect(entries).toHaveLength(2);

    const kv = createFakeKV();
    return flushEntriesToKV(kv, entries).then(() => {
      const keys = kv.listKeys(PERF_KV_PREFIX);
      const readBack: RakutenPerfEntry[] = keys.map((k) =>
        JSON.parse(kv.store.get(k)!),
      );
      const summary = computeSummary(readBack);
      expect(summary.totalRequests).toBe(2);
      expect(summary.errorCount).toBe(2);
      expect(summary.timeoutCount).toBe(1);
      expect(summary.successCount).toBe(0);
    });
  });

  it("multiple requests accumulate across drain+flush cycles", () => {
    const kv = createFakeKV();

    // All 3 entries with distinct timestamps
    recordPerfEntry(
      {
        keywordHash: "req1",
        durationMs: 100,
        httpStatus: 200,
        productCount: 3,
        cacheHit: false,
      },
      "2026-09-01T10:00:00.000Z",
    );
    recordPerfEntry(
      {
        keywordHash: "req2",
        durationMs: 250,
        httpStatus: 200,
        productCount: 7,
        cacheHit: false,
      },
      "2026-09-01T10:00:01.000Z",
    );
    recordPerfEntry(
      {
        keywordHash: "req1",
        durationMs: 0,
        httpStatus: 200,
        productCount: 0,
        cacheHit: true,
      },
      "2026-09-01T10:00:02.000Z",
    );

    // Single drain captures all 3 entries
    const entries = drainPerfEntries();
    expect(entries).toHaveLength(3);

    return flushEntriesToKV(kv, entries).then(() => {
      const keys = kv.listKeys(PERF_KV_PREFIX);
      expect(keys).toHaveLength(3);

      const readBack: RakutenPerfEntry[] = keys.map((k) =>
        JSON.parse(kv.store.get(k)!),
      );
      const summary = computeSummary(readBack);
      expect(summary.totalRequests).toBe(3);
      expect(summary.cacheHits).toBe(1);
      expect(summary.successCount).toBe(3);
      expect(summary.avgDurationMs).toBe(175); // (100+250)/2, cache excluded
    });
  });
});

// ─── computeSummary edge cases ────────────────────────────────────────────────

describe("computeSummary", () => {
  it("returns empty summary for no entries", () => {
    const s = computeSummary([]);
    expect(s.totalRequests).toBe(0);
    expect(s.period.from).toBe("");
  });

  it("computes percentiles for 100 entries", () => {
    const entries: RakutenPerfEntry[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: `2026-09-01T00:00:${String(i).padStart(2, "0")}Z`,
      keywordHash: `h${i}`,
      durationMs: i + 1,
      httpStatus: 200,
      productCount: 0,
      cacheHit: false,
    }));
    const s = computeSummary(entries);
    expect(s.p50DurationMs).toBe(50);
    expect(s.p95DurationMs).toBe(95);
    expect(s.p99DurationMs).toBe(99);
    expect(s.minDurationMs).toBe(1);
    expect(s.maxDurationMs).toBe(100);
  });

  it("excludes cache hits from duration stats", () => {
    const entries: RakutenPerfEntry[] = [
      {
        timestamp: "a",
        keywordHash: "h1",
        durationMs: 0,
        httpStatus: 200,
        productCount: 0,
        cacheHit: true,
      },
      {
        timestamp: "b",
        keywordHash: "h2",
        durationMs: 200,
        httpStatus: 200,
        productCount: 5,
        cacheHit: false,
      },
    ];
    const s = computeSummary(entries);
    expect(s.cacheHits).toBe(1);
    expect(s.cacheHitRate).toBe(0.5);
    expect(s.avgDurationMs).toBe(200);
  });

  it("counts timeouts from error messages", () => {
    const entries: RakutenPerfEntry[] = [
      {
        timestamp: "a",
        keywordHash: "h1",
        durationMs: 5000,
        httpStatus: 0,
        productCount: 0,
        cacheHit: false,
        error: "Request timeout",
      },
      {
        timestamp: "b",
        keywordHash: "h2",
        durationMs: 200,
        httpStatus: 500,
        productCount: 0,
        cacheHit: false,
        error: "HTTP 500",
      },
    ];
    const s = computeSummary(entries);
    expect(s.timeoutCount).toBe(1);
    expect(s.errorCount).toBe(2);
  });
});
