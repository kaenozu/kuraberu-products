import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SOURCE_EXTENSIONS = new Set([".astro", ".html", ".js", ".mjs", ".ts", ".tsx"]);
const CSS_EXTENSIONS = new Set([".css"]);
const DYNAMIC_CLASS_PATTERNS = [
  /^status-(official|retailer|insufficient|unverified)$/,
  /^product-(premium|standard)$/,
  /^external-embed-(x|youtube|tiktok|pinterest)$/,
  /^(is|has)-[a-z0-9-]+$/,
];

function walk(directory, predicate, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current, predicate, files);
    else if (predicate(current)) files.push(current);
  }
  return files;
}

function extractCssClasses(css) {
  const classes = new Set();
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of withoutComments.matchAll(/(^|[^a-zA-Z0-9_-])\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)) {
    classes.add(match[2]);
  }
  return classes;
}

function sourceMentionsClass(source, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = new RegExp(`(^|[^a-zA-Z0-9_-])${escaped}([^a-zA-Z0-9_-]|$)`);
  return boundary.test(source);
}

export function createCssUsageReport({ root = process.cwd() } = {}) {
  const srcDirectory = path.join(root, "src");
  const cssFiles = walk(srcDirectory, (file) => CSS_EXTENSIONS.has(path.extname(file)));
  const sourceFiles = walk(srcDirectory, (file) => SOURCE_EXTENSIONS.has(path.extname(file)));
  const sourceText = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const classes = new Map();

  for (const file of cssFiles) {
    const css = fs.readFileSync(file, "utf8");
    for (const className of extractCssClasses(css)) {
      const entry = classes.get(className) ?? { className, cssFiles: [] };
      entry.cssFiles.push(path.relative(root, file).split(path.sep).join("/"));
      classes.set(className, entry);
    }
  }

  const selectors = [...classes.values()]
    .map((entry) => {
      const dynamic = DYNAMIC_CLASS_PATTERNS.some((pattern) => pattern.test(entry.className));
      const referenced = dynamic || sourceMentionsClass(sourceText, entry.className);
      return { ...entry, dynamic, referenced };
    })
    .sort((left, right) => left.className.localeCompare(right.className));

  const unused = selectors.filter((selector) => !selector.referenced);
  return {
    generatedAt: new Date().toISOString(),
    cssFiles: cssFiles.map((file) => path.relative(root, file).split(path.sep).join("/")),
    sourceFileCount: sourceFiles.length,
    selectorCount: selectors.length,
    referencedCount: selectors.length - unused.length,
    unusedCount: unused.length,
    unused,
    selectors,
  };
}

export function printCssUsageReport(report) {
  console.log(`CSS files: ${report.cssFiles.length}`);
  console.log(`Source files: ${report.sourceFileCount}`);
  console.log(`Class selectors: ${report.selectorCount}`);
  console.log(`Referenced/dynamic: ${report.referencedCount}`);
  console.log(`Unused candidates: ${report.unusedCount}`);
  for (const selector of report.unused) {
    console.log(`- .${selector.className} (${selector.cssFiles.join(", ")})`);
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  const report = createCssUsageReport();
  printCssUsageReport(report);
  const output = process.env.CSS_USAGE_REPORT;
  if (output) fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
