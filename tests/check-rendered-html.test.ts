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
  it("allows zero, three, and four rendered embeds", () => {
    expect(countRenderedExternalEmbeds(validPage(""))).toBe(0);
    expect(countRenderedExternalEmbeds(validPage(embed.repeat(3)))).toBe(3);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/three/index.html", html: validPage(embed.repeat(3)) },
      ]),
    ).toEqual([]);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/four/index.html", html: validPage(embed.repeat(4)) },
      ]),
    ).toEqual([]);
  });

  it.each([
    ["direct ExternalEmbed output", embed.repeat(5)],
    ["wrapper output", `<article>${embed.repeat(5)}</article>`],
    [
      "barrel re-export wrapper output",
      `<section>${embed.repeat(5)}</section>`,
    ],
    [
      "array or loop expansion output",
      `<ul>${[1, 2, 3, 4, 5].map(() => embed).join("")}</ul>`,
    ],
  ])(`rejects five rendered embeds from %s`, (_label, body) => {
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/articles/five/index.html", html: validPage(body) },
      ]),
    ).toEqual([
      "dist/articles/five/index.html: rendered external embed limit exceeded: found 5, maximum is 4",
    ]);
  });

  it("counts each generated HTML page independently", () => {
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/ok/index.html", html: validPage(embed.repeat(4)) },
        { filePath: "dist/bad/index.html", html: validPage(embed.repeat(5)) },
      ]),
    ).toEqual([
      "dist/bad/index.html: rendered external embed limit exceeded: found 5, maximum is 4",
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

  it("does not count embeds inside a terminated multiline comment", () => {
    const html = `<!--
${embed.repeat(4)}
-->
${embed}`;
    expect(countRenderedExternalEmbeds(html)).toBe(1);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/comment-ok/index.html", html },
      ]),
    ).toEqual([]);
  });

  it("rejects an unterminated comment that hides four embeds", () => {
    const html = `<!--
${embed.repeat(4)}`;
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/comment-hidden/index.html", html },
      ]),
    ).toEqual([
      "dist/comment-hidden/index.html: malformed rendered HTML while checking external embeds: unterminated HTML comment",
    ]);
  });

  it.each([
    "<!-- unterminated comment",
    "<div data-external-embed",
    '<div data-external-embed="',
    "<div foo='unterminated",
    "<script>unterminated",
    "<!--",
  ])("rejects malformed HTML in finite time: %s", (html) => {
    const startedAt = performance.now();
    expect(countRenderedExternalEmbeds(html)).toBeLessThanOrEqual(1);
    expect(performance.now() - startedAt).toBeLessThan(100);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "dist/malformed/index.html", html },
      ]),
    ).toEqual([
      `dist/malformed/index.html: malformed rendered HTML while checking external embeds${
        html.startsWith("<!--") ? ": unterminated HTML comment" : ""
      }`,
    ]);
  });

  it("cannot bypass the four-embed limit with an unterminated comment", () => {
    const html = validPage(`<!-- ${embed.repeat(4)}`);
    expect(
      validateRenderedExternalEmbedCounts([
        { filePath: "fixtures/unterminated-four.html", html },
      ]),
    ).toEqual([
      "fixtures/unterminated-four.html: malformed rendered HTML while checking external embeds: unterminated HTML comment",
    ]);
  });

  it("counts five normal embeds so the limit check can reject them", () => {
    expect(countRenderedExternalEmbeds(validPage(embed.repeat(5)))).toBe(5);
  });

  it("counts one normal embed", () => {
    expect(countRenderedExternalEmbeds(validPage(embed))).toBe(1);
  });

  it("checks all HTML files under dist and reports the generated path", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "kuraberu-rendered-"));
    fixtureDirectories.push(directory);
    writeFileSync(path.join(directory, "ok.html"), validPage(embed.repeat(4)));
    writeFileSync(path.join(directory, "bad.html"), validPage(embed.repeat(5)));

    expect(validateRenderedHtml({ distDirectory: directory }).errors).toContain(
      `${path.join(directory, "bad.html")}: rendered external embed limit exceeded: found 5, maximum is 4`,
    );
  });
});
