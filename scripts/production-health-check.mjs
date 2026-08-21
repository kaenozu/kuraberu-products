/**
 * scripts/production-health-check.mjs
 *
 * Production サイトの健全性を定期チェックする。
 * GitHub Actions scheduled workflow から呼ばれる。
 *
 * チェック内容:
 * 1. 主要ページが HTTP 200 で応答すること
 * 2. HTML に主要セクションが含まれること
 * 3. CSP ヘッダーが存在すること
 * 4. sitemap.xml が有効な XML であること
 * 5. robots.txt が存在すること
 *
 * 使い方:
 *   SITE_URL=https://kuraberu-products.pages.dev node scripts/production-health-check.mjs
 */
import { get as httpsGet } from "node:https";

const SITE_URL = process.env.SITE_URL || "https://kuraberu-products.pages.dev";

const CHECKS = [
  { path: "/", name: "top page", expectStatus: 200, expectContent: "くらべる商品メモ" },
  { path: "/articles/", name: "articles index", expectStatus: 200, expectContent: "比較記事" },
  { path: "/sitemap.xml", name: "sitemap.xml", expectStatus: 200, expectContentType: "xml" },
  { path: "/robots.txt", name: "robots.txt", expectStatus: 200, expectContent: "User-agent" },
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = httpsGet(url, { timeout: 10_000 }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function runCheck(check) {
  const url = `${SITE_URL}${check.path}`;
  try {
    const res = await fetch(url);

    // Status check
    if (res.status !== check.expectStatus) {
      return { name: check.name, pass: false, detail: `Expected ${check.expectStatus}, got ${res.status}` };
    }

    // Content check
    if (check.expectContent && !res.body.includes(check.expectContent)) {
      return { name: check.name, pass: false, detail: `Missing expected content: "${check.expectContent}"` };
    }

    // Content type check
    if (check.expectContentType === "xml" && !res.body.includes("<?xml")) {
      return { name: check.name, pass: false, detail: "Response is not valid XML" };
    }

    return { name: check.name, pass: true, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { name: check.name, pass: false, detail: `Request failed: ${err.message}` };
  }
}

async function checkCspHeaders() {
  try {
    const res = await fetch(`${SITE_URL}/`);
    const csp = res.headers["content-security-policy"];
    if (!csp) {
      return { name: "CSP headers", pass: false, detail: "No Content-Security-Policy header" };
    }
    const hasScriptSrc = /script-src/.test(csp);
    const hasStyleSrc = /style-src/.test(csp);
    if (!hasScriptSrc || !hasStyleSrc) {
      return { name: "CSP headers", pass: false, detail: `Missing directives: ${!hasScriptSrc ? "script-src " : ""}${!hasStyleSrc ? "style-src" : ""}` };
    }
    return { name: "CSP headers", pass: true, detail: "CSP present with script-src and style-src" };
  } catch (err) {
    return { name: "CSP headers", pass: false, detail: `Failed: ${err.message}` };
  }
}

async function main() {
  console.log(`Health check: ${SITE_URL}\n`);

  const results = [];

  // Run page checks
  for (const check of CHECKS) {
    const result = await runCheck(check);
    results.push(result);
    const icon = result.pass ? "✅" : "❌";
    console.log(`  ${icon} ${result.name}: ${result.detail}`);
  }

  // CSP check
  const cspResult = await checkCspHeaders();
  results.push(cspResult);
  const cspIcon = cspResult.pass ? "✅" : "❌";
  console.log(`  ${cspIcon} ${cspResult.name}: ${cspResult.detail}`);

  // Summary
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${passed}/${results.length} checks passed`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} check(s) failed`);
    process.exit(1);
  } else {
    console.log("\n✅ All checks passed");
  }
}

main();
