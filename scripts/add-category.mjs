#!/usr/bin/env node

/**
 * 新しい診断カテゴリを追加するスクリプト。
 *
 * 商品データ・診断設定・理由辞書・ページコンテンツのテンプレートを生成し、
 * src/data/diagnoses/index.ts を自動更新する。
 *
 * 使い方:
 *   node scripts/add-category.mjs [--no-index] [--dry-run] [--validate] <slug> <label> <description>
 *
 * 例:
 *   node scripts/add-category.mjs stroller ベビーカー ベビーカーの選び方診断
 *   node scripts/add-category.mjs --no-index stroller ベビーカー ベビーカーの選び方診断
 *
 * オプション:
 *   --no-index   index.ts の自動更新をスキップ（手動更新用）
 *   --dry-run    ファイルを書き込まずに内容を表示
 *   --validate   生成後にテストを実行
 *
 * 生成されるファイル:
 *   - src/data/products/{slug-plural}.ts      (商品データ)
 *   - src/data/diagnoses/{slug}.ts            (診断設定 + 理由辞書 + ページコンテンツ)
 *   - src/data/diagnoses/index.ts を自動更新  (import + categories 配列)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- ユーティリティ ----

/** slug を複数形に（简单に -s を付与） */
function toPluralSlug(s) {
  return s.endsWith("s") ? `${s}` : `${s}s`;
}

/** PascalCaseに変換 */
function toPascalCase(s) {
  return s
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/** camelCaseに変換 */
function toCamelCase(s) {
  const pascal = toPascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ---- オプション解析 ----

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const runValidate = args.includes("--validate");
const skipIndex = args.includes("--no-index");
const positional = args.filter((a) => !a.startsWith("--"));

const [slug, label, description] = positional;

if (!slug || !label || !description) {
  console.error(
    "使い方: node scripts/add-category.mjs [--no-index] [--dry-run] [--validate] <slug> <label> <description>",
  );
  console.error(
    "例:     node scripts/add-category.mjs stroller ベビーカー ベビーカーの選び方診断",
  );
  console.error("");
  console.error("オプション:");
  console.error("  --no-index   index.ts の自動更新をスキップ");
  console.error("  --dry-run    ファイルを書き込まずに内容を表示");
  console.error("  --validate   生成後にテストを実行");
  process.exit(1);
}

// slug のバリデーション
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error(
    `エラー: slug「${slug}」は小文字英数字とハイフンで始まる必要があります`,
  );
  process.exit(1);
}

// 重複チェック
const productsPath = `src/data/products/${toPluralSlug(slug)}.ts`;
const diagnosesPath = `src/data/diagnoses/${slug}.ts`;
const registryPath = "src/data/diagnoses/index.ts";

if (existsSync(join(ROOT, productsPath))) {
  console.error(`エラー: ${productsPath} は既に存在します`);
  process.exit(1);
}
if (existsSync(join(ROOT, diagnosesPath))) {
  console.error(`エラー: ${diagnosesPath} は既に存在します`);
  process.exit(1);
}

// index.ts でのslug重複チェック
const registryContent = readFileSync(join(ROOT, registryPath), "utf-8");
if (registryContent.includes(`slug: "${slug}"`)) {
  console.error(`エラー: slug「${slug}」はindex.tsに既に登録されています`);
  process.exit(1);
}

// ---- テンプレート生成 ----

function generateProductsFile() {
  return `/**
 * ${label}カテゴリの商品データ。
 *
 * 診断エンジンが使う構造化データ。数値・属性の根拠は公式情報のみで、
 * 確認日（verifiedAt）とソースを保持する。未確認のスペックや推測値は入れない。
 *
 * TODO: 商品データを追加してください
 * - 各商品の id, brand, name, tags, attributes を設定
 * - purchaseLinks に楽天アフィリエイトURLを設定
 * - sources に公式情報のURLと確認日を設定
 */

import type { Product } from "../../domain/diagnosis/types";

// TODO: 公式商品ページのURLを定義
// const EXAMPLE_SOURCE_URL = "https://example.com/product/123";

/** 公式商品ページ（TODO: 確認日を更新） */
function officialSource(url: string): {
  label: string;
  url: string;
  checkedAt: string;
} {
  return {
    label: "${label} 公式商品ページ",
    url,
    checkedAt: "2026-01-01", // TODO: 実際の確認日に更新
  };
}

// TODO: 商品データを追加
// 例:
// export const exampleProduct: Product = {
//   id: "${slug}-example",
//   categoryId: "${slug}",
//   brand: "ブランド名",
//   name: "商品名",
//   tags: ["tag1", "tag2"],
//   attributes: {
//     // TODO: 診断ルールで使う属性を定義
//     price: 10000,
//     weight: 500,
//   },
//   articleUrls: [], // TODO: 関連記事URLを設定
//   purchaseLinks: [
//     // TODO: 楽天アフィリエイトURLを設定
//   ],
//   sources: [officialSource("https://example.com")],
//   verifiedAt: "2026-01-01",
// };

/** ${label}カテゴリの商品一覧 */
export const ${toCamelCase(toPluralSlug(slug))}: readonly Product[] = [
  // TODO: 商品を追加
  // exampleProduct,
];
`;
}

function generateDiagnosesFile() {
  const camelProducts = toCamelCase(toPluralSlug(slug));

  return `/**
 * ${label} 診断設定。
 *
 * 質問とルールの定義。ルールは公式情報だけを参照し、
 * 口コミ・価格・推測値はスコアに使わない。
 *
 * TODO: 以下の手順で診断を設定してください
 * 1. reasonDictionary に理由コードと表示文言を追加
 * 2. diagnosis の questions に質問とルールを定義
 * 3. tieBreaker で同点時の並べ替え順序を設定
 * 4. pageContent でSEO用のページコンテンツを定義
 */

import type {
  DiagnosisConfig,
  DiagnosisPageContent,
} from "../../domain/diagnosis/types";
import { ${camelProducts} } from "../products/${toPluralSlug(slug)}";

/** 理由コード → 表示文言 の辞書 */
export const ${toCamelCase(slug)}ReasonDictionary: Record<string, string> = {
  // TODO: 理由コードと表示文言を追加
  // 例:
  // FEATURE_A: "この商品は特徴Aを備えています。",
  // FEATURE_B: "条件に合致しています。",
};

export const ${toCamelCase(slug)}Diagnosis: DiagnosisConfig = {
  id: "${slug}-diagnosis",
  categoryId: "${slug}",
  categoryLabel: "${label}",
  title: "${label} 選び方診断",
  description: "${description}",
  productIds: ${camelProducts}.map((product) => product.id),
  questions: [
    // TODO: 質問を追加
    // 例:
    // {
    //   id: "question-1",
    //   type: "single",
    //   label: "質問文",
    //   description: "補足説明",
    //   required: true,
    //   options: [
    //     {
    //       id: "option-1",
    //       label: "選択肢1",
    //       rules: [
    //         {
    //           type: "score",
    //           match: {
    //             field: "attributes",
    //             key: " attributeName",
    //             operator: "eq",
    //             value: true,
    //           },
    //           score: 3,
    //           reasonCode: "FEATURE_A",
    //         },
    //       ],
    //     },
    //   ],
    // },
  ],
  tieBreaker: [
    // TODO: 同点時のタイブレーク規則を設定
    // { type: "attribute", key: "price", direction: "asc" },
  ],
  resultConfig: {
    topHeadingTemplate: "あなたには「{productName}」が最も合いそうです",
    disclaimer:
      "この診断は、メーカー公式情報と回答条件をもとに商品候補を整理するものです。使用感や個人差を保証するものではありません。",
  },
};

/** 診断ページの静的コンテンツ（SEO用） */
export const ${toCamelCase(slug)}PageContent: DiagnosisPageContent = {
  pageTitle: "${label} どっち？｜30秒で選べる診断｜くらべる商品メモ",
  headline: "${label}、どっち？30秒で診断",
  pageDescription:
    "${description}。公式情報に基づくスコアリングで、理由つきでおすすめを表示します。",
  lead:
    "${description}。質問に答えるだけです。",
  audience:
    "${label}の選び方で迷っている人向けの診断です。",
  targetItems: [
    // TODO: 診断対象の商品名を追加
    // "商品名1",
    // "商品名2",
  ],
  guideSections: [
    {
      heading: "1. 選び方のポイント",
      body: "TODO: 選び方のポイントを記述",
    },
  ],
  faq: [
    {
      question: "診断の判定基準は何ですか？",
      answer:
        "公式商品ページで確認できる情報だけを判定に使います。口コミや推測値はスコアに使いません。",
    },
  ],
  relatedArticles: [
    // TODO: 関連記事のパスを追加
    // { path: "/articles/example/", label: "詳細を見る" },
  ],
};
`;
}

// ---- index.ts 自動更新 ----

/**
 * index.ts の内容を受け取り、import と categories 配列に新しいカテゴリを追加した
 * 新しいファイル内容を返す。
 *
 * 挿入ロジック:
 * 1. import: 最後の `} from "./...` 行の直後に挿入
 * 2. categories: 最後の `},` 行の直後に挿入（`];` の前）
 */
function patchRegistry(content, slug, label) {
  const camelSlug = toCamelCase(slug);
  const camelProducts = toCamelCase(toPluralSlug(slug));
  const pluralSlug = toPluralSlug(slug);

  const lines = content.split("\n");

  // --- import の挿入位置を見つける ---
  // パターン: 最後の `} from "./` で終わる行（マルチライン import の終了行）
  let lastImportEndLine = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\} from "\.\/.+";\s*$/.test(lines[i])) {
      lastImportEndLine = i;
      break;
    }
  }
  if (lastImportEndLine === -1) {
    console.error(
      "エラー: index.ts から import の終了行が見つかりませんでした",
    );
    process.exit(1);
  }

  const importBlock = [
    `import {`,
    `  ${camelSlug}Diagnosis,`,
    `  ${camelSlug}PageContent,`,
    `  ${camelSlug}ReasonDictionary,`,
    `} from "./${slug}";`,
    `import { ${camelProducts} } from "../products/${pluralSlug}";`,
  ];

  // --- categories 配列の挿入位置を見つける ---
  // パターン: 最後の `},` で終わる行（配列要素の終了行）。`];` の前。
  let lastEntryEndLine = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trimEnd();
    if (/^\s*\},\s*$/.test(trimmed)) {
      lastEntryEndLine = i;
      break;
    }
  }
  if (lastEntryEndLine === -1) {
    console.error(
      "エラー: index.ts から categories 配列の終了が見つかりませんでした",
    );
    process.exit(1);
  }

  const categoryEntry = [
    `  {`,
    `    slug: "${slug}",`,
    `    config: ${camelSlug}Diagnosis,`,
    `    products: ${camelProducts},`,
    `    reasons: ${camelSlug}ReasonDictionary,`,
    `    pageContent: ${camelSlug}PageContent,`,
    `  },`,
  ];

  // --- 挿入実行（後ろから順に挿入すると行番号がずれない） ---
  // 1. categories 配列に追加（lastEntryEndLine の後）
  lines.splice(lastEntryEndLine + 1, 0, ...categoryEntry);

  // 2. import に追加（lastImportEndLine の後）。categories を追加した分だけ行がずれるので補正。
  const adjustedImportLine = lastImportEndLine + 1;
  lines.splice(adjustedImportLine, 0, "", ...importBlock);

  return lines.join("\n");
}

// ---- メイン処理 ----

console.log(`カテゴリ「${label}」(${slug}) を追加中...`);

if (dryRun) {
  console.log("\n--- DRY RUN: ファイル内容 ---\n");
  console.log(`=== ${productsPath} ===`);
  console.log(generateProductsFile());
  console.log(`\n=== ${diagnosesPath} ===`);
  console.log(generateDiagnosesFile());

  if (!skipIndex) {
    console.log(`\n=== ${registryPath} (パッチ後) ===`);
    console.log(patchRegistry(registryContent, slug, label));
  } else {
    console.log("\n⚠️  --no-index: index.ts の更新をスキップ");
  }

  process.exit(0);
}

// ディレクトリ作成
const productsDir = join(ROOT, "src/data/products");
const diagnosesDir = join(ROOT, "src/data/diagnoses");

if (!existsSync(productsDir)) {
  mkdirSync(productsDir, { recursive: true });
}
if (!existsSync(diagnosesDir)) {
  mkdirSync(diagnosesDir, { recursive: true });
}

// ファイル生成
const productsFile = join(productsDir, `${toPluralSlug(slug)}.ts`);
const diagnosesFile = join(diagnosesDir, `${slug}.ts`);

writeFileSync(productsFile, generateProductsFile(), "utf-8");
console.log(`✅ ${productsPath} を生成`);

writeFileSync(diagnosesFile, generateDiagnosesFile(), "utf-8");
console.log(`✅ ${diagnosesPath} を生成`);

// index.ts の自動更新
if (!skipIndex) {
  const updatedRegistry = patchRegistry(registryContent, slug, label);
  writeFileSync(join(ROOT, registryPath), updatedRegistry, "utf-8");
  console.log(`✅ ${registryPath} を更新（import + categories 配列）`);
} else {
  console.log(`ℹ️  --no-index: ${registryPath} の更新をスキップ`);
}

// 次のステップ
console.log("\n--- 次のステップ ---");
console.log(`1. ${productsPath} に商品データを追加`);
console.log(
  `2. ${diagnosesPath} に質問・ルール・理由辞書・ページコンテンツを設定`,
);
if (skipIndex) {
  console.log(`3. ${registryPath} に import + categories への追記`);
}
console.log("関連記事を追加（articleUrls, relatedArticles）");
console.log("pnpm test でテストを実行");
console.log("pnpm typecheck で型チェックを実行");
console.log(
  "\n⚠️  設定を編集した後、通常の pnpm test で validate が自動実行されます。",
);

// --validate オプション: テスト実行
if (runValidate) {
  console.log("\n--- テスト実行 ---");
  try {
    execSync("pnpm test", { cwd: ROOT, stdio: "inherit" });
    console.log("\n✅ テスト合格");
  } catch {
    console.error(
      "\n❌ テスト失敗。テンプレートを編集してから再実行してください。",
    );
    process.exit(1);
  }
}
