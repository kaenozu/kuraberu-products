// 外部embed（同意ゲート）のレンダリング検査（#702 で分離）。

import { findTagEndWithStatus, inspectAttributes } from "./html-parse.mjs";
import { MAX_EXTERNAL_EMBEDS_PER_PAGE } from "../external-embed-limit.mjs";

function inspectRenderedExternalEmbeds(html) {
  let count = 0;
  let index = 0;
  let malformed = false;
  let malformedReason;

  while (index < html.length) {
    if (html.startsWith("<!--", index)) {
      const commentEnd = html.indexOf("-->", index + 4);
      if (commentEnd === -1) {
        malformed = true;
        malformedReason = "unterminated HTML comment";
      }
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
    const tagEndInfo = findTagEndWithStatus(html, index + tagMatch[0].length);
    const tag = html.slice(index, tagEndInfo.end);
    const isClosingTag = html[index + 1] === "/";

    if (!tagEndInfo.closed) malformed = true;
    if (!isClosingTag) {
      const attributes = inspectAttributes(tag, tagName);
      if (attributes.hasExternalEmbed) count += 1;
      if (attributes.malformed) malformed = true;
    }

    if (!isClosingTag && (tagName === "script" || tagName === "style")) {
      const closingTag = new RegExp(`<\\/${tagName}\\s*>`, "i").exec(
        html.slice(tagEndInfo.end),
      );
      if (!closingTag) malformed = true;
      index = closingTag ? tagEndInfo.end + closingTag.index : html.length;
      continue;
    }
    const nextIndex = tagEndInfo.end;
    index = nextIndex > index ? nextIndex : index + 1;
  }

  return { count, malformed, malformedReason };
}

export function countRenderedExternalEmbeds(html) {
  return inspectRenderedExternalEmbeds(html).count;
}

export function validateRenderedExternalEmbedCounts(
  files,
  maximum = MAX_EXTERNAL_EMBEDS_PER_PAGE,
) {
  return files.flatMap(({ filePath, html }) => {
    const result = inspectRenderedExternalEmbeds(html);
    const errors = result.malformed
      ? [
          `${filePath}: malformed rendered HTML while checking external embeds${
            result.malformedReason ? `: ${result.malformedReason}` : ""
          }`,
        ]
      : [];
    if (result.count > maximum) {
      errors.push(
        `${filePath}: rendered external embed limit exceeded: found ${result.count}, maximum is ${maximum}`,
      );
    }
    return errors;
  });
}
