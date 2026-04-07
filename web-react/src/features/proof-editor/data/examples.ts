/**
 * Example proofs for the dropdown menu
 */

export interface ProofExample {
  id: string;
  name: string;
  description: string;
  sourceCode: string;
  defaultClaim: string;
}

export const EXAMPLES: ProofExample[] = [
  {
    id: 'reflexivity',
    name: 'Reflexivity (n = n)',
    description: 'Prove that every natural number equals itself using induction',
    defaultClaim: 'n=n',
    sourceCode: `; Reflexivity: prove n = n for all natural numbers
(claim n=n
  (Pi ((n Nat))
    (= Nat n n)))

; Tactic approach: intro n, then induction on n
; Base case: (same zero)
; Step case: (same (add1 n-1))
`,
  },
  {
    id: 'zero-plus-n',
    name: '0 + n = n',
    description: 'Prove that zero plus any number equals that number',
    defaultClaim: '0+n=n',
    sourceCode: `; Define addition
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

; Prove 0 + n = n
(claim 0+n=n
  (Pi ((n Nat))
    (= Nat (+ 0 n) n)))

; With our + definition, (+ 0 n) already reduces to n
; So the proof is just (same n)
`,
  },
  {
    id: 'zero-is-even',
    name: 'Zero is Even',
    description: 'Prove that zero is an even number using Sigma types',
    defaultClaim: 'zero-is-even',
    sourceCode: `; Define addition
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

; Define double
(claim double
  (-> Nat Nat))

(define double
  (lambda (n)
    (iter-Nat n 0 (+ 2))))

; Even means there exists a half such that n = double(half)
(claim Even
  (-> Nat U))

(define Even
  (lambda (n)
    (Sigma ((half Nat))
      (= Nat n (double half)))))

; Prove zero is even: half = 0, and 0 = double(0) = 0
(claim zero-is-even
  (Even 0))

; Use split to provide witness 0, then exact (same 0)
`,
  },
  {
    id: 'either-elim',
    name: 'Either Elimination',
    description: 'Extract a Nat from Either Nat Atom using case analysis',
    defaultClaim: 'either-to-nat',
    sourceCode: `; Convert Either Nat Atom to Nat
; Left case: return the Nat
; Right case: return 0

(claim either-to-nat
  (Pi ((e (Either Nat Atom)))
    Nat))

; Use elim-Either to case analyze
; Left branch: intro n, exact n
; Right branch: intro a, exact 0
`,
  },
  {
    id: 'identity',
    name: 'Identity Function',
    description: 'Define the polymorphic identity function using intro and exact',
    defaultClaim: 'identity',
    sourceCode: `; Polymorphic identity function
; For any type A and value x:A, return x

(claim identity
  (Pi ((A U) (x A))
    A))

; Proof: intro A, intro x, exact x
`,
  },
  {
    id: 'list-length',
    name: 'List Length',
    description: 'Compute the length of a list using list elimination',
    defaultClaim: 'list-length',
    sourceCode: `; Compute the length of any list
; Base (nil): 0
; Step (:: x rest): add1 of recursive length

(claim list-length
  (Pi ((E U) (xs (List E)))
    Nat))

; Use elim-List for induction
; nil case: exact 0
; cons case: intro x, intro rest, intro ih, exact (add1 ih)
`,
  },
  {
    id: 'pair-swap',
    name: 'Pair Components',
    description: 'Construct a Sigma type (dependent pair) using split',
    defaultClaim: 'pair-proof',
    sourceCode: `; Construct a pair of natural numbers
; First component: 10
; Second component: 20

(claim pair-proof
  (Sigma ((x Nat))
    Nat))

; Use split to break into two goals
; First goal: exact 10
; Second goal: exact 20
`,
  },
  {
    id: 'right-zero-reuse',
    name: 'Theorem Reuse: n + 0 = n',
    description: 'Prove +-right-zero first (induction), then reuse it as a green lemma block to instantly prove use-right-zero',
    defaultClaim: '+-right-zero',
    sourceCode: `; Define addition
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

; Theorem 1: n + 0 = n
; Step 1 — select "+-right-zero" and prove it with induction:
;   intro n  →  elim-Nat n
;   base: exact (same zero)
;   step: intro n-1, intro ih, exact (cong ih (+ 1))
(claim +-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))

; Theorem 2: same statement, proved by reusing Theorem 1
; Step 2 — select "use-right-zero" in the dropdown.
; The green +-right-zero block will appear automatically.
; Wire it directly to the goal to complete the proof instantly.
(claim use-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))
`,
  },
  {
    id: 'multi-proof-simple',
    name: 'Multi-Proof: Identity Chain',
    description: 'Prove two simple theorems in sequence — Theorem 1 with intro+exact, then reuse it as a lemma for Theorem 2',
    defaultClaim: 'self-eq',
    sourceCode: `; ========================================
; Multi-Proof Example: Identity Chain
; ========================================
; Two theorems with the SAME type.
; Prove Theorem 1 manually, then
; reuse it as a green lemma for Theorem 2.
;
; Theorem 1 (self-eq): intro n → exact (same n)
; Theorem 2 (reuse-eq): wire the green lemma block → done!

(claim self-eq
  (Pi ((n Nat))
    (= Nat n n)))

(claim reuse-eq
  (Pi ((n Nat))
    (= Nat n n)))
`,
  },
  {
    id: 'multi-proof-pair',
    name: 'Multi-Proof: Pair Lemma',
    description: 'Prove a dependent pair with split+exact, then reuse it to prove a second identical pair',
    defaultClaim: 'five-pair',
    sourceCode: `; ========================================
; Multi-Proof Example: Pair Lemma
; ========================================
; Prove (Sigma ((x Nat)) Nat) two ways.
; Theorem 1: split → exact 5 → exact 10
; Theorem 2: wire green lemma block → done!

(claim five-pair
  (Sigma ((x Nat))
    Nat))

(claim same-pair
  (Sigma ((x Nat))
    Nat))
`,
  },
  // ================================================================
  // Multi-Proof Test Examples (comprehensive)
  // ================================================================
  {
    id: 'mp-01-linear-chain',
    name: 'MP-01: Linear Chain (A → B → C)',
    description: '3-theorem chain: prove A, then B uses A, then C uses B — tests sequential theorem reuse',
    defaultClaim: 'thm-A',
    sourceCode: `; ================================================================
; MP-01: Linear Chain  A → B → C
; ================================================================
; Three theorems where each depends on the previous one.
; Tests: sequential proof completion, lemma availability,
;        no auto-switch after each completion.
;
; ── Workflow ──
; 1. ProofPicker: select "thm-A"
;    Goal: (Pi ((n Nat)) (= Nat n n))
;    → intro n  →  exact (same n)
;    ✅ Green! Stay here. Do NOT auto-switch.
;
; 2. ProofPicker: select "thm-B"
;    Goal: (Pi ((n Nat)) (= Nat n n))
;    Canvas shows green lemma [thm-A].
;    → intro n  →  exact (thm-A n)
;    ✅ Green!
;
; 3. ProofPicker: select "thm-C"
;    Goal: (Pi ((n Nat)) (= Nat n n))
;    Canvas shows green lemmas [thm-A] and [thm-B].
;    → intro n  →  exact (thm-B n)
;    ✅ All three proven!

(claim thm-A
  (Pi ((n Nat))
    (= Nat n n)))

(claim thm-B
  (Pi ((n Nat))
    (= Nat n n)))

(claim thm-C
  (Pi ((n Nat))
    (= Nat n n)))
`,
  },
  {
    id: 'mp-02-diamond-deps',
    name: 'MP-02: Diamond Dependency (A,B → C)',
    description: '2 independent proofs converge into 1 that uses both — tests multiple lemma reuse in single proof',
    defaultClaim: 'left-val',
    sourceCode: `; ================================================================
; MP-02: Diamond Dependency
; ================================================================
;       left-val    right-val
;           \\        /
;            combined
;
; Tests: two independent proofs, then one proof using BOTH.
;
; ── Workflow ──
; 1. ProofPicker: select "left-val"
;    Goal: (Sigma ((x Nat)) Nat)
;    → split  →  exact 3  →  exact 7
;    ✅ Green!
;
; 2. ProofPicker: select "right-val"
;    Goal: (Sigma ((x Nat)) Nat)
;    → split  →  exact 10  →  exact 20
;    ✅ Green!
;
; 3. ProofPicker: select "combined"
;    Goal: (Sigma ((x Nat)) Nat)
;    Canvas shows green lemmas [left-val] and [right-val].
;    → split  →  exact (car left-val)  →  exact (cdr right-val)
;    ✅ Uses car of left-val (3) and cdr of right-val (20)!

(claim left-val
  (Sigma ((x Nat))
    Nat))

(claim right-val
  (Sigma ((x Nat))
    Nat))

(claim combined
  (Sigma ((x Nat))
    Nat))
`,
  },
  {
    id: 'mp-03-intro-exact-basic',
    name: 'MP-03: Intro + Exact Basics (3 proofs)',
    description: '3 simple Pi-type proofs using only intro and exact — tests basic multi-proof workflow',
    defaultClaim: 'id-nat',
    sourceCode: `; ================================================================
; MP-03: Intro + Exact Basics
; ================================================================
; Three simple function proofs. Good first multi-proof test.
;
; ── Workflow ──
; 1. ProofPicker: select "id-nat"
;    Goal: (Pi ((n Nat)) Nat)
;    → intro n  →  exact n
;    ✅ Green!
;
; 2. ProofPicker: select "const-zero"
;    Goal: (Pi ((n Nat)) Nat)
;    → intro n  →  exact 0
;    ✅ Green!
;
; 3. ProofPicker: select "succ"
;    Goal: (Pi ((n Nat)) Nat)
;    → intro n  →  exact (add1 n)
;    ✅ Green!

(claim id-nat
  (Pi ((n Nat))
    Nat))

(claim const-zero
  (Pi ((n Nat))
    Nat))

(claim succ
  (Pi ((n Nat))
    Nat))
`,
  },
  {
    id: 'mp-04-split-chain',
    name: 'MP-04: Split Chain (Pair → Pair → Pair)',
    description: 'Chain of Sigma-type proofs using split — tests split tactic across multiple proofs',
    defaultClaim: 'pair-1',
    sourceCode: `; ================================================================
; MP-04: Split Chain
; ================================================================
; Three pair constructions. pair-2 references pair-1, pair-3 references pair-2.
;
; ── Workflow ──
; 1. ProofPicker: select "pair-1"
;    Goal: (Sigma ((x Nat)) Nat)
;    → split  →  exact 1  →  exact 2
;    ✅ Green! (cons 1 2)
;
; 2. ProofPicker: select "pair-2"
;    Goal: (Sigma ((x Nat)) Nat)
;    Canvas shows green lemma [pair-1].
;    → split  →  exact (car pair-1)  →  exact (add1 (cdr pair-1))
;    ✅ Green! (cons 1 3)
;
; 3. ProofPicker: select "pair-3"
;    Goal: (Sigma ((x Nat)) Nat)
;    Canvas shows green lemmas [pair-1] and [pair-2].
;    → split  →  exact (car pair-2)  →  exact (add1 (cdr pair-2))
;    ✅ Green! (cons 1 4)

(claim pair-1
  (Sigma ((x Nat))
    Nat))

(claim pair-2
  (Sigma ((x Nat))
    Nat))

(claim pair-3
  (Sigma ((x Nat))
    Nat))
`,
  },
  {
    id: 'mp-05-either-left-right',
    name: 'MP-05: Either Left & Right',
    description: 'Prove left injection, right injection, then elimination using both — tests Either tactics',
    defaultClaim: 'choose-left',
    sourceCode: `; ================================================================
; MP-05: Either Left & Right
; ================================================================
; Three proofs involving Either type.
;
; ── Workflow ──
; 1. ProofPicker: select "choose-left"
;    Goal: (Either Nat Atom)
;    → left  →  exact 42
;    ✅ Green! (left 42)
;
; 2. ProofPicker: select "choose-right"
;    Goal: (Either Nat Atom)
;    → right  →  exact 'hello
;    ✅ Green! (right 'hello)
;
; 3. ProofPicker: select "either-to-nat"
;    Goal: (Pi ((e (Either Nat Atom))) Nat)
;    → intro e  →  elimEither on e
;    Left subgoal:  → intro n  →  exact n
;    Right subgoal: → intro a  →  exact 0
;    ✅ Green!

(claim choose-left
  (Either Nat Atom))

(claim choose-right
  (Either Nat Atom))

(claim either-to-nat
  (Pi ((e (Either Nat Atom)))
    Nat))
`,
  },
  {
    id: 'mp-06-induction-then-reuse',
    name: 'MP-06: Induction + Reuse',
    description: 'Prove n=n by induction, then reuse the theorem directly — tests induction + lemma reuse',
    defaultClaim: 'self-equal',
    sourceCode: `; ================================================================
; MP-06: Induction + Reuse
; ================================================================
; Prove reflexivity by induction, then reuse it.
;
; ── Workflow ──
; 1. ProofPicker: select "self-equal"
;    Goal: (Pi ((n Nat)) (= Nat n n))
;    → intro n  →  elimNat on n
;    Base case: → exact (same 0)
;    Step case: → intro n-1  → intro ih  → exact (cong ih (+ 1))
;    ✅ Green!
;
; 2. ProofPicker: select "self-equal-copy"
;    Goal: (Pi ((n Nat)) (= Nat n n))
;    Canvas shows green lemma [self-equal].
;    → exact self-equal
;    ✅ Green! Direct reuse — one tactic!

(claim self-equal
  (Pi ((n Nat))
    (= Nat n n)))

(claim self-equal-copy
  (Pi ((n Nat))
    (= Nat n n)))
`,
  },
  {
    id: 'mp-07-todo-then-finish',
    name: 'MP-07: Todo Placeholders → Complete',
    description: 'First pass: todo all goals. Second pass: replace todos with real proofs — tests incremental proving',
    defaultClaim: 'func-A',
    sourceCode: `; ================================================================
; MP-07: Todo Placeholders → Complete
; ================================================================
; First prove with "todo" placeholders to sketch the structure,
; then come back and fill in each proof properly.
;
; ── Workflow (Pass 1: sketch) ──
; 1. ProofPicker: select "func-A"
;    → intro n  →  todo
;    ✅ Green with todo! (placeholder)
;
; 2. ProofPicker: select "func-B"
;    → intro n  →  todo
;    ✅ Green with todo!
;
; ── Workflow (Pass 2: complete) ──
; 3. ProofPicker: re-select "func-A"
;    Delete the todo tactic, then:
;    → intro n  →  exact (add1 n)
;    ✅ Real proof!
;
; 4. ProofPicker: re-select "func-B"
;    Delete the todo tactic, then:
;    → intro n  →  exact (func-A n)
;    ✅ Uses func-A as lemma!

(claim func-A
  (Pi ((n Nat))
    Nat))

(claim func-B
  (Pi ((n Nat))
    Nat))
`,
  },
  {
    id: 'mp-08-nested-split',
    name: 'MP-08: Nested Split (Pair of Pairs)',
    description: 'Prove two pairs, then combine them into a nested pair — tests deep split tactic chains',
    defaultClaim: 'inner-pair',
    sourceCode: `; ================================================================
; MP-08: Nested Split (Pair of Pairs)
; ================================================================
; Build inner pair, then wrap it in an outer pair.
;
; ── Workflow ──
; 1. ProofPicker: select "inner-pair"
;    Goal: (Sigma ((x Nat)) Nat)
;    → split  →  exact 5  →  exact 10
;    ✅ Green! (cons 5 10)
;
; 2. ProofPicker: select "wrapper"
;    Goal: (Sigma ((n Nat)) (Sigma ((x Nat)) Nat))
;    → split
;    First subgoal (Nat): → exact 99
;    Second subgoal (Sigma ...): → exact inner-pair
;    ✅ Green! Uses inner-pair as the nested pair.

(claim inner-pair
  (Sigma ((x Nat))
    Nat))

(claim wrapper
  (Sigma ((n Nat))
    (Sigma ((x Nat))
      Nat)))
`,
  },
  {
    id: 'mp-09-multi-intro',
    name: 'MP-09: Multi-Argument Functions',
    description: 'Functions with 2-3 arguments, each proof builds on previous — tests deep intro chains',
    defaultClaim: 'add',
    sourceCode: `; ================================================================
; MP-09: Multi-Argument Functions
; ================================================================
;
; ── Workflow ──
; 1. ProofPicker: select "add"
;    Goal: (Pi ((a Nat) (b Nat)) Nat)
;    → intro a  →  intro b  →  exact (iter-Nat a b (lambda (x) (add1 x)))
;    ✅ Green!
;
; 2. ProofPicker: select "add-to-ten"
;    Goal: (Pi ((n Nat)) Nat)
;    Canvas shows green lemma [add].
;    → intro n  →  exact (add n 10)
;    ✅ Green! Uses "add" theorem.
;
; 3. ProofPicker: select "double"
;    Goal: (Pi ((n Nat)) Nat)
;    Canvas shows green lemmas [add] and [add-to-ten].
;    → intro n  →  exact (add n n)
;    ✅ Green! Uses "add" to double.

(claim add
  (Pi ((a Nat) (b Nat))
    Nat))

(claim add-to-ten
  (Pi ((n Nat))
    Nat))

(claim double
  (Pi ((n Nat))
    Nat))
`,
  },
  {
    id: 'mp-10-equality-chain',
    name: 'MP-10: Equality Proof Chain',
    description: 'Prove two equalities and build on them — tests = type and cong/same interaction',
    defaultClaim: 'zero-eq',
    sourceCode: `; ================================================================
; MP-10: Equality Proof Chain
; ================================================================
;
; ── Workflow ──
; 1. ProofPicker: select "zero-eq"
;    Goal: (= Nat 0 0)
;    → exact (same 0)
;    ✅ Green!
;
; 2. ProofPicker: select "one-eq"
;    Goal: (= Nat 1 1)
;    → exact (same 1)
;    ✅ Green!
;
; 3. ProofPicker: select "eq-pair"
;    Goal: (Sigma ((p (= Nat 0 0))) (= Nat 1 1))
;    Canvas shows green lemmas [zero-eq] and [one-eq].
;    → split  →  exact zero-eq  →  exact one-eq
;    ✅ Green! Bundles both equalities into a pair.

(claim zero-eq
  (= Nat 0 0))

(claim one-eq
  (= Nat 1 1))

(claim eq-pair
  (Sigma ((p (= Nat 0 0)))
    (= Nat 1 1)))
`,
  },
  {
    id: 'mp-11-five-step',
    name: 'MP-11: Five Step Build-Up',
    description: '5 increasingly complex proofs, each using previous ones — stress test for multi-proof',
    defaultClaim: 'step-1',
    sourceCode: `; ================================================================
; MP-11: Five Step Build-Up
; ================================================================
; 5 proofs, each more complex. The ultimate stress test.
;
; ── Workflow ──
; 1. ProofPicker: select "step-1"
;    Goal: Nat
;    → exact 42
;    ✅ Green!
;
; 2. ProofPicker: select "step-2"
;    Goal: Nat
;    → exact (add1 step-1)
;    ✅ Green! Uses step-1 = 42, so result = 43
;
; 3. ProofPicker: select "step-3"
;    Goal: (= Nat 42 42)
;    → exact (same 42)
;    ✅ Green!
;
; 4. ProofPicker: select "step-4"
;    Goal: (Sigma ((n Nat)) (= Nat n n))
;    → split  →  exact step-1  →  exact (same step-1)
;    ✅ Green! Pairs step-1 with its self-equality.
;
; 5. ProofPicker: select "step-5"
;    Goal: (Sigma ((n Nat)) Nat)
;    → split  →  exact (car step-4)  →  exact step-2
;    ✅ Green! Uses both step-4 and step-2.

(claim step-1
  Nat)

(claim step-2
  Nat)

(claim step-3
  (= Nat 42 42))

(claim step-4
  (Sigma ((n Nat))
    (= Nat n n)))

(claim step-5
  (Sigma ((n Nat))
    Nat))
`,
  },
  {
    id: 'mp-12-list-induction-reuse',
    name: 'MP-12: List Induction + Reuse',
    description: 'Prove list-length by list induction, then reuse it — tests elimList + lemma reuse',
    defaultClaim: 'my-length',
    sourceCode: `; ================================================================
; MP-12: List Induction + Reuse
; ================================================================
;
; ── Workflow ──
; 1. ProofPicker: select "my-length"
;    Goal: (Pi ((E U) (xs (List E))) Nat)
;    → intro E  →  intro xs  →  elimList on xs
;    Base (nil): → exact 0
;    Step (::):  → intro x  →  intro rest  →  intro ih
;                → exact (add1 ih)
;    ✅ Green!
;
; 2. ProofPicker: select "nat-list-length"
;    Goal: (Pi ((xs (List Nat))) Nat)
;    Canvas shows green lemma [my-length].
;    → intro xs  →  exact (my-length Nat xs)
;    ✅ Green! Specializes my-length to Nat lists.

(claim my-length
  (Pi ((E U) (xs (List E)))
    Nat))

(claim nat-list-length
  (Pi ((xs (List Nat)))
    Nat))
`,
  },
  {
    id: 'mp-13-apply-tactic',
    name: 'MP-13: Apply Tactic Chain',
    description: 'Prove a helper function, then use apply tactic to invoke it — tests the apply tactic',
    defaultClaim: 'add1-fn',
    sourceCode: `; ================================================================
; MP-13: Apply Tactic Chain
; ================================================================
;
; ── Workflow ──
; 1. ProofPicker: select "add1-fn"
;    Goal: (Pi ((n Nat)) Nat)
;    → intro n  →  exact (add1 n)
;    ✅ Green!
;
; 2. ProofPicker: select "get-a-nat"
;    Goal: Nat
;    Canvas shows green lemma [add1-fn].
;    → apply add1-fn
;    New subgoal: Nat (the argument to add1-fn)
;    → exact 5
;    ✅ Green! Result is (add1 5) = 6

(claim add1-fn
  (Pi ((n Nat))
    Nat))

(claim get-a-nat
  Nat)
`,
  },
  {
    id: 'mp-14-mixed-tactics',
    name: 'MP-14: Mixed Tactics Showcase',
    description: 'Uses intro, exact, split, left, right across 4 proofs — tests tactic variety',
    defaultClaim: 'mk-nat',
    sourceCode: `; ================================================================
; MP-14: Mixed Tactics Showcase
; ================================================================
; Each proof uses a different tactic combination.
;
; ── Workflow ──
; 1. ProofPicker: select "mk-nat"
;    Goal: Nat
;    → exact 7
;    ✅ Green!
;
; 2. ProofPicker: select "mk-pair"
;    Goal: (Sigma ((x Nat)) Nat)
;    → split  →  exact mk-nat  →  exact (add1 mk-nat)
;    ✅ Green! Uses mk-nat for both components.
;
; 3. ProofPicker: select "mk-left"
;    Goal: (Either Nat Atom)
;    → left  →  exact (car mk-pair)
;    ✅ Green! Uses car of mk-pair.
;
; 4. ProofPicker: select "mk-right"
;    Goal: (Either Nat Atom)
;    → right  →  exact 'done
;    ✅ Green!

(claim mk-nat
  Nat)

(claim mk-pair
  (Sigma ((x Nat))
    Nat))

(claim mk-left
  (Either Nat Atom))

(claim mk-right
  (Either Nat Atom))
`,
  },
  {
    id: 'mp-15-definitions-and-claims',
    name: 'MP-15: Definitions + Claims Mixed',
    description: 'Pre-defined functions used across multiple claim proofs — tests definition context availability',
    defaultClaim: 'double-5',
    sourceCode: `; ================================================================
; MP-15: Definitions + Claims Mixed
; ================================================================
; Definitions are already proven. Claims use them.
;
; ── Workflow ──
; 1. ProofPicker: select "double-5"
;    Goal: (= Nat (my-double 5) 10)
;    → exact (same 10)
;    ✅ Green! my-double 5 reduces to 10.
;
; 2. ProofPicker: select "double-0"
;    Goal: (= Nat (my-double 0) 0)
;    → exact (same 0)
;    ✅ Green! my-double 0 reduces to 0.
;
; 3. ProofPicker: select "double-pair"
;    Goal: (Sigma ((p (= Nat (my-double 5) 10))) (= Nat (my-double 0) 0))
;    Canvas shows green lemmas [double-5] and [double-0].
;    → split  →  exact double-5  →  exact double-0
;    ✅ Green! Bundles both proofs.

(claim my-double
  (-> Nat Nat))

(define my-double
  (lambda (n)
    (iter-Nat n 0 (lambda (x) (add1 (add1 x))))))

(claim double-5
  (= Nat (my-double 5) 10))

(claim double-0
  (= Nat (my-double 0) 0))

(claim double-pair
  (Sigma ((p (= Nat (my-double 5) 10)))
    (= Nat (my-double 0) 0)))
`,
  },
  {
    id: 'even-or-odd',
    name: 'Even or Odd (Advanced)',
    description: 'Prove every natural number is either even or odd',
    defaultClaim: 'even-or-odd',
    sourceCode: `; Define addition and double
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

(claim double
  (-> Nat Nat))

(define double
  (lambda (n)
    (iter-Nat n 0 (+ 2))))

; Define Even and Odd predicates
(claim Even
  (-> Nat U))

(define Even
  (lambda (n)
    (Sigma ((half Nat))
      (= Nat n (double half)))))

(claim Odd
  (-> Nat U))

(define Odd
  (lambda (n)
    (Sigma ((half Nat))
      (= Nat n (add1 (double half))))))

; Helper: zero is even
(claim zero-is-even
  (Even 0))

(define zero-is-even
  (cons 0 (same 0)))

; Helper: if n is even, add1 n is odd
(claim add1-even->odd
  (Pi ((n Nat))
    (-> (Even n)
        (Odd (add1 n)))))

(define add1-even->odd
  (lambda (n en)
    (cons (car en)
          (cong (cdr en) (+ 1)))))

; Helper: if n is odd, add1 n is even
(claim add1-odd->even
  (Pi ((n Nat))
    (-> (Odd n)
        (Even (add1 n)))))

(define add1-odd->even
  (lambda (n on)
    (cons (add1 (car on))
          (cong (cdr on) (+ 1)))))

; Main theorem: every Nat is either even or odd
(claim even-or-odd
  (Pi ((n Nat))
    (Either (Even n) (Odd n))))

; Proof uses ind-Nat:
; Base: left zero-is-even
; Step: case on whether n-1 is even or odd
`,
  },
];

/**
 * Get an example by ID
 */
export function getExampleById(id: string): ProofExample | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
