/**
 * scripts/reencode-png-lossless.mjs
 *
 * カタログ内の PNG を**可逆（lossless）**で再エンコードし、ソースサイズを削減する。
 *
 * - 画素値は一切変わらないことを、再エンコード前後の raw ピクセル列の SHA-256
 *   照合で各ファイルごとに証明してから書き込む（不一致なら中断・書き込まない）。
 * - src/assets/products/ と public/products/ の同名列は同一バイトで同期する
 *   （片方だけ最適化されて食い違う状態を作らない）。
 * - 保存形式は PNG のまま（ファイル名・参照は変更しない）。
 *
 * 使用方法: node scripts/reencode-png-lossless.mjs [--dry-run] [--min-saving-bytes=N]
 */

import { readdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const CATALOG_DIRS = [
  new URL("../src/assets/products/", import.meta.url),
  new URL("../public/products/", import.meta.url),
];

const dryRun = process.argv.includes("--dry-run");
const minSavingArg = process.argv.find((arg) =>
  arg.startsWith("--min-saving-bytes="),
);
const MIN_SAVING_BYTES = minSavingArg
  ? Number(minSavingArg.split("=")[1])
  : 1024; // 1KB 未満の削減は git pack 肥大化と churn に見合わない

async function listPngs(dirUrl) {
  const dir = dirUrl.href.replace("file:///", "");
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries
    .filter((entry) => extname(entry).toLowerCase() === ".png")
    .map((entry) => ({ name: entry, path: join(dir, entry) }));
}

async function pixelHash(buffer) {
  const raw = await sharp(buffer).raw().toBuffer();
  return createHash("sha256").update(raw).digest("hex");
}

async function main() {
  const byName = new Map(); // name -> [{ dir, path, buffer, size }]
  for (const dirUrl of CATALOG_DIRS) {
    for (const file of await listPngs(dirUrl)) {
      const buffer = await readFile(file.path);
      const list = byName.get(file.name) ?? [];
      list.push({
        dir: dirUrl.href,
        path: file.path,
        buffer,
        size: buffer.length,
      });
      byName.set(file.name, list);
    }
  }

  let candidates = 0;
  let applied = 0;
  let skippedNoGain = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const [name, copies] of [...byName.entries()].sort()) {
    // src 側を基準に再エンコードする（ Twin は同じバイトで上書きして同期を保つ）
    const reference = copies[0];

    // カタログ内で既に同一名が食い違っている場合は安全のため触らない
    if (copies.some((c) => !c.buffer.equals(reference.buffer))) {
      console.log(`  SKIP(unsynced twin) ${name}`);
      continue;
    }

    const beforeHash = await pixelHash(reference.buffer);
    const reencoded = await sharp(reference.buffer)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    const afterHash = await pixelHash(reencoded);

    if (beforeHash !== afterHash) {
      console.error(`  ABORT(pixel mismatch) ${name} — writing nothing`);
      process.exitCode = 1;
      return;
    }

    const saving = reference.size - reencoded.length;
    if (saving < MIN_SAVING_BYTES) {
      skippedNoGain++;
      continue;
    }
    candidates++;
    bytesBefore += reference.size;
    bytesAfter += reencoded.length;

    if (dryRun) {
      console.log(
        `  [dry-run] ${name}: ${(reference.size / 1024).toFixed(0)}KB → ${(reencoded.length / 1024).toFixed(0)}KB (−${(saving / 1024).toFixed(0)}KB, pixels verified)`,
      );
      continue;
    }

    for (const copy of copies) {
      const tmpPath = `${copy.path}.tmp`;
      await writeFile(tmpPath, reencoded);
      await rename(tmpPath, copy.path);
    }
    applied++;
    console.log(
      `  ${name}: ${(reference.size / 1024).toFixed(0)}KB → ${(reencoded.length / 1024).toFixed(0)}KB (−${(saving / 1024).toFixed(0)}KB, ×${copies.length} copies, pixels verified)`,
    );
  }

  const label = dryRun ? "dry-run" : "done";
  console.log(
    `\n${label}: ${dryRun ? candidates : applied} files to shrink, ${skippedNoGain} without meaningful gain`,
  );
  if (candidates > 0) {
    console.log(
      `catalog: ${(bytesBefore / 1024).toFixed(0)}KB → ${(bytesAfter / 1024).toFixed(0)}KB (−${((bytesBefore - bytesAfter) / 1024).toFixed(0)}KB)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
