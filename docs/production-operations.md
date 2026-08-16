# Production operations

Production traffic, account credentials, and repository policy remain privileged actions. The repository now automates every value-independent step and requires explicit confirmation for mutations.

## 1. Configure the protected GitHub environment

Dry run:

```powershell
pwsh ./tools/production/Configure-GitHubProductionEnvironment.ps1 `
  -SiteUrl https://example.invalid/ `
  -UseRakutenApi
```

Apply after reviewing names:

```powershell
pwsh ./tools/production/Configure-GitHubProductionEnvironment.ps1 `
  -SiteUrl https://your-production-host.example/ `
  -ContactUrl https://your-contact-form.example/ `
  -UseRakutenApi `
  -Apply `
  -ConfirmApply CONFIGURE_PRODUCTION
```

The script creates the `production` environment, stores public configuration as environment variables, and prompts securely for:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `RAKUTEN_APPLICATION_ID`
- `RAKUTEN_ACCESS_KEY`
- `RAKUTEN_AFFILIATE_ID`

For direct purchase links, omit `-UseRakutenApi` and provide both Rakuten URLs. Secret values are written through `gh secret set`; they are never printed or read back.

Because the current Astro code reads Rakuten credentials through build-time `import.meta.env`, the protected GitHub Environment is the authoritative secret source for the production build. Cloudflare runtime secrets alone do not populate a static Astro build.

## 2. Rehearse locally without publishing

```powershell
pwsh ./tools/production/Invoke-ProductionBuildAndDeploy.ps1 `
  -SiteUrl https://your-production-host.example/ `
  -UseRakutenApi `
  -ExpectedHead <40-character-sha>
```

Without `-Apply`, the script runs frozen install, environment validation, full `verify`, production build, rendered HTML, deployment HTML, and external-link syntax checks. It produces a privacy-safe local report.

## 3. Deploy exact HEAD

Use **Actions → Deploy production → Run workflow** on the default branch.

Inputs:

- `expected_sha`: exact 40-character default-branch SHA;
- `confirm`: `DEPLOY`.

The job uses the protected `production` environment, checks out the exact SHA, builds with protected secrets, runs all production gates, deploys with Wrangler, waits for propagation, then verifies the public site. Environment approval can be enabled in GitHub settings so a human approval is the last irreversible action.

The local script can also deploy with `-Apply`, but only when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are present in the process environment.

## 4. Public verification

```powershell
pwsh ./tools/production/Invoke-PostDeployVerification.ps1 `
  -BaseUrl https://your-production-host.example/ `
  -ExpectedCommitSha <40-character-sha>
```

Checks include:

- required pages return 200;
- generated unknown route returns 404 and `noindex`;
- canonical URLs match the production origin;
- production pages are indexable;
- no mixed-content references;
- article JSON-LD parses and contains article URL and dates;
- Rakuten CTAs exist only on the approved host allowlist.

## 5. X announcement drafts

The production deploy workflow generates X (Twitter) announcement drafts for newly published articles after public verification succeeds. It never posts: drafts are written to `.acceptance/x-announcements-*/report.md` and included in the workflow summary for human review, then posted manually from `@kuraberu_biyori` (or via the X API with credentials that are not stored in CI).

Detection is diff-based: articles present at the deployed SHA (`HEAD`) but absent at `HEAD^` (the previous default-branch HEAD) are considered new. For the first deploy with no parent commit, all articles are treated as new. A draft is at most 280 characters and is built from the article headline, canonical article URL, and up to three tags.

Run locally to preview:

```bash
node scripts/generate-x-announcements.mjs \
  --site-url https://kuraberu-products.pages.dev \
  --previous-sha <previous-deployed-sha>
```

## 6. Spec-claim verification

Articles that state product specs (dimensions, weight, capacity, power, noise, applicable tatami count, and efficiency) are tracked in `data/spec-claims.json`. Each entry records the official source URL(s), a fingerprint of the spec-claim text, and the date the claims were last verified against the official page (`checkedAt`).

The `verify` pipeline runs `node scripts/spec-claims.mjs check`, which fails when:

- a spec-bearing article has no manifest entry (new or changed article);
- the spec-claim fingerprint no longer matches the article (claims changed since verification);
- a manifest entry references an unknown article or has an invalid `checkedAt`.

The check does not fetch official pages; it keeps article claims bound to a dated human verification. Value comparison happens during the manual audit step, and the recorded date is what expires.

Re-verify flow after editing a spec-bearing article:

1. check the current values against the manufacturer official page;
2. `node scripts/spec-claims.mjs update --article-id <id> --checked-at <today>`;
3. commit both the article change and the updated manifest.

The weekly `spec claims freshness` workflow flags entries older than 180 days and opens an issue titled `仕様表記の再照合が必要（spec-claims）` with the official URLs to re-check. Close the issue after updating the affected `checkedAt` values.

Initial entries were generated from the 2026-08-16 full-site audits (dimensions/weight audit and the extended power/capacity/noise/tatami audit), which surfaced and fixed the BabyBjörn cradle weight (`#172`) and smart-potty weight discrepancies.

## 7. Required `verify` ruleset

Dry run and inspect the generated payload:

```powershell
pwsh ./tools/github/Configure-VerifyRuleset.ps1
```

Apply with no administrator bypass:

```powershell
pwsh ./tools/github/Configure-VerifyRuleset.ps1 `
  -AdminBypass None `
  -Apply `
  -ConfirmApply APPLY_RULESET
```

`PullRequest` or `Always` administrator bypass must be selected explicitly. The script protects the default branch from deletion and force-push, requires pull requests, requires review-thread resolution, and requires a strict `verify` status check.

## Rollback

Before deployment, record the current public deployment ID and the exact target SHA. If public verification fails:

1. stop further production runs;
2. use Cloudflare deployment history to redeploy the recorded previous deployment;
3. run `Invoke-PostDeployVerification.ps1` against the restored site;
4. record only deployment IDs, SHAs, timestamps, and PASS/BLOCKER—never secrets or product credentials.

## Human-only boundary

After this automation is merged, the remaining privileged actions are entering secret values, selecting the canonical public domain, approving the protected production environment, deciding administrator bypass policy, and initiating or rolling back public traffic changes.
