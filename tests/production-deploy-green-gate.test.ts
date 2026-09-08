import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * Dispatch-only invariant guard for the production deploy workflow.
 *
 * Production deploys run exclusively via explicit `workflow_dispatch`
 * (`expected_sha` + `confirm: DEPLOY`); merging to `main` never deploys.
 * Previously a `push` trigger auto-deployed each merge after a CI green-gate
 * poll, and on 2026-09-03 that path fired three attempts (#611/#612/#613)
 * against a red main. The push trigger and its green-gate step were removed
 * (#704), making that incident class structurally impossible: every
 * production run now has an explicit operator signer, and the SHA guards
 * below still reject stale SHAs.
 *
 * These tests pin the dispatch-only shape so the push trigger (and its
 * supporting fallbacks) cannot silently return.
 *
 * Like tests/production-workflow-sha-guard.test.ts, these tests parse the
 * workflow as structured YAML so they survive formatting changes.
 */

const WORKFLOW_PATH = ".github/workflows/deploy-production.yml";
const raw = readFileSync(WORKFLOW_PATH, "utf8");
const workflow = parseYaml(raw) as {
  on: Record<string, unknown>;
  jobs: Record<
    string,
    {
      steps: Array<Record<string, unknown>>;
      "timeout-minutes": number;
    }
  >;
};

const stepList = workflow.jobs.deploy.steps;

function stepIndex(name: string): number {
  return stepList.findIndex((step) => step.name === name);
}

describe("dispatch-only deploy trigger", () => {
  it("has no push trigger", () => {
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
  });

  it("has no push-only green-gate step", () => {
    expect(stepIndex("Block deploy when main is red (CI green gate)")).toBe(-1);
  });

  it("references no push event in any step condition", () => {
    for (const step of stepList) {
      expect(String(step.if ?? "")).not.toContain("github.event_name");
    }
  });

  it("uses the dispatch SHA everywhere (no github.sha fallbacks)", () => {
    expect(raw).not.toContain("${{ github.sha }}");
    expect(raw).not.toContain("inputs.expected_sha ||");
    expect(raw).not.toContain("inputs.confirm ||");
  });

  it("keeps the job timeout within headroom for a full deploy", () => {
    expect(workflow.jobs.deploy["timeout-minutes"]).toBeGreaterThanOrEqual(45);
    expect(workflow.jobs.deploy["timeout-minutes"]).toBeLessThanOrEqual(60);
  });

  it("does not weaken the existing SHA guards ordering", () => {
    const validateIdx = stepIndex("Validate dispatch contract");
    const headGuardIdx = stepIndex("Verify SHA matches default branch HEAD");
    const ancestryIdx = stepIndex(
      "Verify SHA is reachable from default branch (ancestry check)",
    );
    const buildIdx = stepIndex("Build and deploy exact HEAD");
    expect(validateIdx).toBe(0);
    expect(headGuardIdx).toBeLessThan(ancestryIdx);
    expect(ancestryIdx).toBeLessThan(buildIdx);
  });
});
