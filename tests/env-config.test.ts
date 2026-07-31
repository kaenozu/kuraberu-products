import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const REQUIRED_ENV_FILES = [
  "astro.config.mjs",
  "scripts/validate-build-env.mjs",
];

function requiredProductionVars(): string[] {
  const names = new Set<string>();
  for (const file of REQUIRED_ENV_FILES) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/requireHttpsUrl\("([A-Z0-9_]+)"\)/g)) {
      names.add(match[1]);
    }
  }
  return [...names];
}

function exampleEnvVars(): Set<string> {
  const example = readFileSync(".env.example", "utf8");
  return new Set(
    [...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]),
  );
}

describe("environment variable configuration", () => {
  it("every required production variable is documented in .env.example", () => {
    const missing = requiredProductionVars().filter(
      (name) => !exampleEnvVars().has(name),
    );
    expect(missing, `missing from .env.example: ${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("keeps required and optional variables consistent with README", () => {
    const readme = readFileSync("README.md", "utf8");
    for (const name of requiredProductionVars()) {
      expect(
        readme,
        `${name} must be documented as required in README`,
      ).toContain(name);
    }
  });
});
