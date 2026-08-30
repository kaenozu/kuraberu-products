/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// カバレッジはユニットテスト可能なロジック層(domain / lib / functions /
// config)を対象とする。AstroコンポーネントやCSSは dist 生成物へのゲート
// (check-rendered-html 等)で検証するため含めない。memo-app.ts もブラウザAPIに
// 依存するページ初期化コードのため、同じく実ビルド/E2Eゲートで検証する。
// 閾値は現行実測値より少し下に置き、大幅な後退だけを検知する。
export default getViteConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/domain/**/*.ts",
        "src/lib/**/*.ts",
        "functions/**/*.ts",
        "config/**/*.mjs",
      ],
      exclude: ["src/lib/memo-app.ts"],
      thresholds: {
        statements: 78,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
