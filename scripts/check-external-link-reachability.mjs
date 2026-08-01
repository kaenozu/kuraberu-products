import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_LINK_TIMEOUT_MS = 10_000;

function walkHtmlFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(current, files);
    else if (current.endsWith(".html")) files.push(current);
  }
  return files;
}

export function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'");
}

export function collectExternalAnchorUrls(directory = "dist") {
  const urls = new Set();
  for (const file of walkHtmlFiles(directory)) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(
      /<a\b[^>]*\bhref="(https:\/\/[^"#]+)"[^>]*>/gi,
    )) {
      urls.add(decodeHtmlAttribute(match[1]));
    }
  }
  return [...urls].sort();
}

export function classifyExternalStatus(status) {
  if (status >= 200 && status < 400) return "reachable";
  if (status === 404 || status === 410) return "broken";
  return "inconclusive";
}

async function requestWithTimeout(url, method, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "kuraberu-products-link-check/1.0",
        ...(method === "GET" ? { range: "bytes=0-0" } : {}),
      },
    });
    await response.body?.cancel();
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeExternalUrl(
  url,
  { fetchImpl = fetch, timeoutMs = DEFAULT_LINK_TIMEOUT_MS } = {},
) {
  try {
    const head = await requestWithTimeout(url, "HEAD", fetchImpl, timeoutMs);
    if (head.status !== 405 && head.status !== 501) {
      return {
        url,
        status: head.status,
        finalUrl: head.url || url,
        outcome: classifyExternalStatus(head.status),
      };
    }

    const get = await requestWithTimeout(url, "GET", fetchImpl, timeoutMs);
    return {
      url,
      status: get.status,
      finalUrl: get.url || url,
      outcome: classifyExternalStatus(get.status),
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "network-error";
    return { url, outcome: "inconclusive", reason };
  }
}

export async function checkExternalLinkReachability({
  directory = "dist",
  fetchImpl = fetch,
  timeoutMs = DEFAULT_LINK_TIMEOUT_MS,
} = {}) {
  const urls = collectExternalAnchorUrls(directory);
  const results = [];

  for (const url of urls) {
    results.push(await probeExternalUrl(url, { fetchImpl, timeoutMs }));
  }

  const broken = results.filter((result) => result.outcome === "broken");
  const inconclusive = results.filter(
    (result) => result.outcome === "inconclusive",
  );

  for (const result of results) {
    const detail = result.status
      ? `HTTP ${result.status}${result.finalUrl && result.finalUrl !== result.url ? ` -> ${result.finalUrl}` : ""}`
      : result.reason;
    console.log(`${result.outcome}: ${result.url} (${detail})`);
  }

  if (inconclusive.length) {
    console.warn(
      `external link reachability inconclusive: ${inconclusive.length}/${results.length}`,
    );
  }
  if (broken.length) {
    throw new Error(
      `broken external links: ${broken.map((result) => result.url).join(", ")}`,
    );
  }

  console.log(`external link reachability ok: ${results.length} URLs`);
  return results;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  await checkExternalLinkReachability();
}
