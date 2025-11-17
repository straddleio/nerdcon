# Mixed PR Separation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate the mixed PR #13 into two clean, independent PRs (linter fixes and SDK v0.3.0)

**Architecture:** Cherry-pick commits from the mixed branch onto two new feature branches created from clean master. Delete the corrupted branch and close the mixed PR. Create two new PRs with accurate titles and descriptions.

**Tech Stack:** Git, GitHub CLI (gh), npm

---

## Prerequisites

Before starting, verify current state:

```bash
# Check current branch state
git branch -vv

# Check PR status
gh pr list

# Verify you're in the nerdcon directory
pwd
# Should output: /home/keith/nerdcon
```

**Expected state:**
- Branch `feature/sdk-v0.3.0-paykey-review` exists with 16 mixed commits
- PR #13 exists pointing to that branch
- Master is at commit `5c088de`

---

## Task 1: Create Clean Linter Branch

**Files:**
- None (git operations only)

**Step 1: Checkout master and verify clean state**

```bash
git checkout master
```

Run: `git status`
Expected: "Your branch is up to date" and working tree clean

**Step 2: Create linter feature branch**

```bash
git checkout -b feature/linter-fixes
```

Run: `git branch --show-current`
Expected: `feature/linter-fixes`

**Step 3: Cherry-pick first linter commit**

```bash
git cherry-pick 4d245fa
```

Expected: Success or conflict message. If conflict, resolve and continue with `git cherry-pick --continue`

**Step 4: Cherry-pick second linter commit**

```bash
git cherry-pick 05a26bc
```

Expected: Success or conflict message

**Step 5: Cherry-pick third linter commit**

```bash
git cherry-pick 2672b8c
```

Expected: Success or conflict message

**Step 6: Cherry-pick fourth linter commit**

```bash
git cherry-pick 4336004
```

Expected: Success or conflict message

**Step 7: Cherry-pick fifth linter commit**

```bash
git cherry-pick 098240a
```

Expected: Success or conflict message

**Step 8: Cherry-pick sixth linter commit**

```bash
git cherry-pick a7be3c0
```

Expected: Success or conflict message

**Step 9: Verify exactly 6 commits on branch**

```bash
git log --oneline master..feature/linter-fixes
```

Expected: Exactly 6 commits listed, all with linter-related messages

**Step 10: Verify no SDK commits leaked in**

```bash
git log --oneline master..feature/linter-fixes | grep -i "sdk\|paykey\|review"
```

Expected: No output (no SDK-related commits)

---

## Task 2: Verify Linter Branch Integrity

**Files:**
- All modified files in linter commits

**Step 1: Run TypeScript type checking**

```bash
npm run type-check
```

Expected: No type errors

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds for both server and web

**Step 3: Run tests**

```bash
npm test
```

Expected: All 18 tests pass

**Step 4: Run linter to verify improvement**

```bash
npm run lint
```

Expected: ~27 errors (down from 110 before linter fixes)

**Step 5: Commit verification (no commit needed, just verify state)**

Run: `git status`
Expected: Clean working tree (no uncommitted changes)

---

## Task 3: Create Clean SDK Branch

**Files:**
- None (git operations only)

**Step 1: Checkout master again**

```bash
git checkout master
```

Run: `git status`
Expected: Clean working tree

**Step 2: Create SDK feature branch**

```bash
git checkout -b feature/sdk-v0.3.0-clean
```

Run: `git branch --show-current`
Expected: `feature/sdk-v0.3.0-clean`

**Step 3: Cherry-pick first SDK commit**

```bash
git cherry-pick 7eb92ac
```

Expected: Success or conflict message

**Step 4: Cherry-pick second SDK commit**

```bash
git cherry-pick 76095b4
```

Expected: Success or conflict message

**Step 5: Cherry-pick third SDK commit**

```bash
git cherry-pick 5901462
```

Expected: Success or conflict message

**Step 6: Cherry-pick fourth SDK commit**

```bash
git cherry-pick 748195f
```

Expected: Success or conflict message

**Step 7: Cherry-pick fifth SDK commit**

```bash
git cherry-pick 3224467
```

Expected: Success or conflict message

**Step 8: Cherry-pick sixth SDK commit**

```bash
git cherry-pick 7736f9d
```

Expected: Success or conflict message

**Step 9: Cherry-pick seventh SDK commit**

```bash
git cherry-pick 1094e1d
```

Expected: Success or conflict message

**Step 10: Cherry-pick eighth SDK commit**

```bash
git cherry-pick 70cfb73
```

Expected: Success or conflict message

**Step 11: Cherry-pick ninth SDK commit**

```bash
git cherry-pick cc168f5
```

Expected: Success or conflict message

**Step 12: Cherry-pick tenth SDK commit**

```bash
git cherry-pick 22c910b
```

Expected: Success or conflict message

**Step 13: Verify exactly 10 commits on branch**

```bash
git log --oneline master..feature/sdk-v0.3.0-clean
```

Expected: Exactly 10 commits listed, all SDK-related

**Step 14: Verify no linter commits leaked in**

```bash
git log --oneline master..feature/sdk-v0.3.0-clean | grep -i "linter\|lint"
```

Expected: No output (no linter-related commits)

---

## Task 4: Verify SDK Branch Integrity

**Files:**
- All modified files in SDK commits

**Step 1: Run TypeScript type checking**

```bash
npm run type-check
```

Expected: No type errors

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds for both server and web

**Step 3: Run tests**

```bash
npm test
```

Expected: All 18 tests pass

**Step 4: Verify SDK upgrade**

Run: `cat server/package.json | grep "@straddlecom/straddle"`
Expected: Shows version `0.3.0`

**Step 5: Commit verification (no commit needed, just verify state)**

Run: `git status`
Expected: Clean working tree (no uncommitted changes)

---

## Task 5: Delete Old Mixed Branch

**Files:**
- None (git operations only)

**Step 1: Switch to master (safety)**

```bash
git checkout master
```

Expected: Switched to branch 'master'

**Step 2: Delete local mixed branch**

```bash
git branch -D feature/sdk-v0.3.0-paykey-review
```

Expected: "Deleted branch feature/sdk-v0.3.0-paykey-review"

**Step 3: Delete remote mixed branch (if it exists)**

```bash
git push origin --delete feature/sdk-v0.3.0-paykey-review 2>&1 || echo "Branch may not exist on remote"
```

Expected: Success or "remote ref does not exist" (either is fine)

**Step 4: Verify branch is gone**

Run: `git branch -a | grep sdk-v0.3.0-paykey-review`
Expected: No output

---

## Task 6: Close Mixed PR #13

**Files:**
- None (GitHub operations only)

**Step 1: Close PR with explanation**

```bash
gh pr close 13 --comment "Closing this PR - it accidentally mixed two separate projects (SDK v0.3.0 and linter fixes). Replacing with two clean PRs for easier review."
```

Expected: PR #13 closed successfully

**Step 2: Verify PR is closed**

```bash
gh pr view 13 --json state --jq '.state'
```

Expected: `CLOSED`

---

## Task 7: Push Linter Branch and Create PR

**Files:**
- None (git/GitHub operations only)

**Step 1: Push linter branch to remote**

```bash
git checkout feature/linter-fixes
git push -u origin feature/linter-fixes
```

Expected: Branch pushed successfully with tracking set up

**Step 2: Create linter PR**

```bash
gh pr create \
  --title "fix: comprehensive linter fixes - reduce issues from 110 to 27 (75.5% reduction)" \
  --body "$(cat <<'EOF'
## Summary
Systematic linter fixes across the codebase, reducing ESLint issues from 110 to 27 (75.5% reduction).

## Changes
- **Tasks 1-6:** Fixed route handlers, middleware, and utilities
- **Task 9:** Fixed domain layer type safety issues
- **Task 10:** Fixed web components type safety and console logging

## Type Safety Improvements
- Replaced `any` types with proper types
- Fixed Pino logger call signatures
- Improved error handling with structured logging

## Test Plan
- [x] All TypeScript checks passing
- [x] All builds successful
- [x] ESLint errors: 110 → 27 (75.5% reduction)
- [x] All tests passing (18/18)

## Files Changed
- Server routes: bridge.ts, charges.ts, customers.ts, paykeys.ts
- Domain layer: types.ts, state.ts
- Web components: Terminal.tsx, APILog.tsx, cards/*

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR created with URL displayed

**Step 3: Capture linter PR number**

```bash
gh pr view --json number --jq '.number'
```

Expected: PR number (likely #14 or higher)

---

## Task 8: Push SDK Branch and Create PR

**Files:**
- None (git/GitHub operations only)

**Step 1: Push SDK branch to remote**

```bash
git checkout feature/sdk-v0.3.0-clean
git push -u origin feature/sdk-v0.3.0-clean
```

Expected: Branch pushed successfully with tracking set up

**Step 2: Create SDK PR**

```bash
gh pr create \
  --title "feat: Straddle SDK v0.3.0 - Paykey Review Integration" \
  --body "$(cat <<'EOF'
## Summary
Upgrade to Straddle SDK v0.3.0 and integrate complete paykey review functionality with verification_details support.

## What's New
- ✅ **SDK Upgrade:** v0.2.1 → v0.3.0
- ✅ **Review Status:** Paykeys can now be in 'review' status requiring manual approval
- ✅ **Verification Details:** Full support for account_validation and name_match breakdowns
- ✅ **API Endpoints:** GET/PATCH /api/paykeys/:id/review
- ✅ **Terminal Commands:** /paykey-review (debug) and /paykey-decision (approve/reject)
- ✅ **UI Updates:** Gold "REVIEW" badge in PaykeyCard

## Features

### Backend
- PaykeyReview types matching SDK structure
- GET /api/paykeys/:id/review - retrieve verification details
- PATCH /api/paykeys/:id/review - approve/reject decisions
- Proper decision → status mapping (approved → active, rejected → rejected)

### Frontend
- PaykeyReview types and API functions
- Terminal commands for review workflow
- Review status badge visualization

### Testing & Documentation
- All tests passing (18/18)
- Comprehensive verification report
- Updated CLAUDE.md and README.md

## Test Plan
- [x] All TypeScript checks passing
- [x] All builds successful
- [x] All tests passing
- [x] Type safety verified across frontend/backend
- [ ] Manual API testing (requires running server with sandbox)

## Documentation
- **Implementation Plan:** `docs/plans/2025-11-16-straddle-sdk-v0.3.0-paykey-review.md`
- **Verification Report:** `docs/plans/2025-11-16-sdk-v0.3.0-verification-report.md`

## Next Steps
After merge, the UI implementation phase can add detailed verification_details visualization to PaykeyCard.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR created with URL displayed

**Step 3: Capture SDK PR number**

```bash
gh pr view --json number --jq '.number'
```

Expected: PR number (likely #15 or higher)

---

## Task 9: Verify Clean Separation

**Files:**
- None (verification only)

**Step 1: Verify linter PR has exactly 6 commits**

```bash
# Get linter PR number first (adjust number as needed)
LINTER_PR=$(gh pr list --json number,title --jq '.[] | select(.title | contains("linter")) | .number')
gh pr view $LINTER_PR --json commits --jq '.commits | length'
```

Expected: `6`

**Step 2: Verify SDK PR has exactly 10 commits**

```bash
# Get SDK PR number first (adjust number as needed)
SDK_PR=$(gh pr list --json number,title --jq '.[] | select(.title | contains("SDK")) | .number')
gh pr view $SDK_PR --json commits --jq '.commits | length'
```

Expected: `10`

**Step 3: Verify no commit overlap - get linter commit messages**

```bash
gh pr view $LINTER_PR --json commits --jq '.commits[].messageHeadline'
```

Expected: 6 linter-related commit messages

**Step 4: Verify no commit overlap - get SDK commit messages**

```bash
gh pr view $SDK_PR --json commits --jq '.commits[].messageHeadline'
```

Expected: 10 SDK-related commit messages (none should match linter messages)

**Step 5: Verify both PRs are open**

```bash
gh pr list --json number,title,state
```

Expected: Shows both new PRs in OPEN state, PR #13 not listed (closed)

---

## Task 10: Final Cleanup and Documentation

**Files:**
- Modify: `docs/plans/2025-11-16-SITUATION-REPORT-mixed-pr.md`

**Step 1: Update situation report with resolution**

Add this section at the end of the situation report:

```markdown

---

## RESOLUTION COMPLETED

**Date:** 2025-11-16
**Status:** ✅ RESOLVED

### Actions Taken

1. ✅ Created clean linter branch with 6 commits
2. ✅ Created clean SDK branch with 10 commits
3. ✅ Deleted corrupted mixed branch (feature/sdk-v0.3.0-paykey-review)
4. ✅ Closed mixed PR #13
5. ✅ Created clean linter PR #[NUMBER]
6. ✅ Created clean SDK PR #[NUMBER]

### Verification

- Both branches tested independently (all 18 tests passing)
- No commit overlap between PRs
- All builds successful
- Type checking passes

### Next Steps

1. Review linter PR #[NUMBER] independently
2. Review SDK PR #[NUMBER] independently
3. Merge when ready (can be merged in any order)

**Crisis resolved. Two clean, independent PRs ready for review.**
```

**Step 2: Commit the updated situation report**

```bash
git checkout master
git add docs/plans/2025-11-16-SITUATION-REPORT-mixed-pr.md
git commit -m "docs: mark mixed PR crisis as resolved

Added resolution section documenting the corrective actions taken:
- Two clean branches created
- Mixed branch deleted
- Mixed PR closed
- Two new clean PRs created

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Expected: Commit created successfully

**Step 3: Push documentation update**

```bash
git push origin master
```

Expected: Pushed successfully

---

## Success Criteria

After completing all tasks, verify:

- ✅ Two clean branches exist: `feature/linter-fixes` and `feature/sdk-v0.3.0-clean`
- ✅ Old mixed branch `feature/sdk-v0.3.0-paykey-review` is deleted
- ✅ PR #13 is closed
- ✅ Two new PRs created with accurate titles and descriptions
- ✅ Linter PR has exactly 6 commits, all linter-related
- ✅ SDK PR has exactly 10 commits, all SDK-related
- ✅ No commit appears in both PRs
- ✅ All tests pass on both branches (18/18)
- ✅ All builds successful on both branches
- ✅ Situation report updated with resolution

---

## Troubleshooting

### Cherry-pick conflicts

If you encounter conflicts during cherry-picking:

1. View the conflict:
   ```bash
   git status
   ```

2. Resolve manually by editing conflicted files

3. Common conflict areas:
   - `server/src/routes/paykeys.ts` (both projects modified)
   - `server/src/domain/types.ts` (both projects modified)

4. After resolving:
   ```bash
   git add <resolved-files>
   git cherry-pick --continue
   ```

5. If you want to abort:
   ```bash
   git cherry-pick --abort
   ```

### PR creation fails

If `gh pr create` fails with authentication errors:

```bash
gh auth login
gh auth refresh
```

Then retry the PR creation command.

### Tests fail on clean branches

If tests fail on either clean branch but passed on the mixed branch:

1. Check for missing dependencies:
   ```bash
   npm install
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. If still failing, investigate which cherry-picked commit introduced the failure

---

## Implementation Notes

- **Total time estimate:** 30-45 minutes
- **Critical files:** Git history only, no code changes needed
- **Dependencies:** Git, GitHub CLI (gh), npm
- **Rollback strategy:** If something goes wrong, the original `feature/sdk-v0.3.0-paykey-review` branch can be restored from remote before deletion

---

## References

- **Original situation report:** `docs/plans/2025-11-16-SITUATION-REPORT-mixed-pr.md`
- **SDK implementation plan:** `docs/plans/2025-11-16-straddle-sdk-v0.3.0-paykey-review.md`
- **SDK verification report:** `docs/plans/2025-11-16-sdk-v0.3.0-verification-report.md`
- **Linter fixes plan:** `docs/plans/linter-fixes-implementation-plan.md` (if exists)
