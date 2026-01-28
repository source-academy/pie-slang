# Recovery Guide

When things go wrong, follow these procedures.

---

## Symptom: Agent Stuck (No Progress > 10 min)

### Diagnosis
- Agent repeating same action
- Agent waiting for something that won't happen
- Agent confused about state

### Recovery Steps
1. Agent writes to `HELP.md`:
   ```markdown
   ## Help Needed
   **Time**: [timestamp]
   **Agent**: [which agent]
   **Stuck on**: [what's not working]
   **Tried**: [what was attempted]
   **Need**: [what would unblock]
   ```
2. Set `CURRENT_STATE.md` phase to: `BLOCKED`
3. Wait for monitor or user intervention
4. Do NOT keep retrying the same thing

---

## Symptom: Tests Failing Repeatedly (> 3 Attempts)

### Diagnosis
- Same test fails multiple times
- Different tests fail each time (unstable)
- Tests pass locally but fail in browser

### Recovery Steps
1. **Stop testing** - don't keep retrying
2. Git commit current state: `git commit -m "WIP: tests failing on X"`
3. Write to `BLOCKED.md`:
   ```markdown
   ## Test Failure Block
   **Test**: [which test]
   **Expected**: [what should happen]
   **Actual**: [what happens]
   **Console errors**: [any errors]
   **Attempts**: [what was tried]
   ```
4. Set phase to: `BLOCKED`
5. Options:
   - Dev agent adds more logging
   - Simplify test to isolate issue
   - User investigates directly

---

## Symptom: Implementation Breaks Existing Feature

### Diagnosis
- New code works but old feature stopped working
- Regression detected in testing

### Recovery Steps
1. **Immediately commit**: `git commit -m "WIP: regression introduced"`
2. **Identify regression**:
   - What was the last working commit?
   - What change caused the break?
3. **Decision point**:
   - If clear fix: Apply fix, re-test
   - If unclear: Rollback to checkpoint
4. **Rollback command**:
   ```bash
   git log --oneline  # Find checkpoint commit
   git reset --hard <checkpoint-hash>
   ```
5. Re-plan with knowledge of what broke

---

## Symptom: Agents Out of Sync

### Diagnosis
- Dev thinks they're done, test doesn't see changes
- Status file says one thing, reality is different
- Agents have conflicting understanding

### Recovery Steps
1. **All agents stop**
2. **Sync meeting** - All agents read `CURRENT_STATE.md`
3. **Monitor updates** `CURRENT_STATE.md` with correct state
4. **Verify**:
   - Git status matches expected
   - Dev server is running correct code
   - Browser shows current state
5. **Resume** from agreed state

---

## Symptom: Browser in Bad State

### Diagnosis
- UI shows stale data
- JavaScript errors in console
- Interactions not working

### Recovery Steps
1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear storage**:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
3. **Restart dev server**:
   ```bash
   # Kill existing server
   # Start fresh
   cd web-react && npm run dev
   ```
4. **New browser tab**: Sometimes old tab is corrupted
5. **Check Network tab**: Ensure files are loading

---

## Symptom: Dev Server Not Responding

### Diagnosis
- Page won't load
- "Connection refused" errors
- HMR not working

### Recovery Steps
1. **Check if running**:
   ```bash
   lsof -i :3002  # Or whatever port
   ```
2. **Kill zombie processes**:
   ```bash
   pkill -f "vite"
   ```
3. **Restart**:
   ```bash
   cd web-react && npm run dev
   ```
4. **Check for errors** in terminal output
5. **Verify** by opening http://localhost:3002

---

## Symptom: Git State Confused

### Diagnosis
- Uncommitted changes from unknown source
- Merge conflicts
- Wrong branch

### Recovery Steps
1. **Check status**:
   ```bash
   git status
   git branch
   git log --oneline -5
   ```
2. **If uncommitted changes**:
   - If valuable: `git stash`
   - If garbage: `git checkout .`
3. **If wrong branch**:
   ```bash
   git checkout visualization  # or correct branch
   ```
4. **If conflicts**:
   - Do NOT try to resolve blindly
   - Ask user for guidance

---

## Symptom: Worker Not Responding

### Diagnosis
- `proofWorker.test()` hangs or fails
- Tactic application never completes
- Console shows worker errors

### Recovery Steps
1. **Check console** for worker-specific errors
2. **Test worker directly**:
   ```javascript
   const { proofWorker } = await import('/src/shared/lib/worker-client.ts')
   await proofWorker.test()  // Should return quickly
   ```
3. **Hard refresh** to reload worker
4. **Check worker file** for syntax errors
5. **Check imports** in proof-worker.ts

---

## Emergency: Everything Is Broken

### Nuclear Option
```bash
# Save current state just in case
git stash

# Find last known good checkpoint
git log --oneline | grep "checkpoint"

# Reset to it
git reset --hard <checkpoint-hash>

# Restart everything
pkill -f "vite"
cd web-react && npm run dev

# Verify in browser
# Then figure out what went wrong
```

---

## Prevention Checklist

Before starting any phase:

- [ ] Read `CURRENT_STATE.md`
- [ ] Read `GROUND_RULES.md`
- [ ] Verify git status is clean
- [ ] Verify dev server is running
- [ ] Verify browser is on correct URL
- [ ] Verify last checkpoint exists
