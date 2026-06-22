/**
 * Holdout evaluation script for the LoRA tactic prediction model.
 *
 * ~100+ novel theorems (NOT in training set), ~500 tactic steps across all
 * tactic categories. Runs through the interpreter to extract per-step proof
 * states, then queries the running LoRA server and measures accuracy.
 *
 * Usage:
 *   npx tsx training/eval-holdout.ts [--verbose]
 *   npx tsx training/eval-holdout.ts --extract-only   # verify proofs without server
 *
 * Requires: LoRA server running on port 8000 (./training/launch.sh)
 */

import { evaluatePieAndGetContext } from '../src/pie-interpreter/main';
import { ProofManager } from '../src/pie-interpreter/tactics/proof-manager';
import { Context, Define, Free } from '../src/pie-interpreter/utils/context';
import { go, stop } from '../src/pie-interpreter/types/utils';
import { schemeParse } from '../src/pie-interpreter/parser/parser';
import { Parser } from '../src/pie-interpreter/parser/parser';
import { Tactic } from '../src/pie-interpreter/tactics/tactics';
import { sugarType } from '../src/pie-interpreter/unparser/sugar';

// ── Types ────────────────────────────────────────────────────────────────────

interface StepRecord {
  theoremName: string;
  section: string;
  stepIndex: number;
  goal: string;
  globalContext: { name: string; type: string }[];
  localContext: { name: string; type: string }[];
  goldTactic: string;
  predicted?: string;
  exactMatch?: boolean;
  headMatch?: boolean;
  categoryMatch?: boolean;
}

interface HoldoutTheorem {
  section: string;
  name: string;
  claim: string;
  tactics: string[];
}

interface TheoremGroup {
  name: string;
  preamble: string;
  theorems: HoldoutTheorem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function natExpr(n: number): string {
  if (n === 0) return '0';
  return `(add1 ${natExpr(n - 1)})`;
}

// ── Preambles ────────────────────────────────────────────────────────────────

const preambleEvenOdd = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))
(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))
(claim Odd (→ Nat U))
(define Odd (λ (n) (Σ ((half Nat)) (= Nat n (add1 (double half))))))
(claim zero-is-even (Even 0))
(define zero-is-even (cons 0 (same 0)))
(claim add1-even->odd (Π ((n Nat)) (→ (Even n) (Odd (add1 n)))))
(define add1-even->odd (λ (n en) (cons (car en) (cong (cdr en) (+ 1)))))
(claim add1-odd->even (Π ((n Nat)) (→ (Odd n) (Even (add1 n)))))
(define add1-odd->even (λ (n on) (cons (add1 (car on)) (cong (cdr on) (+ 1)))))
`;

const preambleArith = preambleEvenOdd + `
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define n+0=n (λ (n) (ind-Nat n
  (λ (k) (= Nat (+ k 0) k))
  (same 0)
  (λ (n-1 ih) (cong ih (+ 1))))))
(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define +add1 (λ (n m) (ind-Nat n
  (λ (k) (= Nat (+ k (add1 m)) (add1 (+ k m))))
  (same (add1 m))
  (λ (n-1 ih) (cong ih (+ 1))))))
(claim +-comm (Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define +-comm (λ (n m) (ind-Nat n
  (λ (k) (= Nat (+ k m) (+ m k)))
  (symm (n+0=n m))
  (λ (n-1 ih) (trans (cong ih (+ 1)) (symm (+add1 m n-1)))))))
(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define n*0=0 (λ (n) (ind-Nat n
  (λ (k) (= Nat (* k 0) 0))
  (same 0)
  (λ (n-1 ih) ih))))
`;

const preambleBool = `
(claim Bool U)
(define Bool (Either Trivial Trivial))
(claim true Bool)
(define true (left sole))
(claim false Bool)
(define false (right sole))
(claim not-bool (→ Bool Bool))
(define not-bool (λ (b) (ind-Either b (λ (x) Bool) (λ (l) (right sole)) (λ (r) (left sole)))))
(claim and-bool (→ Bool Bool Bool))
(define and-bool (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) b) (λ (r) (right sole)))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) (left sole)) (λ (r) b))))
(claim xor-bool (→ Bool Bool Bool))
(define xor-bool (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) (not-bool b)) (λ (r) b))))
(claim implies-bool (→ Bool Bool Bool))
(define implies-bool (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) b) (λ (r) (left sole)))))
`;

const preambleList = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
`;

// ── Theorem Groups ───────────────────────────────────────────────────────────

function buildEvenOddGroup(): TheoremGroup {
  const theorems: HoldoutTheorem[] = [];

  // ── Section: intro+exact (Even/Odd) ──
  theorems.push(
    { section: 'intro+exact', name: 'hld-id-even',
      claim: '(Π ((n Nat)) (→ (Even n) (Even n)))',
      tactics: ['intro n', 'intro en', 'exact en'] },
    { section: 'intro+exact', name: 'hld-id-odd',
      claim: '(Π ((n Nat)) (→ (Odd n) (Odd n)))',
      tactics: ['intro n', 'intro on', 'exact on'] },
    { section: 'intro+exact', name: 'hld-even-to-odd-s',
      claim: '(Π ((n Nat)) (→ (Even n) (Odd (add1 n))))',
      tactics: ['intro n', 'intro en', 'exact (add1-even->odd n en)'] },
    { section: 'intro+exact', name: 'hld-odd-to-even-s',
      claim: '(Π ((n Nat)) (→ (Odd n) (Even (add1 n))))',
      tactics: ['intro n', 'intro on', 'exact (add1-odd->even n on)'] },
    { section: 'intro+exact', name: 'hld-even-add2',
      claim: '(Π ((n Nat)) (→ (Even n) (Even (add1 (add1 n)))))',
      tactics: ['intro n', 'intro en', 'exact (add1-odd->even (add1 n) (add1-even->odd n en))'] },
    { section: 'intro+exact', name: 'hld-odd-add2',
      claim: '(Π ((n Nat)) (→ (Odd n) (Odd (add1 (add1 n)))))',
      tactics: ['intro n', 'intro on', 'exact (add1-even->odd (add1 n) (add1-odd->even n on))'] },
    { section: 'intro+exact', name: 'hld-even-chain',
      claim: '(Π ((n Nat) (m Nat)) (→ (Even n) (Even n)))',
      tactics: ['intro n', 'intro m', 'intro en', 'exact en'] },
    { section: 'intro+exact', name: 'hld-odd-chain',
      claim: '(Π ((n Nat) (m Nat)) (→ (Odd n) (Odd n)))',
      tactics: ['intro n', 'intro m', 'intro on', 'exact on'] },
    { section: 'intro+exact', name: 'hld-even-weaken',
      claim: '(Π ((n Nat) (m Nat) (k Nat)) (→ (Even n) (Even n)))',
      tactics: ['intro n', 'intro m', 'intro k', 'intro en', 'exact en'] },
    { section: 'intro+exact', name: 'hld-even-0-direct',
      claim: '(Even 0)',
      tactics: ['exact zero-is-even'] },
    { section: 'intro+exact', name: 'hld-odd-1-direct',
      claim: '(Odd (add1 0))',
      tactics: ['exact (add1-even->odd 0 zero-is-even)'] },
  );

  // ── Section: exists (Even/Odd concrete witnesses) ──
  for (const n of [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]) {
    theorems.push({
      section: 'exists',
      name: `hld-even-${n}`,
      claim: `(Even ${natExpr(n)})`,
      tactics: [`exists ${n / 2} half`, `exact (same ${n})`],
    });
  }
  for (const n of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
    theorems.push({
      section: 'exists',
      name: `hld-odd-${n}`,
      claim: `(Odd ${natExpr(n)})`,
      tactics: [`exists ${(n - 1) / 2} half`, `exact (same ${n})`],
    });
  }
  // exists with intro prefix
  for (const n of [0, 4, 8]) {
    theorems.push({
      section: 'exists',
      name: `hld-even-intro-${n}`,
      claim: `(Π ((p Trivial)) (Even ${natExpr(n)}))`,
      tactics: ['intro p', `exists ${n / 2} half`, `exact (same ${n})`],
    });
  }
  for (const n of [1, 5, 9]) {
    theorems.push({
      section: 'exists',
      name: `hld-odd-intro-${n}`,
      claim: `(Π ((p Trivial)) (Odd ${natExpr(n)}))`,
      tactics: ['intro p', `exists ${(n - 1) / 2} half`, `exact (same ${n})`],
    });
  }

  // ── Section: go-Left / go-Right (concrete Either) ──
  // Standard order: (Either (Even N) (Odd N))
  for (const n of [0, 2, 4, 6, 8]) {
    theorems.push({
      section: 'go-Left/Right',
      name: `hld-either-even-${n}`,
      claim: `(Either (Even ${natExpr(n)}) (Odd ${natExpr(n)}))`,
      tactics: ['go-Left', `exists ${n / 2} half`, `exact (same ${n})`],
    });
  }
  for (const n of [1, 3, 5, 7, 9]) {
    theorems.push({
      section: 'go-Left/Right',
      name: `hld-either-odd-${n}`,
      claim: `(Either (Even ${natExpr(n)}) (Odd ${natExpr(n)}))`,
      tactics: ['go-Right', `exists ${(n - 1) / 2} half`, `exact (same ${n})`],
    });
  }
  // Swapped order: (Either (Odd N) (Even N))
  for (const n of [0, 2, 4, 6, 8]) {
    theorems.push({
      section: 'go-Left/Right',
      name: `hld-either-swap-even-${n}`,
      claim: `(Either (Odd ${natExpr(n)}) (Even ${natExpr(n)}))`,
      tactics: ['go-Right', `exists ${n / 2} half`, `exact (same ${n})`],
    });
  }
  for (const n of [1, 3, 5, 7, 9]) {
    theorems.push({
      section: 'go-Left/Right',
      name: `hld-either-swap-odd-${n}`,
      claim: `(Either (Odd ${natExpr(n)}) (Even ${natExpr(n)}))`,
      tactics: ['go-Left', `exists ${(n - 1) / 2} half`, `exact (same ${n})`],
    });
  }

  // ── Section: elim-Either (case splits on Even/Odd) ──
  theorems.push(
    { section: 'elim-Either', name: 'hld-either-to-nat',
      claim: '(Π ((n Nat)) (→ (Either (Even n) (Odd n)) Nat))',
      tactics: ['intro n', 'intro h', 'elim-Either h', 'intro en', 'exact n', 'intro on', 'exact n'] },
    { section: 'elim-Either', name: 'hld-either-to-trivial',
      claim: '(Π ((n Nat)) (→ (Either (Even n) (Odd n)) Trivial))',
      tactics: ['intro n', 'intro h', 'elim-Either h', 'intro en', 'exact sole', 'intro on', 'exact sole'] },
    { section: 'elim-Either', name: 'hld-either-swap-fn',
      claim: '(Π ((n Nat)) (→ (Either (Even n) (Odd n)) (Either (Odd n) (Even n))))',
      tactics: ['intro n', 'intro h', 'elim-Either h', 'intro en', 'go-Right', 'exact en', 'intro on', 'go-Left', 'exact on'] },
    { section: 'elim-Either', name: 'hld-succ-parity-fn',
      claim: '(Π ((n Nat)) (→ (Either (Even n) (Odd n)) (Either (Even (add1 n)) (Odd (add1 n)))))',
      tactics: ['intro n', 'intro h', 'elim-Either h', 'intro en', 'go-Right', 'exact (add1-even->odd n en)', 'intro on', 'go-Left', 'exact (add1-odd->even n on)'] },
    { section: 'elim-Either', name: 'hld-either-even-inject',
      claim: '(Π ((n Nat)) (→ (Even n) (Either (Even n) (Odd n))))',
      tactics: ['intro n', 'intro en', 'go-Left', 'exact en'] },
    { section: 'elim-Either', name: 'hld-either-odd-inject',
      claim: '(Π ((n Nat)) (→ (Odd n) (Either (Even n) (Odd n))))',
      tactics: ['intro n', 'intro on', 'go-Right', 'exact on'] },
    { section: 'elim-Either', name: 'hld-succ-swap',
      claim: '(Π ((n Nat)) (→ (Either (Even n) (Odd n)) (Either (Odd (add1 n)) (Even (add1 n)))))',
      tactics: ['intro n', 'intro h', 'elim-Either h', 'intro en', 'go-Left', 'exact (add1-even->odd n en)', 'intro on', 'go-Right', 'exact (add1-odd->even n on)'] },
    { section: 'elim-Either', name: 'hld-either-add2',
      claim: '(Π ((n Nat)) (→ (Either (Even n) (Odd n)) (Either (Even (add1 (add1 n))) (Odd (add1 (add1 n))))))',
      tactics: ['intro n', 'intro h', 'elim-Either h',
        'intro en', 'go-Left', 'exact (add1-odd->even (add1 n) (add1-even->odd n en))',
        'intro on', 'go-Right', 'exact (add1-even->odd (add1 n) (add1-odd->even n on))'] },
  );

  // ── Section: compound (elim-Nat + elim-Either) ──
  // Full induction proofs with different variable names and Either orders
  theorems.push(
    { section: 'compound', name: 'hld-parity-all',
      claim: '(Π ((n Nat)) (Either (Even n) (Odd n)))',
      tactics: ['intro n', 'elim-Nat n',
        'go-Left', 'exact zero-is-even',
        'intro n-1', 'intro ih', 'elim-Either ih',
        'intro en', 'go-Right', 'exact (add1-even->odd n-1 en)',
        'intro on', 'go-Left', 'exact (add1-odd->even n-1 on)'] },
    { section: 'compound', name: 'hld-parity-all-m',
      claim: '(Π ((m Nat)) (Either (Even m) (Odd m)))',
      tactics: ['intro m', 'elim-Nat m',
        'go-Left', 'exact zero-is-even',
        'intro m-1', 'intro ih', 'elim-Either ih',
        'intro en', 'go-Right', 'exact (add1-even->odd m-1 en)',
        'intro on', 'go-Left', 'exact (add1-odd->even m-1 on)'] },
    { section: 'compound', name: 'hld-parity-all-k',
      claim: '(Π ((k Nat)) (Either (Even k) (Odd k)))',
      tactics: ['intro k', 'elim-Nat k',
        'go-Left', 'exact zero-is-even',
        'intro k-1', 'intro ih', 'elim-Either ih',
        'intro en', 'go-Right', 'exact (add1-even->odd k-1 en)',
        'intro on', 'go-Left', 'exact (add1-odd->even k-1 on)'] },
    { section: 'compound', name: 'hld-parity-swap-all',
      claim: '(Π ((n Nat)) (Either (Odd n) (Even n)))',
      tactics: ['intro n', 'elim-Nat n',
        'go-Right', 'exact zero-is-even',
        'intro n-1', 'intro ih', 'elim-Either ih',
        'intro on', 'go-Right', 'exact (add1-odd->even n-1 on)',
        'intro en', 'go-Left', 'exact (add1-even->odd n-1 en)'] },
    { section: 'compound', name: 'hld-succ-parity-all',
      claim: '(Π ((n Nat)) (Either (Even (add1 n)) (Odd (add1 n))))',
      tactics: ['intro n', 'elim-Nat n',
        'go-Right', 'exact (add1-even->odd 0 zero-is-even)',
        'intro n-1', 'intro ih', 'elim-Either ih',
        'intro en', 'go-Right', 'exact (add1-even->odd (add1 n-1) en)',
        'intro on', 'go-Left', 'exact (add1-odd->even (add1 n-1) on)'] },
    { section: 'compound', name: 'hld-succ-parity-swap',
      claim: '(Π ((n Nat)) (Either (Odd (add1 n)) (Even (add1 n))))',
      tactics: ['intro n', 'elim-Nat n',
        'go-Left', 'exact (add1-even->odd 0 zero-is-even)',
        'intro n-1', 'intro ih', 'elim-Either ih',
        'intro on', 'go-Right', 'exact (add1-odd->even (add1 n-1) on)',
        'intro en', 'go-Left', 'exact (add1-even->odd (add1 n-1) en)'] },
  );

  return { name: 'Even/Odd', preamble: preambleEvenOdd, theorems };
}

function buildArithGroup(): TheoremGroup {
  const theorems: HoldoutTheorem[] = [];

  // ── Section: intro+exact (arithmetic equalities) ──
  theorems.push(
    { section: 'intro+exact', name: 'hld-cong-add1',
      claim: '(Π ((n Nat) (m Nat)) (→ (= Nat n m) (= Nat (add1 n) (add1 m))))',
      tactics: ['intro n', 'intro m', 'intro eq', 'exact (cong eq (+ 1))'] },
    { section: 'intro+exact', name: 'hld-symm-nat',
      claim: '(Π ((n Nat) (m Nat)) (→ (= Nat n m) (= Nat m n)))',
      tactics: ['intro n', 'intro m', 'intro eq', 'exact (symm eq)'] },
    { section: 'intro+exact', name: 'hld-trans-nat',
      claim: '(Π ((a Nat) (b Nat) (c Nat)) (→ (= Nat a b) (→ (= Nat b c) (= Nat a c))))',
      tactics: ['intro a', 'intro b', 'intro c', 'intro eq1', 'intro eq2', 'exact (trans eq1 eq2)'] },
    { section: 'intro+exact', name: 'hld-cong-double',
      claim: '(Π ((n Nat) (m Nat)) (→ (= Nat n m) (= Nat (double n) (double m))))',
      tactics: ['intro n', 'intro m', 'intro eq', 'exact (cong eq double)'] },
    { section: 'intro+exact', name: 'hld-cong-plus-k',
      claim: '(Π ((n Nat) (m Nat) (k Nat)) (→ (= Nat n m) (= Nat (+ k n) (+ k m))))',
      tactics: ['intro n', 'intro m', 'intro k', 'intro eq', 'exact (cong eq (+ k))'] },
    { section: 'intro+exact', name: 'hld-add-zero-left',
      claim: '(Π ((m Nat)) (= Nat (+ 0 m) m))',
      tactics: ['intro m', 'exact (same m)'] },
    { section: 'intro+exact', name: 'hld-mul-zero-left',
      claim: '(Π ((n Nat)) (= Nat (* 0 n) 0))',
      tactics: ['intro n', 'exact (same 0)'] },
  );

  // ── Section: elim-Nat (arithmetic induction) ──
  theorems.push(
    { section: 'elim-Nat', name: 'hld-n-plus-0',
      claim: '(Π ((n Nat)) (= Nat (+ n 0) n))',
      tactics: ['intro n', 'elim-Nat n', 'exact (same 0)',
        'intro n-1', 'intro ih', 'exact (cong ih (+ 1))'] },
    { section: 'elim-Nat', name: 'hld-n-plus-add1',
      claim: '(Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m))))',
      tactics: ['intro n', 'intro m', 'elim-Nat n', 'exact (same (add1 m))',
        'intro n-1', 'intro ih', 'exact (cong ih (+ 1))'] },
    { section: 'elim-Nat', name: 'hld-n-times-1',
      claim: '(Π ((n Nat)) (= Nat (* n 1) n))',
      tactics: ['intro n', 'elim-Nat n', 'exact (same 0)',
        'intro n-1', 'intro ih', 'exact (cong ih (+ 1))'] },
    { section: 'elim-Nat', name: 'hld-n-times-0',
      claim: '(Π ((n Nat)) (= Nat (* n 0) 0))',
      tactics: ['intro n', 'elim-Nat n', 'exact (same 0)',
        'intro n-1', 'intro ih', 'exact ih'] },
    { section: 'elim-Nat', name: 'hld-plus-assoc',
      claim: '(Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c))))',
      tactics: ['intro a', 'intro b', 'intro c', 'elim-Nat a',
        'exact (same (+ b c))',
        'intro a-1', 'intro ih', 'exact (cong ih (+ 1))'] },
    { section: 'elim-Nat', name: 'hld-plus-comm',
      claim: '(Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n)))',
      tactics: ['intro n', 'intro m', 'elim-Nat n',
        'exact (symm (n+0=n m))',
        'intro n-1', 'intro ih', 'exact (trans (cong ih (+ 1)) (symm (+add1 m n-1)))'] },
    { section: 'elim-Nat', name: 'hld-is-zero',
      claim: '(Π ((n Nat)) (Either Trivial Trivial))',
      tactics: ['intro n', 'elim-Nat n', 'go-Left', 'exact sole',
        'intro n-1', 'intro ih', 'go-Right', 'exact sole'] },
  );

  // ── Section: exists (divisibility) ──
  const divPairs: [number, number][] = [
    [2, 3], [2, 7], [2, 9], [3, 2], [3, 4], [3, 7],
    [4, 2], [4, 5], [5, 2], [5, 4], [5, 6], [6, 3],
    [7, 2], [7, 3], [8, 3],
  ];
  for (const [a, b] of divPairs) {
    const prod = a * b;
    theorems.push({
      section: 'exists',
      name: `hld-${a}div${prod}`,
      claim: `(Σ ((k Nat)) (= Nat (* ${a} k) ${natExpr(prod)}))`,
      tactics: [`exists ${b} k`, `exact (same ${prod})`],
    });
  }

  return { name: 'Arithmetic', preamble: preambleArith, theorems };
}

function buildBoolGroup(): TheoremGroup {
  const theorems: HoldoutTheorem[] = [];
  const T = '(left sole)';   // true
  const F = '(right sole)';  // false

  // ── Section: bool-single (single elim-Either) ──
  // not-involutive
  theorems.push(
    { section: 'bool-single', name: 'hld-not-invol',
      claim: '(Π ((b Bool)) (= Bool (not-bool (not-bool b)) b))',
      tactics: ['intro b', 'elim-Either b', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${F})`] },
    { section: 'bool-single', name: 'hld-and-self',
      claim: '(Π ((a Bool)) (= Bool (and-bool a a) a))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${F})`] },
    { section: 'bool-single', name: 'hld-or-self',
      claim: '(Π ((a Bool)) (= Bool (or-bool a a) a))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${F})`] },
    { section: 'bool-single', name: 'hld-and-true',
      claim: '(Π ((a Bool)) (= Bool (and-bool a true) a))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${F})`] },
    { section: 'bool-single', name: 'hld-or-false',
      claim: '(Π ((a Bool)) (= Bool (or-bool a false) a))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${F})`] },
    { section: 'bool-single', name: 'hld-and-false',
      claim: '(Π ((a Bool)) (= Bool (and-bool a false) false))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${F})`, 'intro r', `exact (same ${F})`] },
    { section: 'bool-single', name: 'hld-or-true',
      claim: '(Π ((a Bool)) (= Bool (or-bool a true) true))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${T})`] },
    { section: 'bool-single', name: 'hld-impl-true',
      claim: '(Π ((a Bool)) (= Bool (implies-bool a true) true))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${T})`, 'intro r', `exact (same ${T})`] },
    { section: 'bool-single', name: 'hld-xor-self-false',
      claim: '(Π ((a Bool)) (= Bool (xor-bool a a) false))',
      tactics: ['intro a', 'elim-Either a', 'intro l',
        `exact (same ${F})`, 'intro r', `exact (same ${F})`] },
  );

  // ── Section: bool-double (double elim-Either, 15 steps each) ──
  // and-comm: and(a,b) = and(b,a)
  // TT→TT, TF→FT→F, FT→TF→F, FF→FF
  theorems.push(
    { section: 'bool-double', name: 'hld-and-comm',
      claim: '(Π ((a Bool) (b Bool)) (= Bool (and-bool a b) (and-bool b a)))',
      tactics: ['intro a', 'intro b', 'elim-Either a',
        'intro la', 'elim-Either b',
          'intro lb', `exact (same ${T})`,
          'intro rb', `exact (same ${F})`,
        'intro ra', 'elim-Either b',
          'intro lb', `exact (same ${F})`,
          'intro rb', `exact (same ${F})`] },
    // or-comm: or(a,b) = or(b,a)
    { section: 'bool-double', name: 'hld-or-comm',
      claim: '(Π ((a Bool) (b Bool)) (= Bool (or-bool a b) (or-bool b a)))',
      tactics: ['intro a', 'intro b', 'elim-Either a',
        'intro la', 'elim-Either b',
          'intro lb', `exact (same ${T})`,
          'intro rb', `exact (same ${T})`,
        'intro ra', 'elim-Either b',
          'intro lb', `exact (same ${T})`,
          'intro rb', `exact (same ${F})`] },
    // xor-comm: xor(a,b) = xor(b,a)
    { section: 'bool-double', name: 'hld-xor-comm',
      claim: '(Π ((a Bool) (b Bool)) (= Bool (xor-bool a b) (xor-bool b a)))',
      tactics: ['intro a', 'intro b', 'elim-Either a',
        'intro la', 'elim-Either b',
          'intro lb', `exact (same ${F})`,
          'intro rb', `exact (same ${T})`,
        'intro ra', 'elim-Either b',
          'intro lb', `exact (same ${T})`,
          'intro rb', `exact (same ${F})`] },
    // de-morgan: not(and(a,b)) = or(not(a), not(b))
    { section: 'bool-double', name: 'hld-demorgan-and',
      claim: '(Π ((a Bool) (b Bool)) (= Bool (not-bool (and-bool a b)) (or-bool (not-bool a) (not-bool b))))',
      tactics: ['intro a', 'intro b', 'elim-Either a',
        'intro la', 'elim-Either b',
          'intro lb', `exact (same ${F})`,
          'intro rb', `exact (same ${T})`,
        'intro ra', 'elim-Either b',
          'intro lb', `exact (same ${T})`,
          'intro rb', `exact (same ${T})`] },
    // de-morgan: not(or(a,b)) = and(not(a), not(b))
    { section: 'bool-double', name: 'hld-demorgan-or',
      claim: '(Π ((a Bool) (b Bool)) (= Bool (not-bool (or-bool a b)) (and-bool (not-bool a) (not-bool b))))',
      tactics: ['intro a', 'intro b', 'elim-Either a',
        'intro la', 'elim-Either b',
          'intro lb', `exact (same ${F})`,
          'intro rb', `exact (same ${F})`,
        'intro ra', 'elim-Either b',
          'intro lb', `exact (same ${F})`,
          'intro rb', `exact (same ${T})`] },
  );

  return { name: 'Bool', preamble: preambleBool, theorems };
}

function buildGenericGroup(): TheoremGroup {
  const theorems: HoldoutTheorem[] = [];

  // ── Section: intro+exact (generic/polymorphic) ──
  theorems.push(
    { section: 'intro+exact', name: 'hld-id-fn',
      claim: '(Π ((A U) (a A)) A)',
      tactics: ['intro A', 'intro a', 'exact a'] },
    { section: 'intro+exact', name: 'hld-const-fst',
      claim: '(Π ((A U) (B U) (a A) (b B)) A)',
      tactics: ['intro A', 'intro B', 'intro a', 'intro b', 'exact a'] },
    { section: 'intro+exact', name: 'hld-const-snd',
      claim: '(Π ((A U) (B U) (a A) (b B)) B)',
      tactics: ['intro A', 'intro B', 'intro a', 'intro b', 'exact b'] },
    { section: 'intro+exact', name: 'hld-refl-nat',
      claim: '(Π ((n Nat)) (= Nat n n))',
      tactics: ['intro n', 'exact (same n)'] },
    { section: 'intro+exact', name: 'hld-refl-atom',
      claim: '(Π ((a Atom)) (= Atom a a))',
      tactics: ['intro a', 'exact (same a)'] },
    { section: 'intro+exact', name: 'hld-trivial-fn',
      claim: '(Π ((x Trivial)) Trivial)',
      tactics: ['intro x', 'exact sole'] },
    { section: 'intro+exact', name: 'hld-nat-to-nat',
      claim: '(Π ((n Nat)) Nat)',
      tactics: ['intro n', 'exact n'] },
    { section: 'intro+exact', name: 'hld-const-zero',
      claim: '(Π ((n Nat)) Nat)',
      tactics: ['intro n', 'exact 0'] },
    { section: 'intro+exact', name: 'hld-const-atom',
      claim: '(Π ((n Nat)) Atom)',
      tactics: ['intro n', "exact 'hello"] },
    { section: 'intro+exact', name: 'hld-deep-intro',
      claim: '(Π ((a Nat) (b Nat) (c Nat) (d Nat)) Nat)',
      tactics: ['intro a', 'intro b', 'intro c', 'intro d', 'exact a'] },
  );

  // ── Section: split-Pair ──
  theorems.push(
    { section: 'split-Pair', name: 'hld-pair-nat-nat',
      claim: '(Σ ((x Nat)) Nat)',
      tactics: ['split-Pair', 'exact 0', 'exact 0'] },
    { section: 'split-Pair', name: 'hld-pair-nat-nat-2',
      claim: '(Σ ((x Nat)) Nat)',
      tactics: ['split-Pair', 'exact 42', 'exact 7'] },
    { section: 'split-Pair', name: 'hld-pair-atom-atom',
      claim: '(Σ ((x Atom)) Atom)',
      tactics: ['split-Pair', "exact 'hello", "exact 'world"] },
    { section: 'split-Pair', name: 'hld-pair-atom-nat',
      claim: '(Σ ((x Atom)) Nat)',
      tactics: ['split-Pair', "exact 'test", 'exact 99'] },
    { section: 'split-Pair', name: 'hld-pair-triv-triv',
      claim: '(Σ ((x Trivial)) Trivial)',
      tactics: ['split-Pair', 'exact sole', 'exact sole'] },
    { section: 'split-Pair', name: 'hld-pair-eq-eq',
      claim: '(Σ ((x (= Nat 0 0))) (= Nat 0 0))',
      tactics: ['split-Pair', 'exact (same 0)', 'exact (same 0)'] },
    { section: 'split-Pair', name: 'hld-pair-eq-nat',
      claim: '(Σ ((x (= Nat 5 5))) Nat)',
      tactics: ['split-Pair', 'exact (same 5)', 'exact 10'] },
    { section: 'split-Pair', name: 'hld-pair-intro',
      claim: '(Π ((n Nat)) (Σ ((x Nat)) Nat))',
      tactics: ['intro n', 'split-Pair', 'exact n', 'exact n'] },
  );

  // ── Section: apply ──
  theorems.push(
    { section: 'apply', name: 'hld-mp-nat',
      claim: '(Π ((f (→ Nat Atom)) (n Nat)) Atom)',
      tactics: ['intro f', 'intro n', 'apply f', 'exact n'] },
    { section: 'apply', name: 'hld-compose-nat',
      claim: '(Π ((f (→ Nat Atom)) (g (→ Atom Trivial)) (n Nat)) Trivial)',
      tactics: ['intro f', 'intro g', 'intro n', 'apply g', 'apply f', 'exact n'] },
    { section: 'apply', name: 'hld-contra',
      claim: '(Π ((f (→ Nat Atom)) (g (→ Atom Absurd)) (n Nat)) Absurd)',
      tactics: ['intro f', 'intro g', 'intro n', 'apply g', 'apply f', 'exact n'] },
    { section: 'apply', name: 'hld-no-contra',
      claim: '(Π ((A U) (p (Σ ((a A)) (→ A Absurd)))) Absurd)',
      tactics: ['intro A', 'intro p', 'apply (cdr p)', 'exact (car p)'] },
    { section: 'apply', name: 'hld-no-contra-nat',
      claim: '(Π ((p (Σ ((a Nat)) (→ Nat Absurd)))) Absurd)',
      tactics: ['intro p', 'apply (cdr p)', 'exact (car p)'] },
    { section: 'apply', name: 'hld-double-apply',
      claim: '(Π ((f (→ Nat Nat)) (n Nat)) Nat)',
      tactics: ['intro f', 'intro n', 'apply f', 'apply f', 'exact n'] },
    { section: 'apply', name: 'hld-triple-apply',
      claim: '(Π ((f (→ Nat Nat)) (n Nat)) Nat)',
      tactics: ['intro f', 'intro n', 'apply f', 'apply f', 'apply f', 'exact n'] },
    { section: 'apply', name: 'hld-mixed-apply',
      claim: '(Π ((f (→ Nat Atom)) (g (→ Atom Nat)) (n Nat)) Nat)',
      tactics: ['intro f', 'intro g', 'intro n', 'apply g', 'apply f', 'exact n'] },
  );

  // ── Section: elim-Absurd ──
  theorems.push(
    { section: 'elim-Absurd', name: 'hld-absurd-nat',
      claim: '(Π ((x Absurd)) Nat)',
      tactics: ['intro prf', 'elim-Absurd prf'] },
    { section: 'elim-Absurd', name: 'hld-absurd-atom',
      claim: '(Π ((x Absurd)) Atom)',
      tactics: ['intro prf', 'elim-Absurd prf'] },
    { section: 'elim-Absurd', name: 'hld-absurd-trivial',
      claim: '(Π ((x Absurd)) Trivial)',
      tactics: ['intro prf', 'elim-Absurd prf'] },
    { section: 'elim-Absurd', name: 'hld-absurd-absurd',
      claim: '(Π ((x Absurd)) Absurd)',
      tactics: ['intro prf', 'elim-Absurd prf'] },
    { section: 'elim-Absurd', name: 'hld-absurd-pair',
      claim: '(Π ((x Absurd)) (Σ ((n Nat)) Nat))',
      tactics: ['intro prf', 'elim-Absurd prf'] },
    { section: 'elim-Absurd', name: 'hld-absurd-either',
      claim: '(Π ((x Absurd)) (Either Nat Atom))',
      tactics: ['intro prf', 'elim-Absurd prf'] },
  );

  // ── Section: elim-Either (generic) ──
  theorems.push(
    { section: 'elim-Either', name: 'hld-either-nat-nat',
      claim: '(Π ((e (Either Nat Nat))) Nat)',
      tactics: ['intro e', 'elim-Either e', 'intro l', 'exact l', 'intro r', 'exact r'] },
    { section: 'elim-Either', name: 'hld-either-swap-gen',
      claim: '(Π ((A U) (B U) (e (Either A B))) (Either B A))',
      tactics: ['intro A', 'intro B', 'intro e', 'elim-Either e',
        'intro l', 'go-Right', 'exact l', 'intro r', 'go-Left', 'exact r'] },
    { section: 'elim-Either', name: 'hld-either-to-triv',
      claim: '(Π ((e (Either Nat Atom))) Trivial)',
      tactics: ['intro e', 'elim-Either e', 'intro l', 'exact sole', 'intro r', 'exact sole'] },
    { section: 'elim-Either', name: 'hld-either-left-inject',
      claim: '(Π ((A U) (B U) (a A)) (Either A B))',
      tactics: ['intro A', 'intro B', 'intro a', 'go-Left', 'exact a'] },
    { section: 'elim-Either', name: 'hld-either-right-inject',
      claim: '(Π ((A U) (B U) (b B)) (Either A B))',
      tactics: ['intro A', 'intro B', 'intro b', 'go-Right', 'exact b'] },
    // Triple case (nested Either)
    { section: 'elim-Either', name: 'hld-triple-case',
      claim: '(Π ((e (Either Nat (Either Atom Trivial)))) Nat)',
      tactics: ['intro e', 'elim-Either e', 'intro l', 'exact l',
        'intro r', 'elim-Either r', 'intro rl', 'exact 0', 'intro rr', 'exact 1'] },
  );

  return { name: 'Generic', preamble: '', theorems };
}

function buildListGroup(): TheoremGroup {
  const theorems: HoldoutTheorem[] = [];

  // ── Section: elim-List ──
  theorems.push(
    { section: 'elim-List', name: 'hld-list-const-zero',
      claim: '(Π ((xs (List Nat))) Nat)',
      tactics: ['intro xs', 'elim-List xs', 'exact 0',
        'intro x', 'intro rest', 'intro ih', 'exact 0'] },
    { section: 'elim-List', name: 'hld-list-head-or-zero',
      claim: '(Π ((xs (List Nat))) Nat)',
      tactics: ['intro xs', 'elim-List xs', 'exact 0',
        'intro x', 'intro rest', 'intro ih', 'exact x'] },
    { section: 'elim-List', name: 'hld-list-count',
      claim: '(Π ((E U) (xs (List E))) Nat)',
      tactics: ['intro E', 'intro xs', 'elim-List xs', 'exact 0',
        'intro x', 'intro rest', 'intro ih', 'exact (add1 ih)'] },
    { section: 'elim-List', name: 'hld-list-sum',
      claim: '(Π ((xs (List Nat))) Nat)',
      tactics: ['intro xs', 'elim-List xs', 'exact 0',
        'intro x', 'intro rest', 'intro ih', 'exact (+ x ih)'] },
    { section: 'elim-List', name: 'hld-list-double-count',
      claim: '(Π ((xs (List Nat))) Nat)',
      tactics: ['intro xs', 'elim-List xs', 'exact 0',
        'intro x', 'intro rest', 'intro ih', 'exact (add1 (add1 ih))'] },
  );

  return { name: 'List', preamble: preambleList, theorems };
}

// ── Extract proof steps ──────────────────────────────────────────────────────

function extractSteps(theorem: HoldoutTheorem, baseCtx: Context): StepRecord[] {
  const steps: StepRecord[] = [];
  const proofManager = new ProofManager();

  const startResult = proofManager.startProof(theorem.name, baseCtx, 'holdout-eval');
  if (startResult instanceof stop) {
    console.error(`  FAIL ${theorem.name}: cannot start proof: ${startResult.message}`);
    return [];
  }

  for (let i = 0; i < theorem.tactics.length; i++) {
    const tacticStr = theorem.tactics[i];

    if (!proofManager.currentState || proofManager.currentState.isComplete()) {
      break;
    }

    const goalResult = proofManager.currentState.getCurrentGoal();
    if (!(goalResult instanceof go)) {
      console.error(`  FAIL ${theorem.name}: no current goal at step ${i}`);
      break;
    }

    const goal = goalResult.result;

    const globalContext: { name: string; type: string }[] = [];
    const localContext: { name: string; type: string }[] = [];

    for (const [name, binder] of goal.context.entries()) {
      if (name.startsWith('_')) continue;
      const typeCore = binder.type.readBackType(goal.context);
      const typeStr = sugarType(typeCore, goal.context);
      const entry = { name, type: typeStr };
      if (binder instanceof Define) {
        globalContext.push(entry);
      } else if (binder instanceof Free) {
        localContext.push(entry);
      }
    }

    const goalCore = goal.type.readBackType(goal.context);
    const goalStr = sugarType(goalCore, goal.context);

    steps.push({
      theoremName: theorem.name,
      section: theorem.section,
      stepIndex: i,
      goal: goalStr,
      globalContext,
      localContext,
      goldTactic: tacticStr,
    });

    // Apply the gold tactic
    const wrapped = tacticStr.trim().startsWith('(') ? tacticStr : `(${tacticStr})`;
    const parsed = schemeParse(wrapped);
    const tactic: Tactic = Parser.parseToTactics(parsed[0]);
    const result = proofManager.applyTactic(tactic);
    if (result instanceof stop) {
      console.error(`  FAIL ${theorem.name}: tactic "${tacticStr}" failed at step ${i}: ${result.message}`);
      break;
    }
  }

  return steps;
}

// ── Query the LoRA server ────────────────────────────────────────────────────

async function predict(step: StepRecord): Promise<string> {
  const resp = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal: step.goal,
      globalContext: step.globalContext,
      localContext: step.localContext,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Server error ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json() as { tactic: string };
  return data.tactic;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

const TACTIC_CATEGORIES: Record<string, string> = {
  'intro': 'introduction', 'exact': 'introduction',
  'exists': 'constructor', 'split-Pair': 'constructor',
  'go-Left': 'constructor', 'go-Right': 'constructor',
  'elim-Nat': 'elimination', 'elim-Either': 'elimination',
  'elim-List': 'elimination', 'elim-Vec': 'elimination',
  'elim-Equal': 'elimination', 'elim-Absurd': 'elimination',
  'apply': 'application',
};

function tacticHead(t: string): string {
  return t.trim().split(/\s+/)[0] || '';
}

function tacticCategory(t: string): string {
  return TACTIC_CATEGORIES[tacticHead(t)] ?? 'unknown';
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  const extractOnly = process.argv.includes('--extract-only');

  // Build all theorem groups
  const groups: TheoremGroup[] = [
    buildEvenOddGroup(),
    buildArithGroup(),
    buildBoolGroup(),
    buildGenericGroup(),
    buildListGroup(),
  ];

  const totalTheorems = groups.reduce((s, g) => s + g.theorems.length, 0);
  console.log(`Built ${totalTheorems} holdout theorems across ${groups.length} groups\n`);

  // Extract proof steps for all groups
  console.log('Extracting proof steps...');
  const allSteps: StepRecord[] = [];
  let errors = 0;

  for (const group of groups) {
    // Build claim declarations
    const claimDecls = group.theorems.map(t => `(claim ${t.name} ${t.claim})`);
    const fullSource = group.preamble + '\n' + claimDecls.join('\n');

    let ctx: Context;
    try {
      const result = evaluatePieAndGetContext(fullSource);
      ctx = result.context;
    } catch (e: any) {
      console.error(`  ERROR evaluating preamble for group "${group.name}": ${e.message}`);
      errors += group.theorems.length;
      continue;
    }

    for (const thm of group.theorems) {
      const steps = extractSteps(thm, ctx);
      if (steps.length === 0) {
        errors++;
        continue;
      }
      if (steps.length !== thm.tactics.length) {
        console.error(`  WARN ${thm.name}: extracted ${steps.length}/${thm.tactics.length} steps`);
      }
      allSteps.push(...steps);
    }
    console.log(`  ${group.name}: ${group.theorems.length} theorems`);
  }

  console.log(`\nTotal steps extracted: ${allSteps.length} (${errors} theorem errors)\n`);

  if (extractOnly) {
    console.log('--extract-only mode: skipping server predictions.');
    // Show section distribution
    const sectionCounts = new Map<string, number>();
    for (const s of allSteps) {
      sectionCounts.set(s.section, (sectionCounts.get(s.section) || 0) + 1);
    }
    console.log('Section distribution:');
    for (const [sec, count] of [...sectionCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${sec.padEnd(24)} ${count} steps`);
    }
    // Tactic distribution
    const tacCounts = new Map<string, number>();
    for (const s of allSteps) {
      const h = tacticHead(s.goldTactic);
      tacCounts.set(h, (tacCounts.get(h) || 0) + 1);
    }
    console.log('\nTactic distribution:');
    for (const [tac, count] of [...tacCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${tac.padEnd(16)} ${count} steps`);
    }
    return;
  }

  // Check server health
  try {
    const health = await fetch('http://localhost:8000/health');
    if (!health.ok) throw new Error(`status ${health.status}`);
    const hdata = await health.json() as { status: string; model: string };
    console.log(`Server: ${hdata.model} (${hdata.status})\n`);
  } catch (e: any) {
    console.error(`ERROR: Cannot reach LoRA server at localhost:8000`);
    console.error(`  Start it with: ./training/launch.sh`);
    console.error(`  ${e.message}`);
    process.exit(1);
  }

  // Run predictions
  console.log('Running predictions...\n');
  const t0 = Date.now();

  for (let i = 0; i < allSteps.length; i++) {
    const step = allSteps[i];
    try {
      step.predicted = await predict(step);
    } catch (e: any) {
      step.predicted = `ERROR: ${e.message}`;
    }
    step.exactMatch = step.predicted === step.goldTactic;
    step.headMatch = tacticHead(step.predicted ?? '') === tacticHead(step.goldTactic);
    step.categoryMatch = tacticCategory(step.predicted ?? '') === tacticCategory(step.goldTactic);

    const status = step.exactMatch ? 'OK' : (step.headMatch ? ' ~' : ' X');
    if (verbose) {
      console.log(`  [${i + 1}/${allSteps.length}] [${status}] ${step.theoremName} step ${step.stepIndex}`);
      console.log(`    goal: ${step.goal}`);
      console.log(`    gold: ${step.goldTactic}`);
      console.log(`    pred: ${step.predicted}`);
    } else {
      console.log(`  [${i + 1}/${allSteps.length}] [${status}] gold=${step.goldTactic}  pred=${step.predicted}`);
    }
  }

  const elapsed = (Date.now() - t0) / 1000;

  // ── Aggregate results ──
  const total = allSteps.length;
  const exact = allSteps.filter(s => s.exactMatch).length;
  const head = allSteps.filter(s => s.headMatch).length;
  const cat = allSteps.filter(s => s.categoryMatch).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Holdout Evaluation Results`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\n-- Step-level accuracy --`);
  console.log(`  Total steps:  ${total}`);
  console.log(`  Exact-match:  ${exact}/${total} (${(exact / total * 100).toFixed(1)}%)`);
  console.log(`  Tactic-head:  ${head}/${total} (${(head / total * 100).toFixed(1)}%)`);
  console.log(`  Category:     ${cat}/${total} (${(cat / total * 100).toFixed(1)}%)`);

  // Per-section
  console.log(`\n-- Per-section breakdown --`);
  const sections = [...new Set(allSteps.map(s => s.section))];
  for (const sec of sections) {
    const ss = allSteps.filter(s => s.section === sec);
    const se = ss.filter(s => s.exactMatch).length;
    const sh = ss.filter(s => s.headMatch).length;
    console.log(`  ${sec.padEnd(24)} n=${String(ss.length).padStart(3)}  exact=${(se / ss.length * 100).toFixed(1).padStart(5)}%  head=${(sh / ss.length * 100).toFixed(1).padStart(5)}%`);
  }

  // Per-theorem completion
  console.log(`\n-- Per-theorem completion (all steps exact) --`);
  const theoremNames = [...new Set(allSteps.map(s => s.theoremName))];
  let proofsCompleted = 0;
  let proofsFailed = 0;
  for (const name of theoremNames) {
    const ts = allSteps.filter(s => s.theoremName === name);
    const allCorrect = ts.every(s => s.exactMatch);
    if (allCorrect) proofsCompleted++;
    else proofsFailed++;
    if (verbose || !allCorrect) {
      const correctCount = ts.filter(s => s.exactMatch).length;
      const status = allCorrect ? 'OK  ' : 'FAIL';
      console.log(`  [${status}] ${name.padEnd(36)} ${correctCount}/${ts.length} steps`);
    }
  }
  console.log(`\n  Proofs completed: ${proofsCompleted}/${theoremNames.length} (${(proofsCompleted / theoremNames.length * 100).toFixed(1)}%)`);

  // Per-tactic breakdown
  console.log(`\n-- Per-tactic breakdown --`);
  const perTactic = new Map<string, { total: number; exact: number; head: number }>();
  for (const step of allSteps) {
    const h = tacticHead(step.goldTactic);
    if (!perTactic.has(h)) perTactic.set(h, { total: 0, exact: 0, head: 0 });
    const t = perTactic.get(h)!;
    t.total++;
    if (step.exactMatch) t.exact++;
    if (step.headMatch) t.head++;
  }
  for (const [tac, s] of [...perTactic.entries()].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${tac.padEnd(16)} n=${String(s.total).padStart(3)}  exact=${(s.exact / s.total * 100).toFixed(1).padStart(5)}%  head=${(s.head / s.total * 100).toFixed(1).padStart(5)}%`);
  }

  // Failures summary (first 30)
  const failures = allSteps.filter(s => !s.exactMatch);
  if (failures.length > 0) {
    const showN = Math.min(30, failures.length);
    console.log(`\n-- Failures (showing ${showN}/${failures.length}) --`);
    for (const f of failures.slice(0, showN)) {
      console.log(`  ${f.theoremName} step ${f.stepIndex}: gold="${f.goldTactic}" pred="${f.predicted}"`);
    }
  }

  console.log(`\n  Time: ${elapsed.toFixed(1)}s (${(elapsed / total).toFixed(2)}s/step)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
