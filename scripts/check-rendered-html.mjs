import fs from "node:fs";
import path from "node:path";

const dist = "dist";
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current);
    else if (current.endsWith(".html")) htmlFiles.push(current);
  }
}

function internalTarget(href) {
  const pathname = href.split("#")[0].split("?")[0];
  if (!pathname || !pathname.startsWith("/")) return null;
  if (pathname === "/") return path.join(dist, "index.html");
  if (path.extname(pathname)) return path.join(dist, pathname);
  return path.join(dist, pathname, "index.html");
}

walk(dist);
const errors = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const mainCount = (html.match(/<main(?:\s|>)/g) ?? []).length;
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;

  if (mainCount !== 1) errors.push(`${file}: expected one main, found ${mainCount}`);
  if (h1Count !== 1) errors.push(`${file}: expected one h1, found ${h1Count}`);
  if (!/<meta name="robots" content="(?:index,follow|noindex,nofollow)"/.test(html)) {
    errors.push(`${file}: missing robots metadata`);
  }
  if (!/<link rel="canonical" href="https:\/\//.test(html)) {
    errors.push(`${file}: missing HTTPS canonical`);
  }
  if (html.includes("kuraberu-ikuji.pages.dev")) {
    errors.push(`${file}: contains obsolete site URL`);
  }

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const target = internalTarget(match[1]);
    if (target && !fs.existsSync(target)) {
      errors.push(`${file}: broken internal link ${match[1]}`);
    }
  }
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`rendered html ok: ${htmlFiles.length} pages`);
