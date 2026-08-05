import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const logicPath = 'src/lib/priority-conclusion.ts';
let logic = readFileSync(logicPath, 'utf8');
logic = logic.replace(
  'const isVerified = (evaluation: PriorityEvaluation): boolean =>\n  evaluation.status === "official" && evaluation.score !== undefined;',
  'const isVerified = (\n  evaluation: PriorityEvaluation,\n): evaluation is PriorityEvaluation & { score: PriorityScore } =>\n  evaluation.status === "official" && evaluation.score !== undefined;',
);
writeFileSync(logicPath, logic);

const componentPath = 'src/components/PriorityConclusion.astro';
let component = readFileSync(componentPath, 'utf8');
component = component.replace(
  '<script type="application/json" data-priority-data set:html={serialized} />',
  '<script is:inline type="application/json" data-priority-data set:html={serialized} />',
);
writeFileSync(componentPath, component);

unlinkSync('.github/agent-fix-priority-conclusion.mjs');
