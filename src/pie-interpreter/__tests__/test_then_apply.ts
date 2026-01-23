import 'jest';
import { evaluatePie } from '../main';

describe("ThenTactic Tests", () => {
  it("basic then block for Nat elimination", () => {
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus
  (→ Nat Nat))

(define step-plus
  (λ (n-1) (add1 n-1)))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus)))

(claim n+0=n
  (Π ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))
`;
    const result = evaluatePie(str);
    expect(result).toContain("n+0=n");
  });

  it("nested then blocks for Either elimination", () => {
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus (→ Nat Nat))
(define step-plus (λ (n-1) (add1 n-1)))
(define + (λ (n j) (iter-Nat n j step-plus)))

(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))

(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))

(claim Odd (→ Nat U))
(define Odd (λ (n) (Σ ((haf Nat)) (= Nat n (add1 (double haf))))))

(claim zero-is-even (Even 0))
(define zero-is-even (cons 0 (same 0)))

(claim add1-even->odd
  (Π ((n Nat)) (→ (Even n) (Odd (add1 n)))))
(define add1-even->odd
  (λ (n en) (cons (car en) (cong (cdr en) (+ 1)))))

(claim add1-odd->even
  (Π ((n Nat)) (→ (Odd n) (Even (add1 n)))))
(define add1-odd->even
  (λ (n on) (cons (add1 (car on)) (cong (cdr on) (+ 1)))))

(claim even-or-odd
  (Π ((n Nat)) (Either (Even n) (Odd n))))

(define-tactically even-or-odd
  ((intro n)
   (elim-Nat n)
   (then
     (exact (left zero-is-even)))
   (then
     (intro n-1)
     (intro e-or-on-1)
     (elim-Either e-or-on-1)
     (then
       (intro xr)
       (go-Right)
       (exact (add1-even->odd n-1 xr)))
     (then
       (intro xl)
       (go-Left)
       (exact (add1-odd->even n-1 xl))))))
`;
    const result = evaluatePie(str);
    expect(result).toContain("even-or-odd");
  });
});

describe("ApplyTactic Tests", () => {
  it("simple apply with function", () => {
    const str = `
(claim f (→ Nat Nat))
(define f (λ (n) (add1 n)))

(claim goal Nat)
(define-tactically goal
  ((apply f)
   (exact zero)))
`;
    const result = evaluatePie(str);
    expect(result).toContain("goal");
  });

  it("apply with multi-argument function (curried)", () => {
    const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (a b) (iter-Nat a b (λ (x) (add1 x)))))

(claim goal Nat)
(define-tactically goal
  ((apply (+ 3))
   (exact 2)))
`;
    const result = evaluatePie(str);
    expect(result).toContain("goal");
  });

  it("apply with dependent function for proof", () => {
    const str = `
(claim succ (→ Nat Nat))
(define succ (λ (n) (add1 n)))

(claim three Nat)
(define-tactically three
  ((apply succ)
   (apply succ)
   (apply succ)
   (exact zero)))
`;
    const result = evaluatePie(str);
    expect(result).toContain("three");
  });
});

describe("Combined then and apply", () => {
  it("then with apply inside", () => {
    const str = `
(claim f (→ Nat Nat))
(define f (λ (n) (add1 n)))

(claim double-apply Nat)
(define-tactically double-apply
  ((then
     (apply f)
     (apply f)
     (exact zero))))
`;
    const result = evaluatePie(str);
    expect(result).toContain("double-apply");
  });
});

describe("Apply with cong-add1 proof", () => {
  it("apply cong-add1 to transform equality goal", () => {
    const str = `
(claim cong-add1
  (Π ((n Nat) (m Nat))
    (→ (= Nat n m)
       (= Nat (add1 n) (add1 m)))))

(define cong-add1
  (λ (n m eq)
    (cong eq (the (→ Nat Nat) (λ (x) (add1 x))))))

(claim eq-2-2 (= Nat 2 2))
(define eq-2-2 (same 2))

(claim goal (= Nat 3 3))
(define-tactically goal
  ((apply (cong-add1 2 2))
   (exact eq-2-2)))
`;
    const result = evaluatePie(str);
    expect(result).toContain("goal");
  });
});

describe("Compulsory then blocks", () => {
  it("should fail when 'then' is missing after elimination tactic", () => {
    // This test verifies that after elim-Nat (which creates 2 subgoals),
    // the next tactic MUST be a 'then' block, not a regular tactic like 'exact'
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus
  (→ Nat Nat))

(define step-plus
  (λ (n-1) (add1 n-1)))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus)))

(claim n+0=n
  (Π ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (exact (same 0))
   (exact (same 0))))
`;
    expect(() => evaluatePie(str)).toThrow("Expected 'then' block to handle subgoal branch");
  });

  it("should fail when not enough 'then' blocks are provided", () => {
    // elim-Nat creates 2 branches, but we only provide 1 'then' block
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus (→ Nat Nat))
(define step-plus (λ (n-1) (add1 n-1)))
(define + (λ (n j) (iter-Nat n j step-plus)))

(claim n+0=n
  (Π ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))))
`;
    // This should fail because we only provide 1 then block but need 2
    expect(() => evaluatePie(str)).toThrow();
  });

  it("should succeed when correct number of 'then' blocks are provided", () => {
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus (→ Nat Nat))
(define step-plus (λ (n-1) (add1 n-1)))
(define + (λ (n j) (iter-Nat n j step-plus)))

(claim n+0=n
  (Π ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))
`;
    const result = evaluatePie(str);
    expect(result).toContain("n+0=n");
  });
});
