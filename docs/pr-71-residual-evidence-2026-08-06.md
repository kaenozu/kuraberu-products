# PR #71 residual evidence (2026-08-06)

This document records read-only evidence collected for PR #71. It is not
Production acceptance and does not authorize Ready, merge, release, deploy,
secret, permission, or ruleset changes.

## Repository and pull request

- Repository: `kaenozu/kuraberu-products`
- Base: `feat/affiliate-site-foundation` at
  `0c6d669a12cd3200ae627517e0b0c44223b85345`
- Head: `agent/integration-68-69-20260806` at
  `52432ac43781fd19a321bd44d35ae50d20924edf`
- PR #71: Open / Draft; the remote head matched the local HEAD during this
  check.
- The integration worktree was clean. The base, acceptance, and
  release-hardening worktrees were left unchanged.

## Read-only GitHub evidence

- `verify` and `Production operations script validation` completed
  successfully for the current head. The PR reported five successful checks,
  including Workers Builds and GitGuardian.
- The repository has an active branch ruleset targeting the default branch.
  It requires the `verify` status check and pull requests, and prevents
  deletion and non-fast-forward updates.
- The ruleset currently has no required approving review and does not require
  strict status checks. A deliberately failing and then succeeding PR was not
  used as formal acceptance evidence in this check.
- The GitHub `production` Environment was not returned by the read-only
  Environments API query, and no repository Actions variable names were
  returned. Secret values were not queried or printed.

## Public preview probe

The Workers commit and branch preview URLs linked by the PR's deployment
comment returned HTTP 200 and `noindex,nofollow`. They were preview responses,
not the canonical Production route. The preview HTML did not contain the
Production build SHA marker, which is expected because the preview probe did
not establish Production configuration.

The preview responses returned `https://kuraberu-products.pages.dev/` as their
canonical URL. This is a code/configuration observation only: it does not
prove that Pages is the authorized Production route, and it leaves the
Preview-versus-canonical URL policy unresolved.

The `/about/` page currently renders the operator name as
`くらべる商品メモ運営者`. This is a placeholder-style display value, not
evidence of a formally confirmed legal operator identity.

## Still unconfirmed

- Canonical Cloudflare Production route, environment, deployment version,
  traffic state, rollback candidate, and authorized deploy path.
- The Rakuten product selected by the live API and its exact identity match
  with each public CTA.
- The formal operator identity and contact URL used in Production.
- The Preview canonical URL policy and its relationship to the authorized
  Production route.
- Ruleset failure-side and success-side acceptance with the Draft constraint
  removed.

The `KEEP_DRAFT_BLOCKER` state therefore remains in force.
