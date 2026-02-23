# Pie-Slang User Study Plan
## 2-Week Casual Evaluation at NUS

---

## Overview

**Goal:** Get quick feedback on pie-slang for teaching type theory at NUS.

**Duration:** 2 weeks (flexible)  
**Participants:** 15-20 students (whoever's interested)  
**Format:** Casual try-it-out sessions, no pressure

---

## Study Design

### Week 1: Try It Out When You Have Time

**Kickoff (30 mins, optional drop-in session)**
- Quick demo of the playground
- Show 2-3 examples
- "Here's the link, play around when you're free"
- Provide cheat sheet with common syntax

**Rest of Week 1: Do What You Want (2-3 hours total, at your pace)**
Pick any 3-4 tasks that look interesting:

1. **Add two numbers** using `iter-Nat` (warmup, ~20 min)
2. **Make a list length function** (~30 min)
3. **Play with vectors** (if you're curious)
4. **Write a simple equality proof** (just try `(same zero)`)
5. **Try list append** (if you want a challenge)

**No deadlines.** Do them in any order. Skip if stuck. Ask for help anytime.

**Quick feedback after each task (optional):**
- "Was this fun/annoying/confusing?" (one word is fine)
- Share any errors that confused you

---

### Week 2: Optional Advanced Stuff + Tell Us What You Think

**Days 8-12: More Tasks (ONLY if interested, ~2 hours)**

- Try dependent pairs if that sounds cool
- Attempt a proof about addition (we can help)
- Play with custom types

**Day 13-14: Share Your Thoughts**

**Super short survey (5 minutes):**
- "Was the playground easy to use?" (1-7)
- "Did you learn anything about types?" (Yes/Kinda/No)
- "Would you use this again?" (Yes/Maybe/No)
- "Most annoying thing?" (free text)
- "Coolest thing?" (free text)

**Casual chat (15 min, 8-10 volunteers):**
- Just screen share and walk us through one task
- "What worked? What sucked?"
- No formal interview, just hang out and chat

---

## What We'll Track

### Automatic (you don't do anything)
- How long each task took
- What errors you hit
- Which features you used

### You Tell Us
- Which tasks you completed (just tick them off)
- Quick difficulty rating (1-5, takes 5 seconds)
- Optional: share your code if you want feedback

---

## Success Metrics (Our Problem, Not Yours)

**We're happy if:**
- At least 10 people try 3+ tasks
- Average "ease of use" is 4+/7
- People don't rage-quit due to bugs
- We get clear feedback on what to fix

**You're successful if:**
- You learned literally anything about dependent types
- You didn't hate the experience
- You got compensated for minimal effort

---

## How to Join

**Requirements:**
- Know basic programming (any language is fine)
- Have ~3-5 hours over 2 weeks (do it whenever)
- Want some compensation for your time

**Sign up:**
- Fill out Google Form [link]
- We email you the playground link + cheat sheet
- No commitment, drop out anytime (but tell us why!)

---

## The Tasks (Do At Your Own Pace)

### Task 1: Addition (20 min, Easy)
```scheme
; Make addition work
(claim + (→ Nat Nat Nat))
(define + 
  (λ (n m) 
    (iter-Nat n m (λ (x) (add1 x)))))

; Try: (+ 2 3) 
; Should give you 5
```
**Hint:** Fill in the lambda body. Use the step function to keep adding 1.

---

### Task 2: List Length (30 min, Medium)
```scheme
; Count items in any list
(claim length (Π ((E U)) (→ (List E) Nat)))
(define length
  (λ (E)
    (λ (xs)
      (rec-List xs 
        zero 
        (λ (head tail len-tail) (add1 len-tail))))))
```
**Hint:** Base case is zero. Step case adds 1 to length of tail.

---

### Task 3: Vector First Element (15 min, Easy)
```scheme
; Get first element of a vector
(claim vec-first 
  (Π ((E U) (n Nat)) 
    (→ (Vec E (add1 n)) E)))
(define vec-first
  (λ (E n v) (head v)))
```
**Hint:** Just use the `head` function!

---

### Task 4: Equality Proof (10 min, Easy)
```scheme
; Prove zero equals itself
(claim zero-eq-zero (= Nat zero zero))
(define zero-eq-zero (same zero))
```
**Hint:** Type exactly that. It works. Magic!

---

### Task 5: List Append (45 min, Hard - Optional)
```scheme
; Stick two lists together
(claim append 
  (Π ((E U)) 
    (→ (List E) (List E) (List E))))
(define append
  (λ (E)
    (λ (xs ys)
      (rec-List xs 
        ys 
        (λ (head tail result) (:: head result))))))
```
**Hint:** Base case returns second list. Step case adds head to result.

---

**Bonus Challenge (Only If You're Bored):**
Prove `n + 0 = n` using induction. Ask us for hints—this one's tricky!

---

## What You Get

- **$X gift card** (Amazon/Grab/whatever) for completing 3+ tasks + survey
- **$Y** if you also do the casual chat
- Learn about dependent types (maybe useful for PL courses?)
- Help make the tool better for future students

---

## Analysis (We Do This, Not You)

We'll look at:
- Which tasks people completed vs skipped (shows difficulty)
- Common error patterns (what's confusing?)
- Survey responses (what needs fixing?)
- Chat insights (honest reactions)

Then write a short report: "Should we use this in classes? What needs work?"

---

## Expected Outcomes

**Best case:**
- "This is actually kinda fun!"
- "Error messages make sense"
- "I get dependent types now"

**Realistic case:**
- "It's okay, some parts are confusing"
- "Needs better examples"
- "Cool but hard"

**Worst case:**
- "Too buggy to use"
- "I don't get what dependent types are for"
- We learn what to fix before deploying for real

**All outcomes are useful!**

---

## Costs & Effort

**Students:** 3-5 hours over 2 weeks, whenever you want  
**Researchers:** 15 hours (setup, support, analysis)  
**Money:** ~$[X × num_participants] for compensation

---

## Quick Reference Sheet

**Basic Types:**
```scheme
zero                    ; number 0
(add1 zero)            ; number 1
'foo                   ; atom (symbol)
sole                   ; trivial value
```

**Making Lists:**
```scheme
(the (List Nat) nil)   ; empty list
(:: 1 (:: 2 (the (List Nat) nil)))  ; list [1, 2]
```

**Functions:**
```scheme
(λ (x) (add1 x))       ; add 1 to x
(iter-Nat n base step) ; loop n times
```

**When Stuck:**
- Hover over keywords for hints (LSP tooltips)
- Check error message at bottom of screen
- Ping us on [Slack/Telegram]
- Look at examples: [link to examples doc]

---

## Schedule (Flexible!)

| When | What | How Long |
|------|------|----------|
| Day 1 | Optional kickoff session | 30 min |
| Week 1 | Try 3-4 tasks at your pace | 2-3 hrs total |
| Week 2 | Bonus tasks if interested | 0-2 hrs |
| Day 13-14 | Fill out survey | 5 min |
| Day 14 | Optional chat (volunteers) | 15 min |

**Total:** 3-5 hours over 2 weeks. Do it during coffee breaks, before bed, whenever.

---

## Contact & Support

- **Help/Questions:** [Telegram group / Slack channel]
- **Playground:** https://source-academy.github.io/pie-slang/
- **Cheat Sheet:** [Google Doc link]
- **Sign Up:** [Google Form link]

Drop in, try stuff, tell us what you think. No stress!

---

**Version:** 1.0 (chill edition)  
**Date:** Feb 2026
