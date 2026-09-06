import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * Regression guard: the production deploy workflow MUST block push-triggered
 * deploys when CI is red on the pushed commit.
 *
 * On 2026-09-03, a main merge broke the build/tests (missing article export,
 * failing tests) while the push-triggered `Deploy production` workflow fired
 * anyway; three consecutive runs (#611/#612/#613) failed pre-deploy and
 * produced NO REPORT evidence issues for nothing. The CI green gate now polls
 * the `verify` check run on the pushed SHA and fails closed before checkout:
 * missing check runs, pending beyond the budget, any non-success conclusion,
 * or timeout all block the deploy attempt.
 *
 * Like tests/production-workflow-sha-guard.test.ts, these tests parse the
 * workflow as structured YAML so they survive formatting changes.
 */

const WORKFLOW_PATH = ".github/workflows/deploy-production.yml";
const raw = readFileSync(WORKFLOW_PATH, "utf8");
const workflow = parseYaml(raw) as {
  jobs: Record<
    string,
    {
      steps: Array<Record<string, unknown>>;
      "timeout-minutes": number;
    }
  >;
};

const stepList = workflow.jobs.deploy.steps;

function findStep(name: string): Record<string, unknown> | undefined {
  return stepList.find((step) => step.name === name);
}

function stepIndex(name: string): number {
  return stepList.findIndex((step) => step.name === name);
}

const GATE_NAME = "Block deploy when main is red (CI green gate)";

describe("CI green gate (block deploy on red main)", () => {
  it("exists as the step right after dispatch validation", () => {
    const gate = findStep(GATE_NAME);
    expect(gate).toBeDefined();
    expect(stepIndex(GATE_NAME)).toBe(1);
  });

  it("runs before checkout and before the SHA guards", () => {
    const gateIdx = stepIndex(GATE_NAME);
    const checkoutIdx = stepList.findIndex(
      (s) =>
        typeof s.uses === "string" && s.uses.startsWith("actions/checkout@"),
    );
    const shaGuardIdx = stepIndex("Verify SHA matches default branch HEAD");
    expect(checkoutIdx).toBeGreaterThan(gateIdx);
    expect(shaGuardIdx).toBeGreaterThan(gateIdx);
  });

  it("applies only to push-triggered deploys", () => {
    // workflow_dispatch runs carry an operator-confirmed exact-HEAD SHA and
    // are the manual recovery path when the gate itself is broken.
    const gate = findStep(GATE_NAME);
    expect(gate?.if).toBe("github.event_name == 'push'");
  });

  it("keys on the aggregate verify check run of the pushed SHA", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain('select(.name == "verify")');
    expect(run).toContain("check-runs");
    // Must use the pushed commit SHA via env, never interpolated expressions.
    expect(run).toContain("${EXPECTED_SHA}");
    const env = findStep(GATE_NAME)?.env as Record<string, string> | undefined;
    expect(env?.EXPECTED_SHA).toBe("${{ github.sha }}");
  });

  it("passes only on completed + success", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain('"completed"');
    expect(run).toContain('"success"');
  });

  it("fails closed on a red verdict (non-success conclusion)", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain("Main is red");
    expect(run).toContain("exit 1");
    expect(run).toContain("::error::");
  });

  it("fails closed when no check runs exist for the SHA", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain("No check runs found");
    expect(run).toContain("fail closed");
  });

  it("fails closed when the verify check run never completes (budget timeout)", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain("budget=1800");
    expect(run).toContain("timed out");
    expect(run).toContain("Blocking deploy");
  });

  it("retries transient API errors instead of crashing the step", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain("transient API error");
    // The API call must be guarded so a gh failure retries, not aborts.
    expect(run).toMatch(/if ! verdict=\$\(gh api/);
  });

  it("polls on an interval until a definitive verdict", () => {
    const run = String(findStep(GATE_NAME)?.run ?? "");
    expect(run).toContain("sleep 30");
  });

  it("never interpolates inputs or vars into the gate script", () => {
    // Matches the repo-wide injection guard convention: inputs.* / vars.*
    // must reach run scripts only through env mapping. github.repository /
    // github.token are not attacker-controlled and follow the file's
    // established style (see the evidence-issue steps).
    const gate = findStep(GATE_NAME);
    const run = String(gate?.run ?? "");
    expect(run).not.toMatch(/\$\{\{\s*inputs\./);
    expect(run).not.toMatch(/\$\{\{\s*vars\./);
    // The dispatch-influenced value must come through env, not interpolation.
    expect((gate?.env as Record<string, string>)?.EXPECTED_SHA).toBe(
      "${{ github.sha }}",
    );
  });

  it("extends the job timeout to cover the gate budget plus the deploy", () => {
    // Gate budget is 1800s (30min); the job must not kill a healthy deploy
    // that waited the full budget before starting the ~15min build.
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
