export type ExternalLinkOutcome = "reachable" | "broken" | "inconclusive";

export interface ExternalLinkResult {
  url: string;
  outcome: ExternalLinkOutcome;
  status?: number;
  finalUrl?: string;
  reason?: string;
}

export interface ExternalLinkProbeOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface ExternalLinkCheckOptions extends ExternalLinkProbeOptions {
  directory?: string;
}

export const DEFAULT_LINK_TIMEOUT_MS: number;
export function collectExternalAnchorUrls(directory?: string): string[];
export function classifyExternalStatus(status: number): ExternalLinkOutcome;
export function probeExternalUrl(
  url: string,
  options?: ExternalLinkProbeOptions,
): Promise<ExternalLinkResult>;
export function checkExternalLinkReachability(
  options?: ExternalLinkCheckOptions,
): Promise<ExternalLinkResult[]>;
