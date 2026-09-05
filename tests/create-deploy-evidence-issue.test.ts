import { describe, expect, it } from "vitest";
import {
  CHECK_RUN_NAME,
  ISSUE_TITLE_PREFIX,
  buildAttemptsLine,
  buildAutoCloseComment,
  buildIssueBody,
  buildReportChecklist,
  buildStepLogExcerpt,
  isAutoCloseEnabled,
  isFullyPassed,
} from "../scripts/create-deploy-evidence-issue.mjs";
import {
  buildFailedStepsSection,
  buildIssueCreateArgs,
  buildMissingReportBody,
  collectFailedSteps,
} from "../scripts/create-missing-evidence-issue.mjs";

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

describe("missing deploy evidence fallback", () => {
  it("does not require repository-specific labels", () => {
    const args = buildIssueCreateArgs({
      repo: "kaenozu/kuraberu-products",
      title: "[deploy-verification] 123 — NO REPORT",
      bodyPath: "/tmp/body.md",
    });
    expect(args).not.toContain("--label");
    expect(args).not.toContain("deploy-evidence,blocker");
    expect(
      buildMissingReportBody({
        runId: "123",
        expectedSha: "a".repeat(40),
        siteUrl: "https://kuraberu-products.pages.dev",
      }),
    ).toContain("Evidence issue");
  });
});

describe("NO REPORT run self-diagnostics (issue #611/#612/#613 class)", () => {
  it("collects failed steps from the run's jobs", () => {
    const jobs = [
      {
        name: "deploy",
        conclusion: "failure",
        steps: [
          { name: "Validate dispatch contract", conclusion: "success" },
          { name: "Build and deploy exact HEAD", conclusion: "failure" },
        ],
      },
    ];
    expect(collectFailedSteps(jobs)).toEqual([
      {
        job: "deploy",
        step: "Build and deploy exact HEAD",
        startedAt: null,
        completedAt: null,
      },
    ]);
  });

  it("falls back to job-level failure when no step failed", () => {
    const jobs = [{ name: "deploy", conclusion: "startup_failure", steps: [] }];
    expect(collectFailedSteps(jobs)).toEqual([
      {
        job: "deploy",
        step: null,
        startedAt: null,
        completedAt: null,
      },
    ]);
  });

  it("ignores successful and skipped jobs", () => {
    const jobs = [
      {
        name: "deploy",
        conclusion: "success",
        steps: [{ name: "Build", conclusion: "success" }],
      },
      { name: "unused", conclusion: "skipped", steps: [] },
    ];
    expect(collectFailedSteps(jobs)).toEqual([]);
  });

  it("omits the diagnostics section when diagnostics are unavailable", () => {
    const body = buildMissingReportBody({
      runId: "123",
      expectedSha: "a".repeat(40),
      siteUrl: "https://kuraberu-products.pages.dev",
      diagnosticsSection: null,
    });
    expect(body).not.toContain("Run diagnostics");
    expect(body).toContain("Run ID: `123`");
  });

  it("embeds failed steps and the run URL so no log re-derivation is needed", () => {
    const section = buildFailedStepsSection({
      runId: "33719544484",
      runUrl:
        "https://github.com/kaenozu/kuraberu-products/actions/runs/33719544484",
      runConclusion: "failure",
      failedSteps: [{ job: "deploy", step: "Build and deploy exact HEAD" }],
    });
    expect(section).toContain("Run conclusion: `failure`");
    expect(section).toContain("actions/runs/33719544484");
    expect(section).toContain("`deploy` → `Build and deploy exact HEAD`");
    expect(section).toContain("did **not** update production");
  });

  it("warns when the run failed but no failed step was reported", () => {
    const section = buildFailedStepsSection({
      runId: "1",
      runUrl: null,
      runConclusion: "failure",
      failedSteps: [],
    });
    expect(section).toContain("inspect the run log directly");
  });

  it("renders nothing without diagnostics input", () => {
    expect(buildFailedStepsSection(null)).toBeNull();
  });
});

describe("isFullyPassed (auto-close gate)", () => {
  it("is true for a fully-passed verification", () => {
    expect(isFullyPassed(REPORT)).toBe(true);
  });

  it("is false for BLOCKER", () => {
    expect(isFullyPassed({ ...REPORT, result: "BLOCKER" })).toBe(false);
  });

  it("is false when any check fails", () => {
    const report = {
      ...REPORT,
      checks: [
        { name: "HTTP /", status: "PASS" },
        { name: "x", status: "FAIL" },
      ],
    };
    expect(isFullyPassed(report)).toBe(false);
  });

  it("is false with no checks at all", () => {
    expect(isFullyPassed({ ...REPORT, checks: [] })).toBe(false);
    expect(isFullyPassed({ result: "PASS" })).toBe(false);
  });

  it("is false for null/undefined input", () => {
    expect(isFullyPassed(null)).toBe(false);
    expect(isFullyPassed(undefined)).toBe(false);
  });
});

describe("isAutoCloseEnabled (flag parsing)", () => {
  it("accepts only the string true (case/whitespace insensitive)", () => {
    expect(isAutoCloseEnabled("true")).toBe(true);
    expect(isAutoCloseEnabled("TRUE")).toBe(true);
    expect(isAutoCloseEnabled(" true ")).toBe(true);
  });

  it("treats unset, empty, and any other value as disabled (default off)", () => {
    expect(isAutoCloseEnabled(undefined)).toBe(false);
    expect(isAutoCloseEnabled("")).toBe(false);
    expect(isAutoCloseEnabled("false")).toBe(false);
    expect(isAutoCloseEnabled("1")).toBe(false);
    expect(isAutoCloseEnabled("yes")).toBe(false);
  });
});

describe("AUTO_CLOSE_PASS policy (opt-in auto-close of fully-passed issues)", () => {
  const AUTO_CLOSED_BODY_ARGS = {
    report: REPORT,
    checkRun: CHECK_RUN,
    runId: "32090894278",
    expectedSha: EXPECTED_SHA,
    deployedAt: "2026-08-18T02:10:00Z",
    siteUrl: "https://kuraberu-products.pages.dev",
  } as const;

  it("keeps the manual sign-off instruction by default (flag off)", () => {
    const body = buildIssueBody(AUTO_CLOSED_BODY_ARGS);
    expect(body).toContain(
      "検証者・検証日を記入し、内容を確認してから Close してください。",
    );
    expect(body).not.toContain("自動 Close されます");
  });

  it("swaps in the auto-close instruction when autoClosed is set on a PASS report", () => {
    const body = buildIssueBody({
      ...AUTO_CLOSED_BODY_ARGS,
      autoClosed: true,
    });
    expect(body).toContain(
      "この issue は report.json が完全 PASS だったため自動 Close されます（AUTO_CLOSE_PASS）",
    );
    expect(body).toContain("Reopen して検証者・検証日を記入");
    expect(body).not.toContain(
      "検証者・検証日を記入し、内容を確認してから Close してください。",
    );
  });

  it("never shows the auto-close instruction for BLOCKER reports", () => {
    const body = buildIssueBody({
      ...AUTO_CLOSED_BODY_ARGS,
      report: {
        ...REPORT,
        result: "BLOCKER",
        attempts: 2,
        resultsPerAttempt: ["BLOCKER", "PASS"],
        checks: [{ name: "HTTP /", status: "PASS" }],
      },
      autoClosed: true,
    });
    expect(body).toContain(
      "検証者・検証日を記入し、内容を確認してから Close してください。",
    );
    expect(body).not.toContain("自動 Close されます");
  });

  it("builds a close comment with the verification counts and reopen hint", () => {
    const comment = buildAutoCloseComment({
      report: REPORT,
      runId: "32090894278",
      siteUrl: "https://kuraberu-products.pages.dev",
    });
    expect(comment).toContain("自動 Close（AUTO_CLOSE_PASS ポリシー）");
    expect(comment).toContain("result: **PASS**");
    expect(comment).toContain("attempts: **1**");
    expect(comment).toContain("checks: **3 件 / FAIL 0**");
    expect(comment).toContain("`32090894278`");
    expect(comment).toContain("`acceptance-reports-32090894278`");
    expect(comment).toContain("`AUTO_CLOSE_PASS=true`");
    expect(comment).toContain(
      "BLOCKER・report.json なしの run は従来どおり人間確認のため OPEN のまま",
    );
    expect(comment).toContain("Reopen して");
  });

  it("keeps the verifier fields in the body for auditability after auto-close", () => {
    const body = buildIssueBody({
      ...AUTO_CLOSED_BODY_ARGS,
      autoClosed: true,
    });
    expect(body).toContain("検証者: （未記入）");
    expect(body).toContain("検証日: （未記入）");
  });
});
