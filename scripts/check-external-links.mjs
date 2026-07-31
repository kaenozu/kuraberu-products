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
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:javascript|data):/i.test(value)) {
      errors.push(`${file}: unsafe link scheme: ${value.split(":", 1)[0]}`);
      continue;
    }
    if (/^http:\/\//i.test(value)) {
      errors.push(`${file}: non-HTTPS external URL: ${value}`);
      continue;
    }
    if (/^https:\/\//i.test(value)) externalUrls.add(value);
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
  } catch {
    errors.push(`invalid external URL: ${value}`);
  }
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`external link syntax ok: ${externalUrls.size} URLs`);
