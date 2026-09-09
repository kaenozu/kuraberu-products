import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkPriceClaims,
  classifyLine,
} from "../scripts/check-price-claims.mjs";

describe("price claims gate", () => {
  it("flags bare prices without confirmation context", () => {
    expect(classifyLine(`left: "27,280円",`)).toEqual({
      hasPrice: true,
      hasStock: false,
    });
    expect(classifyLine(`left: "4,400円（税込）",`)).toEqual({
      hasPrice: true,
      hasStock: false,
    });
  });

  it("flags stock assertions", () => {
    expect(classifyLine("在庫ありのためお早めに")).toEqual({
      hasPrice: false,
      hasStock: true,
    });
    expect(classifyLine("すでに売り切れです")).toEqual({
      hasPrice: false,
      hasStock: true,
    });
  });

  it("allows prices with confirmation context on the same line", () => {
    expect(
      classifyLine("2026-08-10時点の確認では、49,500円（送料無料）でした"),
    ).toBeNull();
    expect(
      classifyLine("公式ショップ価格13,585円（2026-08-10確認）"),
    ).toBeNull();
    expect(classifyLine("価格・在庫は販売先でご確認ください")).toBeNull();
    expect(
      classifyLine("在庫はキャンペーンにより変動するため販売ページで確認"),
    ).toBeNull();
  });

  it("ignores non-claim lines such as form placeholders", () => {
    expect(classifyLine("plain text without numbers")).toBeNull();
    expect(classifyLine('<input placeholder="例：10,000円">')).toBeNull();
  });

  it("accepts comparison-block prices dated on the label line", () => {
    const label = `label: "公式ショップ価格（2026-08-10確認）",`;
    expect(classifyLine(`left: "27,280円〜。",`, [label])).toBeNull();
    expect(classifyLine(`left: "27,280円〜。",`, [])).not.toBeNull();
  });

  it("scans target directories and reports file:line findings", () => {
    const root = mkdtempSync(join(tmpdir(), "price-claims-"));
    mkdirSync(join(root, "pages"), { recursive: true });
    mkdirSync(join(root, "content"), { recursive: true });
    mkdirSync(join(root, "data"), { recursive: true });
    writeFileSync(
      join(root, "pages", "a.astro"),
      `<p>ようこそ。</p>\n<p>本日特価2,980円！</p>\n`,
    );
    writeFileSync(join(root, "content", "b.ts"), `export const x = 1;\n`);
    writeFileSync(
      join(root, "data", "c.ts"),
      `export const note = "在庫あり";\n`,
    );

    const { findings, checkedFiles } = checkPriceClaims({ srcDirectory: root });
    expect(checkedFiles).toBe(3);
    expect(
      findings.map((finding) => `${finding.file}:${finding.line}`),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/a\.astro:2$/),
        expect.stringMatching(/c\.ts:1$/),
      ]),
    );
    expect(findings).toHaveLength(2);
  });
});
