export interface CssUsageSelector {
  className: string;
  cssFiles: string[];
  dynamic: boolean;
  referenced: boolean;
}

export interface CssUsageReport {
  generatedAt: string;
  cssFiles: string[];
  sourceFileCount: number;
  selectorCount: number;
  referencedCount: number;
  unusedCount: number;
  unused: CssUsageSelector[];
  selectors: CssUsageSelector[];
}

export function createCssUsageReport(options?: {
  root?: string;
}): CssUsageReport;
export function printCssUsageReport(report: CssUsageReport): void;
