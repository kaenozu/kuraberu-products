import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("../scripts/verify-pnpm-version.mjs", import.meta.url),
);

function runGuard(userAgent: string) {
  const env: Record<string, string | undefined> = {
    ...process.env,
    npm_config_user_agent: userAgent,
  };
  delete env.NPM_CONFIG_USER_AGENT;
  return spawnSync(process.execPath, [scriptPath], {
    encoding: "utf8",
    env,
  });
}

describe("pnpm version guard", () => {
  it("accepts the pnpm version pinned in package.json", () => {
    const result = runGuard("pnpm/10.34.5 npm/? node/v22.17.0 win32 x64");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("10.34.5");
  });

  it("rejects a pnpm version that differs from the pinned one", () => {
    const result = runGuard("pnpm/11.9.0 npm/? node/v22.17.0 win32 x64");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("expected pnpm 10.34.5");
  });
});
