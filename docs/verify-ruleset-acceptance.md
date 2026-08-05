# Required `verify` ruleset acceptance

Repository policy changes are privileged. The scripts in `tools/github` automate reviewable preparation and verification, but they do not apply a ruleset unless `-Apply -ConfirmApply APPLY_RULESET` is supplied explicitly.

## 1. Dry run and backup

```powershell
pwsh ./tools/github/Configure-VerifyRuleset.ps1 `
  -AdminBypass None
```

The dry run:

- verifies that the requested branch is the repository's current default branch;
- downloads the full detail for every existing repository ruleset;
- stores `rulesets-before.json` under ignored `.acceptance/` evidence;
- generates the proposed payload and a normalized expected contract;
- reports semantic differences for target branch, bypass actors, deletion protection, force-push protection, pull-request requirements, review-thread resolution, strict status policy, and required check names;
- performs no repository mutation.

Review the full backup rather than only the target ruleset. A ruleset update can otherwise remove rules that the local script does not understand.

## 2. Administrator bypass decision

Choose one value deliberately:

- `None`: no administrator bypass. This is the safest default for proving that failed `verify` blocks merge.
- `PullRequest`: repository administrators may bypass only through pull requests.
- `Always`: administrators may bypass at any time. This weakens the acceptance proof and should be used only with a documented operational reason.

The choice is encoded in the generated payload and included in semantic verification.

## 3. Apply after review

After recording the dry-run evidence and confirming that no unrelated rules will be lost:

```powershell
pwsh ./tools/github/Configure-VerifyRuleset.ps1 `
  -AdminBypass None `
  -Apply `
  -ConfirmApply APPLY_RULESET
```

Immediately before PUT or POST, the script re-fetches the target ruleset. If its canonical SHA-256 differs from the reviewed backup, the script stops without mutation and requires a new dry run.

After mutation, the script fetches full ruleset detail and deep-verifies every normalized contract field. Merely finding an active ruleset with the expected name is not considered success.

## 4. Intentional failure proof

Use a disposable Draft PR that changes only an anonymous test fixture or a dedicated test assertion. Do not weaken, skip, or mark the real `verify` job as allowed to fail.

Failure phase:

1. push an intentional test failure to the disposable branch;
2. wait for the `verify` check to complete with `failure`;
3. confirm in GitHub that merge is blocked;
4. record evidence with:

```powershell
pwsh ./tools/github/Test-VerifyRulesetEnforcement.ps1 `
  -PullRequest <number> `
  -ExpectedPhase Failure
```

Success phase:

1. revert only the intentional failing assertion;
2. wait for `verify` to complete with `success`;
3. confirm that repository policy no longer blocks merge;
4. record evidence with:

```powershell
pwsh ./tools/github/Test-VerifyRulesetEnforcement.ps1 `
  -PullRequest <number> `
  -ExpectedPhase Success
```

The evidence checker is read-only. It verifies the exact PR HEAD, the single `verify` check run, its completion and conclusion, and the PR `mergeable_state`. It writes only repository name, PR number, HEAD SHA, check result, merge state, and PASS/BLOCKER.

## 5. Recovery

If deep verification fails after mutation:

1. do not perform a second blind PUT;
2. preserve `rulesets-before.json`, `ruleset-after.json`, and `verification.json`;
3. compare the full pre-change snapshot with the applied detail;
4. restore only after an administrator explicitly approves the exact restoration payload;
5. repeat dry run and the intentional failure/success proof.

Never place tokens, secret values, private content, or unrelated repository configuration in Issue or PR comments. Ruleset IDs, commit SHAs, check names, and normalized PASS/BLOCKER evidence are safe to record.
