import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_RESOURCES,
  checkCspEmbedConsistency,
  parseCspDirectives,
} from "../scripts/check-csp-embed-consistency.mjs";

describe("CSP / embed consistency gate", () => {
  it("parses CSP directives from _headers format", () => {
    const directives = parseCspDirectives(
      "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' https://platform.twitter.com\n",
    );
    expect(directives.get("script-src")).toContain(
      "https://platform.twitter.com",
    );
    expect(directives.get("default-src")).toContain("'self'");
  });

  it("covers every runtime embed resource in the real _headers", () => {
    const { violations } = checkCspEmbedConsistency();
    expect(violations).toEqual([]);
  });

  it("keeps the runtime resource list in sync with external-embeds.ts", () => {
    const source = readFileSync("src/lib/external-embeds.ts", "utf8");
    for (const { host } of REQUIRED_RESOURCES) {
      expect(
        source,
        `runtime resource host missing from external-embeds.ts: ${host}`,
      ).toContain(host);
    }
    // 既知の実行時エンドポイントが列挙から漏れていないこと
    for (const endpoint of [
      "platform.twitter.com/widgets.js",
      "www.youtube-nocookie.com/embed",
      "www.tiktok.com/player",
      "assets.pinterest.com/js/pinit.js",
    ]) {
      expect(source).toContain(endpoint);
      expect(
        REQUIRED_RESOURCES.some((resource) => endpoint.includes(resource.host)),
        `endpoint not covered by REQUIRED_RESOURCES: ${endpoint}`,
      ).toBe(true);
    }
  });

  it("rejects a policy that drops a required host", () => {
    const directives = parseCspDirectives(
      "/*\n  Content-Security-Policy: script-src 'self'\n",
    );
    expect(directives.get("script-src")).not.toContain(
      "https://platform.twitter.com",
    );
  });
});
