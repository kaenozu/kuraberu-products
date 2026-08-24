import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
  validateBuildEnvironment,
} from "../config/runtime-env.mjs";

const { deploymentEnv, siteUrl } = validateBuildEnvironment(process.env);
const expectedSiteUrl = normalizeSiteUrl(siteUrl ?? DEFAULT_SITE_URL);
const expectedDefaultRobots =
  deploymentEnv === "production" ? "index,follow" : "noindex,nofollow";
const htmlFiles = [];
const headersFile = path.join("dist", "_headers");

function validateSecurityHeaders() {
  if (!fs.existsSync(headersFile)) {
    return [`${headersFile}: missing Cloudflare static-assets headers file`];
  }

  const headers = fs.readFileSync(headersFile, "utf8");
  const csp = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1];
  if (!csp) return [`${headersFile}: missing Content-Security-Policy`];

  const requiredDirectives = [
    "default-src",
    "script-src",
    "frame-src",
    "connect-src",
    "img-src",
    "style-src",
  ];
  return requiredDirectives
    .filter((directive) => !new RegExp(`(?:^|;)\\s*${directive}\\s`).test(csp))
    .map((directive) => `${headersFile}: CSP missing ${directive}`)
    .concat(
      /(?:^|;)\s*script-src[^;]*\s\*\s*(?:;|$)/.test(csp)
        ? [`${headersFile}: CSP script-src must not allow *`]
        : [],
    )
    .concat(
      /(?:^|;)\s*script-src[^;]*\bunsafe-eval\b/.test(csp)
        ? [`${headersFile}: CSP must not allow unsafe-eval`]
        : [],
    );
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current);
    else if (current.endsWith(".html")) htmlFiles.push(current);
  }
}

// 「sitemap.xml は公開ページのみ列挙」という契約を基準に、
// 記事詳細ページの期待 robots を導出するための掲載パス集合。
function collectSitemapPathnames() {
  try {
    const xml = fs.readFileSync(path.join("dist", "sitemap.xml"), "utf8");
    const pathnames = new Set();
    for (const match of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
      try {
        pathnames.add(new URL(match[1]).pathname);
      } catch {
        // 相対 URL 等は判定対象外
      }
    }
    return pathnames;
  } catch {
    // sitemap 欠損は後段の production 検証が別途エラーにするため、
    // ここでは従来どおり既定期待値へフォールバックする。
    return null;
  }
}

function pathnameFor(file) {
  const relative = path.relative("dist", file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  return `/${relative.slice(0, -".html".length)}/`;
}

function readAttribute(html, pattern, label, file, errors) {
  const match = html.match(pattern);
  if (!match) {
    errors.push(`${file}: missing ${label}`);
    return undefined;
  }
  return match[1];
}

function readStructuredData(html, file, errors) {
  const matches = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  if (matches.length < 1) {
    errors.push(`${file}: expected at least one JSON-LD block, found 0`);
    return undefined;
  }

  const blocks = [];
  for (const match of matches) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      errors.push(`${file}: invalid JSON-LD block`);
      return undefined;
    }
  }
  return blocks;
}

walk("dist");
const errors = [...validateSecurityHeaders()];
const sitemapPathnames = collectSitemapPathnames();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const pathname = pathnameFor(file);
  const is404 = path.relative("dist", file) === "404.html";
  const isArticle =
    pathname.startsWith("/articles/") &&
    pathname !== "/articles/" &&
    !pathname.startsWith("/articles/page/") &&
    !pathname.startsWith("/articles/category/");
  const isPrivateMemo = pathname === "/memo/";
  // 記事詳細ページは sitemap 掲載状況が公開/保持の正。非掲載記事
  // （商品情報確認日前の初稿）は noindex でレンダされるのが契約。
  // sitemap を読めない場合は判定を諦めて既定期待値にフォールバックする。
  const isHeldArticle =
    isArticle && sitemapPathnames !== null && !sitemapPathnames.has(pathname);
  const expectedRobots =
    is404 || isPrivateMemo || isHeldArticle
      ? "noindex,nofollow"
      : expectedDefaultRobots;
  const expectedCanonical = new URL(pathname, `${expectedSiteUrl}/`).toString();

  const robots = readAttribute(
    html,
    /<meta name="robots" content="([^"]+)"/,
    "robots metadata",
    file,
    errors,
  );
  if (robots && robots !== expectedRobots) {
    errors.push(`${file}: expected robots ${expectedRobots}, found ${robots}`);
  }

  const canonical = readAttribute(
    html,
    /<link rel="canonical" href="([^"]+)"/,
    "canonical URL",
    file,
    errors,
  );
  if (canonical && canonical !== expectedCanonical) {
    errors.push(
      `${file}: expected canonical ${expectedCanonical}, found ${canonical}`,
    );
  }

  const ogUrl = readAttribute(
    html,
    /<meta property="og:url" content="([^"]+)"/,
    "Open Graph URL",
    file,
    errors,
  );
  if (ogUrl && ogUrl !== expectedCanonical) {
    errors.push(`${file}: Open Graph URL does not match canonical`);
  }
  if (!/<meta property="og:title" content="[^"]+"/.test(html)) {
    errors.push(`${file}: missing Open Graph title`);
  }
  if (!/<meta property="og:description" content="[^"]+"/.test(html)) {
    errors.push(`${file}: missing Open Graph description`);
  }

  const structuredBlocks = readStructuredData(html, file, errors);
  if (structuredBlocks) {
    const expectedType = isArticle ? "Article" : "WebPage";
    const primary = structuredBlocks.find(
      (block) => block["@type"] === expectedType,
    );
    if (!primary) {
      errors.push(
        `${file}: expected JSON-LD type ${expectedType} block, found ${structuredBlocks.map((b) => b["@type"]).join(", ")}`,
      );
    } else {
      if (primary["@context"] !== "https://schema.org") {
        errors.push(`${file}: unexpected JSON-LD context`);
      }
      if (primary.url !== expectedCanonical) {
        errors.push(`${file}: JSON-LD URL does not match canonical`);
      }
    }
    for (const block of structuredBlocks) {
      const allowedTypes = ["Article", "WebPage", "BreadcrumbList", "FAQPage"];
      if (!allowedTypes.includes(block["@type"])) {
        errors.push(`${file}: unsupported JSON-LD type ${block["@type"]}`);
      }
      if (block["@context"] !== "https://schema.org") {
        errors.push(`${file}: unexpected JSON-LD context`);
      }
      if (block["@type"] === "FAQPage") {
        if (!Array.isArray(block.mainEntity) || block.mainEntity.length === 0) {
          errors.push(`${file}: FAQPage mainEntity must be a non-empty array`);
        }
        for (const entry of block.mainEntity ?? []) {
          if (
            entry?.["@type"] !== "Question" ||
            typeof entry.name !== "string" ||
            entry.name.length === 0 ||
            entry.acceptedAnswer?.["@type"] !== "Answer" ||
            typeof entry.acceptedAnswer.text !== "string" ||
            entry.acceptedAnswer.text.length === 0
          ) {
            errors.push(
              `${file}: FAQPage contains an invalid Question/Answer entry`,
            );
          }
        }
      }
      const serialized = JSON.stringify(block);
      for (const unsupportedClaim of ["aggregateRating", "review", "offers"]) {
        if (serialized.includes(`"${unsupportedClaim}"`)) {
          errors.push(`${file}: unsupported JSON-LD claim ${unsupportedClaim}`);
        }
      }
    }
  }
}

const robotsFile = fs.readFileSync(path.join("dist", "robots.txt"), "utf8");
if (deploymentEnv === "production") {
  if (!robotsFile.includes("Allow: /"))
    errors.push("robots.txt: production must allow crawling");
  if (!robotsFile.includes(`Sitemap: ${expectedSiteUrl}/sitemap.xml`)) {
    errors.push("robots.txt: missing production sitemap URL");
  }
} else if (!robotsFile.includes("Disallow: /")) {
  errors.push("robots.txt: non-production must disallow crawling");
}

const sitemap = fs.readFileSync(path.join("dist", "sitemap.xml"), "utf8");
if (sitemap.includes("/404")) errors.push("sitemap.xml: must not include 404");
for (const pathname of ["/", "/articles/", "/articles/pampers-newborn/"]) {
  const expected = new URL(pathname, `${expectedSiteUrl}/`).toString();
  if (!sitemap.includes(`<loc>${expected}</loc>`)) {
    errors.push(`sitemap.xml: missing ${expected}`);
  }
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`deployment html ok: ${deploymentEnv}, ${htmlFiles.length} pages`);
