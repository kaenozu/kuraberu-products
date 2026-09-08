/**
 * scripts/validators/embeds.mjs
 *
 * レンダリング済み HTML の外部埋め込み数ゲート。
 * 自作トークナイザの代わりに DOM (html-dom.mjs) で数え、
 * 不正検出だけは文字列走査で行う（寛容パーサでは潰れるため）。
 * エラーメッセージ形式は従来どおり。
 */
import { MAX_EXTERNAL_EMBEDS_PER_PAGE } from "../external-embed-limit.mjs";
import {
  hasUnclosedTagOrScript,
  hasUnterminatedComment,
  parseDocument,
} from "./html-dom.mjs";

function inspectRenderedExternalEmbeds(html) {
  let malformed = false;
  let malformedReason;
  if (hasUnterminatedComment(html)) {
    malformed = true;
    malformedReason = "unterminated HTML comment";
  } else if (hasUnclosedTagOrScript(html)) {
    malformed = true;
  }
  let count = 0;
  if (!malformed) {
    count = parseDocument(html).querySelectorAll(
      "[data-external-embed]",
    ).length;
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
