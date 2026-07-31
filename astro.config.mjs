import { defineConfig } from "astro/config";
import { validateBuildEnvironment } from "./config/runtime-env.mjs";

validateBuildEnvironment(process.env);

export default defineConfig({
  output: "static",
});
