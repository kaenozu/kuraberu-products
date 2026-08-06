# Release hardening specification

## Goal

Raise the current static site from a CI-green prototype to a release candidate
whose generated artifact is reproducible, whose comparison claims are
understandable, and whose privileged production checks fail closed.

This work does not register secrets, change GitHub rulesets, select a
canonical production host, deploy traffic, merge pull requests, or create a
release. Those are separate owner-controlled acceptance steps.

## Release-candidate acceptance criteria

1. A clean Windows worktree builds with the locked Node/pnpm versions without
   relying on a parent-directory `node_modules` installation.
2. Production dependency audit has no High or Critical advisory, and CI keeps
   the audit gate enabled.
3. Every production HTML page carries an exact build SHA and the local and
   post-deploy checks compare it with the expected commit.
4. Post-deploy checks identify the two product CTAs by product id and require
   the approved Rakuten host, sponsored link attributes, and both products.
   Search/reference links must not satisfy the CTA check.
5. Privileged workflow inputs and variables are passed through environment
   variables rather than interpolated into shell source. Secrets are scoped to
   the steps that need them.
6. Public copy distinguishes manufacturer-stated information from independent
   verification, and does not present private scores as objective product
   performance.
7. Memo is treated as a private browser utility (`noindex,nofollow`) and is
   excluded from the sitemap; the sitemap is generated from the same metadata
   source as the article index.
8. The 320px header remains readable and its controls meet the minimum touch
   target without horizontal overflow.

## Implementation slices

### Slice A — deterministic dependencies and audit

- Add `cookie@2.0.1` as an explicit runtime dependency.
- Align the workspace override documentation with the locked override.
- Upgrade the vulnerable `sharp` transitive package to a compatible patched
  version and add a production audit command to CI.

### Slice B — provenance and privileged checks

- Carry `PUBLIC_BUILD_SHA` through production validation and generated HTML.
- Validate the SHA in generated HTML and in the post-deploy response.
- Make CTA verification product-aware and fail when either required product is
  absent or malformed.
- Harden the production workflow boundary and reject dirty/ambiguous build
  inputs.

### Slice C — trust and discovery UX

- Replace ambiguous “公式確認済み” wording with manufacturer-source wording
  and an explicit independent-verification disclaimer.
- Keep purchase links marked unverified until owner evidence exists.
- Correct external-source copy and update factual change dates.
- Exclude the browser-only memo from indexing and generate the sitemap from
  shared article metadata.
- Fix the mobile navigation wrapping/touch target issue and add regression
  coverage.

## Explicitly unconfirmed after this branch

- Production secrets/API response and real Rakuten destinations.
- Cloudflare account, route, environment protection, version/traffic ID, and
  rollback evidence.
- Production HTTP/browser checks, external embed behaviour on the canonical
  host, and human acceptance of article claims.
