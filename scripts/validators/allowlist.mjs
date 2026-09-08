// rendered gate 許可リスト（docs/rendered-gate-allowlist.md）（#702 で分離）。

import fs from "node:fs";
import path from "node:path";

// ---- 許可リスト（docs/rendered-gate-allowlist.md, Issue #343）----
//
// 全ページへゲートを拡大した結果、既存データ由来の違反が見つかった場合、
// ゲートを緩めずに例外だけを docs/rendered-gate-allowlist.md の表で
// 明示する。形式:
//   | path | rule | reason |
//   | `articles/<slug>/index.html` | `required-section:<id>` / `template-token` | 理由 |
export const ALLOWLIST_FILE = "docs/rendered-gate-allowlist.md";

/** 許可リスト markdown の表部分をパースする（行ベース・壊れた行は無視）。 */
export function parseRenderedGateAllowlist(markdown) {
  const entries = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/^`|`$/g, ""));
    if (cells.length < 3) continue;
    const [entryPath, rule, reason] = cells;
    if (!entryPath || !rule || entryPath === "path") continue;
    entries.push({ path: entryPath, rule, reason: reason ?? "" });
  }
  return entries;
}

/** エラー行の先頭（dist 相対パス）とルールタグで許可リストを適用する。 */
export function applyRenderedGateAllowlist(errors, entries) {
  if (entries.length === 0) return [...errors];
  const byPath = new Map();
  for (const entry of entries) {
    const rules = byPath.get(entry.path) ?? new Set();
    rules.add(entry.rule);
    byPath.set(entry.path, rules);
  }
  return errors.filter((error) => {
    const separator = error.indexOf(": ");
    if (separator === -1) return true;
    const errorPath = error.slice(0, separator).replace(/\\/g, "/");
    const rules = byPath.get(errorPath);
    if (!rules) return true;
    for (const rule of rules) {
      if (error.includes(`[${rule}]`)) return false;
    }
    return true;
  });
}

export function loadRenderedGateAllowlist() {
  // リポジトリルート基準で許可リストを読む
  const candidate = path.join(process.cwd(), ALLOWLIST_FILE);
  return fs.existsSync(candidate)
    ? parseRenderedGateAllowlist(fs.readFileSync(candidate, "utf8"))
    : [];
}
