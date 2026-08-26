import { describe, expect, it } from "vitest";
import {
  CHECK_RUN_NAME,
  ISSUE_TITLE_PREFIX,
  buildAttemptsLine,
  buildIssueBody,
  buildReportChecklist,
  buildStepLogExcerpt,
} from "../scripts/create-deploy-evidence-issue.mjs";

const EXPECTED_SHA = "7f54044e44872f8874f5c4e38da7ea48003ebefc";

const REPORT = {
  result: "PASS",
  generatedAt: "2026-08-18T02:12:00Z",
  attempts: 1,
  resultsPerAttempt: ["PASS"],
  expectedCommitSha: EXPECTED_SHA,
  baseUrl: "https://kuraberu-products.pages.dev",
  secretsIncluded: false,
  pages: [{ path: "/", status: 200 }],
  checks: [
    { name: "HTTP /", status: "PASS" },
    { name: "Deployed commit matches expected SHA", status: "PASS" },
    { name: "Rakuten CTA present", status: "PASS" },
  ],
};

const CHECK_RUN = {
  id: 95572909781,
  name: CHECK_RUN_NAME,
  conclusion: "success",
  created_at: "2026-08-18T02:12:00Z",
  output: {
    summary: "- Result: PASS\n- Attempts: 1 (PASS)",
  },
};

describe("buildStepLogExcerpt", () => {
  it("reproduces a single-attempt PASS log", () => {
    expect(buildStepLogExcerpt(REPORT)).toBe("Attempt 1/4: PASS\nResult: PASS");
  });

  it("reproduces multi-attempt history with retry waits", () => {
    const report = {
      ...REPORT,
      attempts: 3,
      resultsPerAttempt: ["BLOCKER", "BLOCKER", "PASS"],
    };
    expect(buildStepLogExcerpt(report)).toBe(
      [
        "Attempt 1/4: BLOCKER",
        "Waiting 15s before re-verifying (CDN edge propagation)...",
        "Attempt 2/4: BLOCKER",
        "Waiting 15s before re-verifying (CDN edge propagation)...",
        "Attempt 3/4: PASS",
        "Result: PASS",
      ].join("\n"),
    );
  });
});

describe("buildAttemptsLine", () => {
  it("renders the step-summary style attempts line", () => {
    expect(buildAttemptsLine(REPORT)).toBe("- Attempts: 1 (PASS)");
  });

  it("renders multi-attempt values", () => {
    expect(
      buildAttemptsLine({
        ...REPORT,
        attempts: 3,
        resultsPerAttempt: ["BLOCKER", "BLOCKER", "PASS"],
      }),
    ).toBe("- Attempts: 3 (BLOCKER, BLOCKER, PASS)");
  });
});

describe("buildReportChecklist", () => {
  it("checks every item on a healthy PASS report", () => {
    const checklist = buildReportChecklist(REPORT, EXPECTED_SHA);
    expect(checklist).toContain("- [x] `result` が記録されている（**PASS**）");
    expect(checklist).toContain("- [x] `attempts` が整数かつ 1〜4 で");
    expect(checklist).toContain(
      "- [x] `resultsPerAttempt` が PASS/BLOCKER のみ",
    );
    expect(checklist).toContain(
      "- [x] 最終 attempt の全 `checks` が PASS（**3 件 / FAIL 0**",
    );
    expect(checklist).toContain(
      "- [x] `expectedCommitSha` が expected SHA と一致",
    );
    expect(checklist).toContain("- [x] `secretsIncluded` が false");
    expect(checklist).not.toContain("- [ ]");
  });

  it("flags a BLOCKER report with failed checks", () => {
    const report = {
      ...REPORT,
      result: "BLOCKER",
      attempts: 2,
      resultsPerAttempt: ["BLOCKER", "BOGUS"],
      expectedCommitSha: "0000000000000000000000000000000000000000",
      checks: [
        { name: "HTTP /", status: "FAIL" },
        { name: "Deployed commit matches expected SHA", status: "FAIL" },
      ],
    };
    const checklist = buildReportChecklist(report, EXPECTED_SHA);
    expect(checklist).toContain(
      "- [x] `result` が記録されている（**BLOCKER**）",
    );
    expect(checklist).toContain(
      "- [ ] `resultsPerAttempt` が PASS/BLOCKER のみ",
    );
    expect(checklist).toContain("- [ ] 最終 attempt の全 `checks` が PASS");
    expect(checklist).toContain(
      "- [ ] `expectedCommitSha` が expected SHA と一致",
    );
  });

  it("flags out-of-range attempts", () => {
    const report = { ...REPORT, attempts: 5, resultsPerAttempt: ["PASS"] };
    expect(buildReportChecklist(report, EXPECTED_SHA)).toContain(
      "- [ ] `attempts` が整数かつ 1〜4 で",
    );
  });
});

describe("buildIssueBody", () => {
  it("pre-fills every template field from report + check run", () => {
    const body = buildIssueBody({
      report: REPORT,
      checkRun: CHECK_RUN,
      runId: "32090894278",
      expectedSha: EXPECTED_SHA,
      deployedAt: "2026-08-18T02:10:00Z",
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(body).toContain("`32090894278`");
    expect(body).toContain(`\`${EXPECTED_SHA}\``);
    expect(body).toContain("`acceptance-reports-32090894278`");
    expect(body).toContain("Attempt 1/4: PASS");
    expect(body).toContain("- Attempts: 1 (PASS)");
    expect(body).toContain("- [x] `result` が記録されている（**PASS**）");
    expect(body).toContain('"conclusion": "success"');
    expect(body).toContain("95572909781");
    expect(body).toContain("検証者: （未記入）");
    expect(body).toContain("検証日: （未記入）");
    expect(body).toContain("判定: **（確認後に PASS / HOLD を記入）**");
  });

  it("keeps the issue open for human review (no auto-close instructions)", () => {
    const body = buildIssueBody({
      report: REPORT,
      checkRun: CHECK_RUN,
      runId: "32090894278",
      expectedSha: EXPECTED_SHA,
      deployedAt: "2026-08-18T02:10:00Z",
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(body).toContain(
      "検証者・検証日を記入し、内容を確認してから Close してください。",
    );
    expect(body).toMatch(new RegExp(`^## 使い方`));
  });

  it("uses report.generatedAt when deployedAt is missing", () => {
    const body = buildIssueBody({
      report: REPORT,
      checkRun: null,
      runId: "32090894278",
      expectedSha: EXPECTED_SHA,
      deployedAt: null,
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(body).toContain("2026-08-18");
    expect(body).toContain('"conclusion": null');
  });

  it("leaves the BLOCKER rollback checkbox unchecked on PASS", () => {
    const body = buildIssueBody({
      report: REPORT,
      checkRun: CHECK_RUN,
      runId: "32090894278",
      expectedSha: EXPECTED_SHA,
      deployedAt: "2026-08-18T02:10:00Z",
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(body).toContain(
      "- [ ] BLOCKER だった場合、Rollback 手順を適用・記録した",
    );
  });

  it("checks the rollback item on a BLOCKER report", () => {
    const report = {
      ...REPORT,
      result: "BLOCKER",
      checks: [{ name: "HTTP /", status: "FAIL" }],
    };
    const body = buildIssueBody({
      report,
      checkRun: { ...CHECK_RUN, conclusion: "failure" },
      runId: "32090894278",
      expectedSha: EXPECTED_SHA,
      deployedAt: "2026-08-18T02:10:00Z",
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(body).toContain(
      "- [x] BLOCKER だった場合、Rollback 手順を適用・記録した",
    );
  });

  it("includes a UNKNOWN warning when report.json is missing", () => {
    const body = buildIssueBody({
      report: {
        result: "UNKNOWN",
        attempts: 0,
        resultsPerAttempt: [],
        expectedCommitSha: EXPECTED_SHA,
        baseUrl: null,
        checks: [],
        secretsIncluded: false,
        generatedAt: null,
      },
      checkRun: null,
      runId: "32090894999",
      expectedSha: EXPECTED_SHA,
      deployedAt: "2026-08-21T03:00:00Z",
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(body).toContain("report.json が見つかりませんでした");
    expect(body).toContain("Result: UNKNOWN");
    expect(body).toContain("Attempts: 0");
  });
});

describe("constants", () => {
  it("uses the check-run name and title prefix the workflow relies on", () => {
    expect(CHECK_RUN_NAME).toBe("production-post-deploy-verification");
    expect(ISSUE_TITLE_PREFIX).toBe("[deploy-verification]");
  });
});
