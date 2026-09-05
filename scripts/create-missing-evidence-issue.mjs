/**
 * scripts/create-missing-evidence-issue.mjs
 *
 * report.json が存在しないデプロイ run に対して、監査証跡として
 * プレースホルダー evidence issue を自動起票する。
 *
 * issue は OPEN のまま人間が確認・Close する契約（#361）。
 *
 * 2026-09-03 の #611/#612/#613 では「なぜ report.json が無いのか」を
 * 人間が生ログから再調査する羽目になったため、起票時に Actions API で
 * run / jobs / steps を自己診断し、失敗ステップと run log URL を
 * issue 本文に焼き込む。診断 API 呼び出しに失敗しても起票は阻害しない。
 *
 * 使い方:
 *   node scripts/create-missing-evidence-issue.mjs \
 *     --run-id <run-id> --expected-sha <sha> --site-url <url> [--dry-run]
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const ISSUE_TITLE_PREFIX = "[deploy-verification]";

function ghText(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return process.argv[index + 1];
}

/** job/step 一覧から「失敗した箇所」を抽出する（純粋関数・テスト対象）。 */
export function collectFailedSteps(jobs) {
  const failed = [];
  for (const job of jobs ?? []) {
    const stepFailures = (job.steps ?? [])
      .filter((step) => step.conclusion === "failure")
      .map((step) => ({
        job: job.name,
        step: step.name,
        startedAt: step.started_at ?? null,
        completedAt: step.completed_at ?? null,
      }));
    if (stepFailures.length > 0) {
      failed.push(...stepFailures);
    } else if (
      job.conclusion &&
      job.conclusion !== "success" &&
      job.conclusion !== "skipped"
    ) {
      // ステップ単位の失敗が無いのに job が失敗（startup_failure 等）。
      failed.push({
        job: job.name,
        step: null,
        startedAt: job.started_at ?? null,
        completedAt: job.completed_at ?? null,
      });
    }
  }
  return failed;
}

/**
 * 自己診断: run 情報と job/step 一覧を Actions API から取得する。
 * 失敗ステップと run log URL を返す。API 失敗は呼び出し元で握りつぶす。
 */
export function fetchRunDiagnostics({ repo, runId }) {
  const run = JSON.parse(
    execFileSync("gh", ["api", `repos/${repo}/actions/runs/${runId}`], {
      encoding: "utf8",
    }),
  );
  const { jobs } = JSON.parse(
    execFileSync(
      "gh",
      ["api", `repos/${repo}/actions/runs/${runId}/jobs?per_page=100`],
      { encoding: "utf8" },
    ),
  );
  return {
    runId,
    runUrl: run.html_url ?? null,
    runConclusion: run.conclusion ?? null,
    failedSteps: collectFailedSteps(jobs),
  };
}

/** 自己診断結果を issue 本文用の markdown セクションに整形する。 */
export function buildFailedStepsSection(diagnostics) {
  if (!diagnostics) {
    return null;
  }
  const lines = ["### Run diagnostics (auto-generated)", ""];
  if (diagnostics.runConclusion) {
    lines.push(`- Run conclusion: \`${diagnostics.runConclusion}\``);
  }
  if (diagnostics.runUrl) {
    lines.push(`- Run log: <${diagnostics.runUrl}>`);
  }
  const failed = diagnostics.failedSteps ?? [];
  if (failed.length > 0) {
    lines.push("", "**Failed steps:**", "");
    for (const entry of failed) {
      lines.push(
        entry.step
          ? `- \`${entry.job}\` → \`${entry.step}\``
          : `- \`${entry.job}\` (job-level failure)`,
      );
    }
    lines.push(
      "",
      "The deploy step did not complete, so this run almost certainly did **not** update production.",
    );
  } else if (diagnostics.runConclusion === "failure") {
    lines.push(
      "",
      "The run concluded `failure` but no failed step was reported — inspect the run log directly.",
    );
  }
  return lines.join("\n");
}

export function buildIssueCreateArgs({ repo, title, bodyPath }) {
  return [
    "issue",
    "create",
    "--repo",
    repo,
    "--title",
    title,
    "--body-file",
    bodyPath,
  ];
}

export function buildMissingReportBody({
  runId,
  expectedSha,
  siteUrl,
  diagnosticsSection,
}) {
  return [
    "## ⚠️ Evidence issue (auto-generated — no report.json found)",
    "",
    "This deploy run did not produce a `post-deploy report.json`.",
    "The verification evidence is **missing**. This is a BLOCKER under #361.",
    "",
    "### Deploy details",
    "",
    `- Run ID: \`${runId}\``,
    `- Expected SHA: \`${expectedSha}\``,
    `- Site: \`${siteUrl}\``,
    "",
    ...(diagnosticsSection ? [diagnosticsSection, ""] : []),
    "### Action required",
    "",
    "- [ ] Check the deploy run log for the failing step",
    "- [ ] Confirm whether the deploy actually succeeded",
    "- [ ] Re-run verification manually if needed",
    "- [ ] Close this issue only after evidence is attached",
  ].join("\n");
}

function main() {
  const runId = parseArg("--run-id");
  const expectedSha = parseArg("--expected-sha");
  const siteUrl = parseArg("--site-url");
  const dryRun = process.argv.includes("--dry-run");
  const repo = process.env.GITHUB_REPOSITORY ?? "kaenozu/kuraberu-products";

  // 幂等: 既に同 run ID の issue があればスキップ（診断 API 呼び出し前）。
  const existing = ghText([
    "issue",
    "list",
    "--repo",
    repo,
    "--state",
    "all",
    "--search",
    `in:title ${ISSUE_TITLE_PREFIX} ${runId}`,
    "--json",
    "number",
    "--jq",
    ".[0].number // empty",
  ]);
  if (existing) {
    console.log(`Evidence issue #${existing} already exists; skipping.`);
    return;
  }

  // 自己診断はベストエフォート。API 失敗でもプレースホルダー起票は
  // 阻害しない（監査証跡が最優先）。
  let diagnostics = null;
  try {
    diagnostics = fetchRunDiagnostics({ repo, runId });
  } catch (error) {
    console.warn(
      `Run diagnostics unavailable (${error.message}); creating placeholder without them.`,
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  const title = `${ISSUE_TITLE_PREFIX} ${runId} (${date}) — NO REPORT`;

  const body = buildMissingReportBody({
    runId,
    expectedSha,
    siteUrl,
    diagnosticsSection: buildFailedStepsSection(diagnostics),
  });

  if (dryRun) {
    console.log(`[dry-run] title: ${title}`);
    console.log(body);
    return;
  }

  const tempDir = mkdtempSync(path.join(os.tmpdir(), "kuraberu-evidence-"));
  const bodyPath = path.join(tempDir, "issue-body.md");
  writeFileSync(bodyPath, body, "utf8");
  try {
    const created = ghText(buildIssueCreateArgs({ repo, title, bodyPath }));
    console.log(`Created placeholder evidence issue: ${created}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main();
}
