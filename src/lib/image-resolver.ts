/**
 * 画像パス文字列を Astro の ImageMetadata に解決する。
 *
 * データ層（articles.ts, comparison-v2.ts）では imagePath を
 * "/products/xxx.jpg" の文字列として保持するが、<Image> コンポーネントに
 * 渡すには ImageMetadata（import された画像モジュール）が必要。
 *
 * import.meta.glob で全画像を eager import し、パス → ImageMetadata の
 * マップを構築する。コンポーネントからは resolveImage() を呼ぶだけで
 * 最適化された画像参照が得られる。
 *
 * - ローカルパス（"/products/xxx.jpg"）: src/assets/products/ に存在しない場合はビルドエラー
 * - 外部URL（"https://..."）: undefined を返す（コンポーネントが <img> で表示）
 * - undefined: undefined を返す
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// ImageMetadata は astro:assets から直接エクスポートされず、astro/dist/assets/types.js
// もモジュール解決対象外のため、import.meta.glob の返すオブジェクト型を any で受ける。
// Image コンポーネントは実行時にプロパティを消費するため、ここでの any は安全。

const imageModules = import.meta.glob<{
  default: any;
}>("/src/assets/products/*.{jpg,jpeg,png,webp,avif}", { eager: true });

/**
 * 画像パスを ImageMetadata に解決する。
 *
 * - "/products/xxx.jpg" → src/assets/products/xxx.jpg を探索。見つからなければビルドエラー。
 * - "https://..." → undefined（外部URLは最適化対象外）
 * - undefined → undefined
 */
export function resolveImage(path: string | undefined): any | undefined {
  if (!path) return undefined;
  // 外部URLはローカル最適化の対象外
  if (path.startsWith("http://") || path.startsWith("https://"))
    return undefined;
  // "/products/xxx.jpg" → "/src/assets/products/xxx.jpg"
  const normalized = path.replace(/^\/products\//, "/src/assets/products/");
  const mod = imageModules[normalized];
  if (!mod) {
    throw new Error(
      `[image-resolver] Image not found: "${path}" resolved to "${normalized}" but no matching file exists in src/assets/products/. ` +
        `Check the imagePath in your article metadata.`,
    );
  }
  return mod.default;
}
