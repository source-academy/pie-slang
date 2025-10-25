# Pie Language Specification

Pie is a dependently-typed programming language based on "The Little Typer" book. This document describes the syntax and semantics for generating valid Pie expressions.

## Basic Syntax

### Numbers (Literals)
- Numeric literals: `0`, `1`, `2`, `3`, `4`, `5`, etc. are shorthand for Nat constructors
- `0` is equivalent to `zero`
- `1` is equivalent to `(add1 zero)`
- `2` is equivalent to `(add1 (add1 zero))`

### Variables
- Variable names: alphanumeric identifiers, can include hyphens: `x`, `my-var`, `n-1`, `vec-length`
- Variables are introduced by lambda parameters, Pi parameters, or definitions

### Type Annotations
When explicit type annotation is needed, use `(the Type value)`:
```
(the Nat zero)
(the Atom 'foo)
(the (List Nat) nil)
```

## Core Types

### Nat (Natural Numbers)
- The type of natural numbers
- Syntax: `Nat`

### Atom
- The type of quoted symbols
- Syntax: `Atom`

### Trivial
- The unit type with only one value
- Syntax: `Trivial`

### Absurd
- The empty type with no values
- Syntax: `Absurd`

### U (Universe)
- The type of types
- Syntax: `U`

### → (Arrow/Function Type)
Non-dependent function type shorthand:
```
(-> A B)           ; A → B
(-> A B C)         ; A → B → C (curried)
```

### Π (Pi Type)
Dependent function type with explicit parameter names:
```
(Π ((x A)) B)                    ; Π(x:A). B
(Π ((x A) (y B)) C)             ; Π(x:A)(y:B). C
```

### Pair (Sigma Type)
Non-dependent pair type shorthand:
```
(Pair A D)         ; Σ(a:A). D
```

### Σ (Sigma Type)
Dependent pair type with explicit parameter names:
```
(Σ ((x A)) B)                    ; Σ(x:A). B
(Σ ((x A) (y B)) C)             ; Σ(x:A)(y:B). C
```

### List
Polymorphic list type:
```
(List A)           ; List of elements of type A
```

### Vec
Length-indexed vector type:
```
(Vec E n)          ; Vector of elements of type E with length n (where n is a Nat)
```

### Either
Sum type (disjoint union):
```
(Either L R)       ; Either left (type L) or right (type R)
```

### = (Equality Type)
Propositional equality:
```
(= T from to)      ; Proof that from equals to, both of type T
```

## Constructors

### Nat Constructors
- `zero`: The number 0
- `(add1 n)`: The successor of n

### Atom Constructors
- `'symbol`: A quoted symbol, e.g., `'foo`, `'bar`, `'pea`, `'olive`

### Trivial Constructor
- `sole`: The only value of type Trivial

### Pair/Sigma Constructors
- `(cons a d)`: Construct a pair with car `a` and cdr `d`

### List Constructors
- `nil`: Empty list (requires type annotation: `(the (List T) nil)`)
- `(:: head tail)`: Cons cell with head and tail

### Vec Constructors
- `vecnil`: Empty vector (requires type annotation: `(the (Vec E zero) vecnil)`)
- `(vec:: head tail)`: Vector cons with head element and tail vector

### Either Constructors
- `(left x)`: Left injection into Either type
- `(right y)`: Right injection into Either type

### Equality Constructor
- `same`: Reflexivity proof for equality (when both sides are definitionally equal)
- `(same x)`: Explicit reflexivity proof at value x

### Function Constructor
- `(λ (x) body)`: Lambda function (can also write as `lambda`)
- `(λ (x y) body)`: Multi-parameter lambda (curried: `(λ (x) (λ (y) body))`)

## Eliminators

### Nat Eliminators
- `(ind-Nat target motive base step)`: Induction on natural numbers
  - `target`: The Nat being analyzed
  - `motive`: `(λ (k) T)` - function from Nat to type
  - `base`: Value for zero case
  - `step`: `(λ (n-1 ih) ...)` - function taking predecessor and inductive hypothesis

- `(rec-Nat target base step)`: Recursion (simpler than ind-Nat)
  - Similar to ind-Nat but motive is implicit (always returns same type)

- `(iter-Nat target base step)`: Iteration (simplest)
  - `step`: `(λ (x) ...)` - function taking only result of previous iteration

- `(which-Nat target base step)`: Case analysis (if zero then base, else step)
  - `step`: `(λ (n-1) ...)` - function taking predecessor only

### List Eliminators
- `(ind-List target motive base step)`: Induction on lists
  - `target`: The list being analyzed
  - `motive`: `(λ (xs) T)` - function from list to type
  - `base`: Value for nil case
  - `step`: `(λ (head tail ih) ...)` - head, tail, and inductive hypothesis

- `(rec-List target base step)`: Recursion on lists
  - Similar structure to ind-List

### Vec Eliminators
- `(ind-Vec length target motive base step)`: Induction on vectors
  - `length`: The length (Nat) of the vector
  - `target`: The vector being analyzed
  - `motive`: Function taking length and vector to type
  - `base`: Value for vecnil case
  - `step`: Function for vec:: case

- `head`: Get first element of non-empty vector
- `tail`: Get rest of non-empty vector (one element shorter)

### Pair/Sigma Eliminators
- `(car p)`: First projection (get first element of pair)
- `(cdr p)`: Second projection (get second element of pair)

### Either Eliminators
- `(ind-Either target motive on-left on-right)`: Case analysis on Either
  - `target`: The Either value
  - `motive`: `(λ (e) T)` - function from Either to type
  - `on-left`: `(λ (x) ...)` - handler for left case
  - `on-right`: `(λ (y) ...)` - handler for right case

### Absurd Eliminator
- `(ind-Absurd target motive)`: Ex falso quodlibet (from false, anything follows)

### Equality Eliminators
- `(replace proof motive base)`: Use equality proof to convert types
  - `proof`: A proof of `(= T from to)`
  - `motive`: `(λ (x) T)` - how the type depends on the value
  - `base`: Value of type `(motive from)`, returns value of type `(motive to)`

## Function Application
- `(f x)`: Apply function f to argument x
- `(f x y)`: Apply f to x and y (curried: `((f x) y)`)

## Top-Level Definitions
- `(claim name type)`: Declare a name with a type
- `(define name value)`: Define the value for a previously claimed name
- `(define-tactically name tactics)`: Define using tactics (for proof mode)

## Comments
Lines can be omitted or preceded with `;` for comments (though not used in generation).

## Key Rules

1. **Empty collections need type annotations**: `(the (List Nat) nil)`, `(the (Vec Atom zero) vecnil)`
2. **Variables must be in scope**: Use only variables from the context or introduced by lambdas
3. **Type consistency**: The generated expression must match the expected type
4. **Constructor arity**: Each constructor takes a specific number of arguments
5. **Eliminator structure**: Eliminators have fixed parameter patterns (target, motive, cases)
