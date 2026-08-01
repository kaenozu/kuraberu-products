import { validateBuildEnvironment } from "../config/runtime-env.mjs";

const { deploymentEnv } = validateBuildEnvironment(process.env);
console.log(`build environment ok: ${deploymentEnv}`);
