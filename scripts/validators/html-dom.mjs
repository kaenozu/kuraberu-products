/**
 * scripts/validators/html-dom.mjs
 *
 * check-rendered-html 系ゲートの共用 DOM 層。
 * 自作トークナイザ (findTagEnd 系) の置換先として node-html-parser を使う。
 * node-html-parser は pure JS・依存は entities/css-select のみで
 * ネイティブ依存が無いため、pnpm-workspace.yaml の
 * onlyBuiltDependencies 許可対象の追加は不要。
 * (supply-chain: MIT、fb55 系の定番軽量パーサ)
 */
import { parse } from "node-html-parser";

/**
 * HTML を DOM としてパースする。コメントは保持する
 * （埋め込み数カウントでコメント内を除外するため）。
 */
export function parseDocument(html) {
  return parse(html, {
    comment: true,
    blockTextElements: {
      script: true,
      noscript: true,
      style: true,
      pre: true,
    },
  });
}

/**
 * 終端していない HTML コメント（`<!--` に対応する `-->` が無い）が
 * あるかを判定する。コメントで埋め込みを隠す回避策の検出用。
 */
export function hasUnterminatedComment(html) {
  let index = 0;
  while (true) {
    const open = html.indexOf("<!--", index);
    if (open === -1) return false;
    const close = html.indexOf("-->", open + 4);
    if (close === -1) return true;
    index = close + 3;
  }
}

/**
 * 閉じていないタグ・script/style 要素があるかを判定する。
 * node-html-parser は寛容にパースするため、不正検出は文字列走査で行う。
 * - EOF までに `>` で閉じない `<tag ...`
 * - 閉じタグの無い `<script` / `<style`
 */
export function hasUnclosedTagOrScript(html) {
  const tagOpen = html.match(/<[A-Za-z][^<>]*$/);
  if (tagOpen) return true;
  for (const tagName of ["script", "style"]) {
    const openPattern = new RegExp(`<${tagName}(?:\\s|>|\/)`, "i");
    const closePattern = new RegExp(`<\\/${tagName}(?:\\s|>)`, "i");
    if (openPattern.test(html) && !closePattern.test(html)) return true;
  }
  return false;
}
