import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createExternalEmbedConfig,
  EXTERNAL_EMBED_PROVIDERS,
} from "../src/lib/external-embeds";

describe("external embed URL validation", () => {
  it("normalizes supported official URLs", () => {
    expect(
      createExternalEmbedConfig(
        "youtube",
        "https://youtu.be/dQw4w9WgXcQ?si=example",
      ),
    ).toMatchObject({
      canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      renderer: "iframe",
    });

    expect(
      createExternalEmbedConfig(
        "x",
        "https://twitter.com/example_user/status/1234567890?ref_src=test",
      ),
    ).toMatchObject({
      canonicalUrl: "https://x.com/example_user/status/1234567890",
      renderer: "widget",
    });

    expect(
      createExternalEmbedConfig(
        "tiktok",
        "https://www.tiktok.com/@example/video/7412345678901234567",
      ),
    ).toMatchObject({
      embedUrl: "https://www.tiktok.com/player/v1/7412345678901234567",
      renderer: "iframe",
    });

    expect(
      createExternalEmbedConfig(
        "pinterest",
        "https://www.pinterest.jp/pin/123456789012345678/",
      ),
    ).toMatchObject({
      canonicalUrl: "https://www.pinterest.com/pin/123456789012345678/",
      renderer: "widget",
    });
  });

  it.each([
    ["x", "https://example.com/user/status/123"],
    ["x", "https://x.com/search?q=product"],
    ["youtube", "https://www.youtube.com/watch?v=short"],
    ["tiktok", "https://www.tiktok.com/@example"],
    ["pinterest", "https://www.pinterest.com/search/pins/?q=product"],
    ["youtube", "http://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["youtube", "https://user:password@www.youtube.com/watch?v=dQw4w9WgXcQ"],
  ] as const)("rejects invalid %s URLs", (provider, url) => {
    expect(() => createExternalEmbedConfig(provider, url)).toThrow();
  });

  it("keeps the initial page free from third-party script tags", () => {
    const component = readFileSync(
      "src/components/ExternalEmbed.astro",
      "utf8",
    );

    expect(component).not.toMatch(/<script[^>]+src=/i);
    expect(component).not.toContain("set:html");
    expect(component).toContain("data-external-embed-load");
    expect(component).toContain("元の投稿へのリンク");
  });

  it("limits phase-one providers to reviewed implementations", () => {
    expect(EXTERNAL_EMBED_PROVIDERS).toEqual([
      "x",
      "youtube",
      "tiktok",
      "pinterest",
    ]);
  });
});
