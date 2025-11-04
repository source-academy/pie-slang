# Pie Type Reference

Quick reference for all Pie types with their constructors and eliminators.

## Summary Table

| Type | Constructors | Eliminators | Notes |
|------|--------------|-------------|-------|
| Nat | `zero`, `(add1 n)` | `ind-Nat`, `rec-Nat`, `iter-Nat`, `which-Nat` | Natural numbers |
| Atom | `'symbol` | None (atoms are compared by name) | Quoted symbols |
| Trivial | `sole` | None (only one value) | Unit type |
| Absurd | None | `ind-Absurd` | Empty type |
| U | Type expressions | None | Universe of types |
| → | `(λ (x) body)` | Application `(f x)` | Non-dependent function |
| Π | `(λ (x) body)` | Application `(f x)` | Dependent function |
| Pair/Σ | `(cons a d)` | `car`, `cdr` | Pairs/dependent pairs |
| List | `nil`, `(:: h t)` | `ind-List`, `rec-List` | Polymorphic lists |
| Vec | `vecnil`, `(vec:: h t)` | `ind-Vec`, `head`, `tail` | Length-indexed vectors |
| Either | `(left x)`, `(right y)` | `ind-Either` | Sum type |
| = | `same`, `(same x)` | `replace`, `ind-=` | Equality proofs |
| **User-defined** | Defined by `data` | Generated eliminator | Custom inductive types |

---

## Nat (Natural Numbers)

**Type syntax:** `Nat`

### Constructors
```
zero                    ; 0
(add1 n)               ; n + 1

; Shorthand: numeric literals
0    ≡ zero
1    ≡ (add1 zero)
2    ≡ (add1 (add1 zero))
```

### Eliminators

#### ind-Nat (Induction)
Most powerful, allows dependent motives:
```
(ind-Nat target motive base step)

target : Nat                           ; The number to analyze
motive : (→ Nat U)                    ; (λ (k) TypeDependingOnK)
base   : (motive zero)                ; Value for zero case
step   : (Π ((n-1 Nat))              ; (λ (n-1 ih) ...)
          (→ (motive n-1)
              (motive (add1 n-1))))
```

**Example - Addition:**
```
(λ (x y)
  (ind-Nat x
    (λ (k) Nat)
    y
    (λ (n-1 ih) (add1 ih))))
```

#### rec-Nat (Recursion)
Similar to ind-Nat but simpler (non-dependent result type):
```
(rec-Nat target base step)

target : Nat
base   : T                            ; Value for zero case
step   : (→ Nat T T)                 ; (λ (n-1 ih) ...)
```

**Example - Addition:**
```
(λ (x y)
  (rec-Nat x
    y
    (λ (n-1 ih) (add1 ih))))
```

#### iter-Nat (Iteration)
Simplest, step only gets previous result:
```
(iter-Nat target base step)

target : Nat
base   : T
step   : (→ T T)                      ; (λ (prev) ...)
```

**Example - Add constant:**
```
(iter-Nat 3
  5
  (λ (prev) (add1 prev)))   ; Result: 8
```

#### which-Nat (Case analysis)
Check if zero or successor:
```
(which-Nat target base step)

target : Nat
base   : T                            ; If target is zero
step   : (→ Nat T)                   ; (λ (n-1) ...) if target is (add1 n-1)
```

---

## Atom

**Type syntax:** `Atom`

### Constructors
```
'symbol              ; Examples: 'foo, 'bar, 'pea, 'olive, 'oil
```

### Eliminators
None directly. Atoms are primitive values.

---

## Trivial (Unit Type)

**Type syntax:** `Trivial`

### Constructors
```
sole                 ; The only value of type Trivial
```

### Eliminators
None needed (only one possible value).

---

## Absurd (Empty Type)

**Type syntax:** `Absurd`

### Constructors
None (uninhabited type).

### Eliminators

#### ind-Absurd
From contradiction, derive anything:
```
(ind-Absurd target motive)

target : Absurd                       ; The impossible value
motive : U                           ; Any type you want to prove
```

---

## U (Universe)

**Type syntax:** `U`

The type of types. Type expressions evaluate to values of type U.

**Examples:**
```
Nat : U
Atom : U
(→ Nat Nat) : U
(List Atom) : U
```

---

## → (Function Type / Pi with non-dependent result)

**Type syntax:**
```
(→ A B)              ; A → B
(→ A B C)            ; A → B → C (curried)
```

### Constructors
```
(λ (x) body)                         ; Lambda abstraction
(λ (x y) body)                       ; Multi-argument (curried)
```

### Eliminators
```
(f x)                                ; Function application
```

**Example:**
```
(the (→ Nat Nat)
  (λ (x) x))                         ; Identity function
```

---

## Π (Dependent Function Type / Pi Type)

**Type syntax:**
```
(Π ((x A)) B)                        ; Π(x:A). B where B can depend on x
(Π ((x A) (y B)) C)                 ; Multiple dependent parameters
```

### Constructors
```
(λ (x) body)                         ; Lambda (same as →)
```

### Eliminators
```
(f x)                                ; Application (same as →)
```

**Example:**
```
(the (Π ((n Nat)) (Vec Atom n))
  (λ (n) (peas n)))                 ; Returns vector of length n
```

---

## Pair (Non-dependent Pair) / Σ (Dependent Pair / Sigma Type)

**Type syntax:**
```
(Pair A D)                           ; Σ(a:A). D (non-dependent)
(Σ ((x A)) B)                        ; Σ(x:A). B where B can depend on x
(Σ ((x A) (y B)) C)                 ; Multiple dependent fields
```

### Constructors
```
(cons a d)                           ; Construct pair with car=a, cdr=d
```

### Eliminators
```
(car p)                              ; First projection
(cdr p)                              ; Second projection
```

**Examples:**
```
; Non-dependent pair
(the (Pair Atom Atom)
  (cons 'olive 'oil))

; Dependent pair
(the (Σ ((n Nat)) (Vec Atom n))
  (cons 3 (vec:: 'a (vec:: 'b (vec:: 'c vecnil)))))
```

---

## List (Polymorphic Lists)

**Type syntax:** `(List E)` where E is the element type

### Constructors
```
nil                                  ; Empty list (needs annotation!)
(:: head tail)                       ; Cons cell

; IMPORTANT: nil requires type annotation
(the (List Nat) nil)                 ; Correct
nil                                  ; ERROR!
```

### Eliminators

#### ind-List (Induction)
```
(ind-List target motive base step)

target : (List E)
motive : (→ (List E) U)              ; (λ (xs) TypeDependingOnXs)
base   : (motive nil)                ; Value for nil case
step   : (Π ((head E)                ; (λ (h t ih) ...)
             (tail (List E)))
          (→ (motive tail)
             (motive (:: head tail))))
```

#### rec-List (Recursion)
Similar to ind-List but simpler.

**Example - Sum of list:**
```
(ind-List ns
  (λ (_) Nat)
  zero
  (λ (x y z)
    (ind-Nat x
      (λ (n) Nat)
      z
      (λ (_ q) (add1 q)))))
```

**Example - Build list:**
```
(:: (add1 zero)
  (:: (add1 (add1 zero))
    (the (List Nat) nil)))           ; List [1, 2]
```

---

## Vec (Length-Indexed Vectors)

**Type syntax:** `(Vec E n)` where E is element type, n is length (a Nat)

### Constructors
```
vecnil                               ; Empty vector (needs annotation!)
(vec:: head tail)                    ; Vector cons

; IMPORTANT: vecnil requires type annotation
(the (Vec Nat zero) vecnil)          ; Correct
vecnil                               ; ERROR!
```

### Eliminators

#### ind-Vec (Induction)
```
(ind-Vec length target motive base step)

length : Nat                         ; Length of the vector
target : (Vec E length)             ; The vector
motive : (Π ((k Nat))               ; Type depends on length and vector
          (→ (Vec E k) U))
base   : (motive zero vecnil)       ; Value for vecnil case
step   : (Π ((len Nat)              ; (λ (len e es ih) ...)
             (e E)
             (es (Vec E len)))
          (→ (motive len es)
             (motive (add1 len) (vec:: e es))))
```

#### head
```
(head v)                             ; Get first element (v must be non-empty)
; Type: (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) E))
```

#### tail
```
(tail v)                             ; Get rest of vector (one shorter)
; Type: (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) (Vec E n)))
```

**Example - Build vector of length 3:**
```
(vec:: zero
  (vec:: (add1 zero)
    (vec:: (add1 (add1 zero))
      (the (Vec Nat zero) vecnil))))  ; Vec [0, 1, 2] : (Vec Nat 3)
```

---

## Either (Sum Type)

**Type syntax:** `(Either L R)` where L is left type, R is right type

### Constructors
```
(left x)                             ; Inject x into left side
(right y)                            ; Inject y into right side
```

### Eliminators

#### ind-Either (Case analysis)
```
(ind-Either target motive on-left on-right)

target   : (Either L R)
motive   : (→ (Either L R) U)        ; (λ (e) TypeDependingOnE)
on-left  : (Π ((x L)) (motive (left x)))   ; (λ (x) ...)
on-right : (Π ((y R)) (motive (right y)))  ; (λ (y) ...)
```

**Example - Swap Either:**
```
(λ (e)
  (ind-Either e
    (λ (_) (Either Atom Nat))
    (λ (x) (right x))                ; Swap: Nat goes right
    (λ (y) (left y))))               ; Swap: Atom goes left
```

**Example - Simple construction:**
```
(left zero)          ; : (Either Nat Atom)
(right 'foo)         ; : (Either Nat Atom)
```

---

## = (Equality Type)

**Type syntax:** `(= T from to)` - proof that `from` equals `to`, both of type `T`

### Constructors
```
same                                 ; Reflexivity (when from ≡ to definitionally)
(same x)                             ; Explicit reflexivity at x
```

### Eliminators

#### replace (Transport across equality)
```
(replace proof motive base)

proof  : (= T from to)              ; Equality proof
motive : (→ T U)                    ; (λ (x) TypeDependingOnX)
base   : (motive from)              ; Value at 'from'
; Returns: (motive to)              ; Value transported to 'to'
```

**Example - Reflexivity proof:**
```
(the (= Nat zero zero)
  (same zero))
```

**Example - Symmetry using replace:**
```
(λ (n m n=m)
  (replace n=m
    (λ (k) (= Nat k n))
    (same n)))                       ; Proves m = n from n = m
```

#### ind-= (Equality induction / J rule)
More powerful eliminator for equality:
```
(ind-= proof motive base)

proof  : (= T from to)              ; Equality proof
motive : (Π ((x T))                 ; Two-argument motive
          (→ (= T from x) U))       ; Depends on x AND proof
base   : (motive from (same from))  ; Base case for reflexivity
; Returns: (motive to proof)        ; Result for actual proof
```

**Example - Congruence for add1:**
```
(λ (n-1 incr=add1n-1)
  (ind-= incr=add1n-1
    (λ (x proof-incr-n-1=x)
      (= Nat (add1 (incr n-1)) (add1 x)))
    (same (add1 (incr n-1)))))
```

**Difference between `replace` and `ind-=`:**
- `replace`: Motive takes one argument `(λ (x) T)`
- `ind-=`: Motive takes two arguments `(λ (x proof) T)` - can use the proof itself!

---

## User-Defined Inductive Types (data)

You can define your own inductive types with parameters and indices.

### Syntax
```
(data TypeName
  (parameters)                       ; Type parameters
  (indices)                          ; Type indices
  (constructor1 (args) result-type)
  (constructor2 (args) result-type)
  ...
  eliminator-name)
```

### Example 1: Simple Bool
```
(data Bool () ()                     ; No parameters, no indices
  (true () (Bool))                   ; Constructor 'true' with no args
  (false () (Bool))                  ; Constructor 'false' with no args
  ind-Bool)                          ; Eliminator name
```

**Using Bool:**
```
; Constructors get prefix data-
(data-true)                          ; : Bool
(data-false)                         ; : Bool

; Eliminator also gets prefix data-
(data-ind-Bool (data-true)
  (lambda (b) Nat)                   ; Motive
  (add1 zero)                        ; Case for true
  zero)                              ; Case for false
```

### Example 2: Indexed Type (Less-Than)
```
(data Less-Than () ((j Nat) (k Nat))  ; Indexed by two Nats
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))        ; 0 < n+1
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))    ; j < k → j+1 < k+1
  ind-Less-Than)
```

**Using Less-Than:**
```
; Constructors
(data-zero-smallest zero)             ; : (Less-Than 0 1)
(data-add1-smaller zero (add1 zero)
  (data-zero-smallest zero))          ; : (Less-Than 1 2)

; Eliminator
(data-ind-Less-Than proof
  (lambda (j k p) Nat)                ; Motive depends on indices and proof
  (lambda (n) zero)                   ; Case for zero-smallest
  (lambda (j k j<k ih) (add1 ih)))    ; Case for add1-smaller
```

### General Constructor Pattern
```
(constructor-name
  ((param1 Type1) (param2 Type2) ... (arg ArgType))
  (TypeName index1 index2 ...))
```

- Constructor names get `data-` prefix when used
- Parameters before the colon
- Result type must be the datatype with indices

### General Eliminator Pattern
```
(data-ind-TypeName target motive method1 method2 ...)

target  : (TypeName idx1 idx2 ...)   ; The value to eliminate
motive  : Depends on indices + target
methodN : One method per constructor
```

Each method gets:
- Constructor's parameters as arguments
- Inductive hypotheses for recursive arguments
- Must return `(motive applied to constructor)`

---

## Type Annotation Reminders

### Always annotate empty collections:
```
✓ (the (List Nat) nil)
✗ nil

✓ (the (Vec Atom zero) vecnil)
✗ vecnil
```

### Sometimes need explicit types:
```
✓ (the Nat zero)
✓ (the Atom 'foo)
✓ (the (= Nat 0 0) (same 0))
```

### User-defined constructors need prefix:
```
✗ (true)                             ; ERROR
✓ (data-true)                        ; Correct

✗ (ind-Bool ...)                     ; ERROR
✓ (data-ind-Bool ...)                ; Correct
```
