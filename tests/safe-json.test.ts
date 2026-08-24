import { describe, expect, it } from "vitest";
import { safeJsonForScript } from "../src/lib/safe-json";

describe("safeJsonForScript (#388)", () => {
  it("escapes every '<' so inline scripts cannot be terminated early", () => {
    const json = safeJsonForScript({
      summary: "比較</script><script>alert(1)</script>",
    });
    expect(json).not.toContain("<");
    expect(json).toContain("\\u003c/script>");
    expect(json).toContain("alert(1)");
    // JSON として復元できること
    expect(JSON.parse(json)).toEqual({
      summary: "比較</script><script>alert(1)</script>",
    });
  });

  it("keeps Japanese text and structural characters intact", () => {
    const value = {
      headline: "水筒、どっち？",
      tags: ["サーモス", "タイガー"],
    };
    const json = safeJsonForScript(value);
    expect(JSON.parse(json)).toEqual(value);
    expect(json).toContain("水筒、どっち？");
  });

  it("serializes arrays and nested values deterministically", () => {
    const discovery = [
      { id: "a", path: "/articles/a/", modifiedAt: "2026-08-01" },
      { id: "b", path: "/articles/b/", modifiedAt: "2026-08-02" },
    ];
    expect(safeJsonForScript(discovery)).toBe(
      JSON.stringify(discovery).replaceAll("<", "\\u003c"),
    );
  });
});
