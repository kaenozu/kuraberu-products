#!/usr/bin/env node
/**
 * scripts/article-add.mjs — Article Scaffold v1 (Step 1)
 *
 * 使い方:
 *   pnpm article:add articles/new/panasonic-ne-ms4c-vs-ne-bs5c.yaml
 *   node scripts/article-add.mjs <input.yaml> [--check] [--root <dir>]
 *
 * YAML 1ファイルから次を生成する:
 *   - src/content/articles/<slug>.ts (defineArticleMetadata)
 *   - src/pages/articles/<slug>/index.astro (articleId 1行ページ)
 *   - src/content/articles/index.ts の export / import / 配列への登録
 *   - src/content/articles.ts (互換shim) への export 登録
 *
 * 事実部分 (仕様差・おすすめ理由・FAQ回答) は生成しない。
 * YAMLに渡された検証済み情報だけを並べ替え、定型文はサイト標準の
 * ボイラープレートに限定する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** slug から export const 名を導出する (例: panasonic-ne-ms4c-vs-ne-bs5c → panasonicNeMs4cVsNeBs5cArticle) */
export function slugToConstName(slug) {
  const camel = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const head = camel.charAt(0).toLowerCase() + camel.slice(1);
  return `${head}Article`;
}

function isValidCalendarDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * YAML入力を検証する。root は存在チェック用 (テストでは一時ディレクトリを渡す)。
 * 戻り値 { errors, warnings }。errors が空なら生成可能。
 */
export function validateInput(input, { root = process.cwd() } = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(input)) {
    return { errors: ["YAML root must be a mapping"], warnings };
  }

  if (!isNonEmptyString(input.slug) || !SLUG_PATTERN.test(input.slug)) {
    errors.push(
      "slug must match /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/ (lowercase alphanumeric and hyphens)",
    );
  } else if (input.slug.length > 80) {
    errors.push("slug must be 80 characters or fewer");
  }
  if (!isNonEmptyString(input.category)) {
    errors.push("category is required");
  }

  for (const side of ["left", "right"]) {
    const model = input[side];
    if (!isPlainObject(model)) {
      errors.push(`${side} must be a mapping`);
      continue;
    }
    for (const field of ["brand", "model", "officialUrl", "image", "tagline"]) {
      if (!isNonEmptyString(model[field])) {
        errors.push(`${side}.${field} is required`);
      }
    }
    if (isNonEmptyString(model.officialUrl) && !isHttpsUrl(model.officialUrl)) {
      errors.push(`${side}.officialUrl must be an https:// URL`);
    }
    if (
      isNonEmptyString(model.officialUrl) &&
      /example\.com|placeholder/i.test(model.officialUrl)
    ) {
      warnings.push(`${side}.officialUrl looks like a placeholder URL`);
    }
    if (isNonEmptyString(model.image) && !model.image.startsWith("/")) {
      errors.push(`${side}.image must be a root-relative path (start with /)`);
    }
    if (!Array.isArray(model.guidePoints) || model.guidePoints.length === 0) {
      errors.push(`${side}.guidePoints must contain at least one entry`);
    } else if (model.guidePoints.some((point) => !isNonEmptyString(point))) {
      errors.push(`${side}.guidePoints must not contain empty entries`);
    }
  }
  if (
    isPlainObject(input.left) &&
    isPlainObject(input.right) &&
    isNonEmptyString(input.left.model) &&
    input.left.model === input.right.model
  ) {
    errors.push("left.model and right.model must differ");
  }

  if (!Array.isArray(input.differences) || input.differences.length === 0) {
    errors.push("differences must contain at least one row");
  } else {
    input.differences.forEach((row, index) => {
      if (!isPlainObject(row)) {
        errors.push(`differences[${index}] must be a mapping`);
        return;
      }
      for (const field of ["label", "left", "right"]) {
        if (!isNonEmptyString(row[field])) {
          errors.push(`differences[${index}].${field} is required`);
        }
      }
      if (
        row.highlight !== undefined &&
        row.highlight !== "left" &&
        row.highlight !== "right"
      ) {
        errors.push(
          `differences[${index}].highlight must be "left" or "right"`,
        );
      }
    });
  }

  if (!Array.isArray(input.faq) || input.faq.length === 0) {
    errors.push("faq must contain at least one entry");
  } else {
    input.faq.forEach((entry, index) => {
      if (!isPlainObject(entry)) {
        errors.push(`faq[${index}] must be a mapping`);
        return;
      }
      if (!isNonEmptyString(entry.question)) {
        errors.push(`faq[${index}].question is required`);
      }
      if (!isNonEmptyString(entry.answer)) {
        errors.push(`faq[${index}].answer is required`);
      }
    });
  }

  if (
    !isNonEmptyString(input.checkedAt) ||
    !isValidCalendarDate(input.checkedAt)
  ) {
    errors.push("checkedAt must be an ISO 8601 calendar date (YYYY-MM-DD)");
  } else if (input.checkedAt > todayLocalDate()) {
    errors.push(`checkedAt (${input.checkedAt}) must not be a future date`);
  }

  // 既存記事との重複チェック
  if (isNonEmptyString(input.slug)) {
    const articleFile = path.join(
      root,
      "src",
      "content",
      "articles",
      `${input.slug}.ts`,
    );
    const pageDir = path.join(root, "src", "pages", "articles", input.slug);
    if (fs.existsSync(articleFile)) {
      errors.push(`src/content/articles/${input.slug}.ts already exists`);
    }
    if (fs.existsSync(pageDir)) {
      errors.push(`src/pages/articles/${input.slug}/ already exists`);
    }
    const indexFile = path.join(root, "src", "content", "articles", "index.ts");
    if (fs.existsSync(indexFile)) {
      const indexSource = fs.readFileSync(indexFile, "utf-8");
      if (indexSource.includes(`"/articles/${input.slug}/"`)) {
        errors.push(
          `article path /articles/${input.slug}/ is already registered`,
        );
      }
    }
    const constName = slugToConstName(input.slug);
    const shimFile = path.join(root, "src", "content", "articles.ts");
    if (fs.existsSync(shimFile)) {
      const shimSource = fs.readFileSync(shimFile, "utf-8");
      if (shimSource.includes(constName)) {
        errors.push(`${constName} is already exported from articles.ts shim`);
      }
    }
  }

  // 画像の存在チェックは警告に留める (画像は後から追加できる)
  for (const side of ["left", "right"]) {
    const image = input[side]?.image;
    if (isNonEmptyString(image) && image.startsWith("/")) {
      const publicPath = path.join(root, "public", image.replace(/^\//, ""));
      if (!fs.existsSync(publicPath)) {
        warnings.push(`${side}.image ${image} not found under public/`);
      }
    }
  }

  return { errors, warnings };
}

/** ダブルクォートJS文字列リテラルに変換する */
function jsString(value) {
  return JSON.stringify(value);
}

function renderSide(side, brand, productType) {
  const guidePoints =
    side.guidePoints.length === 1
      ? `    guidePoints: [${jsString(side.guidePoints[0])}],`
      : `    guidePoints: [\n${side.guidePoints.map((point) => `      ${jsString(point)},`).join("\n")}\n    ],`;
  const lines = [
    `    brand: ${jsString(brand)},`,
    `    line: ${jsString(side.model)},`,
    `    tagline: ${jsString(side.tagline)},`,
    `    image: ${jsString(side.image)},`,
    `    imageAlt: ${jsString(`${brand} ${productType} ${side.model}`)},`,
    `    officialHref: ${jsString(side.officialUrl)},`,
    guidePoints,
  ];
  return lines.join("\n");
}

function renderDiffRow(row) {
  const lines = [
    `    {`,
    `      label: ${jsString(row.label)},`,
    `      left: ${jsString(row.left)},`,
    `      right: ${jsString(row.right)},`,
  ];
  if (row.highlight === "left" || row.highlight === "right") {
    lines.push(`      highlight: ${jsString(row.highlight)},`);
  }
  if (isNonEmptyString(row.highlightNote)) {
    lines.push(`      highlightNote: ${jsString(row.highlightNote)},`);
  }
  lines.push(`    },`);
  return lines.join("\n");
}

/** 検証済みYAMLから記事TSを描画する。事実はYAML由来のみ、定型文はボイラープレートのみ。 */
export function renderArticleTs(input) {
  const slug = input.slug;
  const constName = slugToConstName(slug);
  const brand = input.left.brand;
  const leftModel = input.left.model;
  const rightModel = input.right.model;
  const productType = isNonEmptyString(input.productType)
    ? input.productType
    : input.category;
  const labels = input.differences.map((row) => row.label).join("・");
  const uniqueTags = [...new Set([brand, input.category])];

  return `import { defineArticleMetadata } from "./types";

export const ${constName} = defineArticleMetadata({
  id: ${jsString(slug)},
  productCount: 2,
  path: "/articles/${slug}/",
  title: ${jsString(`${brand} ${leftModel}と${rightModel}、どっち？｜くらべる商品メモ`)},
  headline: ${jsString(`${brand}の${productType}「${leftModel}」と「${rightModel}」を比較`)},
  description: ${jsString(`${brand} ${leftModel}と${rightModel}を、公式の${labels}で比較`)},
  category: ${jsString(input.category)},
  tags: [${uniqueTags.map((tag) => jsString(tag)).join(", ")}],
  audiences: [${jsString(`${input.category}を選びたい人`)}, ${jsString(`${leftModel}と${rightModel}を比べたい人`)}],
  uses: [${jsString("仕様で選ぶ")}, ${jsString(`${input.category}を比べる`)}],
  summary: ${jsString(`${leftModel}と${rightModel}を、${brand}公式の${labels}に分けて比較します。`)},
  publishedAt: ${jsString(input.checkedAt)},
  modifiedAt: ${jsString(input.checkedAt)},
  productInfoCheckedAt: ${jsString(input.checkedAt)},
  purchaseLinksCheckedAt: ${jsString(input.checkedAt)},
  purchaseLinkStatus: "unverified",
  imagePath: ${jsString(input.left.image)},
  aboutProductNames: [${jsString(`${brand} ${leftModel}`)}, ${jsString(`${brand} ${rightModel}`)}],
  leftModel: {
${renderSide(input.left, brand, productType)}
  },
  rightModel: {
${renderSide(input.right, brand, productType)}
  },
  keyDiffRows: [
${input.differences.map(renderDiffRow).join("\n")}
  ],
  lead: ${jsString(`${brand}の${productType}「${leftModel}」と「${rightModel}」を、公式の商品・仕様ページで確認できる${labels}に分けて比較します。`)},
  summaryParagraph: ${jsString(`違いを確認して重視するポイントに合う方を選んでください。価格・在庫は販売先でご確認ください。`)},
  officialDescription: ${jsString(`比較の根拠は、${brand}公式の商品ページで確認した仕様です。`)},
  socialProofQuery: ${jsString(`${brand} ${leftModel} ${rightModel} ${productType}`)},
  faqEntries: [
${input.faq
  .map(
    (entry) =>
      `    {\n      question: ${jsString(entry.question)},\n      answer: ${jsString(entry.answer)},\n    },`,
  )
  .join("\n")}
  ],
  changeLog: [
    {
      date: ${jsString(input.checkedAt)},
      summary: "初回公開。",
    },
  ],
});
`;
}

/** articleId 1行ページを描画する */
export function renderPageAstro(input) {
  return `---
import ArticleComparisonPage from '../../../components/ArticleComparisonPage.astro';
---
<ArticleComparisonPage articleId="${input.slug}" />
`;
}

const INDEX_EXPORT_ANCHOR = "// Commercial article exports";
const INDEX_IMPORT_ANCHOR =
  'import { commercialArticleSeeds, createCommercialArticle } from "./commercial";';
const INDEX_ARRAY_ANCHOR = "  ...additionalCommercialArticles,";
const SHIM_ANCHOR = "  // Commercial article exports";

/** index.ts の3箇所 (export/import/配列) に登録行を挿入する */
export function applyIndexEdits(indexSource, { constName, slug }) {
  if (indexSource.includes(constName)) {
    throw new Error(`${constName} is already registered in articles index`);
  }
  if (indexSource.includes(`/${slug}/`)) {
    throw new Error(
      `/articles/${slug}/ is already registered in articles index`,
    );
  }
  for (const anchor of [
    INDEX_EXPORT_ANCHOR,
    INDEX_IMPORT_ANCHOR,
    INDEX_ARRAY_ANCHOR,
  ]) {
    if (!indexSource.includes(anchor)) {
      throw new Error(`articles index anchor not found: ${anchor}`);
    }
  }
  let next = indexSource.replace(
    INDEX_EXPORT_ANCHOR,
    `export { ${constName} } from "./${slug}";\n\n${INDEX_EXPORT_ANCHOR}`,
  );
  next = next.replace(
    INDEX_IMPORT_ANCHOR,
    `import { ${constName} } from "./${slug}";\n${INDEX_IMPORT_ANCHOR}`,
  );
  next = next.replace(
    INDEX_ARRAY_ANCHOR,
    `  ${constName},\n${INDEX_ARRAY_ANCHOR}`,
  );
  return next;
}

/** 互換shim (src/content/articles.ts) に export を追加する */
export function applyShimEdits(shimSource, { constName }) {
  if (shimSource.includes(constName)) {
    throw new Error(`${constName} is already exported from articles shim`);
  }
  if (!shimSource.includes(SHIM_ANCHOR)) {
    throw new Error(`articles shim anchor not found: ${SHIM_ANCHOR}`);
  }
  return shimSource.replace(SHIM_ANCHOR, `  ${constName},\n${SHIM_ANCHOR}`);
}

/** 生成TSを prettier で正規化する (format:check を素通しさせるため) */
export async function formatTs(source) {
  try {
    const prettier = await import("prettier");
    const format = prettier.format ?? prettier.default?.format;
    if (typeof format !== "function") return { source, formatted: false };
    return {
      source: await format(source, { parser: "typescript" }),
      formatted: true,
    };
  } catch {
    return { source, formatted: false };
  }
}

function printChecklist(items) {
  for (const item of items) {
    console.log(`  ✓ ${item}`);
  }
}

/**
 * YAML → 生成 → (check でなければ) 書き込み。
 * 戻り値 { constName, created, warnings }。
 */
export async function runArticleAdd({ root, yamlPath, check = false }) {
  const absoluteYaml = path.isAbsolute(yamlPath)
    ? yamlPath
    : path.join(root, yamlPath);
  const raw = fs.readFileSync(absoluteYaml, "utf-8");
  const input = YAML.parse(raw);
  const constName =
    isPlainObject(input) && isNonEmptyString(input.slug)
      ? slugToConstName(input.slug)
      : "(unknown)";

  const { errors, warnings } = validateInput(input, { root });
  if (errors.length > 0) {
    console.error(`article:add validation failed for ${yamlPath}:`);
    for (const error of errors) {
      console.error(`  ✗ ${error}`);
    }
    throw new Error(
      `article:add validation failed:\n  - ${errors.join("\n  - ")}`,
    );
  }

  const rendered = renderArticleTs(input);
  const { source: articleTs, formatted } = await formatTs(rendered);
  if (!formatted) {
    warnings.push("prettier unavailable: generated TS left unformatted");
  }
  const pageAstro = renderPageAstro(input);
  const indexFile = path.join(root, "src", "content", "articles", "index.ts");
  const shimFile = path.join(root, "src", "content", "articles.ts");
  const nextIndex = applyIndexEdits(fs.readFileSync(indexFile, "utf-8"), {
    constName,
    slug: input.slug,
  });
  const nextShim = applyShimEdits(fs.readFileSync(shimFile, "utf-8"), {
    constName,
  });

  console.log(`article:add ${input.slug}`);
  printChecklist([
    "slug OK",
    "official URLs are https",
    "no duplicate slug",
    "checkedAt OK",
    "left/right models OK",
    `${input.differences.length} difference rows`,
    `${input.faq.length} faq entries`,
    "metadata validation PASS",
  ]);
  for (const warning of warnings) {
    console.log(`  ! ${warning}`);
  }

  const created = [
    path.join("src", "content", "articles", `${input.slug}.ts`),
    path.join("src", "pages", "articles", input.slug, "index.astro"),
  ];
  if (check) {
    console.log("check only: no files written");
    return { constName, created, warnings };
  }

  fs.writeFileSync(
    path.join(root, "src", "content", "articles", `${input.slug}.ts`),
    articleTs,
  );
  fs.mkdirSync(path.join(root, "src", "pages", "articles", input.slug), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, "src", "pages", "articles", input.slug, "index.astro"),
    pageAstro,
  );
  fs.writeFileSync(indexFile, nextIndex);
  fs.writeFileSync(shimFile, nextShim);

  console.log("Created:");
  for (const file of created) {
    console.log(`  ${file}`);
  }
  console.log("Updated:");
  console.log("  src/content/articles/index.ts");
  console.log("  src/content/articles.ts");
  console.log("Run:");
  console.log("  pnpm verify");
  return { constName, created, warnings };
}

const invokedAsCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsCli) {
  const args = process.argv.slice(2);
  const yamlPath = args.find((arg) => !arg.startsWith("--"));
  const check = args.includes("--check");
  const rootFlagIndex = args.indexOf("--root");
  const root =
    rootFlagIndex >= 0 && args[rootFlagIndex + 1]
      ? path.resolve(args[rootFlagIndex + 1])
      : process.cwd();
  if (!yamlPath) {
    console.error(
      "usage: node scripts/article-add.mjs <input.yaml> [--check] [--root <dir>]",
    );
    process.exit(1);
  }
  try {
    await runArticleAdd({ root, yamlPath, check });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
