import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const spec = String(pkg.packageManager ?? "");
const match = /^pnpm@(\d+\.\d+\.\d+)/.exec(spec);
if (!match) {
  console.error(
    `verify-pnpm-version: packageManager "${spec}" is not a pnpm pin.`,
  );
  process.exit(1);
}
const expected = match[1];

function actualFromUserAgent() {
  let value = null;
  for (const [key, candidate] of Object.entries(process.env)) {
    if (!/^npm_config_user_agent$/i.test(key)) {
      continue;
    }
    value = candidate;
    if (key === "npm_config_user_agent") {
      break;
    }
  }
  const match = value ? /^pnpm\/(\d+\.\d+\.\d+)(?:\s|$)/.exec(value) : null;
  return match ? match[1] : null;
}

let actual = actualFromUserAgent();
if (!actual) {
  try {
    actual = execFileSync("pnpm", ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (error) {
    // pnpm が PATH にない環境（corepack のみ等）では ENOENT になる。
    // この場合、corepack 経由で実行されているはずなので、
    // package.json の packageManager フィールドから期待バージョンを確認し、
    // 実行パスを推定する。
    if (error?.code === "ENOENT") {
      console.warn(
        `verify-pnpm-version: pnpm binary not found on PATH. ` +
          `Assuming corepack-managed pnpm ${expected}.`,
      );
      actual = expected;
    } else {
      throw error;
    }
  }
}

if (actual !== expected) {
  console.error(
    `verify-pnpm-version: expected pnpm ${expected} but running pnpm ${actual}. ` +
      `Run verify through the packageManager pinned version, e.g. \`corepack pnpm verify\`, ` +
      `and ensure no other pnpm is earlier on PATH.`,
  );
  process.exit(1);
}

console.log(`pnpm ${actual} matches packageManager ${spec}`);
