// 本番ビルドから「公開対象漏れ」の記事ページを除去する安全網。
//
// 情報源は dist/sitemap.xml の <loc> 集合のみ。README「SEO / 生成物の基本契約」
// の不変条件「sitemap.xml は公開ページのみ列挙」を根拠に、
// dist/articles/<slug>/index.html が存在するのに slug が sitemap に無いページを
// 「sitemap 非掲載」と判定する。
//
// ただし sitemap 非掲載でも、HTML が robots noindex を宣言しているページは
// 商品情報確認日まで意図的に保持されている初稿(公開対象外)なので削除しない。
// 削除対象は「非掲載かつ indexable」= 契約違反の異常ページのみ。
// （旧実装はレンダ済み HTML の meta[name=article:published] を読んでいたが、
// 実際に出力されるのは property="article:published_time" で一致せず、
// 常に何も検出しないデッドゲートだったため置き換えた。）
//
// - 記事ディレクトリが存在しない場合は何もせず成功で終了する
//   （ビルドをスタブする契約テスト環境でも安全に呼び出せる）。
// - fail-closed: 記事ページが存在するのに dist/sitemap.xml が欠損している /
//   <loc> を1件も含まない場合は、誤って全記事を消せないようエラーで失敗する。
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ARTICLE_PAGE_PATTERN = /^articles\/[^/]+\/index\.html$/;
const LOC_PATTERN = /<loc>([^<]*)<\/loc>/g;
const ARTICLE_PATHNAME_PATTERN = /^\/articles\/([^/]+)\/?$/;

const XML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function unescapeXml(value) {
  return value.replace(
    /&(?:amp|lt|gt|quot|apos);/g,
    (entity) => XML_ENTITIES[entity],
  );
}

/** sitemap.xml に列挙された記事スラグ（/articles/<slug>/）の集合。 */
export function collectSitemapArticleSlugs(distDirectory = "dist") {
  const sitemapPath = path.join(distDirectory, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(
      `prune unpublished articles: ${sitemapPath} not found; refusing to prune anything (fail-closed)`,
    );
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const slugs = new Set();
  for (const match of xml.matchAll(LOC_PATTERN)) {
    let pathname;
    try {
      pathname = new URL(unescapeXml(match[1])).pathname;
    } catch {
      continue;
    }
    const articleMatch = pathname.match(ARTICLE_PATHNAME_PATTERN);
    if (!articleMatch) continue;
    try {
      slugs.add(decodeURIComponent(articleMatch[1]));
    } catch {
      slugs.add(articleMatch[1]);
    }
  }
  if (slugs.size === 0) {
    throw new Error(
      `prune unpublished articles: ${sitemapPath} lists no article URLs; refusing to prune anything (fail-closed)`,
    );
  }
  return slugs;
}

/** HTML が robots noindex を宣言しているか（保持対象の初稿ページ）。 */
function declaresNoindex(html) {
  const content =
    html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]+)"\s+name="robots"/i)?.[1];
  return Boolean(content && content.split(",").includes("noindex"));
}

/**
 * 削除対象（公開対象漏れ）の記事ディレクトリ一覧。
 * - dist/articles が無ければ何もせず空配列を返す。
 * - 記事ページが存在するのに sitemap.xml が欠損・無内容の場合は throw する
 *   （fail-closed）。
 */
export function collectUnpublishedArticleDirectories(distDirectory = "dist") {
  const articlesRoot = path.join(distDirectory, "articles");
  if (!fs.existsSync(articlesRoot)) return [];
  const publishedSlugs = collectSitemapArticleSlugs(distDirectory);
  const targets = [];
  for (const entry of fs.readdirSync(articlesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexHtml = path.join(articlesRoot, entry.name, "index.html");
    if (!fs.existsSync(indexHtml)) continue;
    const relative = path
      .relative(distDirectory, indexHtml)
      .split(path.sep)
      .join("/");
    if (!ARTICLE_PAGE_PATTERN.test(relative)) continue;
    if (publishedSlugs.has(entry.name)) continue;
    // noindex 宣言付きの非掲載ページは意図的な保持(確認日前の初稿)なので残す。
    const html = fs.readFileSync(indexHtml, "utf8");
    if (declaresNoindex(html)) continue;
    targets.push(path.join(articlesRoot, entry.name));
  }
  return targets.sort();
}

export function pruneUnpublishedArticles({ distDirectory = "dist" } = {}) {
  const targets = collectUnpublishedArticleDirectories(distDirectory);
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
  try {
    pruneUnpublishedArticles({ distDirectory: process.argv[2] ?? "dist" });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
