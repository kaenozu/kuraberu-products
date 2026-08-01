import { readFileSync, readdirSync } from "node:fs";
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
    ["x", "https://x.com:444/example_user/status/1234567890"],
    ["youtube", "https://www.youtube.com:444/watch?v=dQw4w9WgXcQ"],
    ["tiktok", "https://www.tiktok.com:444/@example/video/7412345678901234567"],
    ["pinterest", "https://www.pinterest.com:444/pin/123456789012345678/"],
  ] as const)("rejects invalid %s URLs", (provider, url) => {
    expect(() => createExternalEmbedConfig(provider, url)).toThrow();
  });

  it("accepts explicit standard HTTPS ports after URL normalization", () => {
    expect(
      createExternalEmbedConfig(
        "x",
        "https://x.com:443/example_user/status/1234567890",
      ).canonicalUrl,
    ).toBe("https://x.com/example_user/status/1234567890");
    expect(
      createExternalEmbedConfig(
        "youtube",
        "https://www.youtube.com:443/watch?v=dQw4w9WgXcQ",
      ).canonicalUrl,
    ).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(
      createExternalEmbedConfig(
        "tiktok",
        "https://www.tiktok.com:443/@example/video/7412345678901234567",
      ).canonicalUrl,
    ).toContain("https://www.tiktok.com/");
    expect(
      createExternalEmbedConfig(
        "pinterest",
        "https://www.pinterest.com:443/pin/123456789012345678/",
      ).canonicalUrl,
    ).toBe("https://www.pinterest.com/pin/123456789012345678/");
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
    expect(component).toContain("scriptLoads.delete(src)");
    expect(component).toContain("script.remove()");
    expect(component).toContain('tabindex="-1"');
    expect(component).toContain("target.focus({ preventScroll: true })");
    expect(component).toContain("button.focus({ preventScroll: true })");
    expect(component).toContain("createExternalConditionWaiter");
    expect(component).toContain("hasConnectedProviderDom(provider, target)");
    expect(component).toContain("mutationObserver.observe(target");
    expect(component).not.toContain(
      "読み込み処理を完了しました。表示されない場合は元の投稿へのリンクから確認してください。",
    );
  });

  it("limits phase-one providers to reviewed implementations", () => {
    expect(EXTERNAL_EMBED_PROVIDERS).toEqual([
      "x",
      "youtube",
      "tiktok",
      "pinterest",
    ]);
  });

  it("keeps the reviewed Pinterest acceptance embed in the related article", () => {
    const article = readFileSync(
      "src/pages/articles/pampers-newborn/index.astro",
      "utf8",
    );

    expect(article).toContain('provider="pinterest"');
    expect(article).toContain(
      "https://www.pinterest.com/pin/1095922890543405483/",
    );
    expect(article.match(/<ExternalEmbed\s/g)).toHaveLength(2);
  });

  it("does not keep real external embed screenshots in evidence", () => {
    const evidenceFiles = readdirSync("docs/evidence").filter((file) =>
      /^issue-15-embed-.*\.(?:png|jpe?g|webp|gif)$/i.test(file),
    );
    expect(evidenceFiles).toEqual([]);
  });
});
