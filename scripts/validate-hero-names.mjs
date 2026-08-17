import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function astroFiles(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...astroFiles(current));
    else if (entry.isFile() && current.endsWith(".astro")) files.push(current);
  }

  return files;
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function occurrences(text, needle) {
  let count = 0;
  let index = text.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(needle, index + needle.length);
  }
  return count;
}

/**
 * HeroComparison は `<span>{brand}</span> {line}` の順で描画するため、
 * brand 側（product）が line を既に含むと「ベビービョルン クレードル クレードル」の
 * ような商品名重複になる。product はブランド名のみを持たせる。
 */
export function heroNameDuplicationViolations(sources) {
  const violations = [];
  for (const { filePath, source } of sources) {
    const productPattern = /product:\s*'([^']*)'/g;
    let productMatch;
    while ((productMatch = productPattern.exec(source)) !== null) {
      const product = productMatch[1];
      const searchFrom = productMatch.index + productMatch[0].length;
      const window = source.slice(searchFrom, searchFrom + 200);
      const lineMatch = window.match(/line:\s*'([^']*)'/);
      if (!lineMatch) continue;
      const nextProduct = window.search(/product:\s*'/);
      if (nextProduct !== -1 && (lineMatch.index ?? 0) > nextProduct) {
        continue; // 次の product より後ろの line は別候補のもの
      }
      const line = lineMatch[1];
      const rendered = `${product} ${line}`;
      if (line.length >= 2 && occurrences(rendered, line) >= 2) {
        violations.push(
          `${filePath}:${lineNumber(source, productMatch.index)}: hero name duplication: product "${product}" already contains line "${line}"; use the brand name for product`,
        );
      }
    }
  }
  return violations;
}

export function validateHeroNamesDirectory(directory = "src/pages/articles") {
  const sources = astroFiles(directory).map((filePath) => ({
    filePath,
    source: fs.readFileSync(filePath, "utf8"),
  }));
  return heroNameDuplicationViolations(sources);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const errors = validateHeroNamesDirectory();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("hero names ok: no product/line duplication");
}
