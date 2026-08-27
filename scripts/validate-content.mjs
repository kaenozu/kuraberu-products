import fs from "node:fs";
import path from "node:path";
import { validateExternalEmbedDirectory } from "./external-embed-limit.mjs";
import { validateHeroNamesDirectory } from "./validate-hero-names.mjs";

const root = "src";
const includedExtensions = new Set([
  ".astro",
  ".ts",
  ".js",
  ".md",
  ".mdx",
  ".json",
  ".yaml",
  ".yml",
]);
const banned = ["大人気", "話題", "絶対におすすめ", "これ一択"];
// Numeric value and its delta must remain separate in rendered prose. These
// compacted forms are easy to create when article data is interpolated and
// make the comparison direction/meaning ambiguous.
const malformedDelta = /約\d+g約\d+g|\d+枚\d+枚多い/g;
const placeholderUrl =
  /https?:\/\/(?:[^\s"'<>/]+\.)?example\.com(?:[\s"'<>/]|$)/gi;
const placeholderTokenUrl = /https?:\/\/[^\s"'<>]*placeholder[^\s"'<>]*/gi;
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current);
    else if (includedExtensions.has(path.extname(current))) files.push(current);
  }
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

walk(root);
const errors = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const phrase of banned) {
    let offset = text.indexOf(phrase);
    while (offset !== -1) {
      errors.push(
        `${file}:${lineNumber(text, offset)}: prohibited expression: ${phrase}`,
      );
      offset = text.indexOf(phrase, offset + phrase.length);
    }
  }
  for (const match of text.matchAll(placeholderUrl)) {
    errors.push(
      `${file}:${lineNumber(text, match.index ?? 0)}: placeholder URL`,
    );
  }
  for (const match of text.matchAll(placeholderTokenUrl)) {
    errors.push(
      `${file}:${lineNumber(text, match.index ?? 0)}: placeholder URL`,
    );
  }
  for (const match of text.matchAll(malformedDelta)) {
    errors.push(
      `${file}:${lineNumber(text, match.index ?? 0)}: malformed numeric delta expression: ${match[0]}`,
    );
  }
}

for (const error of validateExternalEmbedDirectory("src/pages")) {
  errors.push(error);
}
for (const error of validateHeroNamesDirectory()) {
  errors.push(error);
}

const evidenceDirectory = "docs/evidence";
if (fs.existsSync(evidenceDirectory)) {
  for (const entry of fs.readdirSync(evidenceDirectory, {
    withFileTypes: true,
  })) {
    if (
      entry.isFile() &&
      /^issue-15-embed-.*\.(?:png|jpe?g|webp|gif)$/i.test(entry.name)
    ) {
      errors.push(
        `${path.join(evidenceDirectory, entry.name)}: real external embed evidence images are forbidden; use DOM or text evidence`,
      );
    }
  }
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`content ok: ${files.length} source files`);
