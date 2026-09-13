import { describe, expect, it } from "vitest";
import {
  clampPerfHours,
  PERF_HOURS_DEFAULT,
  PERF_HOURS_MAX,
  PERF_HOURS_MIN,
} from "../functions/api/rakuten-perf";

describe("clampPerfHours", () => {
  it("returns the default for missing or non-numeric input", () => {
    expect(clampPerfHours(null)).toBe(PERF_HOURS_DEFAULT);
    expect(clampPerfHours(undefined)).toBe(PERF_HOURS_DEFAULT);
    expect(clampPerfHours("")).toBe(PERF_HOURS_DEFAULT);
    expect(clampPerfHours("abc")).toBe(PERF_HOURS_DEFAULT);
    expect(clampPerfHours("Infinity")).toBe(PERF_HOURS_DEFAULT);
  });

  it("returns the default for NaN", () => {
    expect(clampPerfHours("NaN")).toBe(PERF_HOURS_DEFAULT);
  });

  it("passes through in-range values", () => {
    expect(clampPerfHours("1")).toBe(1);
    expect(clampPerfHours("24")).toBe(24);
    expect(clampPerfHours("168")).toBe(168);
  });

  it("floors fractional input", () => {
    expect(clampPerfHours("24.9")).toBe(24);
  });

  it("clamps out-of-range values to the allowed window", () => {
    expect(clampPerfHours("0")).toBe(PERF_HOURS_MIN);
    expect(clampPerfHours("-5")).toBe(PERF_HOURS_MIN);
    expect(clampPerfHours("169")).toBe(PERF_HOURS_MAX);
    expect(clampPerfHours("1000000")).toBe(PERF_HOURS_MAX);
  });
});
