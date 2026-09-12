import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

const script = readFileSync(
  "tools/production/Invoke-ProductionBuildAndDeploy.ps1",
  "utf8",
);
const workflow = parseYaml(
  readFileSync(".github/workflows/deploy-production.yml", "utf8"),
) as {
  jobs: {
    deploy: {
      env: Record<string, string>;
    };
  };
};

describe("production direct Rakuten affiliate configuration", () => {
  it("passes the protected affiliate id into the production job", () => {
    expect(workflow.jobs.deploy.env.RAKUTEN_AFFILIATE_ID).toBe(
      "${{ secrets.RAKUTEN_AFFILIATE_ID }}",
    );
  });

  it("does not erase the affiliate id in direct purchase-link mode", () => {
    expect(script).not.toContain("$env:RAKUTEN_AFFILIATE_ID = $null");
    expect(script).toContain("$env:RAKUTEN_APPLICATION_ID = $null");
    expect(script).toContain("$env:RAKUTEN_ACCESS_KEY = $null");
  });

  it("still requires the affiliate id for API mode through the existing secret resolver", () => {
    expect(script).toContain(
      "$env:RAKUTEN_AFFILIATE_ID = Resolve-SecretValue 'RAKUTEN_AFFILIATE_ID' 'Rakuten affiliate ID'",
    );
  });
});
