/**
 * scripts/check-image-magic.mjs
 *
 * 画像カタログ（src/assets/products/ と public/products/）の全ファイルについて、
 * 拡張子が実際のフォーマット（マジックバイト）と一致しているかを検証する CI ゲート。
 *
 * 背景: 拡張子が嘘をついている画像（JPEG バイトなのに .png など）が過去に混入し、
 * Content-Type の不整合や最適化パイプラインの誤動作を招くため、ビルド時に検出して
 * 落とす。判定はコンテンツスニッフィングではなくバイト列の先頭ヘッダのみを見る。
 *
 * 使用方法: node scripts/check-image-magic.mjs
 */

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CATALOG_DIRS = [
  new URL("../src/assets/products/", import.meta.url),
  new URL("../public/products/", import.meta.url),
];

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
]);

/** 先頭バイト列から実際の画像フォーマット名を判定する（未知は null）。 */
export function detectImageFormat(buffer) {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return "JPEG";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "PNG";
  }
  // GIF: GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46)
    return "GIF";
  // WEBP: RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "WEBP";
  }
  // AVIF / ISOBMFF 系: ....ftyp
  if (buffer.toString("ascii", 4, 8) === "ftyp") return "AVIF";
  return null;
}

/** 拡張子（.jpg 等）が主張するフォーマット名。 */
export function extensionFormat(file) {
  const ext = extname(file).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "JPEG";
    case ".png":
      return "PNG";
    case ".webp":
      return "WEBP";
    case ".avif":
      return "AVIF";
    case ".gif":
      return "GIF";
    default:
      return null;
  }
}

/** カタログ内の「拡張子が嘘」のファイルを列挙する。空配列なら合格。 */
export async function collectImageLies(catalogDirs = CATALOG_DIRS) {
  const lies = [];
  for (const dirUrl of catalogDirs) {
    const dir = fileURLToPath(dirUrl);
    if (!existsSync(dir)) continue;
    for (const entry of await readdir(dir)) {
      if (!IMAGE_EXTENSIONS.has(extname(entry).toLowerCase())) continue;
      const filePath = join(dir, entry);
      const buffer = await readFile(filePath);
      const actual = detectImageFormat(buffer);
      const claimed = extensionFormat(entry);
      if (actual === null) {
        lies.push({ file: filePath, claimed, actual: null });
      } else if (actual !== claimed) {
        lies.push({ file: filePath, claimed, actual });
      }
    }
  }
  return lies;
}

async function main() {
  const lies = await collectImageLies();
  if (lies.length === 0) {
    console.log(
      "check-image-magic: OK — すべての画像の拡張子は実フォーマットと一致しています",
    );
    return;
  }
  console.error(
    `check-image-magic: FAIL — 拡張子と実フォーマットが不一致の画像が ${lies.length} 件あります:`,
  );
  for (const lie of lies) {
    const actual = lie.actual === null ? "UNKNOWN" : lie.actual;
    console.error(
      `  - ${lie.file}: 拡張子は ${lie.claimed} を主張していますが、実フォーマットは ${actual} です（リネームして参照を更新してください）`,
    );
  }
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
