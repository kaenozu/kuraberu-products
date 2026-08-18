/**
 * scripts/reupload-deploy-evidence.mjs
 *
 * 過去の本番デプロイ run の post-deploy 検証 report.json を、
 * GitHub に永続する `production-post-deploy-verification` Check Run から再構築する。
 *
 * 背景: upload-artifact@v4 の既定値（include-hidden-files: false）では
 * `.acceptance/`（隠しディレクトリ）配下の report.json がアップロード対象外になり、
 * 「No files were found ... No artifacts will be uploaded.」となって証跡が残らない。
 * 元の report.json はエフェメラル runner 上にしか無いため、唯一の永続情報源である
 * Check Run（result / attempts / resultsPerAttempt / 最終 attempt の checks を保持）から
 * 同じスキーマの report.json を再構築し、`acceptance-reports-<run-id>` artifact の
 * 再アップロードを可能にする。
 *
 * 使い方:
 *   node scripts/reupload-deploy-evidence.mjs --run-id <deploy-run-id>
 *
 * 出力: .acceptance/post-deploy-reupload-<run-id>/report.json
 * （deploy-production.yml の glob `post-deploy-<stamp>/report.json` に一致する）
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const CHECK_RUN_NAME = "production-post-deploy-verification";

/** Check Run の output.text から「- [PASS] <名前>」の行を [{ name, status }] へ。 */
export function parseChecks(text) {
  const checks = [];
  for (const match of text.matchAll(/^- \[(PASS|FAIL)\] (.+)$/gm)) {
    checks.push({ name: match[2], status: match[1] });
  }
  return checks;
}

/** Check Run の output.summary から attempts 履歴フィールドを取り出す。 */
export function parseSummary(summary) {
  const result = summary.match(/^- Result: (.+)$/m)?.[1] ?? null;
  const attemptsLine = summary.match(/^- Attempts: (\d+) \(([^)]*)\)$/m);
  const totalChecks =
    summary.match(/Final-attempt checks: (\d+) total/)?.[1] ?? null;
  const failedChecks =
    summary.match(/checks: \d+ total, (\d+) FAIL/)?.[1] ?? null;
  const expectedCommitSha =
    summary.match(/^- Expected commit: (.+)$/m)?.[1] ?? null;
  const baseUrl = summary.match(/^- Base URL: (.+)$/m)?.[1] ?? null;
  return {
    result,
    attempts: attemptsLine ? Number(attemptsLine[1]) : null,
    resultsPerAttempt: attemptsLine
      ? attemptsLine[2]
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [],
    totalChecks: totalChecks ? Number(totalChecks) : null,
    failedChecks: failedChecks ? Number(failedChecks) : null,
    expectedCommitSha,
    baseUrl,
  };
}

/**
 * Check Run 1件から、Invoke-PostDeployVerification.ps1 が書く report.json と
 * 同じスキーマ（result / generatedAt / baseUrl / expectedCommitSha / attempts /
 * resultsPerAttempt / pages / checks / secretsIncluded）のオブジェクトを組み立てる。
 * pages の bytes は Check Run から復元できないため省略し、再構築元を明示する。
 */
export function buildReport(checkRun) {
  const summary = parseSummary(checkRun.output.summary ?? "");
  const checks = parseChecks(checkRun.output.text ?? "");
  const pages = checks
    .filter((check) => /^HTTP \//.test(check.name))
    .map((check) => ({
      path: check.name.replace(/^HTTP /, ""),
      status: check.status === "PASS" ? 200 : 0,
    }));
  return {
    result: summary.result,
    generatedAt: new Date(checkRun.completed_at ?? Date.now()).toISOString(),
    baseUrl: summary.baseUrl,
    expectedCommitSha: summary.expectedCommitSha,
    attempts: summary.attempts,
    resultsPerAttempt: summary.resultsPerAttempt,
    pages,
    checks,
    secretsIncluded: false,
    reconstructed: {
      fromCheckRunId: checkRun.id,
      note: "rebuilt from the production-post-deploy-verification Check Run; the original report.json was not uploaded because upload-artifact@v4 excludes hidden .acceptance/ by default",
    },
  };
}

function ghJson(args) {
  return JSON.parse(execFileSync("gh", ["api", ...args], { encoding: "utf8" }));
}

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return process.argv[index + 1];
}

function main() {
  const runId = parseArg("--run-id");
  const repo = process.env.GITHUB_REPOSITORY ?? "kaenozu/kuraberu-products";
  const run = ghJson([`repos/${repo}/actions/runs/${runId}`]);
  const { check_runs: checkRuns } = ghJson([
    `repos/${repo}/commits/${run.head_sha}/check-runs`,
  ]);
  const candidates = checkRuns
    .filter(
      (entry) =>
        entry.name === CHECK_RUN_NAME &&
        /- Result: (PASS|BLOCKER)/.test(entry.output?.summary ?? ""),
    )
    .sort((a, b) => b.id - a.id);
  if (candidates.length === 0) {
    throw new Error(
      `run ${runId}: no ${CHECK_RUN_NAME} Check Run with a Result on commit ${run.head_sha}`,
    );
  }
  const checkRun = candidates[0];
  const report = buildReport(checkRun);
  if (report.attempts === null || report.result === null) {
    throw new Error(`run ${runId}: could not parse the Check Run output`);
  }
  const outputDir = path.join(".acceptance", `post-deploy-reupload-${runId}`);
  mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, "report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(
    `Rebuilt ${CHECK_RUN_NAME} (check run ${checkRun.id}) from deploy run ${runId}:`,
  );
  console.log(
    `  result=${report.result} attempts=${report.attempts} (${report.resultsPerAttempt.join(", ")}) checks=${report.checks.length}`,
  );
  console.log(`Report: ${reportPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main();
}
