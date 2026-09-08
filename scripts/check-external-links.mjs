import fs from "node:fs";
import path from "node:path";

const htmlFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current);
    else if (current.endsWith(".html")) htmlFiles.push(current);
  }
}
walk("dist");

const externalUrls = new Set();
const errors = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  // href だけでなく src（iframe/script/img）も検査する。
  // ランタイム注入用の data-config 内 JSON（ExternalEmbed.astro）など、
  // 属性名に依らない埋め込み URL は次の素朴な https トークン走査で拾う。
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:javascript|data):/i.test(value)) {
      errors.push(`${file}: unsafe link scheme: ${value.split(":", 1)[0]}`);
      continue;
    }
    if (/^http:\/\//i.test(value)) {
      errors.push(`${file}: non-HTTPS external URL: ${value}`);
      continue;
    }
    if (/placeholder/i.test(value)) {
      errors.push(`${file}: placeholder external URL: ${value}`);
      continue;
    }
    if (/^https:\/\//i.test(value)) externalUrls.add(value);
  }
  const decoded = html.replaceAll("&amp;", "&");
  for (const match of decoded.matchAll(
    /(https?|javascript|data):[^\s"'<>\\]+/g,
  )) {
    const token = match[0].replace(/[.,;)\]]+$/, "");
    if (/^(?:javascript|data):/i.test(token)) {
      errors.push(`${file}: unsafe embedded URL scheme: ${token.slice(0, 60)}`);
      continue;
    }
    if (/^http:\/\//i.test(token)) {
      errors.push(`${file}: non-HTTPS embedded URL: ${token.slice(0, 120)}`);
      continue;
    }
    externalUrls.add(token);
  }
}

for (const value of externalUrls) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:")
      errors.push(`non-HTTPS external URL: ${value}`);
    if (url.username || url.password)
      errors.push(`credential-bearing external URL: ${url.hostname}`);
    if (
      url.hostname === "example.com" ||
      url.hostname.endsWith(".example.com")
    ) {
      errors.push(`placeholder external URL: ${value}`);
    }
    if (/placeholder/i.test(url.pathname + url.search)) {
      errors.push(`placeholder external URL: ${value}`);
    }
  } catch {
    errors.push(`invalid external URL: ${value}`);
  }
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`external link syntax ok: ${externalUrls.size} URLs`);
