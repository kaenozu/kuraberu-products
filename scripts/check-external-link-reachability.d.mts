export const DEFAULT_LINK_TIMEOUT_MS: number;
export const LINK_STATE_FILE: string;
export const INCONCLUSIVE_WARN_THRESHOLD: number;
export const INCONCLUSIVE_FAIL_THRESHOLD: number;

export interface LinkState {
  urls: Record<string, LinkEntry>;
}

export interface LinkEntry {
  consecutiveInconclusive?: number;
  lastOutcome?: string;
  lastReason?: string;
  lastCheckedAt?: string;
}

export interface ProbeResult {
  url: string;
  status?: number | null;
  finalUrl?: string;
  outcome: "reachable" | "broken" | "inconclusive";
  reason?: string;
}

export function loadLinkState(statePath?: string): LinkState;
export function saveLinkState(state: LinkState, statePath?: string): void;
export function updateLinkEntry(
  entry: LinkEntry | undefined,
  outcome: "reachable" | "broken" | "inconclusive",
  reason?: string,
): LinkEntry;
export function decodeHtmlAttribute(value: string): string;
export function collectExternalAnchorUrls(directory?: string): string[];
export function classifyExternalStatus(
  status: number,
): "reachable" | "broken" | "inconclusive";
export function probeExternalUrl(
  url: string,
  options?: { fetchImpl?: typeof fetch; timeoutMs?: number },
): Promise<ProbeResult>;
export function checkExternalLinkReachability(options?: {
  directory?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  statePath?: string;
}): Promise<{
  reachable: string[];
  broken: string[];
  inconclusive: string[];
  warnings: string[];
  errors: string[];
  total: number;
}>;
