import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  countRenderedExternalEmbeds,
  validateRenderedExternalEmbedCounts,
  validateRenderedHtml,
} from "../scripts/check-rendered-html.mjs";

const fixtureDirectories: string[] = [];

const embed = '<div data-external-embed="x"></div>';

function validPage(body: string) {
  return `<!doctype html>
<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://example.invalid/"></head>
<body><main><h1>Fixture</h1>${body}</main></body></html>`;
}

afterEach(() => {
  while (fixtureDirectories.length) {
    rmSync(fixtureDirectories.pop()!, { recursive: true, force: true });
  }
});

describe("rendered external embed limit", () => {
  it("allows zero and three rendered embeds", () => {
    expect(countRenderedExternalEmbeds(validPage(""))).toBe(0);
    expect(countRenderedExternalEmbeds(validPage(embed.repeat(3)))).toBe(3);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/three/index.html", html: validPage(embed.repeat(3)) },
      ]),
    ).toEqual([]);
  });

  it.each([
    ["direct ExternalEmbed output", embed.repeat(4)],
    ["wrapper output", `<article>${embed.repeat(4)}</article>`],
    [
      "barrel re-export wrapper output",
      `<section>${embed.repeat(4)}</section>`,
    ],
    [
      "array or loop expansion output",
      `<ul>${[1, 2, 3, 4].map(() => embed).join("")}</ul>`,
    ],
  ])("rejects four rendered embeds from %s", (_label, body) => {
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/articles/four/index.html", html: validPage(body) },
      ]),
    ).toEqual([
      "dist/articles/four/index.html: rendered external embed limit exceeded: found 4, maximum is 3",
    ]);
  });

  it("counts each generated HTML page independently", () => {
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/ok/index.html", html: validPage(embed.repeat(3)) },
        { filePath: "dist/bad/index.html", html: validPage(embed.repeat(4)) },
      ]),
    ).toEqual([
      "dist/bad/index.html: rendered external embed limit exceeded: found 4, maximum is 3",
    ]);
  });

  it("ignores comments, attribute values, and module script strings", () => {
    const html = validPage(`
      <!-- ${embed.repeat(4)} -->
      <div data-note="${embed}"></div>
      <script type="module">const html = ${JSON.stringify(embed.repeat(4))};</script>
      ${embed.repeat(3)}
    `);
    expect(countRenderedExternalEmbeds(html)).toBe(3);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/strings/index.html", html },
      ]),
    ).toEqual([]);
  });

  it.each([
    "<div data-external-embed",
    '<div data-external-embed="',
    "<div foo='unterminated",
    "<script>unterminated",
  ])("rejects malformed HTML in finite time: %s", (html) => {
    const startedAt = performance.now();
    expect(countRenderedExternalEmbeds(html)).toBeLessThanOrEqual(1);
    expect(performance.now() - startedAt).toBeLessThan(100);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/malformed/index.html", html },
      ]),
    ).toEqual([
      "dist/malformed/index.html: malformed rendered HTML while checking external embeds",
    ]);
  });

  it("counts four normal embeds so the limit check can reject them", () => {
    expect(countRenderedExternalEmbeds(validPage(embed.repeat(4)))).toBe(4);
  });

  it("counts one normal embed", () => {
    expect(countRenderedExternalEmbeds(validPage(embed))).toBe(1);
  });

  it("checks all HTML files under dist and reports the generated path", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-rendered-"));
    fixtureDirectories.push(directory);
    writeFileSync(path.join(directory, "ok.html"), validPage(embed.repeat(3)));
    writeFileSync(path.join(directory, "bad.html"), validPage(embed.repeat(4)));

    expect(validateRenderedHtml({ distDirectory: directory }).errors).toContain(
      `${path.join(directory, "bad.html")}: rendered external embed limit exceeded: found 4, maximum is 3`,
    );
  });
});
