/**
 * src/assets/products/ の大きい画像を事前にリサイズしてソースサイズを削減する。
 *
 * Astro の <Picture> はソース画像を WebP/AVIF に変換するが、ソースが大きいと
 * - git pack が肥大化する
 * - import.meta.glob の eager import が遅くなる
 * - sharp の変換時間が長くなる
 *
 * このスクリプトは 200KB 超の画像を max 1200px 幅にリサイズする。
 * アスペクト比を維持し、品質 85 で上書きする。
 *
 * 使用方法: node scripts/resize-source-images.mjs [--dry-run]
 */

import { readdir, stat, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const PRODUCTS_DIR = new URL("../src/assets/products/", import.meta.url);
const MAX_WIDTH = 1200;
const QUALITY = 85;
const SIZE_THRESHOLD_BYTES = 200 * 1024; // 200KB
const SUPPORTED_EXT = new Set([".jpg", ".jpeg", ".png"]);

const dryRun = process.argv.includes("--dry-run");

async function getFiles(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const ext = extname(entry).toLowerCase();
    if (SUPPORTED_EXT.has(ext)) {
      files.push(join(dir, entry));
    }
  }
  return files;
}

async function main() {
  const files = await getFiles(PRODUCTS_DIR.href.replace("file:///", ""));
  let resized = 0;
  let skipped = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (const filePath of files) {
    const info = await stat(filePath);
    if (info.size <= SIZE_THRESHOLD_BYTES) {
      skipped++;
      continue;
    }

    const image = sharp(filePath);
    const meta = await image.metadata();
    const needsResize = (meta.width ?? 0) > MAX_WIDTH;

    if (!needsResize) {
      skipped++;
      continue;
    }

    totalBefore += info.size;

    if (dryRun) {
      console.log(
        `  [dry-run] ${filePath.split("/").pop()}: ${meta.width}x${meta.height} → resize to max ${MAX_WIDTH}px`,
      );
      resized++;
      continue;
    }

    const resizedBuffer = await image
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();

    // Windows では sharp がファイルをロックしている場合があるため、
    // 一時ファイルに書き込み後にリネームで置換する。
    const tmpPath = filePath + ".tmp";
    await writeFile(tmpPath, resizedBuffer);
    const { rename } = await import("node:fs/promises");
    await rename(tmpPath, filePath);
    totalAfter += resizedBuffer.length;

    const before = (info.size / 1024).toFixed(0);
    const after = (resizedBuffer.length / 1024).toFixed(0);
    console.log(
      `  ${filePath.split("/").pop()}: ${meta.width}x${meta.height} → ${before}KB → ${after}KB`,
    );
    resized++;
  }

  console.log(`\n結果: ${resized} ファイルリサイズ、${skipped} ファイルスキップ`);
  if (resized > 0) {
    const saved = ((totalBefore - totalAfter) / 1024).toFixed(0);
    console.log(
      `削減: ${(totalBefore / 1024).toFixed(0)}KB → ${(totalAfter / 1024).toFixed(0)}KB (${saved}KB 削減)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
