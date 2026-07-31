const deploymentEnv = process.env.DEPLOYMENT_ENV ?? "preview";
const allowed = new Set(["development", "preview", "production"]);

if (!allowed.has(deploymentEnv)) {
  throw new Error(
    `DEPLOYMENT_ENV must be development, preview, or production: ${deploymentEnv}`,
  );
}

function requireHttpsUrl(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required production variable: ${name}`);
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error(`${name} must use https`);
  }
}

if (deploymentEnv === "production") {
  requireHttpsUrl("PUBLIC_SITE_URL");
  requireHttpsUrl("PUBLIC_RAKUTEN_PREMIUM_URL");
  requireHttpsUrl("PUBLIC_RAKUTEN_SARASARA_URL");
}

console.log(`build environment ok: ${deploymentEnv}`);
