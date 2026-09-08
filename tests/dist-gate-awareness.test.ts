import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

// dist 依存のテスト群（article-cta-consistency、article-metadata の rendered dist
// ケース等）は dist が無いと skipIf で静かに素通りする。`pnpm test` 単体では
// 無警告で成功に見えるため、このテストが警告を出して可視化する。
// フル検証には `pnpm build` または `pnpm verify` を使うこと。
describe("dist-dependent gates awareness", () => {
  it("warns when dist is absent so skipped suites cannot silently pass", () => {
    const hasDist = existsSync("dist/index.html");
    if (!hasDist) {
      console.warn(
        "dist/ が無いため dist 依存のテスト群が skip されます。" +
          "フル検証には pnpm build または pnpm verify を実行してください。",
      );
    }
    expect(true).toBe(true);
  });
});
