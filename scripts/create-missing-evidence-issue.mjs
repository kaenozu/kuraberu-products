/**
 * scripts/create-missing-evidence-issue.mjs
 *
 * report.json が存在しないデプロイ run に対して、監査証跡として
 * プレースホルダー evidence issue を自動起票する。
 *
 * issue は OPEN のまま人間が確認・Close する契約（#361）。
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

export function buildMissingReportBody({ runId, expectedSha, siteUrl }) {
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
    "### Action required",
    "",
    "- [ ] Check the deploy run log for the failing step",
    "- [ ] Confirm whether the deploy actually succeeded",
    "- [ ] Re-run verification manually if needed",
    "- [ ] Close this issue only after evidence is attached",
  ].join("\n");
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

function main() {
  const runId = parseArg("--run-id");
  const expectedSha = parseArg("--expected-sha");
  const siteUrl = parseArg("--site-url");
  const dryRun = process.argv.includes("--dry-run");
  const repo = process.env.GITHUB_REPOSITORY ?? "kaenozu/kuraberu-products";

  const date = new Date().toISOString().slice(0, 10);
  const title = `${ISSUE_TITLE_PREFIX} ${runId} (${date}) — NO REPORT`;

  // 幂等: 既に同 run ID の issue があればスキップ。
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

  const body = buildMissingReportBody({ runId, expectedSha, siteUrl });

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
