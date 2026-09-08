/**
 * scripts/validators/empty-sections.mjs
 *
 * 見出しの直後に本文が無い「空セクション」の検出。
 * 自作トークナイザの代わりに DOM 走査を使う。
 * 戻り値の形状（{ level, heading, start }）は従来どおり。
 */
import { parseDocument } from "./html-dom.mjs";

const STRUCTURAL_CLOSING_TAGS = new Set([
  "main",
  "article",
  "section",
  "details",
  "body",
  "html",
]);

function isInSummary(element) {
  let current = element.parentNode;
  while (current) {
    if (current.tagName?.toLowerCase() === "summary") return true;
    current = current.parentNode;
  }
  return false;
}

function nextMeaningfulSibling(element) {
  let sibling = element.nextSibling;
  while (sibling) {
    if (sibling.nodeType === 3) {
      if (sibling.text.trim() !== "") return { type: "text" };
      sibling = sibling.nextSibling;
      continue;
    }
    if (sibling.nodeType === 8) {
      sibling = sibling.nextSibling;
      continue;
    }
    if (sibling.nodeType === 1) {
      const tagName = sibling.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tagName)) return { type: "heading", name: tagName };
      if (
        sibling.text.trim() === "" &&
        sibling.querySelectorAll("*").length === 0
      ) {
        return { type: "emptyElement", name: tagName };
      }
      return { type: "openingTag", name: tagName };
    }
    sibling = sibling.nextSibling;
  }
  // 親を遡り、構造的閉じタグの直後かどうかを判定する。
  let current = element;
  let parent = element.parentNode;
  while (parent && parent.nodeType === 1) {
    const parentTag = parent.tagName.toLowerCase();
    let after = current.nextSibling;
    let trailingOnly = true;
    while (after) {
      if (after.nodeType === 3 && after.text.trim() !== "") {
        trailingOnly = false;
        break;
      }
      if (after.nodeType === 1) {
        trailingOnly = false;
        break;
      }
      after = after.nextSibling;
    }
    if (!trailingOnly) return { type: "openingTag", name: parentTag };
    if (STRUCTURAL_CLOSING_TAGS.has(parentTag)) {
      return { type: "closingTag", name: parentTag };
    }
    current = parent;
    parent = parent.parentNode;
  }
  return { type: "end" };
}

// 見出しの直後に本文（テキスト・要素）が無い「空セクション」を検出する。
// 次のいずれかに該当する見出しを空セクションとみなす。
// - 見出しの直後に別の見出し（h1〜h6）が続く
// - 見出しの直後に構造的な閉じタグ（main / article / section / details / body / html）が続く
// - 見出しの直後に空要素（例: <p></p>）が続く
// - 見出しが文書末尾にある
// FAQ の <summary><h3>…</h3></summary> は見出しの直後に閉じタグが来るが、
// summary 自体が本文を持つため検出対象から除外する。
export function findEmptySections(html) {
  const root = parseDocument(html);
  const sections = [];
  const headings = root.querySelectorAll("h1,h2,h3,h4,h5,h6");
  for (const heading of headings) {
    if (isInSummary(heading)) continue;
    const token = nextMeaningfulSibling(heading);
    const isEmpty =
      token.type === "end" ||
      token.type === "heading" ||
      (token.type === "closingTag" &&
        STRUCTURAL_CLOSING_TAGS.has(token.name)) ||
      token.type === "emptyElement";
    if (isEmpty) {
      sections.push({
        level: Number(heading.tagName[1]),
        heading: heading.text.trim(),
        start: -1,
      });
    }
  }
  return sections;
}
