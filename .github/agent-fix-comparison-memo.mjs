import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const componentPath = 'src/components/ComparisonMemoButton.astro';
let component = readFileSync(componentPath, 'utf8');
component = component.replace(
  "  import { comparisonMemoStorageKey, encodeComparisonMemo, sanitizeComparisonMemo, toggleComparisonMemo } from '../lib/comparison-memo';\n",
  "  import { comparisonMemoStorageKey, encodeComparisonMemo, sanitizeComparisonMemo, toggleComparisonMemo } from '../lib/comparison-memo';\n  import type { ComparisonMemoState } from '../lib/comparison-memo';\n",
);
component = component.replace('    const render = (ids) => {', '    const render = (ids: readonly string[]) => {');
component = component.replace('    let state;', '    let state: ComparisonMemoState;');
writeFileSync(componentPath, component);

const pagePath = 'src/pages/memo.astro';
let page = readFileSync(pagePath, 'utf8');
page = page.replace('      let ids = [];', '      let ids: string[] = [];');
writeFileSync(pagePath, page);

unlinkSync('.github/agent-fix-comparison-memo.mjs');
