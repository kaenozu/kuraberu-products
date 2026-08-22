import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * Regression guard: the production deploy workflow MUST reject an input SHA
 * that differs from the default branch HEAD at dispatch time.
 *
 * Prior to the guard, a privileged dispatcher could deploy any reachable
 * commit (e.g. an older release or an un-merged PR head) by supplying its
 * 40-char SHA.  The workflow resolves the real default branch HEAD via
 * `github.event.repository.default_branch` (not `github.sha` which reflects
 * the dispatch ref) and rejects mismatches *before* checkout.
 *
 * These tests parse the workflow as structured YAML rather than matching raw
 * text with regex, making them robust against formatting changes, indentation
 * shifts, and comment rewrites.
 */

const WORKFLOW_PATH = ".github/workflows/deploy-production.yml";
const raw = readFileSync(WORKFLOW_PATH, "utf8");
const workflow = parseYaml(raw) as {
  name: string;
  on: Record<string, unknown>;
  permissions: Record<string, string>;
  concurrency: Record<string, unknown>;
  jobs: Record<
    string,
    {
      steps: Array<Record<string, unknown>>;
      environment: string;
      "timeout-minutes": number;
      if?: string;
      env?: Record<string, string>;
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

describe("production deploy SHA guard", () => {
  describe("workflow_dispatch input contract", () => {
    it("declares expected_sha as a required string input", () => {
      const on = workflow.on as Record<string, unknown>;
      const dispatch = on.workflow_dispatch as Record<string, unknown>;
      const inputs = dispatch.inputs as Record<string, unknown>;
      const shaInput = inputs.expected_sha as Record<string, unknown>;

      expect(shaInput).toBeDefined();
      expect(shaInput.required).toBe(true);
      expect(shaInput.type).toBe("string");
      expect(String(shaInput.description)).toMatch(/default.?branch|SHA/i);
    });

    it("declares confirm as a required input", () => {
      const on = workflow.on as Record<string, unknown>;
      const dispatch = on.workflow_dispatch as Record<string, unknown>;
      const inputs = dispatch.inputs as Record<string, unknown>;
      const confirmInput = inputs.confirm as Record<string, unknown>;

      expect(confirmInput).toBeDefined();
      expect(confirmInput.required).toBe(true);
    });

    it("fails explicitly instead of skipping when confirm != DEPLOY", () => {
      // A job-level `if` silently skips the entire run when the dispatcher
      // forgets the confirmation phrase, leaving no feedback. The guard must
      // instead live in the first step, which fails loudly with exit 1.
      expect(workflow.jobs.deploy.if).toBeUndefined();
      const run = String(findStep("Validate dispatch contract")?.run ?? "");
      expect(run).toContain("DEPLOY_CONFIRM");
      expect(run).toContain('!= "DEPLOY"');
      expect(run).toContain("exit 1");
      expect(run).toContain("::error::");
    });
  });

  describe("Validate dispatch contract step", () => {
    it("exists as the first step", () => {
      const step = findStep("Validate dispatch contract");
      expect(step).toBeDefined();
      expect(stepIndex("Validate dispatch contract")).toBe(0);
    });

    it("validates the SHA is a 40-char lowercase hex string", () => {
      const step = findStep("Validate dispatch contract");
      const run = String(step?.run ?? "");
      expect(run).toMatch(/\[\[ ! "\$EXPECTED_SHA" =~ \^\[0-9a-f\]\{40\}\$/);
    });

    it("rejects uppercase hex SHAs (rev-parse output is lowercase)", () => {
      const step = findStep("Validate dispatch contract");
      const run = String(step?.run ?? "");
      // Uppercase input can never equal `git rev-parse` output, so accepting
      // it in validation would only move the failure to a later, vaguer step.
      expect(run).not.toMatch(/0-9a-fA-F/);
      expect(run).toMatch(/lowercase hex commit SHA/);
    });

    it("exposes required repository variables via the job environment", () => {
      const env = workflow.jobs.deploy.env as Record<string, string>;
      expect(env.PUBLIC_SITE_URL).toBe("${{ vars.PUBLIC_SITE_URL }}");
      expect(env.DEPLOYMENT_ENV_VAR).toContain("vars.DEPLOYMENT_ENV");
      expect(env.PURCHASE_LINK_MODE).toContain("vars.PURCHASE_LINK_MODE");
    });

    it("validates required environment variables from the environment", () => {
      const run = String(findStep("Validate dispatch contract")?.run ?? "");
      expect(run).toContain("$PUBLIC_SITE_URL");
      expect(run).toContain("$DEPLOYMENT_ENV_VAR");
      expect(run).toContain("$PURCHASE_LINK_MODE");
    });

    it("validates deployment env is production", () => {
      const step = findStep("Validate dispatch contract");
      const run = String(step?.run ?? "");
      expect(run).toContain('"production"');
    });

    it("runs before checkout", () => {
      const validateIdx = stepIndex("Validate dispatch contract");
      const checkoutStep = stepList.find(
        (s) =>
          typeof s.uses === "string" && s.uses.startsWith("actions/checkout@"),
      );
      expect(checkoutStep).toBeDefined();
      expect(validateIdx).toBeLessThan(stepList.indexOf(checkoutStep!));
    });
  });

  describe("Verify SHA matches default branch HEAD step", () => {
    it("exists after checkout but before build", () => {
      const step = findStep("Verify SHA matches default branch HEAD");
      expect(step).toBeDefined();
      const guardIdx = stepIndex("Verify SHA matches default branch HEAD");
      const buildIdx = stepIndex("Build and deploy exact HEAD");
      expect(guardIdx).toBeGreaterThan(-1);
      expect(buildIdx).toBeGreaterThan(-1);
      expect(guardIdx).toBeLessThan(buildIdx);
    });

    it("runs before the public deployment verification", () => {
      const guardIdx = stepIndex("Verify SHA matches default branch HEAD");
      const verifyIdx = stepIndex("Verify public deployment");
      expect(verifyIdx).toBeGreaterThan(-1);
      expect(guardIdx).toBeLessThan(verifyIdx);
    });

    it("compares the expected SHA against the real default branch HEAD", () => {
      const step = findStep("Verify SHA matches default branch HEAD");
      const run = String(step?.run ?? "");
      expect(run).toContain("$EXPECTED_SHA");
      // Must NOT use ${{ github.sha }} as variable reference (reflects dispatch ref)
      expect(run).not.toContain("${{ github.sha }}");
      expect(run).not.toContain("${{ inputs.");
      // Must resolve the actual default branch via repository metadata
      const env = step?.env as Record<string, string> | undefined;
      expect(env?.DEFAULT_BRANCH).toContain(
        "github.event.repository.default_branch",
      );
    });

    it("exits with code 1 on mismatch", () => {
      const step = findStep("Verify SHA matches default branch HEAD");
      const run = String(step?.run ?? "");
      expect(run).toContain("exit 1");
    });

    it("prints an error annotation on mismatch", () => {
      const step = findStep("Verify SHA matches default branch HEAD");
      const run = String(step?.run ?? "");
      expect(run).toContain("::error::");
      expect(run).toContain(
        "Only the latest default-branch commit may be deployed",
      );
    });

    it("uses bash shell", () => {
      const step = findStep("Verify SHA matches default branch HEAD");
      expect(step?.shell).toBe("bash");
    });

    it("resolves the default branch via env, not github.ref", () => {
      const step = findStep("Verify SHA matches default branch HEAD");
      const env = step?.env as Record<string, string> | undefined;
      expect(env).toBeDefined();
      expect(env?.DEFAULT_BRANCH).toContain(
        "github.event.repository.default_branch",
      );
      // Must NOT use ${{ github.ref }} or ${{ github.sha }} as variable references
      const run = String(step?.run ?? "");
      expect(run).not.toContain("${{ github.ref }}");
      expect(run).not.toContain("${{ github.sha }}");
    });
  });

  describe("Verify SHA is reachable from default branch (ancestry check)", () => {
    it("exists after the SHA == HEAD guard but before build", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      expect(step).toBeDefined();
      const headGuardIdx = stepIndex("Verify SHA matches default branch HEAD");
      const ancestryIdx = stepIndex(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const buildIdx = stepIndex("Build and deploy exact HEAD");
      expect(ancestryIdx).toBeGreaterThan(headGuardIdx);
      expect(ancestryIdx).toBeLessThan(buildIdx);
    });

    it("uses git merge-base --is-ancestor for the ancestry check", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const run = String(step?.run ?? "");
      expect(run).toContain("git merge-base --is-ancestor");
    });

    it("compares the expected SHA against the real default branch HEAD", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const run = String(step?.run ?? "");
      expect(run).toContain("$EXPECTED_SHA");
      // Must NOT use ${{ inputs.* }} or ${{ github.ref }} as variable references
      expect(run).not.toContain("${{ inputs.");
      expect(run).not.toContain("${{ github.ref }}");
      const env = step?.env as Record<string, string> | undefined;
      expect(env?.DEFAULT_BRANCH).toContain(
        "github.event.repository.default_branch",
      );
    });

    it("exits with code 1 when SHA is not an ancestor", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const run = String(step?.run ?? "");
      expect(run).toContain("exit 1");
    });

    it("prints an error annotation for non-ancestor SHAs", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const run = String(step?.run ?? "");
      expect(run).toContain("::error::");
      expect(run).toContain("not an ancestor");
    });

    it("uses bash shell", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      expect(step?.shell).toBe("bash");
    });

    it("uses the real default branch (not github.ref) for ancestry check", () => {
      const step = findStep(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const run = String(step?.run ?? "");
      // Must NOT use ${{ github.ref }} as variable reference
      expect(run).not.toContain("${{ github.ref }}");
      const env = step?.env as Record<string, string> | undefined;
      expect(env?.DEFAULT_BRANCH).toContain(
        "github.event.repository.default_branch",
      );
    });
  });

  describe("Verify exact checkout step", () => {
    it("exists after the ancestry check", () => {
      const step = findStep("Verify exact checkout");
      expect(step).toBeDefined();
      const ancestryIdx = stepIndex(
        "Verify SHA is reachable from default branch (ancestry check)",
      );
      const checkoutVerifyIdx = stepIndex("Verify exact checkout");
      expect(checkoutVerifyIdx).toBeGreaterThan(ancestryIdx);
    });

    it("confirms git HEAD matches the expected SHA", () => {
      const step = findStep("Verify exact checkout");
      const run = String(step?.run ?? "");
      expect(run).toContain("git rev-parse HEAD");
      expect(run).toContain("$EXPECTED_SHA");
      expect(run).not.toContain("${{ inputs.");
    });
  });

  describe("checkout step configuration", () => {
    it("checks out the input SHA with full history", () => {
      const checkoutStep = stepList.find(
        (s) =>
          typeof s.uses === "string" && s.uses.startsWith("actions/checkout@"),
      );
      expect(checkoutStep).toBeDefined();
      const withBlock = checkoutStep?.with as Record<string, unknown>;
      expect(withBlock?.ref).toBe("${{ inputs.expected_sha }}");
      expect(withBlock?.["fetch-depth"]).toBe(0);
    });

    it("does not persist credentials", () => {
      const checkoutStep = stepList.find(
        (s) =>
          typeof s.uses === "string" && s.uses.startsWith("actions/checkout@"),
      );
      const withBlock = checkoutStep?.with as Record<string, unknown>;
      expect(withBlock?.["persist-credentials"]).toBe(false);
    });
  });

  describe("workflow security properties", () => {
    it("is triggered only by workflow_dispatch", () => {
      const on = workflow.on as Record<string, unknown>;
      expect(Object.keys(on)).toEqual(["workflow_dispatch"]);
    });

    it("uses read-only contents permission", () => {
      const permissions = workflow.permissions as Record<string, string>;
      expect(permissions.contents).toBe("read");
    });

    it("grants read access to the Actions runs API for evidence scripts", () => {
      // create-deploy-evidence-issue.mjs / reupload-deploy-evidence.mjs call
      // repos/*/actions/runs/<id>; without actions: read they fail with 403.
      const permissions = workflow.permissions as Record<string, string>;
      expect(permissions.actions).toBe("read");
    });

    it("uses concurrency group to prevent parallel deploys", () => {
      const concurrency = workflow.concurrency as Record<string, unknown>;
      expect(concurrency.group).toBe("production-deploy");
      expect(concurrency["cancel-in-progress"]).toBe(false);
    });

    it("runs on the production environment", () => {
      expect(workflow.jobs.deploy.environment).toBe("production");
    });

    it("has a timeout to prevent runaway builds", () => {
      expect(typeof workflow.jobs.deploy["timeout-minutes"]).toBe("number");
      expect(workflow.jobs.deploy["timeout-minutes"]).toBeLessThanOrEqual(60);
    });
  });

  describe("step ordering invariants", () => {
    it("builds only after SHA verification", () => {
      const guardIdx = stepIndex("Verify SHA matches default branch HEAD");
      const buildIdx = stepIndex("Build and deploy exact HEAD");
      expect(guardIdx).toBeGreaterThanOrEqual(0);
      expect(buildIdx).toBeGreaterThan(guardIdx);
    });

    it("deploys only after build", () => {
      const buildIdx = stepIndex("Build and deploy exact HEAD");
      const verifyIdx = stepIndex("Verify public deployment");
      expect(buildIdx).toBeGreaterThanOrEqual(0);
      expect(verifyIdx).toBeGreaterThan(buildIdx);
    });

    it("validation runs before any checkout or build", () => {
      const validateIdx = stepIndex("Validate dispatch contract");
      const checkoutStep = stepList.findIndex(
        (s) =>
          typeof s.uses === "string" && s.uses.startsWith("actions/checkout@"),
      );
      const buildIdx = stepIndex("Build and deploy exact HEAD");
      expect(validateIdx).toBe(0);
      expect(checkoutStep).toBeGreaterThan(0);
      expect(buildIdx).toBeGreaterThan(checkoutStep);
    });
  });

  describe("expression injection guard", () => {
    // inputs.* / vars.* interpolated directly into run: scripts let a
    // malicious dispatcher or repo variable inject shell commands. They must
    // only reach the scripts through the job-level env mapping.
    it("never interpolates inputs or vars into run scripts", () => {
      stepList.forEach((step, index) => {
        if (typeof step.run !== "string") return;
        const label = `step ${index} (${String(step.name ?? "unnamed")})`;
        expect(step.run, label).not.toMatch(/\$\{\{\s*inputs\./);
        expect(step.run, label).not.toMatch(/\$\{\{\s*vars\./);
      });
    });

    it("routes dispatch inputs through the job environment", () => {
      const env = workflow.jobs.deploy.env as Record<string, string>;
      expect(env.EXPECTED_SHA).toBe("${{ inputs.expected_sha }}");
      expect(env.DEPLOY_CONFIRM).toBe("${{ inputs.confirm }}");
    });

    it("pins upload-artifact to a single version across workflows", () => {
      const pins = stepList
        .filter(
          (s) =>
            typeof s.uses === "string" &&
            s.uses.startsWith("actions/upload-artifact@"),
        )
        .map((s) => String(s.uses));
      expect(new Set(pins).size).toBeLessThanOrEqual(1);
    });
  });
});
