import { describe, expect, it } from "vitest";
import {
  CHECK_RUN_NAME,
  buildReport,
  parseChecks,
  parseSummary,
} from "../scripts/reupload-deploy-evidence.mjs";

const SUMMARY = `- Result: PASS
- Attempts: 1 (PASS)
- Final-attempt checks: 46 total, 0 FAIL
- Expected commit: 7f54044e44872f8874f5c4e38da7ea48003ebefc
- Base URL: https://kuraberu-products.pages.dev
- Report artifact: acceptance-reports-32090894278`;

const TEXT = `### Final-attempt checks (1 attempts: PASS)
- [PASS] HTTP /
- [PASS] Canonical /
- [PASS] HTTP /articles/pampers-newborn/
- [PASS] Deployed commit matches expected SHA
- [PASS] Rakuten CTA present`;

describe("parseChecks", () => {
  it("extracts name and status from the check-run text lines", () => {
    expect(parseChecks(TEXT)).toEqual([
      { name: "HTTP /", status: "PASS" },
      { name: "Canonical /", status: "PASS" },
      { name: "HTTP /articles/pampers-newborn/", status: "PASS" },
      { name: "Deployed commit matches expected SHA", status: "PASS" },
      { name: "Rakuten CTA present", status: "PASS" },
    ]);
  });

  it("parses FAIL status and ignores non-check lines", () => {
    expect(
      parseChecks(`### heading\n- [FAIL] HTTP /broken/\n- [PASS] HTTP /\n`),
    ).toEqual([
      { name: "HTTP /broken/", status: "FAIL" },
      { name: "HTTP /", status: "PASS" },
    ]);
  });

  it("returns an empty array for empty text", () => {
    expect(parseChecks("")).toEqual([]);
  });
});

describe("parseSummary", () => {
  it("parses result, attempts and resultsPerAttempt", () => {
    expect(parseSummary(SUMMARY)).toMatchObject({
      result: "PASS",
      attempts: 1,
      resultsPerAttempt: ["PASS"],
      totalChecks: 46,
      failedChecks: 0,
      expectedCommitSha: "7f54044e44872f8874f5c4e38da7ea48003ebefc",
      baseUrl: "https://kuraberu-products.pages.dev",
    });
  });

  it("parses a multi-attempt history with a trailing PASS", () => {
    const summary = SUMMARY.replace(
      "Attempts: 1 (PASS)",
      "Attempts: 3 (BLOCKER, BLOCKER, PASS)",
    );
    expect(parseSummary(summary)).toMatchObject({
      attempts: 3,
      resultsPerAttempt: ["BLOCKER", "BLOCKER", "PASS"],
    });
  });

  it("parses a BLOCKER result with failed checks", () => {
    const summary = SUMMARY.replace("Result: PASS", "Result: BLOCKER").replace(
      "0 FAIL",
      "2 FAIL",
    );
    expect(parseSummary(summary)).toMatchObject({
      result: "BLOCKER",
      failedChecks: 2,
    });
  });
});

describe("buildReport", () => {
  const checkRun = {
    id: 12345,
    name: CHECK_RUN_NAME,
    completed_at: "2026-08-18T02:12:00Z",
    output: { summary: SUMMARY, text: TEXT },
  };

  it("builds a schema-compatible report with attempts history", () => {
    const report = buildReport(checkRun);
    expect(report.result).toBe("PASS");
    expect(report.attempts).toBe(1);
    expect(report.resultsPerAttempt).toEqual(["PASS"]);
    expect(report.expectedCommitSha).toBe(
      "7f54044e44872f8874f5c4e38da7ea48003ebefc",
    );
    expect(report.baseUrl).toBe("https://kuraberu-products.pages.dev");
    expect(report.secretsIncluded).toBe(false);
    expect(report.checks).toHaveLength(5);
    expect(report.checks.every((check) => check.status === "PASS")).toBe(true);
    // 全チェックの中に「Deployed commit matches expected SHA」が含まれる
    expect(report.checks).toContainEqual({
      name: "Deployed commit matches expected SHA",
      status: "PASS",
    });
  });

  it("derives the pages array from the HTTP checks", () => {
    const report = buildReport(checkRun);
    expect(report.pages).toEqual([
      { path: "/", status: 200 },
      { path: "/articles/pampers-newborn/", status: 200 },
    ]);
  });

  it("marks the report as reconstructed from the check run", () => {
    const report = buildReport(checkRun);
    expect(report.reconstructed).toMatchObject({ fromCheckRunId: 12345 });
  });

  it("reflects FAIL checks in pages status", () => {
    const report = buildReport({
      ...checkRun,
      output: {
        summary: SUMMARY.replace("Result: PASS", "Result: BLOCKER"),
        text: TEXT.replace("- [PASS] HTTP /", "- [FAIL] HTTP /"),
      },
    });
    expect(report.pages).toContainEqual({ path: "/", status: 0 });
    expect(report.result).toBe("BLOCKER");
  });
});
