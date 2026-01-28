# Test Plan: TASK-001

## Status: READY FOR TESTING
- Implementation: ✅ Complete (8 steps)
- TypeScript: ✅ Compiles clean
- Dev Server: ⚠️ Start with `cd web-react && npm run dev`

---

## Pre-Test Setup

1. Start the dev server:
   ```bash
   cd /Users/fzjjs/Developer/UROP/pie-slang/web-react
   npm run dev
   ```
2. Open browser to http://localhost:3002
3. Verify the app loads without console errors

---

## Test Cases

### TEST 1: Edge-Drawing Flow (Core Requirement 1)

**Goal**: Verify manual edge-drawing triggers tactic application

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Drag `intro` tactic from palette to canvas | Tactic node appears with **amber** color (incomplete status) |
| 1.2 | Draw edge from root goal's output handle to tactic's input handle | Edge connects, tactic shows parameter input field |
| 1.3 | Enter variable name (e.g., "n") in the input field and press Enter/Set | Tactic applies, **child goal created**, tactic turns **green** (applied) |
| 1.4 | Check parent goal | Should show **completed** status |

**Pass Criteria**: Child goal only created AFTER parameter entered and validation passed.

---

### TEST 2: Parameterless Tactics

**Goal**: Verify tactics without parameters apply immediately on connection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Start a proof with a Pair-type goal (e.g., `(Pair Nat Nat)`) | Goal node displays |
| 2.2 | Drag `split` tactic to canvas | Tactic appears with **blue** color (ready status) |
| 2.3 | Draw edge from goal to tactic | Tactic applies immediately, **two child goals created** |

**Pass Criteria**: No parameter prompt; immediate application.

---

### TEST 3: Error Handling (Core Requirement 2)

**Goal**: Verify failed tactics show errors and don't create goals

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Start a proof with a non-Pair goal (e.g., `(-> Nat Nat)`) | Goal node displays |
| 3.2 | Drag `split` tactic to canvas | Tactic appears (ready) |
| 3.3 | Draw edge from goal to tactic | Tactic turns **red** (error), error message displayed |
| 3.4 | Check for child goals | **NO child goals created** |

**Pass Criteria**: Error shown on tactic node, no spurious goal nodes.

---

### TEST 4: Context Separation (Core Requirement 3)

**Goal**: Verify local context in goal, globals in sidebar

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | Load source code with definitions (e.g., `(claim plus (-> Nat Nat Nat))`) | Source panel shows code |
| 4.2 | Start proof session | Root goal appears |
| 4.3 | Check right sidebar | **DefinitionsPanel** shows global definitions/theorems |
| 4.4 | Apply `intro n` tactic | Child goal created |
| 4.5 | Check child goal's context section | Shows **only** `n : Nat` (local variable) |
| 4.6 | Check sidebar | Still shows global definitions (NOT in goal node) |

**Pass Criteria**: Goal shows only introduced variables; sidebar shows globals.

---

### TEST 5: Existing Drag-Drop Flow (Regression)

**Goal**: Verify drag-onto-goal still works

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Start a proof session | Root goal appears |
| 5.2 | Drag `intro` tactic **directly onto** the goal node | Tactic should prompt for parameter or apply |
| 5.3 | Enter parameter if prompted | Tactic applies, child goal created |

**Pass Criteria**: Legacy drag-drop behavior preserved.

---

### TEST 6: Context Variable Handles (for elimNat etc.)

**Goal**: Verify context variables have connectable handles

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Apply `intro n` to get a goal with context variable | Goal shows `n : Nat` with connection handle (●) |
| 6.2 | Drag `elimNat` tactic to canvas | Tactic appears (incomplete, needs target) |
| 6.3 | Draw edge from context variable handle to tactic | Edge connects, tactic receives target parameter |
| 6.4 | Draw edge from goal output to tactic input | Tactic applies with the selected target |

**Pass Criteria**: Context variables are connectable for target selection.

---

## Test Results Template

```
TEST 1: Edge-Drawing Flow
- [ ] 1.1 PASS/FAIL:
- [ ] 1.2 PASS/FAIL:
- [ ] 1.3 PASS/FAIL:
- [ ] 1.4 PASS/FAIL:

TEST 2: Parameterless Tactics
- [ ] 2.1 PASS/FAIL:
- [ ] 2.2 PASS/FAIL:
- [ ] 2.3 PASS/FAIL:

TEST 3: Error Handling
- [ ] 3.1 PASS/FAIL:
- [ ] 3.2 PASS/FAIL:
- [ ] 3.3 PASS/FAIL:
- [ ] 3.4 PASS/FAIL:

TEST 4: Context Separation
- [ ] 4.1 PASS/FAIL:
- [ ] 4.2 PASS/FAIL:
- [ ] 4.3 PASS/FAIL:
- [ ] 4.4 PASS/FAIL:
- [ ] 4.5 PASS/FAIL:
- [ ] 4.6 PASS/FAIL:

TEST 5: Existing Drag-Drop
- [ ] 5.1 PASS/FAIL:
- [ ] 5.2 PASS/FAIL:
- [ ] 5.3 PASS/FAIL:

TEST 6: Context Variable Handles
- [ ] 6.1 PASS/FAIL:
- [ ] 6.2 PASS/FAIL:
- [ ] 6.3 PASS/FAIL:
- [ ] 6.4 PASS/FAIL:
```

---

## Reporting Issues

If a test fails:
1. Note the exact step that failed
2. Capture any console errors
3. Describe expected vs actual behavior
4. Update SYNC.md with the issue

Test Agent should report results to SYNC.md when complete.
