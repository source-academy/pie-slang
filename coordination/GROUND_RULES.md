# Ground Rules

These rules apply to ALL agents and cannot be overridden.

---

## Rule 1: Exact Solutions Only

**NO WORKAROUNDS. NO SIMPLIFICATIONS. NO "GOOD ENOUGH".**

Every implementation must be the **correct, complete solution** to the problem.

### What This Means

| Situation | WRONG Approach | RIGHT Approach |
|-----------|----------------|----------------|
| Feature hard to implement | Skip it, do partial version | Implement it fully or escalate |
| Bug hard to fix | Work around it | Find and fix root cause |
| Edge case complex | Ignore it | Handle it properly |
| Time pressure | Cut corners | Request more time |
| Unclear requirements | Assume and proceed | Ask for clarification |

### If You Think You Need a Workaround

1. **STOP** - Do not implement the workaround
2. **DOCUMENT** - Write to `WORKAROUND_REQUEST.md`:
   ```markdown
   ## Workaround Request

   **Date**: [date]
   **Agent**: [which agent]
   **Task**: [task ID]

   ### The Problem
   [What you're trying to solve]

   ### Why Exact Solution is Difficult
   [Technical reasons]

   ### Proposed Workaround
   [What you would do instead]

   ### Trade-offs
   [What we lose with the workaround]

   ### Effort for Exact Solution
   [Estimated time/complexity]
   ```
3. **WAIT** - Set status to `awaiting_user_decision`
4. **User decides** - Only proceed after explicit approval

### Examples

**Scenario**: Manual edge-drawing is complex, could just improve drag-drop UX instead

- ❌ WRONG: "Let's just make drag-drop better, users won't miss manual edges"
- ✅ RIGHT: Document why it's hard, propose exact solution, ask if scope should change

**Scenario**: Tactic parameter modal is tricky, could hardcode default values

- ❌ WRONG: "Default to 'x' for intro tactic, users can edit later"
- ✅ RIGHT: Implement proper parameter input flow

**Scenario**: Error handling is complex, could just show generic error

- ❌ WRONG: "Show 'Something went wrong' for all errors"
- ✅ RIGHT: Parse and display specific error messages

---

## Rule 2: Git Checkpoints Are Mandatory

Before ANY status transition, create a git commit.

```bash
# Before plan approval
git add -A && git commit -m "checkpoint: plan approved TASK-XXX"

# Before marking implementation complete
git add -A && git commit -m "checkpoint: impl complete TASK-XXX"

# Before marking tests complete
git add -A && git commit -m "checkpoint: tests passed TASK-XXX"
```

**No exceptions.** This is your safety net.

---

## Rule 3: Timeboxes Are Hard Limits

| Phase | Max Time | On Timeout |
|-------|----------|------------|
| Planning | 15 min | Escalate to monitor |
| Implementation (per step) | 30 min | Checkpoint and reassess |
| Testing | 20 min | Report partial results |

If you hit a timebox:
1. Stop what you're doing
2. Commit current state
3. Write what's blocking you
4. Wait for guidance

---

## Rule 4: Single Source of Truth

`CURRENT_STATE.md` is the canonical state. All agents must:
- Read it before starting any work
- Update it when their state changes
- Trust it over other files if there's conflict

---

## Rule 5: Explicit Handoffs

Never assume another agent knows what you did. Always write a handoff message:

```markdown
## Handoff: Dev → Test
**Time**: [timestamp]

### What I Did
[Specific changes]

### What to Test
[Specific test cases]

### Known Issues
[Any caveats]

### Files Changed
[List of files]
```

---

## Rule 6: Fail Fast, Escalate Early

If something isn't working after **3 attempts**, stop and escalate.

Don't spend 30 minutes debugging when you could ask for help in 2 minutes.

---

## Rule 7: No Silent Failures

If something fails:
1. Log it immediately
2. Don't retry silently
3. Make it visible in status files

---

## Rule 8: User Has Final Say

On any disagreement or uncertainty:
- Document the options
- Present to user
- Wait for decision
- Do NOT proceed with assumptions
