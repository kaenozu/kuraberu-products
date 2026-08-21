// 本番ビルドから「下書き」記事（article:published = false）のページを除去する。
// レンダリング済み dist の meta タグ（BaseLayout が記事メタデータから出力する
// article:published）を唯一の情報源とし、articles.ts のTSを直接参照しない。
// - preview / development: 下書きページはレビュー用に残す（noindex は env 側で保証）
// - production: 下書きページのディレクトリを dist から削除する
// sitemap は src/pages/sitemap.xml.ts 側で公開済み記事のみ列挙するため、
// ここで sitemap を書き換える必要はない。
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ARTICLE_PAGE_PATTERN = /^articles\/[^/]+\/index\.html$/;
const PUBLISHED_META_PATTERN =
  /name="article:published" content="(true|false)"/;

export function collectUnpublishedArticleDirectories(distDirectory = "dist") {
  const targets = [];
  const articlesRoot = path.join(distDirectory, "articles");
  if (!fs.existsSync(articlesRoot)) return targets;
  for (const entry of fs.readdirSync(articlesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexHtml = path.join(articlesRoot, entry.name, "index.html");
    if (!fs.existsSync(indexHtml)) continue;
    const relative = path
      .relative(distDirectory, indexHtml)
      .split(path.sep)
      .join("/");
    if (!ARTICLE_PAGE_PATTERN.test(relative)) continue;
    const html = fs.readFileSync(indexHtml, "utf8");
    const match = html.match(PUBLISHED_META_PATTERN);
    if (match?.[1] === "false") {
      targets.push(path.join(articlesRoot, entry.name));
    }
  }
  return targets.sort();
}

export function pruneUnpublishedArticles({
  distDirectory = "dist",
  deploymentEnv = process.env.DEPLOYMENT_ENV ?? "preview",
} = {}) {
  const targets = collectUnpublishedArticleDirectories(distDirectory);
  if (deploymentEnv !== "production") {
    console.log(`prune unpublished articles: skipped (${deploymentEnv})`);
    return { pruned: [] };
  }
  for (const directory of targets) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  console.log(
    `prune unpublished articles: removed ${targets.length} draft page(s)`,
  );
  return { pruned: targets };
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  pruneUnpublishedArticles();
}
