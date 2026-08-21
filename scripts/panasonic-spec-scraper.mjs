#!/usr/bin/env node
/**
 * scripts/panasonic-spec-scraper.mjs
 *
 * Panasonic 公式の仕様ページ (spec.html) から構造化された仕様データを取得する。
 * data/spec-claims.json に登録された Panasonic URL を自動検出し、
 * 各ページの <th>/<td> テーブルを解析して JSON に変換する。
 *
 * 使い方:
 *   node scripts/panasonic-spec-scraper.mjs                    # spec-claims.json の全 Panasonic URL を処理
 *   node scripts/panasonic-spec-scraper.mjs --url URL          # 指定 URL のみ処理
 *   node scripts/panasonic-spec-scraper.mjs --article-id ID    # 指定記事の公式 URL を処理
 *   node scripts/panasonic-spec-scraper.mjs --diff             # 記事本文との差分を出力
 *   node scripts/panasonic-spec-scraper.mjs --output FILE      # JSON 出力先ファイル
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";

const MANIFEST_PATH = "data/spec-claims.json";
const DEFAULT_OUTPUT = "data/panasonic-specs.json";

// --- HTML Entity 復元 ---
function decodeHtmlEntities(text) {
  return text
    .replace(/&#xff08;/g, "（")
    .replace(/&#xff09;/g, "）")
    .replace(/&#xff5e;/g, "～")
    .replace(/&#xff0f;/g, "／")
    .replace(/&#xff1a;/g, "：")
    .replace(/&#xff03;/g, "＃")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// --- HTML タグ除去 ---
function stripTags(html) {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

// --- Panasonic spec.html テーブル解析 ---
function parseSpecTable(html) {
  const specs = {};

  // <th scope="row">...KEY...</th> <td>...VALUE...</td> パターンを抽出
  // scope="row" の th だけを拾い、rowgroup はスキップ
  const regex =
    /<th\s+scope="row"[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const key = decodeHtmlEntities(stripTags(match[1])).trim();
    const value = decodeHtmlEntities(stripTags(match[2])).trim();

    if (key && value) {
      // 重複キーの場合は配列化
      if (specs[key]) {
        if (Array.isArray(specs[key])) {
          specs[key].push(value);
        } else {
          specs[key] = [specs[key], value];
        }
      } else {
        specs[key] = value;
      }
    }
  }

  return specs;
}

// --- URL からモデル番号を抽出 ---
function extractModelNumber(url) {
  const match = url.match(/\/products\/([A-Z0-9-]+)\//i);
  return match ? match[1] : null;
}

// --- ページタイトル取得 ---
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(stripTags(match[1])).trim() : null;
}

// --- fetch with retry ---
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SpecVerifier/1.0; +https://github.com/kaenozu/kuraberu-products)",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// --- Panasonic spec URL を構築 ---
function buildSpecUrl(productUrl) {
  // https://panasonic.jp/xxx/products/YYY.html → https://panasonic.jp/xxx/products/YYY/spec.html
  if (productUrl.endsWith("/spec.html")) return productUrl;
  if (productUrl.endsWith(".html"))
    return productUrl.replace(/\.html$/, "/spec.html");
  if (!productUrl.endsWith("/")) return `${productUrl}/spec.html`;
  return `${productUrl}spec.html`;
}

// --- spec-claims.json から Panasonic URL を収集 ---
function collectPanasonicUrls(manifest, targetArticleId) {
  const urls = [];
  for (const entry of manifest.entries ?? []) {
    if (targetArticleId && entry.articleId !== targetArticleId) continue;
    for (const url of entry.officialUrls ?? []) {
      if (url.includes("panasonic.jp")) {
        urls.push({ articleId: entry.articleId, url });
      }
    }
  }
  return urls;
}

// --- 記事本文から仕様クレームを抽出 (spec-claims.mjs と同じパターン) ---
const SPEC_PATTERNS = [
  {
    key: "dimensions",
    re: /(\d[\d,]*(?:\.\d+)?)\s*[x×]\s*[^x×\n]{0,12}?(\d[\d,]*(?:\.\d+)?)(?:\s*[x×]\s*[^x×\n]{0,12}?(\d[\d,]*(?:\.\d+)?))?\s*(?:mm|cm|センチ)/gi,
  },
  {
    key: "weight",
    re: /(?:重量|質量)[^。\n]{0,40}?(\d[\d,]*(?:\.\d+)?)\s*(?:kg|g)\b/gi,
  },
  {
    key: "capacity",
    re: /(?:容量|タンク容量)[^。\n]{0,40}?(\d[\d,]*(?:\.\d+)?)\s*(?:L|リットル)/gi,
  },
  {
    key: "power",
    re: /(?:消費電力|定格)[^。\n]{0,30}?(\d[\d,]*(?:\.\d+)?)\s*(?:W|ワット)/gi,
  },
  {
    key: "noise",
    re: /(?:運転音|騒音)[^。\n]{0,30}?(\d[\d,]*(?:\.\d+)?)\s*dB/gi,
  },
  {
    key: "tatami",
    re: /(?:適用畳数|木造)[^。\n]{0,30}?(\d[\d,]*(?:\.\d+)?)\s*畳/gi,
  },
  {
    key: "efficiency",
    re: /(?:保温効力|保冷効力)[^。\n]{0,20}?(\d[\d,]*(?:\.\d+)?)℃/gi,
  },
  {
    key: "price",
    re: /(?:価格|表示価格|税込価格|税込)[^。\n]{0,30}?(\d[\d,]*)\s*円/gi,
  },
  {
    key: "mouthDiameter",
    re: /口径[^。\n]{0,20}?約?(\d+(?:\.\d+)?)\s*cm/gi,
  },
  {
    key: "colors",
    re: /(?:カラー数|色展開|カラーラインアップ)[^。\n]{0,20}?(\d+)\s*色/gi,
  },
  {
    key: "steamAmount",
    re: /スチーム量[^。\n]{0,30}?約?(\d+(?:\.\d+)?)\s*(?:mL|g|ml)/gi,
  },
  {
    key: "boilingTime",
    re: /(?:沸とう時間|沸騰時間|カップ1杯|満水)[^。\n]{0,20}?約?(\d+)\s*(?:分|秒)/gi,
  },
  {
    key: "usageHeight",
    re: /対象身長[^。\n]{0,30}?(\d+)\s*[-〜~]\s*(\d+)\s*cm/gi,
  },
  {
    key: "usageAge",
    re: /対象月齢[^。\n]{0,30}?(\d+)\s*[-〜~]\s*(\d+)\s*ヶ?月/gi,
  },
  {
    key: "loadCapacity",
    re: /(?:耐荷重|最大積載重量)[^。\n]{0,30}?(\d+(?:\.\d+)?)\s*(?:kg|g)/gi,
  },
];

function extractArticleClaims(articleText) {
  const claims = [];
  for (const pattern of SPEC_PATTERNS) {
    for (const match of articleText.matchAll(pattern.re)) {
      claims.push({ key: pattern.key, raw: match[0].trim(), value: match[1] });
    }
  }
  return claims;
}

// --- 公式仕様値と記事クレームの突合 ---
function diffSpecs(articleClaims, officialSpecs) {
  const diffs = [];

  for (const claim of articleClaims) {
    const officialEntries = Object.entries(officialSpecs);
    let matched = false;

    for (const [specKey, specValue] of officialEntries) {
      if (typeof specValue !== "string") continue;
      // 記事の数値クレームが公式仕様に含まれるか確認
      if (specValue.includes(claim.value)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      diffs.push({
        claimKey: claim.key,
        claimRaw: claim.raw,
        claimValue: claim.value,
        note: "記事の仕様値が公式ページに見つかりません",
      });
    }
  }

  return diffs;
}

// --- 記事ファイルから本文を読み取り ---
function readArticleText(articleId) {
  // Astro ファイル
  const astroPath = `src/pages/articles/${articleId}/index.astro`;
  if (existsSync(astroPath)) {
    return readFileSync(astroPath, "utf8");
  }
  // Markdown ファイル
  const mdPath = `src/content/articles/${articleId}.md`;
  if (existsSync(mdPath)) {
    return readFileSync(mdPath, "utf8");
  }
  return null;
}

// --- メイン ---
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i + 1]) {
      options.url = args[++i];
    } else if (args[i] === "--article-id" && args[i + 1]) {
      options.articleId = args[++i];
    } else if (args[i] === "--diff") {
      options.diff = true;
    } else if (args[i] === "--output" && args[i + 1]) {
      options.output = args[++i];
    }
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const panasonicUrls = collectPanasonicUrls(manifest, options.articleId);

  if (options.url) {
    panasonicUrls.length = 0;
    panasonicUrls.push({ articleId: "manual", url: options.url });
  }

  if (panasonicUrls.length === 0) {
    console.log("Panasonic URL が見つかりませんでした。");
    process.exit(0);
  }

  console.log(`Panasonic 仕様ページ: ${panasonicUrls.length} 件を処理します\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const { articleId, url } of panasonicUrls) {
    const specUrl = buildSpecUrl(url);
    const modelNumber = extractModelNumber(specUrl);
    process.stdout.write(
      `  [${articleId}] ${modelNumber ?? specUrl} ... `,
    );

    try {
      const html = await fetchWithRetry(specUrl);
      const title = extractTitle(html);
      const specs = parseSpecTable(html);
      const specCount = Object.keys(specs).length;

      if (specCount === 0) {
        console.log(`SKIP (仕様テーブルなし)`);
        continue;
      }

      const result = {
        articleId,
        modelNumber,
        specUrl,
        title,
        fetchedAt: new Date().toISOString().slice(0, 10),
        specCount,
        specs,
      };

      // diff モード: 記事本文との突合
      if (options.diff && articleId !== "manual") {
        const articleText = readArticleText(articleId);
        if (articleText) {
          const articleClaims = extractArticleClaims(articleText);
          result.articleClaims = articleClaims;
          result.diffs = diffSpecs(articleClaims, specs);
          if (result.diffs.length > 0) {
            console.log(
              `OK (${specCount} specs, ${result.diffs.length} diffs)`,
            );
          } else {
            console.log(`OK (${specCount} specs, all matched)`);
          }
        } else {
          console.log(`OK (${specCount} specs, article file not found)`);
        }
      } else {
        console.log(`OK (${specCount} specs)`);
      }

      results.push(result);
      successCount++;

      // polite delay
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`FAIL (${err.message})`);
      failCount++;
      results.push({
        articleId,
        modelNumber,
        specUrl,
        error: err.message,
      });
    }
  }

  // 出力
  const output = {
    generatedAt: new Date().toISOString(),
    totalUrls: panasonicUrls.length,
    successCount,
    failCount,
    results,
  };

  const outputPath = options.output ?? DEFAULT_OUTPUT;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`\n結果: ${successCount} 件成功 / ${failCount} 件失敗`);
  console.log(`出力: ${outputPath}`);

  // diff がある場合は exit 1
  const hasDiffs = results.some((r) => r.diffs?.length > 0);
  if (hasDiffs) {
    console.error("\n⚠️  記事クレームと公式仕様の差分があります。上記を確認してください。");
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  await main();
}
