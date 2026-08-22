/**
 * サーバ側の同義語辞書（src/lib/article-discovery.ts）とクライアント側の
 * 辞書（public/scripts/article-discovery.js）の同期不変条件を検証する。
 *
 * public/ 配下の素のJSは Astro バンドルを通らないため、クライアントは
 * TS実装を import できない。そのため辞書は手動同期になっており、片方だけ
 * 更新されると検索結果がサーバとクライアントで食い違う。このテストは
 * 「TS定義を import し、JSファイルのテキストからキー群を抽出して比較する」
 * ことで、同期漏れをビルド前に検出する。
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYNONYMS } from "../src/lib/article-discovery";

const clientSource = readFileSync(
  "public/scripts/article-discovery.js",
  "utf8",
);

/** JS 側の SYNONYMS Map リテラル部分を抽出する。 */
function extractClientMapLiteral(source: string): string {
  const start = source.indexOf("const SYNONYMS = new Map([");
  expect(
    start,
    "client JS must declare `const SYNONYMS = new Map([...`",
  ).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("]);", start);
  expect(
    end,
    "client SYNONYMS literal must be closed with `]);`",
  ).toBeGreaterThan(start);
  return source.slice(start, end + "]);".length);
}

/** Map リテラルのテキストから [キー, 同義語配列] を抽出する。 */
function parseSynonymEntries(literal: string): Map<string, string[]> {
  const entries = new Map<string, string[]>();
  for (const match of literal.matchAll(/\[\s*"([^"]+)"\s*,\s*\[([^\]]*)\]/g)) {
    const key = match[1];
    const synonyms = (match[2]?.match(/"([^"]+)"/g) ?? []).map((quoted) =>
      quoted.slice(1, -1),
    );
    entries.set(key, synonyms);
  }
  return entries;
}

describe("article discovery synonym parity", () => {
  const clientEntries = parseSynonymEntries(
    extractClientMapLiteral(clientSource),
  );

  it("client dictionary is non-empty and parseable", () => {
    expect(clientEntries.size).toBeGreaterThan(0);
  });

  it("declares exactly the same keys as the server definition", () => {
    const serverKeys = [...SYNONYMS.keys()].sort();
    const clientKeys = [...clientEntries.keys()].sort();
    expect(clientKeys).toEqual(serverKeys);
  });

  it("maps each key to the same synonym list as the server definition", () => {
    for (const [key, serverSynonyms] of SYNONYMS) {
      expect(clientEntries.get(key), `synonyms for "${key}"`).toEqual([
        ...serverSynonyms,
      ]);
    }
  });
});
