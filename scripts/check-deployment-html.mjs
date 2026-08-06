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
  if (matches.length !== 1) {
    errors.push(`${file}: expected one JSON-LD block, found ${matches.length}`);
    return undefined;
  }

  try {
    return JSON.parse(matches[0][1]);
  } catch {
    errors.push(`${file}: invalid JSON-LD`);
    return undefined;
  }
}

walk("dist");
const errors = [...validateSecurityHeaders()];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const pathname = pathnameFor(file);
  const is404 = path.relative("dist", file) === "404.html";
  const isArticle =
    pathname.startsWith("/articles/") && pathname !== "/articles/";
  const expectedRobots = is404 ? "noindex,nofollow" : expectedDefaultRobots;
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

  const structuredData = readStructuredData(html, file, errors);
  if (structuredData) {
    const expectedType = isArticle ? "Article" : "WebPage";
    if (structuredData["@context"] !== "https://schema.org") {
      errors.push(`${file}: unexpected JSON-LD context`);
    }
    if (structuredData["@type"] !== expectedType) {
      errors.push(
        `${file}: expected JSON-LD type ${expectedType}, found ${structuredData["@type"]}`,
      );
    }
    if (structuredData.url !== expectedCanonical) {
      errors.push(`${file}: JSON-LD URL does not match canonical`);
    }
    const serialized = JSON.stringify(structuredData);
    for (const unsupportedClaim of ["aggregateRating", "review", "offers"]) {
      if (serialized.includes(`"${unsupportedClaim}"`)) {
        errors.push(`${file}: unsupported JSON-LD claim ${unsupportedClaim}`);
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
for (const pathname of [
  "/",
  "/articles/",
  "/articles/pampers-newborn/",
  "/memo/",
]) {
  const expected = new URL(pathname, `${expectedSiteUrl}/`).toString();
  if (!sitemap.includes(`<loc>${expected}</loc>`)) {
    errors.push(`sitemap.xml: missing ${expected}`);
  }
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`deployment html ok: ${deploymentEnv}, ${htmlFiles.length} pages`);
