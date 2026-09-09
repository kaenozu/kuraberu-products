// HTML走査の最小プリミティブ（#702 で check-rendered-html.mjs から分離）。

import fs from "node:fs";
import path from "node:path";

export function walk(directory, htmlFiles) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current, htmlFiles);
    else if (current.endsWith(".html")) htmlFiles.push(current);
  }
}

export function findTagEnd(source, start) {
  let quote = null;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      // HTML属性値ではバックスラッシュはエスケープ文字ではない。
      // バックスラッシュによるクォート無効化チェックは行わない。
      // サロゲートペアの末尾も正しく処理される。
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  return { end: source.length, closed: false };
}

export function findTagEndWithStatus(source, start) {
  const tagEnd = findTagEnd(source, start);
  if (typeof tagEnd === "number") {
    return { end: tagEnd, closed: true };
  }
  return tagEnd;
}

export function inspectAttributes(tag, tagName) {
  let index = 1 + tagName.length;
  while (index < tag.length) {
    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (index >= tag.length || tag[index] === ">") {
      return { hasExternalEmbed: false, malformed: !tag.endsWith(">") };
    }
    if (tag[index] === "/") {
      if (tag[index + 1] === ">")
        return { hasExternalEmbed: false, malformed: false };
      index += 1;
      continue;
    }

    const nameStart = index;
    while (index < tag.length && !/[\s=/>]/.test(tag[index] ?? "")) {
      index += 1;
    }
    if (index === nameStart) {
      index += 1;
      continue;
    }
    const name = tag.slice(nameStart, index).toLowerCase();
    if (name === "data-external-embed") {
      return { hasExternalEmbed: true, malformed: !tag.endsWith(">") };
    }

    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (tag[index] !== "=") continue;
    index += 1;
    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (index >= tag.length) {
      return { hasExternalEmbed: false, malformed: true };
    }
    if (tag[index] === '"' || tag[index] === "'") {
      const quote = tag[index];
      index += 1;
      while (index < tag.length && tag[index] !== quote) index += 1;
      if (index >= tag.length) {
        return { hasExternalEmbed: false, malformed: true };
      }
      index += 1;
    } else {
      while (index < tag.length && !/[\s>]/.test(tag[index] ?? "")) {
        index += 1;
      }
    }
  }
  return { hasExternalEmbed: false, malformed: !tag.endsWith(">") };
}

export function internalTarget(href, distDirectory) {
  let pathname = href.split("#")[0].split("?")[0];
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    /* ignore malformed URIs */
  }
  if (!pathname || !pathname.startsWith("/")) return null;
  if (pathname === "/") return path.join(distDirectory, "index.html");
  if (path.extname(pathname)) return path.join(distDirectory, pathname);
  return path.join(distDirectory, pathname, "index.html");
}
