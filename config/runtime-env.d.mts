export type DeploymentEnvironment = "development" | "preview" | "production";

export type EnvironmentValues = Record<string, string | undefined>;

export interface ValidatedBuildEnvironment {
  deploymentEnv: DeploymentEnvironment;
  siteUrl?: string;
  contactUrl?: string;
  amazonAssociateTag?: string;
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
export function normalizeOptionalAmazonAssociateTag(
  value: string | undefined,
  name?: string,
): string | undefined;
export function toAmazonAssociateSearchUrl(
  query: unknown,
  associateTag: string | undefined,
): string | undefined;
export function isAllowedRakutenUrl(value: unknown): boolean;
export function isAllowedAmazonUrl(value: unknown): boolean;
export function isRakutenProductDetailUrl(value: unknown): boolean;
export function toAffiliateRakutenUrl(
  value: string | undefined,
  redirectPrefix?: string,
  environment?: EnvironmentValues,
): string | undefined;
export function toAffiliateRakutenSearchUrl(
  query: unknown,
  environment?: EnvironmentValues,
): string | undefined;
export function isAffiliateRakutenUrl(value: string | undefined): boolean;
export function normalizeOptionalRakutenUrl(
  value: string | undefined,
  name: string,
): string | undefined;
export function validateBuildEnvironment(
  environment?: EnvironmentValues,
): ValidatedBuildEnvironment;
