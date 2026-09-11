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
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAX_POST_LENGTH = 280;

// 記事メタデータの情報源は 2 種類: 互換 shim（articles.ts・現在は純粋な再エクスポート）
// と、分割後の個別記事ファイル（articles/<slug>.ts）。shim 単独で解析すると
// defineArticleMetadata ブロックが 0 件になり、全デプロイで「新規記事なし」と
// 誤判定する（分割以降の実際のバグ）。そのため常時両方を読む。
export const ARTICLES_PATH = "src/content/articles.ts";
export const ARTICLES_DIR = "src/content/articles";
export const ARTICLES_EXCLUDE = new Set([
  "index.ts",
  "commercial.ts",
  "types.ts",
]);

// export文がprettierで行分割されても（`defineArticleMetadata(` と `{` の
// 間に改行が入っても）記事ブロックを検出できる。#786 では長いexport名が
// 折り返され、単一行前提の正規表現から漏れてspec coverageが失敗した。
const ARTICLE_BLOCK =
  /export const \w+\s*=\s*defineArticleMetadata\(\s*\{([\s\S]*?)\n\}\s*\);/g;

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
  // shim と個別ファイルの両方を解析するため、同一 id の二重宣言が混入しても
  // 最初の 1 件だけを採用する（二重告知の防止）。
  const current = parseArticles(currentText).filter(
    (article, index, all) =>
      all.findIndex((entry) => entry.id === article.id) === index,
  );
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

/** 個別記事ディレクトリの .ts ソースを連結する（除外リスト・ソート済みで決定的）。 */
export function collectArticleSources(
  dir = ARTICLES_DIR,
  exclude = ARTICLES_EXCLUDE,
) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts") && !exclude.has(file))
    .sort()
    .map((file) => readFileSync(path.join(dir, file), "utf8"))
    .join("\n");
}

/** 現ツリーの記事ソース（shim + 個別ファイル）。 */
export function readCurrentArticles() {
  return `${readFileSync(ARTICLES_PATH, "utf8")}\n${collectArticleSources()}`;
}

/** previous ツリーの記事ソース。git が使えない場合は ""（全記事を新規扱い）。 */
export function readPreviousArticles(previousSha, previousFile) {
  if (previousFile) {
    return readFileSync(previousFile, "utf8");
  }
  const sha = previousSha ?? "HEAD^";
  try {
    // ファイル一覧は現在ツリー（readdirSync）から取り、各ファイルを
    // git show <sha>:<path> で previous SHA から読む。git ls-tree は
    // CI ランナー上で失敗するケースがあり、一覧取得を git に頼ると
    // 全記事が「新規」扱いになるため、実績のある git show のみに統一する。
    // previous 以降に追加されたファイルは show が失敗するので個別にスキップ
    // （previous で削除済みの記事は現在ツリーに無いため列挙されないが、
    // 差分検出には影響しない）。
    const names = readdirSync(ARTICLES_DIR)
      .filter((name) => name.endsWith(".ts") && !ARTICLES_EXCLUDE.has(name))
      .sort();
    // 各ファイルを個別に git show すると記事数に比例してプロセス起動が増え、
    // Windows のフル履歴 checkout ではテストのタイムアウトを招く。batch API
    // で一度に読み、未存在ファイルは従来どおりスキップする。
    const paths = [
      ARTICLES_PATH,
      ...names.map((name) => `${ARTICLES_DIR}/${name}`),
    ];
    const output = execFileSync("git", ["cat-file", "--batch"], {
      input: `${paths.map((file) => `${sha}:${file}`).join("\\n")}\\n`,
      encoding: null,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const contents = new Map();
    let offset = 0;
    for (const file of paths) {
      const headerEnd = output.indexOf(0x0a, offset);
      if (headerEnd < 0) break;
      const header = output.subarray(offset, headerEnd).toString("utf8");
      offset = headerEnd + 1;
      const [, type, sizeText] = header.split(" ");
      const size = Number(sizeText);
      if (type === "missing") continue;
      contents.set(
        file,
        output.subarray(offset, offset + size).toString("utf8"),
      );
      offset += size + 1;
    }
    const shimText = contents.get(ARTICLES_PATH);
    if (!shimText) return "";
    const parts = names
      .map((name) => contents.get(`${ARTICLES_DIR}/${name}`))
      .filter(Boolean);
    return `${shimText}\n${parts.join("\n")}`;
  } catch (error) {
    // 親コミットが無い（初回デプロイ）など → 全記事を新規扱い
    console.error(
      `[previous-articles] falling back to "all new": ${error?.message ?? error}`,
    );
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
  const currentText = readCurrentArticles();
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
