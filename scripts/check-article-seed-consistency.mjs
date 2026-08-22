#!/usr/bin/env node
/**
 * check-article-seed-consistency.mjs
 *
 * 記事 seed（メタデータ）・ページ・404 スタブの三つ組の整合を検証するゲート。
 *
 * 対応関係の実測（2026-08 時点）:
 * - seed は 2 系統ある。モノリス src/content/articles.ts と、ディレクトリ版
 *   src/content/articles/*.ts（commercial.ts の commercialArticleSeeds を含む）。
 *   `import ... from ".../content/articles"` はファイルがディレクトリより優先
 *   されるため実行時にはモノリスが解決されるが、両系統を union して検査する。
 * - slug は seed の `path: "/articles/<slug>/"`（または commercial seed の
 *   `id:`）から導出され、seed ファイル名とは一致しない（例: cradle.ts →
 *   babybjorn-cradle）。したがってファイル名突合では検出できない。
 * - 公開扱いは publicArticleMetadata と同じ規約: 手動 seed は無条件に公開、
 *   commercial seed は productInfoCheckedAt を持つものだけ公開。
 * - functions/articles/<slug>.ts は未公開記事への明示 404 スタブ。Cloudflare
 *   Pages は静的アセットを Functions より優先するため、スタブは対応ページが
 *   存在しない場合にのみ意味を持つ。
 *
 * 検証ルール（双方向）:
 *   A. 公開 seed → src/pages/articles/<slug>/index.astro が存在すること
 *      （「メタデータだけ載ってページが 404」を防ぐ）
 *   B. スタブ → 対応 seed がどこかの系統に存在すること（seed 消滅後の残置検出）
 *   C. スタブ → 対応ページが存在「しない」こと（静的アセットが優先されるため
 *      ページがあるスタブは死にコード。削除忘れを検出）
 *   D. ページ → 対応 seed が存在こと（メタデータ削除後の孤児ページ検出）
 *
 * 使い方: node scripts/check-article-seed-consistency.mjs
 * 不整合がある場合は具体的なファイル名を列挙し exit code 1。
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// メッセージ・ソース表記はOS非依存の POSIX 形式で統一する。
const SEED_MONOLITH = "src/content/articles.ts";
const SEED_DIR = "src/content/articles";
const PAGES_DIR = "src/pages/articles";
const STUBS_DIR = "functions/articles";

/** テストフィクスチャ等の実ファイルアクセス用に OS パスへ変換する。 */
function toOsPath(root, ...parts) {
  return path.join(root, ...parts.join("/").split("/"));
}

// defineArticleMetadata の path リテラルから slug を抜く。
// createCommercialArticle の `path: \`/articles/${seed.id}/\`` のような
// テンプレートリテラル（${} を含む）は具体 slug でないため除外する。
const ARTICLE_PATH_PATTERN = /path:\s*["'`]\/articles\/([^/"'`\s]+)\/["'`]/g;

// commercialArticleSeeds 配列をトップレベルオブジェクトごとに分割して
// id / productInfoCheckedAt を読む。文字列値に波括弧を含む seed は深さ計数が
// 崩れ得るが、既存 seed には該当なし（scripts/find-missing-article-pairs.mjs と
// 同系の正規パース方針）。
function extractCommercialSeeds(text) {
  const anchor = text.indexOf("commercialArticleSeeds");
  if (anchor === -1) return [];
  const open = text.indexOf("[", anchor);
  if (open === -1) return [];
  const close = text.indexOf("\n];", open);
  const body =
    close === -1 ? text.slice(open + 1) : text.slice(open + 1, close);

  const chunks = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const character = body[i];
    if (character === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (character === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        chunks.push(body.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return chunks
    .map((chunk) => ({
      id: chunk.match(/\bid:\s*["']([^"']+)["']/)?.[1] ?? null,
      // 公開規約は publicArticleMetadata の filter と同一:
      // productInfoCheckedAt を持つ commercial seed だけが公開扱い。
      isPublic: /productInfoCheckedAt\s*:/.test(chunk),
    }))
    .filter((seed) => seed.id);
}

function addSeed(seeds, slug, source, isPublic) {
  if (!slug || slug.includes("${")) return;
  const entry = seeds.get(slug) ?? { sources: [], isPublic: false };
  if (!entry.sources.includes(source)) entry.sources.push(source);
  if (isPublic) entry.isPublic = true;
  seeds.set(slug, entry);
}

/** seed 系統すべてから slug → { sources, isPublic } を収集する。 */
export function collectArticleSeeds({ root = process.cwd() } = {}) {
  const seeds = new Map();
  const readSource = (...parts) =>
    fs.readFileSync(toOsPath(root, ...parts), "utf8");

  // 系統1: モノリス src/content/articles.ts（手動記事 + commercial seeds）。
  if (fs.existsSync(toOsPath(root, SEED_MONOLITH))) {
    const monolithPath = SEED_MONOLITH;
    const text = readSource(SEED_MONOLITH);
    for (const match of text.matchAll(ARTICLE_PATH_PATTERN)) {
      addSeed(seeds, match[1], monolithPath, true);
    }
    for (const seed of extractCommercialSeeds(text)) {
      addSeed(
        seeds,
        seed.id,
        `${monolithPath}#commercialArticleSeeds`,
        seed.isPublic,
      );
    }
  }

  // 系統2: ディレクトリ版 src/content/articles/*.ts。
  const seedDirectory = toOsPath(root, SEED_DIR);
  if (fs.existsSync(seedDirectory)) {
    for (const entry of fs.readdirSync(seedDirectory)) {
      if (!entry.endsWith(".ts")) continue;
      const relative = `${SEED_DIR}/${entry}`;
      if (entry === "index.ts" || entry === "types.ts") continue;
      const text = readSource(SEED_DIR, entry);
      if (entry === "commercial.ts") {
        for (const seed of extractCommercialSeeds(text)) {
          addSeed(
            seeds,
            seed.id,
            `${relative}#commercialArticleSeeds`,
            seed.isPublic,
          );
        }
        continue;
      }
      for (const match of text.matchAll(ARTICLE_PATH_PATTERN)) {
        addSeed(seeds, match[1], relative, true);
      }
    }
  }

  return seeds;
}

/** src/pages/articles/<slug>/index.astro を持つ slug 一覧。 */
export function collectPageSlugs(root = process.cwd()) {
  const directory = toOsPath(root, PAGES_DIR);
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(directory, entry.name, "index.astro")),
    )
    .map((entry) => entry.name)
    .sort();
}

/** functions/articles/<slug>.ts スタブの slug 一覧。 */
export function collectStubSlugs(root = process.cwd()) {
  const directory = toOsPath(root, STUBS_DIR);
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => name.slice(0, -".ts".length))
    .sort();
}

/**
 * 双方向チェック。戻り値は人間可読な違反メッセージ（具体的なファイル名を含む）。
 */
export function findSeedInconsistencies({ seeds, pageSlugs, stubSlugs }) {
  const violations = [];
  const pageSet = new Set(pageSlugs);

  // A. 公開 seed → ページ必須。
  for (const [slug, seed] of [...seeds.entries()].sort()) {
    if (!seed.isPublic || pageSet.has(slug)) continue;
    violations.push(
      `公開seedに対応するページがありません: /articles/${slug}/` +
        ` (seed: ${seed.sources.join(", ")})` +
        ` — 期待: ${PAGES_DIR}/${slug}/index.astro`,
    );
  }

  for (const stub of stubSlugs) {
    // B. スタブ → seed 必須（どちらの系統でもよい）。
    if (!seeds.has(stub)) {
      violations.push(
        `seed消滅後のスタブ残置です: ${STUBS_DIR}/${stub}.ts` +
          ` — /articles/${stub}/ を宣言する seed が存在しません`,
      );
      continue;
    }
    // C. スタブ → ページがあってはならない（Cloudflare Pages は静的アセットを
    // 優先するため、ページがあるスタブは決して発火しない死にコード）。
    if (pageSet.has(stub)) {
      violations.push(
        `ページが存在するためスタブが死にコードです: ${STUBS_DIR}/${stub}.ts` +
          ` vs ${PAGES_DIR}/${stub}/index.astro` +
          " — スタブを削除してください",
      );
    }
  }

  // D. ページ → seed 必須。
  for (const slug of pageSlugs) {
    if (seeds.has(slug)) continue;
    violations.push(
      `seed を持たない孤児ページです: ${PAGES_DIR}/${slug}/index.astro` +
        ` — /articles/${slug}/ を宣言する seed が存在しません`,
    );
  }

  return violations;
}

export function checkArticleSeedConsistency({ root = process.cwd() } = {}) {
  const seeds = collectArticleSeeds({ root });
  const pageSlugs = collectPageSlugs(root);
  const stubSlugs = collectStubSlugs(root);
  const violations = findSeedInconsistencies({ seeds, pageSlugs, stubSlugs });
  const publicCount = [...seeds.values()].filter((s) => s.isPublic).length;
  return { seeds, pageSlugs, stubSlugs, publicCount, violations };
}

function main() {
  const root = process.cwd();
  const { seeds, pageSlugs, stubSlugs, publicCount, violations } =
    checkArticleSeedConsistency({ root });

  console.log(
    `article seed consistency: ${seeds.size} seeds (${publicCount} public), ` +
      `${pageSlugs.length} pages, ${stubSlugs.length} stubs`,
  );

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`✗ ${violation}`);
    }
    console.error(`${violations.length} inconsistency(ies) found.`);
    process.exitCode = 1;
    return;
  }
  console.log("ok: article seeds, pages and 404 stubs are consistent");
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  main();
}
