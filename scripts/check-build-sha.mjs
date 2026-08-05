import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA_PATTERN = /^[0-9a-f]{40}$/;

function walk(directory, files) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current, files);
    else if (current.endsWith(".html")) files.push(current);
  }
}

export function extractBuildSha(html) {
  const match = html.match(
    /<meta\s+name=["']x-build-sha["']\s+content=["'](?<sha>[0-9a-f]{40})["']\s*\/?\s*>/i,
  );
  return match?.groups?.sha?.toLowerCase();
}

export function validateGeneratedBuildSha({
  distDirectory = "dist",
  expectedSha = process.env.PUBLIC_BUILD_SHA,
} = {}) {
  const normalized = expectedSha?.trim().toLowerCase();
  if (!normalized || !SHA_PATTERN.test(normalized)) {
    throw new Error(
      "PUBLIC_BUILD_SHA must be an exact 40-character Git commit SHA",
    );
  }
  const htmlFiles = [];
  walk(distDirectory, htmlFiles);
  htmlFiles.sort();
  if (htmlFiles.length === 0) {
    throw new Error(`No generated HTML files found under ${distDirectory}`);
  }
  const errors = [];
  for (const filePath of htmlFiles) {
    const actual = extractBuildSha(fs.readFileSync(filePath, "utf8"));
    if (actual !== normalized) {
      errors.push(
        `${filePath}: build SHA actual=${actual} expected=${normalized}`,
      );
    }
  }
  return { pageCount: htmlFiles.length, expectedSha: normalized, errors };
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const result = validateGeneratedBuildSha();
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  console.log(
    `build sha ok: ${result.pageCount} pages @ ${result.expectedSha}`,
  );
}
