import fs from "node:fs";
import path from "node:path";

export const MAX_EXTERNAL_EMBEDS_PER_PAGE = 3;

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

function componentNames(source) {
  const names = new Set(["ExternalEmbed"]);
  const frontmatter = source.match(/^---\s*([\s\S]*?)\s*---/);
  if (!frontmatter) return names;

  const importPattern =
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+["'][^"']*\/ExternalEmbed\.astro["']/g;
  for (const match of frontmatter[1].matchAll(importPattern)) {
    names.add(match[1]);
  }
  return names;
}

function skipTag(source, start) {
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

export function countExternalEmbedTags(source) {
  const names = componentNames(source);
  let count = 0;
  let index = 0;

  if (source.startsWith("---")) {
    const frontmatterEnd = source.indexOf("\n---", 3);
    index = frontmatterEnd === -1 ? source.length : frontmatterEnd + 4;
  }

  while (index < source.length) {
    if (source.startsWith("<!--", index)) {
      const commentEnd = source.indexOf("-->", index + 4);
      index = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    if (source[index] !== "<" || source[index + 1] === "/") {
      index += 1;
      continue;
    }

    const tagMatch = source.slice(index + 1).match(/^([A-Za-z_$][\w$]*)/);
    if (!tagMatch) {
      index += 1;
      continue;
    }

    const name = tagMatch[1];
    const boundary = source[index + 1 + name.length];
    if (
      names.has(name) &&
      (boundary === undefined ||
        /\s|\/>|>/.test(
          source.slice(index + 1 + name.length, index + 3 + name.length),
        ))
    ) {
      count += 1;
    }

    index = skipTag(source, index + 1 + name.length);
  }

  return count;
}

export function validateExternalEmbedSources(sources) {
  const violations = [];
  for (const { filePath, source } of sources) {
    const count = countExternalEmbedTags(source);
    if (/(^|[\\/])src[\\/]components[\\/]/.test(filePath) && count > 0) {
      violations.push(
        `${filePath}: external embeds must be declared directly in a page so the per-page limit cannot be bypassed by a wrapper`,
      );
      continue;
    }
    if (count > MAX_EXTERNAL_EMBEDS_PER_PAGE) {
      violations.push(
        `${filePath}: external embed limit exceeded: found ${count}, maximum is ${MAX_EXTERNAL_EMBEDS_PER_PAGE}`,
      );
    }
  }
  return violations;
}

export function validateExternalEmbedDirectory(directory = "src/pages") {
  const sources = astroFiles(directory).map((filePath) => ({
    filePath,
    source: fs.readFileSync(filePath, "utf8"),
  }));
  const errors = validateExternalEmbedSources(sources);
  const componentSources = astroFiles("src/components")
    .filter((filePath) => !filePath.endsWith(`${path.sep}ExternalEmbed.astro`))
    .map((filePath) => ({
      filePath,
      source: fs.readFileSync(filePath, "utf8"),
    }));

  errors.push(...validateExternalEmbedSources(componentSources));

  return errors;
}
