# Production Environment Configuration Guide

This document specifies the GitHub Production Environment settings required to
complete the HOLD release. All settings listed here **must be configured manually**
by a repository administrator — they cannot be changed via code or API without
appropriate permissions.

## Current State (as of audit date)

| Setting                  | Current Value      | Status                     |
| ------------------------ | ------------------ | -------------------------- |
| Environment name         | `production`       | ✅ Configured              |
| Deployment branch policy | `null` (no policy) | ⚠️ **NEEDS CONFIGURATION** |
| Required reviewers       | `[]` (none)        | ⚠️ **NEEDS CONFIGURATION** |
| Wait timer               | 0 minutes          | ⚠️ **NEEDS CONFIGURATION** |
| Prevent self-review      | Not set            | ⚠️ **NEEDS CONFIGURATION** |
| Admins can bypass        | `true`             | ⚠️ **NEEDS REVIEW**        |

## Required Configuration Steps

### 1. Deployment Branch Policy

**Current**: `null` — any branch can deploy to production.

**Required**: Configure a deployment branch policy that restricts which branches
can trigger deployments to the `production` environment.

**Recommended setting**: Protected branches only, or explicit branch pattern
matching the default branch name (`feat/affiliate-site-foundation`).

**How to configure**:

1. Go to repository Settings → Environments → production
2. Under "Deployment branches", select "Selected branches"
3. Add a branch protection rule:
   - Pattern: `feat/affiliate-site-foundation` (or `main` if renamed)
   - This ensures only the default branch can trigger production deploys

**Why this matters**: Without a branch policy, anyone with `workflow_dispatch`
permissions can trigger a production deploy from any branch. The code-level
SHA guard (`inputs.expected_sha == github.sha`) provides defense-in-depth,
but the environment policy is the primary gate.

### 2. Required Reviewers

**Current**: Empty array — no reviewers required.

**Required**: Add at least one required reviewer for production deployments.

**Recommended setting**: Add 1-2 repository administrators as required reviewers.

**How to configure**:

1. Go to repository Settings → Environments → production
2. Under "Protection rules", click "Add reviewer"
3. Add GitHub usernames of trusted reviewers
4. Optionally enable "Prevent self-review" to prevent the deployer from
   approving their own deployment

**Why this matters**: Required reviewers ensure that a human reviews every
production deployment before it proceeds. This is the last line of defense
against accidental or malicious deployments.

### 3. Wait Timer

**Current**: 0 minutes (immediate deployment).

**Required**: Configure a wait timer to allow cancellation of accidental deploys.

**Recommended setting**: 5-15 minutes.

**How to configure**:

1. Go to repository Settings → Environments → production
2. Under "Protection rules", set "Wait timer" to 5-15 minutes
3. This gives reviewers time to cancel if a deployment was triggered in error

**Why this matters**: A wait timer provides a safety window between the deploy
request and actual deployment. If a deploy is triggered accidentally, it can
be cancelled before it takes effect.

### 4. Prevent Self-Review

**Current**: Not configured.

**Required**: Enable to prevent the deployer from approving their own deployment.

**How to configure**:

1. Go to repository Settings → Environments → production
2. Under "Protection rules", enable "Prevent self-review"
3. This ensures the person who triggers the deploy cannot also approve it

**Why this matters**: Self-review bypasses the purpose of required reviewers.
Enabling this ensures a different person reviews every production deployment.

### 5. Admin Bypass Policy

**Current**: `can_admins_bypass: true` — administrators can bypass all
environment protection rules.

**Required**: Review whether admin bypass should be allowed.

**Options**:

- **Keep enabled**: Administrators can bypass protection rules for emergency
  deployments. This is convenient but reduces security.
- **Disable**: Even administrators must follow the full review process.
  This is more secure but may slow down emergency deployments.

**Recommendation**: Keep enabled for now, but document the emergency bypass
procedure and ensure it's audited.

## Environment Variables (Already Configured)

These variables are already set in the production environment:

| Variable                      | Value                                 | Notes                             |
| ----------------------------- | ------------------------------------- | --------------------------------- |
| `DEPLOYMENT_ENV`              | `production`                          | Deployment environment identifier |
| `PUBLIC_SITE_URL`             | `https://kuraberu-products.pages.dev` | Production site URL               |
| `PUBLIC_RAKUTEN_PREMIUM_URL`  | `https://a.r10.to/hPGC8L`             | Rakuten premium affiliate URL     |
| `PUBLIC_RAKUTEN_SARASARA_URL` | `https://a.r10.to/hHx75A`             | Rakuten sarasara affiliate URL    |
| `PURCHASE_LINK_MODE`          | `direct`                              | Purchase link resolution mode     |

**Missing variable**: `PUBLIC_CONTACT_URL` — referenced in workflow but not
configured. Must be added before production deploy.

## Environment Secrets (Already Configured)

These secrets are already set in the production environment:

| Secret                  | Status        | Notes                         |
| ----------------------- | ------------- | ----------------------------- |
| `CLOUDFLARE_API_TOKEN`  | ✅ Configured | Cloudflare Pages deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Configured | Cloudflare account ID         |

**Missing secrets** (required for `PURCHASE_LINK_MODE: api`):

- `RAKUTEN_APPLICATION_ID` — Rakuten API application ID
- `RAKUTEN_ACCESS_KEY` — Rakuten API access key
- `RAKUTEN_AFFILIATE_ID` — Rakuten affiliate ID

**Note**: These are only required if `PURCHASE_LINK_MODE` is set to `api`.
Currently it's set to `direct`, so these secrets are not needed for the
current configuration.

## Repository Settings

| Setting                      | Current Value                    | Notes             |
| ---------------------------- | -------------------------------- | ----------------- |
| Default branch               | `feat/affiliate-site-foundation` | Non-standard name |
| Repository visibility        | Public                           | ✅                |
| Default workflow permissions | Read                             | ✅ Secure default |
| Actions permissions          | Workflow reads allowed           | ✅                |

## Branch Protection (Rulesets)

A ruleset named "protect main branches" is active with:

| Rule                   | Configuration                                      |
| ---------------------- | -------------------------------------------------- |
| Deletion               | Blocked                                            |
| Non-fast-forward       | Blocked                                            |
| Pull request           | Required (0 approvals, thread resolution required) |
| Required status checks | `verify` (integration ID: 15368)                   |
| Strict status checks   | Enabled                                            |
| Allowed merge methods  | merge, squash, rebase                              |

**Note**: This ruleset applies to the default branch (`feat/affiliate-site-foundation`).
The name "protect main branches" is misleading — it actually protects the
default branch regardless of its name.

## Pre-Deploy Checklist

Before enabling production deployments, verify:

- [ ] Deployment branch policy is configured (Section 1)
- [ ] Required reviewers are added (Section 2)
- [ ] Wait timer is set (Section 3)
- [ ] Self-review prevention is enabled (Section 4)
- [ ] Admin bypass policy is reviewed (Section 5)
- [ ] `PUBLIC_CONTACT_URL` variable is added
- [ ] Missing secrets are added (if using `PURCHASE_LINK_MODE: api`)
- [ ] Code-level SHA guard is in place (already done)
- [ ] Ancestry check is in place (already done)
- [ ] Post-deploy verification covers all critical paths

## Security Considerations

### Defense-in-Depth Layers

The production deployment has multiple security layers:

1. **Code-level SHA guard**: `inputs.expected_sha == github.sha` ensures only
   the exact default branch HEAD can be deployed
2. **Ancestry check**: `git merge-base --is-ancestor` verifies the SHA is
   reachable from the default branch
3. **Environment protection**: Branch policy, required reviewers, wait timer
4. **Workflow permissions**: Read-only contents, concurrency group
5. **Branch protection**: Ruleset requires status checks and reviews

### Risk Assessment

| Risk                  | Mitigation                             | Status                |
| --------------------- | -------------------------------------- | --------------------- |
| Feature branch deploy | SHA guard + ancestry check             | ✅ Mitigated          |
| Stale commit deploy   | SHA guard enforces HEAD only           | ✅ Mitigated          |
| Unauthorized deploy   | Required reviewers                     | ⚠️ Not configured     |
| Accidental deploy     | Wait timer + concurrency               | ⚠️ Wait timer not set |
| Admin abuse           | Audit logging + self-review prevention | ⚠️ Partial            |

## GO Criterion

The HOLD release requires:

1. **All P1 code fixes**: ✅ Completed
2. **pnpm verify passing**: ✅ Passing (647 tests)
3. **Environment settings**: ⚠️ **NEEDS MANUAL CONFIGURATION**
4. **E2E network tests**: ✅ Passing (4 tests)
5. **Ancestry check**: ✅ Implemented

**HOLD will be lifted when**:

- Environment deployment branch policy is configured
- Required reviewers are added
- Wait timer is set (optional but recommended)
- All missing environment variables/secrets are added

**Estimated time to complete**: 15-30 minutes for manual configuration.
