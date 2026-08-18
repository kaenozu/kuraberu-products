import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 角丸トークンの監査（監査 P2・docs/ui-ux-spec-2026-08.md）。
// 角丸は 3 段階のみ:
//   --radius-sm（6px）: 小さなコントロール（入力・ボタン・サムネイル）
//   --radius-md（10px）: 中くらいのカード（カード・FAQ・ドロップダウン）
//   --radius-lg（14px）: 大きな面（比較表・購入カード・ヒーロー）
// 完全な円（50%）・ピル（999px）は「角丸トークン」ではなく形状なので許容する。
// 非対称な角丸（例: 0 var(--radius-md) var(--radius-md) 0）は var 経由のみ許容。
//
// 対象: src/ 配下の .css ファイルと .astro の <style> ブロック。
// px 直書き（4px / 8px / 10px / 12px / 14px 等）を fail-closed で検出する。

const RADIUS_VAR_PATTERN = /^var\(--radius-(?:sm|md|lg)\)$/;
const FULL_ROUND_VALUES = new Set(["50%", "999px"]);

// 許可される値:
// - var(--radius-{sm,md,lg})
// - 50% / 999px（完全な円・ピル）
// - 空白区切りの角丸指定で、各トークンが 0 または var(--radius-{sm,md,lg})（非対称対応）
export function isAllowedBorderRadius(value) {
  const trimmed = value.trim();
  if (RADIUS_VAR_PATTERN.test(trimmed)) return true;
  if (FULL_ROUND_VALUES.has(trimmed)) return true;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 1) {
    return tokens.every(
      (token) => token === "0" || RADIUS_VAR_PATTERN.test(token),
    );
  }
  return false;
}

export function checkCssSource(source, label, errors) {
  const pattern = /border-radius\s*:\s*([^;]+);/g;
  for (const match of source.matchAll(pattern)) {
    const value = match[1].trim();
    if (isAllowedBorderRadius(value)) continue;
    errors.push(
      `${label}: border-radius "${value}" is not one of the 3 radius tokens (--radius-sm/md/lg); use var(--radius-…) instead (or keep 50%/999px for full-round shapes)`,
    );
  }
}

export function checkRadiusTokens({ srcDirectory = "src" } = {}) {
  const errors = [];
  const cssFiles = [];
  const astroFiles = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const current = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(current);
      else if (current.endsWith(".css")) cssFiles.push(current);
      else if (current.endsWith(".astro")) astroFiles.push(current);
    }
  }
  walk(srcDirectory);

  for (const file of cssFiles.sort()) {
    const source = fs.readFileSync(file, "utf8");
    checkCssSource(
      source,
      path.relative(srcDirectory, file).replace(/\\/g, "/"),
      errors,
    );
  }

  for (const file of astroFiles.sort()) {
    const source = fs.readFileSync(file, "utf8");
    // .astro の <style> ブロック（is:global 等の属性があってもよい）だけを対象にする
    const stylePattern = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
    let index = 0;
    for (const match of source.matchAll(stylePattern)) {
      const block = match[1];
      const offset = source.indexOf(block, index);
      index = offset + block.length;
      const line = source.slice(0, offset).split("\n").length;
      checkCssSource(
        block,
        `${path.relative(srcDirectory, file).replace(/\\/g, "/")}:${line}`,
        errors,
      );
    }
  }

  return errors;
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const errors = checkRadiusTokens();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "radius tokens ok: all border-radius use --radius-sm/md/lg (or 50%/999px)",
  );
}
