import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_EXTERNAL_EMBEDS_PER_PAGE } from "./external-embed-limit.mjs";

function walk(directory, htmlFiles) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current, htmlFiles);
    else if (current.endsWith(".html")) htmlFiles.push(current);
  }
}

function findTagEnd(source, start) {
  let quote = null;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote && source[index - 1] !== "\\") quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  return source.length;
}

function hasAttribute(tag, tagName) {
  let index = 1 + tagName.length;
  while (index < tag.length) {
    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (tag[index] === ">" || tag[index] === "/") return false;

    const nameStart = index;
    while (!/[\s=/>]/.test(tag[index] ?? "")) index += 1;
    const name = tag.slice(nameStart, index).toLowerCase();
    if (name === "data-external-embed") return true;

    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (tag[index] !== "=") continue;
    index += 1;
    while (/\s/.test(tag[index] ?? "")) index += 1;
    if (tag[index] === '"' || tag[index] === "'") {
      const quote = tag[index];
      index += 1;
      while (index < tag.length && tag[index] !== quote) index += 1;
      index += 1;
    } else {
      while (!/[\s>]/.test(tag[index] ?? "")) index += 1;
    }
  }
  return false;
}

export function countRenderedExternalEmbeds(html) {
  let count = 0;
  let index = 0;

  while (index < html.length) {
    if (html.startsWith("<!--", index)) {
      const commentEnd = html.indexOf("-->", index + 4);
      index = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }
    if (html[index] !== "<") {
      index += 1;
      continue;
    }

    const tagMatch = html.slice(index).match(/^<([A-Za-z][\w:-]*)/);
    if (!tagMatch) {
      index += 1;
      continue;
    }

    const tagName = tagMatch[1].toLowerCase();
    const tagEnd = findTagEnd(html, index + tagMatch[0].length);
    const tag = html.slice(index, tagEnd);
    const isClosingTag = html[index + 1] === "/";

    if (!isClosingTag && hasAttribute(tag, tagName)) count += 1;

    if (!isClosingTag && (tagName === "script" || tagName === "style")) {
      const closingTag = new RegExp(`<\\/${tagName}\\s*>`, "i").exec(
        html.slice(tagEnd),
      );
      index = closingTag ? tagEnd + closingTag.index : html.length;
      continue;
    }
    index = tagEnd;
  }

  return count;
}

export function validateRenderedExternalEmbedCounts(
  files,
  maximum = MAX_EXTERNAL_EMBEDS_PER_PAGE,
) {
  return files.flatMap(({ filePath, html }) => {
    const count = countRenderedExternalEmbeds(html);
    return count > maximum
      ? [
          `${filePath}: rendered external embed limit exceeded: found ${count}, maximum is ${maximum}`,
        ]
      : [];
  });
}

function internalTarget(href, distDirectory) {
  const pathname = href.split("#")[0].split("?")[0];
  if (!pathname || !pathname.startsWith("/")) return null;
  if (pathname === "/") return path.join(distDirectory, "index.html");
  if (path.extname(pathname)) return path.join(distDirectory, pathname);
  return path.join(distDirectory, pathname, "index.html");
}

export function validateRenderedHtml({ distDirectory = "dist" } = {}) {
  const htmlFiles = [];
  walk(distDirectory, htmlFiles);
  htmlFiles.sort();
  const errors = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const mainCount = (html.match(/<main(?:\s|>)/g) ?? []).length;
    const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;

    if (mainCount !== 1)
      errors.push(`${file}: expected one main, found ${mainCount}`);
    if (h1Count !== 1)
      errors.push(`${file}: expected one h1, found ${h1Count}`);
    if (
      !/<meta name="robots" content="(?:index,follow|noindex,nofollow)"/.test(
        html,
      )
    ) {
      errors.push(`${file}: missing robots metadata`);
    }
    if (!/<link rel="canonical" href="https:\/\//.test(html)) {
      errors.push(`${file}: missing HTTPS canonical`);
    }
    if (html.includes("kuraberu-ikuji.pages.dev")) {
      errors.push(`${file}: contains obsolete site URL`);
    }

    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const target = internalTarget(match[1], distDirectory);
      if (target && !fs.existsSync(target)) {
        errors.push(`${file}: broken internal link ${match[1]}`);
      }
    }
  }

  errors.push(
    ...validateRenderedExternalEmbedCounts(
      htmlFiles.map((filePath) => ({
        filePath,
        html: fs.readFileSync(filePath, "utf8"),
      })),
    ),
  );

  const embedPage = path.join(
    distDirectory,
    "articles",
    "pampers-newborn",
    "index.html",
  );
  if (fs.existsSync(embedPage)) {
    const html = fs.readFileSync(embedPage, "utf8");
    const thirdPartyScript = [
      ...html.matchAll(/<script[^>]+\bsrc=["']([^"']+)/gi),
    ].some(([, src]) => /^(?:https?:)?\/\//i.test(src));
    const thirdPartyIframe = /<iframe(?:\s|>)/i.test(html);
    const preconnect = /<link[^>]+rel=["']?preconnect/i.test(html);

    if (thirdPartyScript)
      errors.push(`${embedPage}: third-party script tag in initial HTML`);
    if (thirdPartyIframe)
      errors.push(`${embedPage}: iframe tag in initial HTML`);
    if (preconnect) errors.push(`${embedPage}: preconnect in initial HTML`);
  }

  return { errors, pageCount: htmlFiles.length };
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const { errors, pageCount } = validateRenderedHtml();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`rendered html ok: ${pageCount} pages`);
}
