import { describe, expect, it } from "vitest";
import {
  countExternalEmbedTags,
  validateExternalEmbedSources,
} from "../scripts/external-embed-limit.mjs";

const embed = '<ExternalEmbed provider="x" url="https://x.com/a/status/1" />';

describe("external embed per-page limit", () => {
  it("allows zero and three embeds", () => {
    expect(countExternalEmbedTags("<article />")).toBe(0);
    expect(countExternalEmbedTags(`${embed}${embed}${embed}`)).toBe(3);
    expect(
      validateExternalEmbedSources([
        {
          filePath: "src/pages/three.astro",
          source: `${embed}${embed}${embed}`,
        },
      ]),
    ).toEqual([]);
  });

  it("rejects four embeds with the article path and count", () => {
    expect(
      validateExternalEmbedSources([
        { filePath: "src/pages/four.astro", source: embed.repeat(4) },
      ]),
    ).toEqual([
      "src/pages/four.astro: external embed limit exceeded: found 4, maximum is 3",
    ]);
  });

  it("counts each source independently", () => {
    expect(
      validateExternalEmbedSources([
        { filePath: "src/pages/ok.astro", source: embed.repeat(3) },
        { filePath: "src/pages/bad.astro", source: embed.repeat(4) },
      ]),
    ).toEqual([
      "src/pages/bad.astro: external embed limit exceeded: found 4, maximum is 3",
    ]);
  });

  it("ignores comments, frontmatter strings, attributes, and closing tags", () => {
    const source = `---
const note = "<ExternalEmbed />";
---
<!-- <ExternalEmbed /> -->
<div data-note="<ExternalEmbed />">text</div>
${embed}
</ExternalEmbed>`;
    expect(countExternalEmbedTags(source)).toBe(1);
  });

  it("detects an aliased direct import", () => {
    const source = `---
import ArticleEmbed from "../../components/ExternalEmbed.astro";
---
<ArticleEmbed provider="x" url="https://x.com/a/status/1" />`;
    expect(countExternalEmbedTags(source)).toBe(1);
  });

  it("does not allow a component wrapper to bypass the page limit", () => {
    expect(
      validateExternalEmbedSources([
        {
          filePath: "src/components/ArticleEmbed.astro",
          source: embed,
        },
      ]),
    ).toEqual([
      "src/components/ArticleEmbed.astro: external embeds must be declared directly in a page so the per-page limit cannot be bypassed by a wrapper",
    ]);
  });
});
