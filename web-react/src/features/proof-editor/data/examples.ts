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
