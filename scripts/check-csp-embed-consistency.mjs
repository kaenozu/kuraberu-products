/**
 * scripts/check-csp-embed-consistency.mjs
 *
 * CSP と埋め込み実行時 URL の整合性ゲート。
 * public/_headers の Content-Security-Policy が、src/lib/external-embeds.ts の
 * 実行時リソース（scriptSrc / embedUrl のホスト）をすべて許可していることを
 * 機械検証する。許可漏れは同意後の埋め込み破損になるため fail-closed（exit 1）。
 *
 * 使い方:
 *   node scripts/check-csp-embed-consistency.mjs check
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HEADERS_FILE = "public/_headers";

// 実行時に取得する third-party リソースと、許可が必要な CSP ディレクティブ。
// src/lib/external-embeds.ts の実装と対応付けること:
// - X: platform.twitter.com/widgets.js（scriptSrc）
// - YouTube: www.youtube-nocookie.com/embed（embedUrl）
// - TikTok: www.tiktok.com/player（embedUrl）
// - Pinterest: assets.pinterest.com/js/pinit.js（scriptSrc）
export const REQUIRED_RESOURCES = [
  { host: "platform.twitter.com", directives: ["script-src"] },
  { host: "assets.pinterest.com", directives: ["script-src"] },
  {
    host: "www.youtube-nocookie.com",
    directives: ["frame-src", "media-src"],
  },
  { host: "www.tiktok.com", directives: ["frame-src", "media-src"] },
];

export function parseCspDirectives(headersText) {
  const directives = new Map();
  for (const line of headersText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("Content-Security-Policy:")) continue;
    const policy = trimmed.slice("Content-Security-Policy:".length);
    for (const part of policy.split(";")) {
      const tokens = part.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;
      const [name, ...sources] = tokens;
      directives.set(
        name,
        new Set(sources.map((source) => source.toLowerCase())),
      );
    }
  }
  return directives;
}

function sourceCoversHost(sources, host) {
  const lower = host.toLowerCase();
  for (const source of sources) {
    if (source === lower) return true;
    if (source.startsWith("https://")) {
      const pattern = source.slice("https://".length);
      if (pattern === lower) return true;
      if (pattern.startsWith("*.")) {
        const suffix = pattern.slice(1);
        if (lower.endsWith(suffix)) return true;
      }
    }
  }
  return false;
}

export function checkCspEmbedConsistency({ headersFile = HEADERS_FILE } = {}) {
  if (!fs.existsSync(headersFile)) {
    throw new Error(`headers file not found: ${headersFile}`);
  }
  const directives = parseCspDirectives(fs.readFileSync(headersFile, "utf8"));
  const violations = [];
  for (const { host, directives: names } of REQUIRED_RESOURCES) {
    for (const name of names) {
      const sources = directives.get(name);
      if (!sources) {
        violations.push(`${name} directive is missing (needed for ${host})`);
      } else if (!sourceCoversHost(sources, host)) {
        violations.push(`${name} does not allow ${host}`);
      }
    }
  }
  return { violations, resourceCount: REQUIRED_RESOURCES.length };
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const mode = process.argv[2] ?? "check";
  if (mode !== "check") {
    console.error(`ERROR: unknown mode: ${mode}`);
    process.exitCode = 2;
  } else {
    const { violations, resourceCount } = checkCspEmbedConsistency();
    if (violations.length > 0) {
      console.error("CSP / embed consistency violations:");
      for (const violation of violations) console.error(`- ${violation}`);
      process.exitCode = 1;
    } else {
      console.log(
        `csp / embed consistency ok: ${resourceCount} runtime resource(s) covered`,
      );
    }
  }
}
