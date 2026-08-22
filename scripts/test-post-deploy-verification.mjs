/**
 * test-post-deploy-verification.mjs
 *
 * Local validation of the post-deploy verification logic.
 * Reads the built dist directory directly (no HTTP server needed)
 * to verify article integrity, build-sha consistency, and JSON-LD presence.
 *
 * Usage: node scripts/test-post-deploy-verification.mjs
 *
 * Build-sha handling:
 *   The `meta[name=build-sha]` tag is only emitted when PUBLIC_BUILD_SHA was
 *   set at build time (production deploys inject it automatically).
 *   - DEPLOYMENT_ENV=production: a missing build-sha is a FAIL.
 *   - otherwise:                 reported as SKIP (counted separately from PASS).
 *   DEPLOYMENT_ENV is read from the environment running this script, mirroring
 *   the CI verify job which exports the same value used for the build.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_DIST_DIR = "dist";
const PASS = "✓";
const FAIL = "✗";
const SKIP = "-";

// dist/articles 配下に期待する最小記事数。
// config/ 側（config/article-layout.mjs 等）には「記事総数」の契約が存在せず、
// 導出できないため、ここに名前付き定数として保持する。これは現在の記事数
// （実測 81 ページ）に対する「大量ページ消失」検出用のフロアであり、正確な
// 記事数の契約ではない。意図的に記事を削減してこの値を切る場合は、根拠を
// コミットメッセージに残した上でこの定数を引き下げること。
const MIN_EXPECTED_ARTICLE_COUNT = 50;

// ─── Representative articles ────────────────────────────────────────────────
// These cover different content types and features:
const ARTICLES = [
  "articles/pampers-newborn/index.html", // verified purchase, comparison
  "articles/thermos-tiger-bottle/index.html", // comparison, verified purchase
  "articles/babybjorn/index.html", // comparison, autoload X embed
  "articles/tiger-mta-j050-guide/index.html", // guide article
  "articles/shupot/index.html", // multiple autoload X embeds
  "articles/zojirushi-ec-kv50-vs-ec-ma60/index.html", // comparison
];

/**
 * Collect post-deploy verification checks without performing any I/O outside
 * `distDirectory`. File system errors are converted into failed checks instead
 * of uncaught exceptions, so the summary and exit code are always produced.
 */
export function collectPostDeployChecks({
  distDirectory = DEFAULT_DIST_DIR,
  deploymentEnv = process.env.DEPLOYMENT_ENV,
} = {}) {
  /** @type {{section: string, name: string, status: "PASS"|"FAIL"|"SKIP", detail: string}[]} */
  const checks = [];

  function check(section, name, passed, detail = "") {
    checks.push({ section, name, status: passed ? "PASS" : "FAIL", detail });
  }

  function skip(section, name, detail = "") {
    checks.push({ section, name, status: "SKIP", detail });
  }

  // HTML の読み込み結果を記事ごとにキャッシュし、読めない場合は最初の試行で
  // 一度だけ FAIL チェックを記録する（各セクションで重複報告しない）。
  const htmlCache = new Map();

  function loadArticleHtml(section, article) {
    if (htmlCache.has(article)) return htmlCache.get(article);
    let html = null;
    if (!fs.existsSync(path.join(distDirectory, article))) {
      // 存在しない記事はセクション2の存在チェックが個別に報告するため、
      // ここでは追加の FAIL を出さずにスキップ扱いにする。
      htmlCache.set(article, null);
      return null;
    }
    try {
      html = fs.readFileSync(path.join(distDirectory, article), "utf8");
    } catch (error) {
      check(
        section,
        `Readable: ${article}`,
        false,
        `file exists but cannot be read: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    htmlCache.set(article, html);
    return html;
  }

  const fileExists = (filePath) =>
    fs.existsSync(path.join(distDirectory, filePath));

  // ─── 1. Core page existence ────────────────────────────────────────────────
  const section1 = "1. Core page existence";
  const corePages = [
    "index.html",
    "articles/index.html",
    "memo/index.html",
    "about/index.html",
    "privacy/index.html",
    "disclaimer/index.html",
    "robots.txt",
    "sitemap.xml",
  ];
  for (const page of corePages) {
    check(section1, `HTTP 200 ${page}`, fileExists(page), "file exists");
  }

  // ─── 2. Article HTTP status (file existence) ───────────────────────────────
  const section2 = "2. Article file existence";
  for (const article of ARTICLES) {
    check(section2, `Article ${article}`, fileExists(article), "file exists");
  }

  // ─── 3. Build-sha consistency ──────────────────────────────────────────────
  const section3 = "3. Build-sha consistency";
  const buildShas = new Set();
  const shaRegex =
    /<meta[^>]+name=["']build-sha["'][^>]+content=["']([^"']+)["']/i;
  for (const article of ARTICLES) {
    const html = loadArticleHtml(section3, article);
    if (!html) continue;
    const match = html.match(shaRegex);
    if (match) {
      buildShas.add(match[1]);
      check(section3, `Build-sha present in ${article}`, true, match[1]);
    }
  }

  const shaFound = buildShas.size > 0;
  if (shaFound) {
    if (buildShas.size === 1) {
      check(
        section3,
        "Build-sha consistent across articles",
        true,
        [...buildShas][0],
      );
    } else {
      check(
        section3,
        "Build-sha consistent across articles",
        false,
        `${buildShas.size} unique SHAs: ${[...buildShas].join(", ")}`,
      );
    }
  } else if (deploymentEnv === "production") {
    // 本番ビルドでは tools/production/Invoke-ProductionBuildAndDeploy.ps1 が
    // PUBLIC_BUILD_SHA を必ず注入する。欠落は配信検証の根幹に関わるため FAIL。
    check(
      section3,
      "Build-sha present in production build",
      false,
      "DEPLOYMENT_ENV=production requires PUBLIC_BUILD_SHA to be injected at build time",
    );
  } else {
    // build-sha is only injected when PUBLIC_BUILD_SHA env var is set during build.
    // This is expected in local builds — the check is for production builds only.
    // PASS ではなく SKIP として pass 件数から切り離して集計する。
    skip(
      section3,
      "Build-sha",
      "not embedded in this build (PUBLIC_BUILD_SHA unset); only enforced when DEPLOYMENT_ENV=production",
    );
  }

  // ─── 4. JSON-LD presence ───────────────────────────────────────────────────
  const section4 = "4. JSON-LD structured data";
  const jsonLdRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const article of ARTICLES) {
    const html = loadArticleHtml(section4, article);
    if (!html) continue;
    let found = false;
    let match;
    // Reset lastIndex for each article
    jsonLdRegex.lastIndex = 0;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data["@type"] === "Article") {
          found = true;
          check(section4, `JSON-LD in ${article}`, true, `@type=Article`);
          // Validate required fields
          check(
            section4,
            `  datePublished in ${article}`,
            !!data.datePublished,
            data.datePublished,
          );
          check(
            section4,
            `  dateModified in ${article}`,
            !!data.dateModified,
            data.dateModified,
          );
          check(section4, `  url in ${article}`, !!data.url, data.url);
          break;
        }
      } catch {
        // parse error
      }
    }
    if (!found) {
      check(
        section4,
        `JSON-LD in ${article}`,
        false,
        "no Article structured data",
      );
    }
  }

  // ─── 5. No mixed content ───────────────────────────────────────────────────
  const section5 = "5. Mixed content check";
  const mixedContentRegex = /(?:src|href)=["']http:\/\//i;
  for (const article of ARTICLES) {
    const html = loadArticleHtml(section5, article);
    if (!html) continue;
    const hasMixed = mixedContentRegex.test(html);
    check(section5, `No mixed content in ${article}`, !hasMixed);
  }

  // ─── 6. HTML content type (basic check) ────────────────────────────────────
  const section6 = "6. HTML structure";
  const canonicalRegex =
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i;
  for (const article of ARTICLES) {
    const html = loadArticleHtml(section6, article);
    if (!html) continue;
    const match = html.match(canonicalRegex);
    check(
      section6,
      `Canonical URL in ${article}`,
      !!match,
      match?.[1] ?? "missing",
    );
  }

  // ─── 7. Article count validation ───────────────────────────────────────────
  const section7 = "7. Article count";
  let articleDirs = [];
  try {
    articleDirs = fs
      .readdirSync(path.join(distDirectory, "articles"), {
        withFileTypes: true,
      })
      .filter(
        (d) => d.isDirectory() && d.name !== "category" && d.name !== "page",
      );
  } catch (error) {
    check(
      section7,
      "dist/articles directory listing",
      false,
      `cannot list articles: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  check(
    section7,
    "Article count > 0",
    articleDirs.length > 0,
    `${articleDirs.length} articles`,
  );
  check(
    section7,
    `Article count >= ${MIN_EXPECTED_ARTICLE_COUNT}`,
    articleDirs.length >= MIN_EXPECTED_ARTICLE_COUNT,
    `${articleDirs.length} articles (floor: MIN_EXPECTED_ARTICLE_COUNT)`,
  );

  // ─── 8. Purchase link status meta tag ──────────────────────────────────────
  const section8 = "8. Purchase link status meta tags";
  const purchaseStatusRegex =
    /<meta[^>]+name=["']article:purchase-link-status["'][^>]+content=["']([^"']+)["']/i;
  for (const article of ARTICLES) {
    const html = loadArticleHtml(section8, article);
    if (!html) continue;
    const match = html.match(purchaseStatusRegex);
    if (match) {
      check(section8, `Purchase status in ${article}`, true, match[1]);
    } else {
      check(section8, `Purchase status in ${article}`, false, "missing");
    }
  }

  // セクション9（Consent banner readiness）は削除した。
  //
  // 【README】旧チェックは「HTML に autoload という文字列があれば pass」という
  // もので、動作を何も検証していなかった。同意バナー（embed-consent）の実際の
  // 振る舞い — 同意前のサードパーティリクエスト遮断、同意後の自動読み込み、
  // clearConsent による再同意（バナーへのフォーカス含む）— はクライアント側
  // JavaScript によるものであり、静的な dist HTML からは検証不能である。
  // これらは E2E テスト tests/e2e/embed-consent.e2e.ts と単体テスト
  // tests/embed-consent.test.ts の担当領域のため、ここでの形骸チェックは
  // 行わない。

  return checks;
}

export function summarizeChecks(checks) {
  const passed = checks.filter((c) => c.status === "PASS").length;
  const failed = checks.filter((c) => c.status === "FAIL").length;
  const skipped = checks.filter((c) => c.status === "SKIP").length;
  return { passed, failed, skipped, total: checks.length };
}

function printReport(checks) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(" Post-Deploy Verification (Local)");
  console.log("═══════════════════════════════════════════════════════════\n");

  let currentSection = "";
  for (let i = 0; i < checks.length; i++) {
    const { section, name, status, detail } = checks[i];
    if (section !== currentSection) {
      if (currentSection !== "") console.log();
      console.log(section);
      currentSection = section;
    }
    const marker = status === "PASS" ? PASS : status === "FAIL" ? FAIL : SKIP;
    console.log(`  ${marker} ${name}${detail ? ` — ${detail}` : ""}`);
  }
  console.log();
}

function main() {
  const checks = collectPostDeployChecks();
  printReport(checks);

  const { passed, failed, skipped, total } = summarizeChecks(checks);
  console.log("═══════════════════════════════════════════════════════════");
  console.log(
    ` Results: ${passed}/${total} passed, ${skipped} skipped, ${failed} failed`,
  );
  console.log("═══════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    console.error(`${failed} checks failed.`);
    process.exit(1);
  } else {
    console.log("All checks passed.");
    process.exit(0);
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  main();
}
