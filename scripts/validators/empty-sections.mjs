// 空セクション検出（#702 で分離）。自作トークナイザは将来の置換対象。

import { findTagEnd } from "./html-parse.mjs";

export const STRUCTURAL_CLOSING_TAGS = new Set([
  "main",
  "article",
  "section",
  "details",
  "body",
  "html",
]);

function summaryRanges(html) {
  const ranges = [];
  for (const match of html.matchAll(
    /<summary\b[^>]*>[\s\S]*?<\/summary\s*>/gi,
  )) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function skipWhitespaceAndComments(html, index) {
  let current = index;
  while (current < html.length) {
    const whitespace = /^\s*/.exec(html.slice(current));
    current += whitespace[0].length;
    if (!html.startsWith("<!--", current)) break;
    const commentEnd = html.indexOf("-->", current + 4);
    if (commentEnd === -1) return html.length;
    current = commentEnd + 3;
  }
  return current;
}

function nextMeaningfulToken(html, index) {
  const current = skipWhitespaceAndComments(html, index);
  if (current >= html.length) return { type: "end" };
  if (html[current] !== "<") return { type: "text" };

  const tagMatch = html.slice(current).match(/^<(\/?)\s*([A-Za-z][\w:-]*)/);
  if (!tagMatch) return { type: "text" };

  const closing = tagMatch[1] === "/";
  const tagName = tagMatch[2].toLowerCase();
  if (closing) return { type: "closingTag", name: tagName };
  if (/^h[1-6]$/.test(tagName)) return { type: "heading", name: tagName };

  const tagEnd = findTagEnd(html, current + tagMatch[0].length);
  if (typeof tagEnd === "number") {
    const afterOpen = skipWhitespaceAndComments(html, tagEnd);
    if (new RegExp(`^</${tagName}\\s*>`).test(html.slice(afterOpen))) {
      return { type: "emptyElement", name: tagName };
    }
  }
  return { type: "openingTag", name: tagName };
}

export function findEmptySections(html) {
  const summaries = summaryRanges(html);
  const sections = [];
  const headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi;
  for (const match of html.matchAll(headingPattern)) {
    const start = match.index;
    if (summaries.some(([from, to]) => start >= from && start < to)) continue;
    const token = nextMeaningfulToken(html, start + match[0].length);
    const isEmpty =
      token.type === "end" ||
      token.type === "heading" ||
      (token.type === "closingTag" &&
        STRUCTURAL_CLOSING_TAGS.has(token.name)) ||
      token.type === "emptyElement";
    if (isEmpty) {
      sections.push({
        level: Number(match[1]),
        heading: match[2].trim(),
        start,
      });
    }
  }
  return sections;
}
