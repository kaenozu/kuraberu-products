export type DeploymentEnvironment = "development" | "preview" | "production";

export type EnvironmentValues = Record<string, string | undefined>;

export interface ValidatedBuildEnvironment {
  deploymentEnv: DeploymentEnvironment;
  siteUrl?: string;
  buildSha?: string;
  contactUrl?: string;
  rakutenPremiumUrl?: string;
  rakutenSarasaraUrl?: string;
  rakutenApiReady: boolean;
}

export const DEFAULT_SITE_URL: string;
export const CONFIGURED_ENVIRONMENT_VARIABLES: readonly string[];

export function normalizeSiteUrl(value: string, name?: string): string;
export function normalizeOptionalPublicUrl(
  value: string | undefined,
  name?: string,
): string | undefined;
export function normalizeOptionalBuildSha(
  value: string | undefined,
  name?: string,
): string | undefined;
export function isAllowedRakutenUrl(value: unknown): boolean;
export function normalizeOptionalRakutenUrl(
  value: string | undefined,
  name: string,
): string | undefined;
export function validateBuildEnvironment(
  environment?: EnvironmentValues,
): ValidatedBuildEnvironment;
