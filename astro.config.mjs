import { defineConfig } from "astro/config";

const deploymentEnv = process.env.DEPLOYMENT_ENV ?? "preview";
const allowedEnvironments = new Set(["development", "preview", "production"]);

if (!allowedEnvironments.has(deploymentEnv)) {
  throw new Error(
    `DEPLOYMENT_ENV must be development, preview, or production: ${deploymentEnv}`,
  );
}

function requireHttpsUrl(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required production variable: ${name}`);
  if (new URL(value).protocol !== "https:") {
    throw new Error(`${name} must use https`);
  }
}

if (deploymentEnv === "production") {
  requireHttpsUrl("PUBLIC_SITE_URL");
  requireHttpsUrl("PUBLIC_RAKUTEN_PREMIUM_URL");
  requireHttpsUrl("PUBLIC_RAKUTEN_SARASARA_URL");
  requireHttpsUrl("PUBLIC_CONTACT_URL");
}

export default defineConfig({
  output: "static",
});
