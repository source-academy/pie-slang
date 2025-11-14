# Pie Code Examples

Real working examples extracted from the test suite.

---

## Basic Types

### Nat Examples
```
zero
(add1 zero)
(add1 (add1 zero))
1
2
3
```

### Atom Examples
```
'foo
'bar
'pea
'olive
'oil
```

### Trivial Example
```
sole
```

---

## Function Examples

### Identity Function
```
(the (→ Nat Nat)
  (λ (x) x))
```

### Constant Function
```
(the (→ Nat Nat)
  (λ (x) zero))
```

### Two-Argument Function
```
(the (→ (→ Nat Nat) Nat Nat)
  (λ (f x) (f x)))
```

### Addition Using ind-Nat
```
(the (→ Nat Nat Nat)
  (λ (x y)
    (ind-Nat x
      (λ (k) Nat)
      y
      (λ (n-1 ih) (add1 ih)))))
```

### Addition Using iter-Nat
```
(the (→ Nat Nat Nat)
  (λ (x y)
    (iter-Nat x
      y
      (λ (prev) (add1 prev)))))
```

---

## Pair Examples

### Simple Pair
```
(the (Pair Atom Atom)
  (cons 'olive 'oil))
```

### Pair Projections
```
(car (the (Pair Atom Atom) (cons 'olive 'oil)))  ; Returns 'olive
(cdr (the (Pair Atom Atom) (cons 'olive 'oil)))  ; Returns 'oil
```

### Function with Pair
```
(the (→ Trivial (Pair Trivial Trivial))
  (λ (x) (cons x x)))
```

### Nested Pairs
```
(the (Pair Nat (Pair Atom Trivial))
  (cons zero (cons 'foo sole)))
```

---

## List Examples

### Empty List
```
(the (List Nat) nil)
```

### Single Element
```
(:: (add1 zero)
  (the (List Nat) nil))
```

### Multiple Elements
```
(:: (add1 (add1 (add1 zero)))
  (:: (add1 (add1 zero))
    (the (List Nat) nil)))
```

### List Recursion - Sum
```
(the (→ (List Nat) Nat)
  (λ (ns)
    (ind-List ns
      (λ (_) Nat)
      zero
      (λ (x y z)
        (ind-Nat x
          (λ (n) Nat)
          z
          (λ (_ q) (add1 q)))))))
```

---

## Vec Examples

### Empty Vector
```
(the (Vec Nat zero) vecnil)
```

### Vector Length 1
```
(vec:: zero (the (Vec Nat zero) vecnil))
```

### Vector Length 3
```
(vec:: zero
  (vec:: (add1 zero)
    (vec:: (add1 (add1 zero))
      (the (Vec Nat zero) vecnil))))
```

### First of Vector
```
(claim first
  (Π ((E U) (l Nat))
    (→ (Vec E (add1 l)) E)))

(define first
  (λ (E l es) (head es)))
```

### Rest of Vector
```
(claim rest
  (Π ((E U) (l Nat))
    (→ (Vec E (add1 l)) (Vec E l))))

(define rest
  (λ (E l es) (tail es)))
```

### Build Vector Using ind-Nat
```
(claim peas
  (Π ((how-many-peas Nat))
    (Vec Atom how-many-peas)))

(define peas
  (λ (how-many-peas)
    (ind-Nat how-many-peas
      (λ (k) (Vec Atom k))
      (the (Vec Atom zero) vecnil)
      (λ (l-1 peas-l-1)
        (vec:: 'pea peas-l-1)))))
```

---

## Either Examples

### Left Injection
```
(left zero)          ; Type: (Either Nat Atom)
```

### Right Injection
```
(right 'foo)         ; Type: (Either Nat Atom)
```

### Case Analysis
```
(λ (e)
  (ind-Either e
    (λ (_) Nat)
    (λ (n) n)
    (λ (a) zero)))
```

---

## Equality Examples

### Reflexivity
```
(the (= Nat zero zero)
  (same zero))
```

### Symmetry with replace
```
(the (Π ((n Nat) (m Nat))
       (→ (= Nat n m)
          (= Nat m n)))
  (λ (n m n=m)
    (replace n=m
      (λ (k) (= Nat k n))
      (same n))))
```

### Using replace
```
(replace (the (= Nat 4 4) (same 4))
  (λ (k) (= Nat k 4))
  (same 4))
```

### Congruence with ind-=
```
(λ (n-1 incr=add1n-1)
  (ind-= incr=add1n-1
    (λ (x proof-incr-n-1=x)
      (= Nat (add1 (incr n-1)) (add1 x)))
    (same (add1 (incr n-1)))))
```

---

## Dependent Type Examples

### Pi Type (Dependent Function)
```
(the (Π ((A U)) U)
  (λ (B) B))
```

### Multiple Dependent Parameters
```
(the (Π ((A U) (a A)) A)
  (λ (B b) b))
```

### Complex Dependent Function with Pair
```
(the (Π ((f (→ Nat U))
         (p (Σ ((n Nat)) (f n))))
       (f (car p)))
  (λ (f p) (cdr p)))
```

---

## User-Defined Inductive Types

### Bool Definition
```
(data Bool () ()
  (true () (Bool))
  (false () (Bool))
  ind-Bool)
```

### Bool Usage
```
(true)
(false)

(ind-Bool (true)
  (λ (b) Nat)
  (add1 zero)
  zero)
```

### Less-Than Definition (Indexed Type)
```
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)
```

### Less-Than Usage
```
(claim proof-0<1 (Less-Than zero (add1 zero)))
(define proof-0<1 (zero-smallest zero))

(claim proof-1<2 (Less-Than (add1 zero) (add1 (add1 zero))))
(define proof-1<2
  (add1-smaller zero (add1 zero)
    (zero-smallest zero)))

(ind-Less-Than proof-0<1
  (λ (j k p) Nat)
  (λ (n) zero)
  (λ (j k j<k ih) (add1 ih)))
```

---

## Complete Programs

### Addition Function
```
(claim +
  (→ Nat Nat Nat))

(claim step-plus
  (→ Nat Nat))

(define step-plus
  (λ (n-1) (add1 n-1)))

(define +
  (λ (n j)
    (iter-Nat n j step-plus)))
```

### Increment Function
```
(claim incr
  (→ Nat Nat))

(define incr
  (λ (n)
    (iter-Nat n 1 (+ 1))))
```

### Proof: incr n = add1 n
```
(claim incr=add1
  (Π ((n Nat))
    (= Nat (incr n) (add1 n))))

(claim base-incr=add1
  (= Nat (incr zero) (add1 zero)))

(define base-incr=add1
  (same (add1 zero)))

(claim step-incr=add1
  (Π ((n-1 Nat))
    (→ (= Nat (incr n-1) (add1 n-1))
       (= Nat (add1 (incr n-1)) (add1 (add1 n-1))))))

(define step-incr=add1
  (λ (n-1 incr=add1n-1)
    (ind-= incr=add1n-1
      (λ (x proof-incr-n-1=x)
        (= Nat (add1 (incr n-1)) (add1 x)))
      (same (add1 (incr n-1))))))
```

---

## Key Observations from Examples

1. **Empty collections always need `(the Type value)`**:
   - `(the (List Nat) nil)` not `nil`
   - `(the (Vec Atom zero) vecnil)` not `vecnil`

2. **User-defined constructors/eliminators get `` prefix**:
   - `(true)` not `(true)`
   - `(ind-Bool ...)` not `(ind-Bool ...)`

3. **Numeric literals are shorthand**:
   - `0` = `zero`
   - `1` = `(add1 zero)`
   - `2` = `(add1 (add1 zero))`

4. **Lambda can take multiple arguments**:
   - `(λ (x y) body)` is curried as `(λ (x) (λ (y) body))`

5. **Eliminators have fixed structure**:
   - `ind-Nat`: target, motive, base, step
   - `ind-List`: target, motive, base, step
   - `ind-Vec`: length, target, motive, base, step
   - `ind-Either`: target, motive, left-case, right-case
   - `ind-=`: proof, motive, base
