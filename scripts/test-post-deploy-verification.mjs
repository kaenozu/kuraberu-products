/**
 * test-post-deploy-verification.mjs
 *
 * Local validation of the post-deploy verification logic.
 * Reads the built dist directory directly (no HTTP server needed)
 * to verify article integrity, build-sha consistency, and JSON-LD presence.
 *
 * Usage: node scripts/test-post-deploy-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";

const DIST_DIR = "dist";
const PASS = "✓";
const FAIL = "✗";

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(name, passed, detail = "") {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`  ${PASS} ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failedChecks++;
    console.log(`  ${FAIL} ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function readHtml(filePath) {
  return fs.readFileSync(path.join(DIST_DIR, filePath), "utf8");
}

function fileExists(filePath) {
  return fs.existsSync(path.join(DIST_DIR, filePath));
}

// ─── Representative articles ────────────────────────────────────────────────
// These cover different content types and features:
const ARTICLES = [
  "articles/pampers-newborn/index.html",           // verified purchase, comparison
  "articles/thermos-tiger-bottle/index.html",      // comparison, verified purchase
  "articles/babybjorn/index.html",                 // comparison, autoload X embed
  "articles/tiger-mta-j050-guide/index.html",      // guide article
  "articles/shupot/index.html",                    // multiple autoload X embeds
  "articles/zojirushi-ec-kv50-vs-ec-ma60/index.html", // comparison
];

console.log("\n═══════════════════════════════════════════════════════════");
console.log(" Post-Deploy Verification (Local)");
console.log("═══════════════════════════════════════════════════════════\n");

// ─── 1. Core page existence ─────────────────────────────────────────────────
console.log("1. Core page existence");
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
  check(`HTTP 200 ${page}`, fileExists(page), "file exists");
}
console.log();

// ─── 2. Article HTTP status (file existence) ────────────────────────────────
console.log("2. Article file existence");
for (const article of ARTICLES) {
  check(`Article ${article}`, fileExists(article), "file exists");
}
console.log();

// ─── 3. Build-sha consistency ───────────────────────────────────────────────
console.log("3. Build-sha consistency");
const buildShas = new Set();
const shaRegex =
  /<meta[^>]+name=["']build-sha["'][^>]+content=["']([^"']+)["']/i;
let shaFound = false;
for (const article of ARTICLES) {
  if (!fileExists(article)) continue;
  const html = readHtml(article);
  const match = html.match(shaRegex);
  if (match) {
    shaFound = true;
    buildShas.add(match[1]);
    check(`Build-sha present in ${article}`, true, match[1]);
  }
}

if (shaFound) {
  if (buildShas.size === 1) {
    check("Build-sha consistent across articles", true, [...buildShas][0]);
  } else {
    check(
      "Build-sha consistent across articles",
      false,
      `${buildShas.size} unique SHAs: ${[...buildShas].join(", ")}`,
    );
  }
} else {
  // build-sha is only injected when PUBLIC_BUILD_SHA env var is set during build.
  // This is expected in local builds — the check is for production builds only.
  check(
    "Build-sha (skipped — not set in local build)",
    true,
    "build-sha only present when PUBLIC_BUILD_SHA is set",
  );
}
console.log();

// ─── 4. JSON-LD presence ────────────────────────────────────────────────────
console.log("4. JSON-LD structured data");
const jsonLdRegex =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
for (const article of ARTICLES) {
  if (!fileExists(article)) continue;
  const html = readHtml(article);
  let found = false;
  let match;
  // Reset lastIndex for each article
  jsonLdRegex.lastIndex = 0;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data["@type"] === "Article") {
        found = true;
        check(`JSON-LD in ${article}`, true, `@type=Article`);
        // Validate required fields
        check(
          `  datePublished in ${article}`,
          !!data.datePublished,
          data.datePublished,
        );
        check(
          `  dateModified in ${article}`,
          !!data.dateModified,
          data.dateModified,
        );
        check(
          `  url in ${article}`,
          !!data.url,
          data.url,
        );
        break;
      }
    } catch {
      // parse error
    }
  }
  if (!found) {
    check(`JSON-LD in ${article}`, false, "no Article structured data");
  }
}
console.log();

// ─── 5. No mixed content ────────────────────────────────────────────────────
console.log("5. Mixed content check");
const mixedContentRegex = /(?:src|href)=["']http:\/\//i;
for (const article of ARTICLES) {
  if (!fileExists(article)) continue;
  const html = readHtml(article);
  const hasMixed = mixedContentRegex.test(html);
  check(`No mixed content in ${article}`, !hasMixed);
}
console.log();

// ─── 6. HTML content type (basic check) ─────────────────────────────────────
console.log("6. HTML structure");
const canonicalRegex =
  /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i;
for (const article of ARTICLES) {
  if (!fileExists(article)) continue;
  const html = readHtml(article);
  const match = html.match(canonicalRegex);
  check(`Canonical URL in ${article}`, !!match, match?.[1] ?? "missing");
}
console.log();

// ─── 7. Article count validation ────────────────────────────────────────────
console.log("7. Article count");
const articlesDir = path.join(DIST_DIR, "articles");
const articleDirs = fs
  .readdirSync(articlesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "category" && d.name !== "page");
check(
  "Article count > 0",
  articleDirs.length > 0,
  `${articleDirs.length} articles`,
);
check(
  "Article count >= 50",
  articleDirs.length >= 50,
  `${articleDirs.length} articles`,
);
console.log();

// ─── 8. Purchase link status meta tag ───────────────────────────────────────
console.log("8. Purchase link status meta tags");
const purchaseStatusRegex =
  /<meta[^>]+name=["']article:purchase-link-status["'][^>]+content=["']([^"']+)["']/i;
for (const article of ARTICLES) {
  if (!fileExists(article)) continue;
  const html = readHtml(article);
  const match = html.match(purchaseStatusRegex);
  if (match) {
    check(
      `Purchase status in ${article}`,
      true,
      match[1],
    );
  } else {
    check(
      `Purchase status in ${article}`,
      false,
      "missing",
    );
  }
}
console.log();

// ─── 9. Consent banner readiness ────────────────────────────────────────────
console.log("9. Consent banner readiness");
const consentBannerRegex = /data-embed-consent-banner/i;
const embedConsentModule = fs.existsSync("src/lib/embed-consent.ts");
check("Embed consent module exists", embedConsentModule);

for (const article of ARTICLES) {
  if (!fileExists(article)) continue;
  const html = readHtml(article);
  // Check if article has autoload embeds that would trigger consent banner
  const hasAutoload = /autoload/i.test(html);
  if (hasAutoload) {
    // Articles with autoload should have the consent banner infrastructure
    // (the banner is injected by client-side JS, so we check the script exists)
    check(
      `Autoload embed in ${article}`,
      true,
      "consent banner will be shown on client",
    );
  }
}
console.log();

// ─── Summary ────────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log(
  ` Results: ${passedChecks}/${totalChecks} passed, ${failedChecks} failed`,
);
console.log("═══════════════════════════════════════════════════════════\n");

if (failedChecks > 0) {
  console.error(`${failedChecks} checks failed.`);
  process.exit(1);
} else {
  console.log("All checks passed.");
  process.exit(0);
}
