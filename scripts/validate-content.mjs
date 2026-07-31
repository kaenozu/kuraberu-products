import fs from "node:fs";
import path from "node:path";

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
const placeholderUrl = /https?:\/\/(?:[^\s"'<>/]+\.)?example\.com(?:[\s"'<>/]|$)/gi;
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
}

if (errors.length) throw new Error(errors.join("\n"));
console.log(`content ok: ${files.length} source files`);
