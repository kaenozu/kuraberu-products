/**
 * scripts/generate-x-announcements.mjs
 *
 * 新規公開記事の X（Twitter）告知下書きを生成する。
 *
 * 記事メタデータ (src/content/articles.ts) を解析し、前回のデプロイ時点から
 * 追加された記事 id を差分検出して、X 投稿用の 280 文字以内の下書きを作る。
 * 投稿そのものは行わない（X API の認証情報を CI に置かない）ため、下書きを
 * レポートと標準出力へ出す。人間が確認してから投稿する前提。
 *
 * 使い方:
 *   node scripts/generate-x-announcements.mjs \
 *     --site-url https://example.com \
 *     [--previous-sha <sha>|HEAD^] [--previous-file <path>] \
 *     [--output-dir .acceptance/x-announcements-<timestamp>]
 *
 * 既定の previous は現在の git HEAD^ の src/content/articles.ts。
 * git が使えない/親コミットが無い場合は「全記事が新規」として扱う。
 * 環境変数 PUBLIC_SITE_URL を --site-url の代わりに使える。
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAX_POST_LENGTH = 280;

const ARTICLES_PATH = "src/content/articles.ts";

const ARTICLE_BLOCK =
  /export const \w+\s*=\s*defineArticleMetadata\(\{([\s\S]*?)\n\}\);/g;

function stringField(body, key) {
  const match = body.match(new RegExp(`\\b${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return match ? JSON.parse(`"${match[1]}"`) : undefined;
}

function stringArrayField(body, key) {
  const match = body.match(new RegExp(`\\b${key}:\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) {
    return [];
  }
  return [...match[1].matchAll(/"((?:[^"\\\\]|\\\\.)*)"/g)].map((entry) =>
    JSON.parse(`"${entry[1]}"`),
  );
}

/** articles.ts のソースから記事メタデータを抽出する。 */
export function parseArticles(sourceText) {
  const articles = [];
  for (const match of sourceText.matchAll(ARTICLE_BLOCK)) {
    const body = match[1];
    const id = stringField(body, "id");
    if (!id) {
      continue;
    }
    articles.push({
      id,
      title: stringField(body, "title") ?? "",
      headline: stringField(body, "headline") ?? "",
      path: stringField(body, "path") ?? "",
      publishedAt: stringField(body, "publishedAt") ?? "",
      modifiedAt: stringField(body, "modifiedAt") ?? "",
      category: stringField(body, "category") ?? "",
      tags: stringArrayField(body, "tags"),
    });
  }
  return articles;
}

/** 1記事分の X 投稿下書きを 280 文字以内で組み立てる。 */
export function buildDraft(article, siteUrl) {
  const base = String(siteUrl).replace(/\/+$/, "");
  const url = new URL(article.path, `${base}/`).toString();
  const tags = [...new Set(article.tags)]
    .slice(0, 3)
    .map((tag) => `#${tag}`)
    .join(" ");
  const prefix = "【記事公開】";
  const headline = article.headline || article.title;
  const tail = `${url}` + (tags ? `\n${tags}` : "");

  let draft = `${prefix}${headline}\n${tail}`;
  if (draft.length > MAX_POST_LENGTH) {
    const tailText = `\n${tail}`;
    const budget =
      MAX_POST_LENGTH - tailText.length - prefix.length - "…".length;
    if (budget > 0) {
      draft = `${prefix}${headline.slice(0, budget)}…${tailText}`;
    }
  }
  return draft;
}

/** 現在の記事一覧から、previous 時点に無かった記事の下書きを生成する。 */
export function generateAnnouncements(currentText, previousText, siteUrl) {
  const current = parseArticles(currentText);
  const previousIds = new Set(
    parseArticles(previousText).map((article) => article.id),
  );
  return current
    .filter((article) => !previousIds.has(article.id))
    .map((article) => ({
      article,
      draft: buildDraft(article, siteUrl),
    }));
}

function readPreviousArticles(previousSha, previousFile) {
  if (previousFile) {
    return readFileSync(previousFile, "utf8");
  }
  const sha = previousSha ?? "HEAD^";
  try {
    return execFileSync("git", ["show", `${sha}:${ARTICLES_PATH}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    // 親コミットが無い（初回デプロイ）など → 全記事を新規扱い
    return "";
  }
}

function renderReport(announcements, siteUrl, previousSha) {
  const lines = [
    "# X 告知下書き（新規公開記事）",
    "",
    `- 生成時刻 (UTC): ${new Date().toISOString()}`,
    `- サイト: ${siteUrl}`,
    `- 差分基準: ${previousSha ?? "HEAD^"}`,
    `- 新規記事: ${announcements.length} 件`,
    "",
  ];
  announcements.forEach(({ article, draft }, index) => {
    lines.push(
      `## ${index + 1}. ${article.title}`,
      "",
      "```",
      draft,
      "```",
      "",
      `（${MAX_POST_LENGTH}文字中 ${draft.length}文字）`,
      "",
    );
  });
  if (announcements.length === 0) {
    lines.push("新規公開記事はありません。", "");
  }
  lines.push(
    "## 機械可読（JSON）",
    "",
    "```json",
    JSON.stringify(
      announcements.map(({ article, draft }) => ({
        id: article.id,
        path: article.path,
        draft,
        length: draft.length,
      })),
      null,
      2,
    ),
    "```",
    "",
  );
  return lines.join("\n");
}

function parseArgs(argv) {
  const options = { siteUrl: process.env.PUBLIC_SITE_URL ?? "" };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--site-url" && value) {
      options.siteUrl = value;
      index += 1;
    } else if (flag === "--previous-sha" && value) {
      options.previousSha = value;
      index += 1;
    } else if (flag === "--previous-file" && value) {
      options.previousFile = value;
      index += 1;
    } else if (flag === "--output-dir" && value) {
      options.outputDir = value;
      index += 1;
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.siteUrl) {
    console.error("ERROR: --site-url または PUBLIC_SITE_URL が必要です");
    process.exitCode = 2;
    return;
  }
  const currentText = readFileSync(ARTICLES_PATH, "utf8");
  const previousText = readPreviousArticles(
    options.previousSha,
    options.previousFile,
  );
  const announcements = generateAnnouncements(
    currentText,
    previousText,
    options.siteUrl,
  );

  for (const { article, draft } of announcements) {
    console.log(`[X告知] ${article.title}`);
    console.log(draft);
    console.log("");
  }
  if (announcements.length === 0) {
    console.log("新規公開記事はありません（告知下書きの生成対象なし）");
  }

  const report = renderReport(
    announcements,
    options.siteUrl,
    options.previousSha,
  );
  const outputDir =
    options.outputDir ??
    `.acceptance/x-announcements-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "report.md"), report, "utf8");
  console.log(`Report: ${path.join(outputDir, "report.md")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main();
}
