# Three-Agent Protocol Analysis

## Overview

This document analyzes potential problems with the Dev-Test-Monitor agent workflow and proposes improvements.

---

## Potential Problems

### 1. **File-Based Communication Latency**

**Problem**: Agents communicate via files, requiring polling to detect changes. This creates delays and potential race conditions.

**Symptoms**:
- Agent A writes to file, Agent B doesn't see it immediately
- Two agents write to same file simultaneously, one overwrites the other
- Agents waste time polling unchanged files

**Impact**: Slower iteration cycles, lost updates, confused state

---

### 2. **Context Loss Between Agents**

**Problem**: Each agent runs in a separate conversation with limited context. They only know what's written in coordination files.

**Symptoms**:
- Dev agent makes a subtle change, test agent doesn't understand why
- Test agent reports "it doesn't work" without enough detail for dev to debug
- Important decisions made in one conversation are lost

**Impact**: Miscommunication, repeated work, debugging difficulties

---

### 3. **Deadlock and Starvation**

**Problem**: Sequential handoffs can cause agents to wait indefinitely.

**Scenarios**:
- Dev waits for test results, test waits for dev to be "ready"
- Monitor doesn't update status, both agents stuck
- One agent crashes, others wait forever

**Impact**: Workflow stops, human intervention required

---

### 4. **Scope Creep and Boundary Violations**

**Problem**: Without strict boundaries, agents may step on each other's work.

**Scenarios**:
- Test agent "helpfully" suggests code fixes
- Dev agent tests in browser "just to check"
- Monitor makes direct code changes instead of assigning to dev

**Impact**: Confused ownership, conflicting changes, duplicate work

---

### 5. **State Synchronization**

**Problem**: The application state (browser, files, worker) may not match what agents expect.

**Scenarios**:
- Dev finishes, but dev server needs restart
- Test agent checks old cached version
- Browser has stale state from previous test

**Impact**: False positives/negatives, wasted debugging time

---

### 6. **Error Recovery**

**Problem**: No clear protocol for when things go wrong.

**Scenarios**:
- Dev plan is fundamentally wrong after partial implementation
- Test finds a critical bug that blocks all other testing
- Agent gets stuck in infinite loop or crashes

**Impact**: Manual intervention required, unclear how to resume

---

### 7. **Parallelization Missed Opportunities**

**Problem**: Strictly sequential workflow wastes time when work could be parallel.

**Scenarios**:
- Test could run regression while dev implements new feature
- Dev could plan next task while waiting for test results
- Multiple independent features could be developed simultaneously

**Impact**: Slower overall progress

---

### 8. **Information Overload in Files**

**Problem**: Coordination files grow large, making it hard to find current information.

**Symptoms**:
- dev-plan.md has 10 old plans, current one buried
- status.txt has stale comments
- Agents parse wrong section

**Impact**: Confusion, acting on outdated info

---

## Proposed Improvements

### 1. **Structured Status File**

Instead of free-form status.txt, use structured format:

```yaml
# status.yaml
current_state: dev_implementing
task_id: TASK-003
last_updated: 2026-01-28T21:45:00
updated_by: dev_agent

dev_agent:
  state: implementing
  current_step: 2 of 5
  last_activity: 2026-01-28T21:45:00

test_agent:
  state: idle
  waiting_for: dev_complete

monitor_agent:
  state: idle
  last_decision: approved_plan
```

**Benefit**: Clear state, timestamps for staleness detection, machine-parseable

---

### 2. **Separate Files Per Task**

Instead of overwriting, create task-specific files:

```
coordination/
  tasks/
    TASK-003/
      task.md
      dev-plan.md
      dev-summary.md
      test-plan.md
      test-results.md
      monitor-decisions.md
```

**Benefit**: History preserved, no accidental overwrites, easy to review

---

### 3. **Heartbeat/Timeout Protocol**

Each agent writes a heartbeat:

```yaml
# heartbeat-dev.yaml
agent: dev
alive: true
last_heartbeat: 2026-01-28T21:45:00
current_action: "editing proof-worker.ts"
```

Other agents check: if heartbeat > 5 minutes old, assume stuck.

**Benefit**: Detect stuck agents, enable recovery

---

### 4. **Explicit Handoff Messages**

Instead of just status changes, write handoff messages:

```markdown
# handoff.md
## From: Dev Agent
## To: Test Agent
## Time: 2026-01-28 21:45

I've completed the implementation. Key things to test:
1. Manual edge drawing now triggers applyTactic
2. Check the onConnect handler in ProofCanvas.tsx

Known limitation: Only works for tactic→goal edges, not goal→tactic
```

**Benefit**: Rich context transfer, clear expectations

---

### 5. **Pre-flight Checklist**

Before each phase, agent runs checklist:

**Dev Agent Pre-Implementation**:
- [ ] Status is `dev_plan_approved`
- [ ] I've read monitor feedback
- [ ] Dev server is running
- [ ] No uncommitted changes from others

**Test Agent Pre-Test**:
- [ ] Status is `test_plan_ready`
- [ ] Dev server running at correct port
- [ ] Browser cache cleared / hard refresh
- [ ] Previous test results archived

**Benefit**: Catch environment issues early

---

### 6. **Rollback Protocol**

Define explicit rollback procedure:

```markdown
## Rollback Triggered
When: Test finds critical regression
Action:
1. Dev agent: git stash current changes
2. Dev agent: git checkout last-known-good
3. Test agent: verify rollback works
4. Monitor: decide whether to continue or redesign
```

**Benefit**: Clear recovery path

---

### 7. **Parallel Work Lanes**

Allow multiple tasks in different states:

```yaml
active_tasks:
  - id: TASK-003
    phase: testing
    feature: manual-edge-tactic

  - id: TASK-004
    phase: planning
    feature: proof-completion-indicator

  - id: TASK-005
    phase: blocked
    blocked_by: TASK-003
```

**Benefit**: Higher throughput, less waiting

---

### 8. **Summary-at-Top Pattern**

Every coordination file starts with current summary:

```markdown
# Dev Plan

## CURRENT STATUS
- State: APPROVED
- Task: TASK-003
- Last Updated: 2026-01-28 21:45

---

## Current Plan (v3)
[Latest plan here]

---

## History
### v2 (rejected)
...
### v1 (superseded)
...
```

**Benefit**: Current info always at top, history preserved below

---

## Implementation Priority

| Improvement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Structured status | Low | High | 1 |
| Explicit handoffs | Low | High | 2 |
| Pre-flight checklists | Low | Medium | 3 |
| Summary-at-top | Low | Medium | 4 |
| Heartbeat/timeout | Medium | Medium | 5 |
| Separate task folders | Medium | Medium | 6 |
| Parallel lanes | High | High | 7 |
| Rollback protocol | Medium | Low | 8 |

---

## Recommended Starting Protocol

For initial use, implement improvements 1-4 (low effort, high/medium impact):

1. Use structured status.yaml
2. Write explicit handoff messages
3. Run pre-flight checklists
4. Keep summaries at top of files

This gives 80% of the benefit with 20% of the effort.
