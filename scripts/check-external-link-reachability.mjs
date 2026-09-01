import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_LINK_TIMEOUT_MS = 10_000;

// State tracking for persistent inconclusive results.
// A single 403/429/500 is normal (bot defense, transient). But if a URL
// stays inconclusive across multiple weekly runs, it needs human review.
export const LINK_STATE_FILE = "data/external-link-state.json";
export const INCONCLUSIVE_WARN_THRESHOLD = 3; // consecutive inconclusive → warning
export const INCONCLUSIVE_FAIL_THRESHOLD = 7; // consecutive inconclusive → BLOCKER

/**
 * Load link state from disk. Returns { urls: { [url]: LinkEntry } }.
 */
export function loadLinkState(statePath = LINK_STATE_FILE) {
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, "utf8"));
    if (raw && typeof raw.urls === "object") return raw;
    return { urls: {} };
  } catch {
    return { urls: {} };
  }
}

/**
 * Save link state to disk.
 */
export function saveLinkState(state, statePath = LINK_STATE_FILE) {
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
}

/**
 * Update state for a single URL based on probe outcome.
 * Returns the updated entry.
 */
export function updateLinkEntry(entry, outcome, reason) {
  const now = new Date().toISOString();
  if (!entry) entry = {};

  if (outcome === "reachable") {
    entry.consecutiveInconclusive = 0;
    entry.lastOutcome = "reachable";
    delete entry.lastReason;
  } else if (outcome === "broken") {
    entry.consecutiveInconclusive = 0;
    entry.lastOutcome = "broken";
    delete entry.lastReason;
  } else {
    // inconclusive (403, 429, 5xx, timeout, network-error)
    entry.consecutiveInconclusive = (entry.consecutiveInconclusive || 0) + 1;
    entry.lastOutcome = "inconclusive";
    if (reason) entry.lastReason = reason;
    else delete entry.lastReason;
  }
  entry.lastCheckedAt = now;
  return entry;
}

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
  statePath = LINK_STATE_FILE,
} = {}) {
  const urls = collectExternalAnchorUrls(directory);
  const results = [];
  const state = loadLinkState(statePath);
  const warnings = [];
  const errors = [];

  for (const url of urls) {
    const result = await probeExternalUrl(url, { fetchImpl, timeoutMs });
    results.push(result);

    // Update state for this URL
    const prev = state.urls[url];
    state.urls[url] = updateLinkEntry(prev, result.outcome, result.reason);
    const entry = state.urls[url];

    // Check consecutive failure thresholds
    const consecutive = entry.consecutiveInconclusive || 0;
    if (consecutive >= INCONCLUSIVE_FAIL_THRESHOLD) {
      errors.push(
        `${url}: ${consecutive} consecutive inconclusive results (last: ${entry.lastReason ?? "unknown"}) — needs human review`,
      );
    } else if (consecutive >= INCONCLUSIVE_WARN_THRESHOLD) {
      warnings.push(
        `${url}: ${consecutive} consecutive inconclusive results (last: ${entry.lastReason ?? "unknown"})`,
      );
    }

    const detail = result.status
      ? `HTTP ${result.status}${result.finalUrl && result.finalUrl !== result.url ? ` -> ${result.finalUrl}` : ""}`
      : result.reason;
    console.log(`${result.outcome}: ${result.url} (${detail})`);
  }

  // Persist state for next run
  saveLinkState(state, statePath);

  const broken = results.filter((result) => result.outcome === "broken");
  const inconclusive = results.filter(
    (result) => result.outcome === "inconclusive",
  );

  if (warnings.length) {
    for (const w of warnings) console.warn(`⚠ ${w}`);
  }
  if (inconclusive.length) {
    console.warn(
      `external link reachability inconclusive: ${inconclusive.length}/${results.length}`,
    );
  }
  if (errors.length) {
    throw new Error(
      `External links with persistent inconclusive status (>=${INCONCLUSIVE_FAIL_THRESHOLD} consecutive runs):\n${errors.join("\n")}`,
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
