/**
 * scripts/create-deploy-evidence-issue.mjs
 *
 * 本番デプロイ直後に、デプロイ検証証跡 issue（.github/ISSUE_TEMPLATE/
 * production-deploy-verification.yml の各フィールドを埋めた状態）を自動起票する。
 *
 * 情報源は 2 つ:
 *   1. 実行 job 内の report.json（.acceptance/post-deploy-<stamp>/report.json）— result /
 *      attempts / resultsPerAttempt / expectedCommitSha / baseUrl / checks。
 *   2. `production-post-deploy-verification` Check Run（同じ job の直前ステップが
 *      作成済み）— conclusion と output.summary。
 *
 * 冪等: 同じ run ID の `[deploy-verification]` issue が既にあれば何もしない
 * （デプロイの再実行・リトライで重複起票しない）。
 * 検証者・検証日の記入と Close は人間が行う（自動 Close しない）。
 *
 * 使い方:
 *   node scripts/create-deploy-evidence-issue.mjs \
 *     --report .acceptance/post-deploy-<stamp>/report.json \
 *     --run-id <run-id> --expected-sha <sha> --site-url <url> [--dry-run]
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const CHECK_RUN_NAME = "production-post-deploy-verification";
export const ISSUE_TITLE_PREFIX = "[deploy-verification]";
export const MAX_ATTEMPTS = 4;
const RETRY_DELAY_SECONDS = 15;

/** report.resultsPerAttempt から Verify ステップのログ抜粋を再現する。 */
export function buildStepLogExcerpt(report, maxAttempts = MAX_ATTEMPTS) {
  const lines = [];
  report.resultsPerAttempt.forEach((result, index) => {
    lines.push(`Attempt ${index + 1}/${maxAttempts}: ${result}`);
    if (result === "BLOCKER" && index < report.resultsPerAttempt.length - 1) {
      lines.push(
        `Waiting ${RETRY_DELAY_SECONDS}s before re-verifying (CDN edge propagation)...`,
      );
    }
  });
  lines.push(`Result: ${report.result}`);
  return lines.join("\n");
}

/** step summary の Attempts 行（report.md と同形式）。 */
export function buildAttemptsLine(report) {
  return `- Attempts: ${report.attempts} (${report.resultsPerAttempt.join(", ")})`;
}

function checkItem(checked, text) {
  return `${checked ? "- [x]" : "- [ ]"} ${text}`;
}

/** report.json フィールド確認チェックリストを実値に基づいて生成する。 */
export function buildReportChecklist(report, expectedSha) {
  const checks = report.checks ?? [];
  const failed = checks.filter((check) => check.status === "FAIL").length;
  const allPass = checks.length > 0 && failed === 0;
  const hasDeployedShaCheck = checks.some(
    (check) =>
      check.name === "Deployed commit matches expected SHA" &&
      check.status === "PASS",
  );
  const attemptsValid =
    Number.isInteger(report.attempts) &&
    report.attempts >= 1 &&
    report.attempts <= MAX_ATTEMPTS &&
    report.attempts === (report.resultsPerAttempt ?? []).length;
  const resultsValid =
    (report.resultsPerAttempt ?? []).length > 0 &&
    report.resultsPerAttempt.every(
      (entry) => entry === "PASS" || entry === "BLOCKER",
    ) &&
    report.resultsPerAttempt.at(-1) === "PASS";
  return [
    checkItem(
      report.result === "PASS" || report.result === "BLOCKER",
      `\`result\` が記録されている（**${report.result ?? "不明"}**）`,
    ),
    checkItem(
      attemptsValid,
      `\`attempts\` が整数かつ 1〜4 で、\`resultsPerAttempt\` の長さと一致（\`attempts=${report.attempts}\` / \`resultsPerAttempt=${JSON.stringify(report.resultsPerAttempt)}\`）`,
    ),
    checkItem(
      resultsValid,
      `\`resultsPerAttempt\` が PASS/BLOCKER のみ（PASS デプロイでは末尾が PASS）`,
    ),
    checkItem(
      allPass && hasDeployedShaCheck,
      `最終 attempt の全 \`checks\` が PASS（**${checks.length} 件 / FAIL ${failed}**、\`Deployed commit matches expected SHA\` 含む）`,
    ),
    checkItem(
      report.expectedCommitSha === expectedSha,
      `\`expectedCommitSha\` が expected SHA と一致（\`${report.expectedCommitSha}\`）`,
    ),
    checkItem(report.secretsIncluded === false, "`secretsIncluded` が false"),
  ].join("\n");
}

/** テンプレートに沿った issue body を組み立てる。 */
export function buildIssueBody({
  report,
  checkRun,
  runId,
  expectedSha,
  deployedAt,
  siteUrl,
}) {
  const artifactName = `acceptance-reports-${runId}`;
  const checkRunSummary = checkRun?.output?.summary ?? null;
  const checkRunJson = JSON.stringify(
    {
      id: checkRun?.id ?? null,
      conclusion: checkRun?.conclusion ?? null,
      created_at: checkRun?.created_at ?? null,
      summary: checkRunSummary,
    },
    null,
    2,
  );
  const allPass =
    report.result === "PASS" &&
    (report.checks ?? []).length > 0 &&
    report.checks.every((check) => check.status === "PASS");
  const lines = [
    ...(report.result === "UNKNOWN"
      ? [
          "> **⚠️ report.json が見つかりませんでした。** run log を確認してください。",
          "",
        ]
      : []),
    "## 使い方",
    "",
    "- この issue は本番デプロイ workflow が自動起票したものです。",
    "  各フィールドは実行 job 内の report.json と Check Run から埋めています。",
    "- **検証者・検証日を記入し、内容を確認してから Close してください。**",
    "- 手順の詳細は `docs/production-operations.md` の **Section 4「Public verification」/「Confirm the attempts history after a production run」** を参照。",
    "",
    "---",
    "",
    "### 実行 run ID",
    "",
    `\`${runId}\``,
    "",
    "### expected SHA（ディスパッチ時に指定した 40 桁）",
    "",
    `\`${expectedSha}\``,
    "",
    "### deployed SHA（実際にデプロイされた commit）",
    "",
    `\`${report.expectedCommitSha ?? "(report.json に無し)"}\``,
    "",
    "### デプロイ日時（UTC）",
    "",
    `\`${deployedAt ?? report.generatedAt ?? "(不明)"}\``,
    "",
    "### 対象 URL",
    "",
    `\`${siteUrl}\``,
    "",
    "### artifact 名",
    "",
    `\`${artifactName}\``,
    "",
    "### 「Verify public deployment」ステップのログ抜粋",
    "",
    "```text",
    buildStepLogExcerpt(report),
    "```",
    "",
    "### step summary の Attempts 行",
    "",
    "```text",
    buildAttemptsLine(report),
    "```",
    "",
    "### report.json フィールド確認（最終 attempt）",
    "",
    buildReportChecklist(report, expectedSha),
    "",
    "### Check Run 監査クエリの出力",
    "",
    "```json",
    checkRunJson,
    "```",
    "",
    "### 付随確認",
    "",
    "- [ ] artifact をダウンロードして report.json を確認した（`gh run download <run-id> -n " +
      "acceptance-reports-<run-id>`）",
    checkItem(
      !allPass,
      "BLOCKER だった場合、Rollback 手順を適用・記録した（該当なしの場合は不要）",
    ),
    "",
    "### 検証者・検証日",
    "",
    "- 検証者: （未記入）",
    "- 検証日: （未記入）",
    "- 判定: **（確認後に PASS / HOLD を記入）**",
    "",
  ];
  return lines.join("\n");
}

function ghJson(args) {
  return JSON.parse(execFileSync("gh", ["api", ...args], { encoding: "utf8" }));
}

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

function main() {
  const ri = process.argv.indexOf("--report");
  const reportPath =
    ri !== -1 && process.argv[ri + 1] ? process.argv[ri + 1] : null;
  const runId = parseArg("--run-id");
  const expectedSha = parseArg("--expected-sha");
  const siteUrl = parseArg("--site-url");
  const dryRun = process.argv.includes("--dry-run");
  const repo = process.env.GITHUB_REPOSITORY ?? "kaenozu/kuraberu-products";

  const report = reportPath
    ? JSON.parse(readFileSync(reportPath, "utf8"))
    : {
        result: "UNKNOWN",
        attempts: 0,
        resultsPerAttempt: [],
        expectedCommitSha: expectedSha,
        baseUrl: null,
        checks: [],
        secretsIncluded: false,
        generatedAt: null,
      };

  const run = ghJson([`repos/${repo}/actions/runs/${runId}`]);
  const deployedAt = run.created_at ?? null;

  const { check_runs: checkRuns } = ghJson([
    `repos/${repo}/commits/${expectedSha}/check-runs`,
  ]);
  const checkRun =
    checkRuns
      .filter(
        (entry) =>
          entry.name === CHECK_RUN_NAME &&
          /- Result: (PASS|BLOCKER)/.test(entry.output?.summary ?? ""),
      )
      .sort((a, b) => b.id - a.id)[0] ?? null;

  const body = buildIssueBody({
    report,
    checkRun,
    runId,
    expectedSha,
    deployedAt,
    siteUrl,
  });
  const date = String(deployedAt ?? report.generatedAt ?? "").slice(0, 10);
  const title = `${ISSUE_TITLE_PREFIX} ${runId} (${date})`;

  if (dryRun) {
    console.log(`[dry-run] title: ${title}`);
    console.log(body);
    return;
  }

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
    console.log(
      `Evidence issue #${existing} already exists; skipping creation.`,
    );
    return;
  }

  const tempDir = mkdtempSync(path.join(os.tmpdir(), "kuraberu-evidence-"));
  const bodyPath = path.join(tempDir, "issue-body.md");
  writeFileSync(bodyPath, body, "utf8");
  try {
    const created = ghText([
      "issue",
      "create",
      "--repo",
      repo,
      "--title",
      title,
      "--body-file",
      bodyPath,
    ]);
    console.log(`Created evidence issue: ${created}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main();
}
