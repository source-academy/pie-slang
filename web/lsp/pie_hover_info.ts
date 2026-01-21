// Built-in Pie symbols with hover information
export const PIE_HOVER_INFO = new Map([
  // Natural numbers
  [
    "Nat",
    {
      summary: "Natural numbers",
      details: "The type of natural numbers (0, 1, 2, ...)",
      examples: "(the Nat 5)",
    },
  ],
  [
    "zero",
    {
      summary: "Zero",
      details: "The natural number zero.",
      examples: "(the Nat zero)",
    },
  ],
  [
    "add1",
    {
      summary: "Add one",
      details: "Adds one to a natural number.",
      examples: "(add1 3) ; evaluates to 4",
    },
  ],
  // Nat's elimination forms
  [
    "which-Nat",
    {
      summary: "Case analysis on natural numbers",
      details: "Performs case analysis on a natural number.",
      examples: "(which-Nat n base step)",
    },
  ],
  [
    "iter-Nat",
    {
      summary: "Iteration on natural numbers",
      details: "Performs iteration on a natural number.",
      examples: "(iter-Nat n base step)",
    },
  ],
  [
    "rec-Nat",
    {
      summary: "Recursion on natural numbers",
      details: "Performs recursion on a natural number.",
      examples: "(rec-Nat n base step)",
    },
  ],
  [
    "ind-Nat",
    {
      summary: "Induction on natural numbers",
      details: "Performs induction on a natural number.",
      examples: "(ind-Nat n motive base step)",
    },
  ],

  // Atoms
  [
    "Atom",
    {
      summary: "Atomic values",
      details: "The type of indivisible values (quoted symbols).",
      examples: "(the Atom 'hello)",
    },
  ],
  [
    "quote",
    {
      summary: "Quote an atom",
      details: "Creates an atomic value.",
      examples: "(quote hello) ; same as 'hello",
    },
  ],

  // Lists
  [
    "List",
    {
      summary: "Lists",
      details: "A list type constructor.",
      examples: "(List Nat) ; type of lists of natural numbers",
    },
  ],
  [
    "nil",
    {
      summary: "Empty list",
      details: "The empty list.",
      examples: "(the (List Nat) nil)",
    },
  ],
  [
    "::",
    {
      summary: "List constructor",
      details: "Adds an element to the front of a list.",
      examples: "(:: 1 (:: 2 nil))",
    },
  ],
  [
    "rec-List",
    {
      summary: "Recursion on lists",
      details: "Performs recursion on a list.",
      examples: "(rec-List lst base step)",
    },
  ],
  [
    "ind-List",
    {
      summary: "Induction on lists",
      details: "Performs induction on a list.",
      examples: "(ind-List lst motive base step)" /*  */,
    },
  ],

  // Functions
  [
    "lambda",
    {
      summary: "Lambda expression",
      details: "Creates an anonymous function.",
      examples: "(lambda (x) (add1 x))",
    },
  ],
  [
    "λ",
    {
      summary: "Lambda expression (Unicode)",
      details: "Unicode version of lambda.",
      examples: "(λ (x) (add1 x))",
    },
  ],

  // Types
  [
    "the",
    {
      summary: "Type annotation",
      details: "Asserts that an expression has a particular type.",
      examples: "(the Nat 5)",
    },
  ],
  [
    "->",
    {
      summary: "Function type",
      details: "Non-dependent function type.",
      examples: "(the (-> Nat Nat) (lambda (x) (add1 x)))",
    },
  ],
  [
    "→",
    {
      summary: "Function type (Unicode)",
      details: "Unicode version of ->.",
      examples: "(the (→ Nat Nat) (λ (x) (add1 x)))",
    },
  ],
  [
    "Universe",
    {
      summary: "Type of types",
      details: "The type of types.",
      examples: "(the Universe Nat)",
    },
  ],
  [
    "U",
    {
      summary: "Type of types (short)",
      details: "Short form of Universe.",
      examples: "(the U Nat)",
    },
  ],

  // Dependent types
  [
    "Pi",
    {
      summary: "Dependent function type",
      details: "Creates a dependent function type.",
      examples: "(Pi ((n Nat)) (Vec Nat n))",
    },
  ],
  [
    "Π",
    {
      summary: "Dependent function type (Unicode)",
      details: "Unicode version of Pi.",
      examples: "(Π ((n Nat)) (Vec Nat n))",
    },
  ],
  [
    "Sigma",
    {
      summary: "Dependent pair type",
      details: "Creates a dependent pair type.",
      examples: "(Sigma ((A U)) (List A))",
    },
  ],
  [
    "Σ",
    {
      summary: "Dependent pair type (Unicode)",
      details: "Unicode version of Sigma.",
      examples: "(Σ ((A U)) (List A))",
    },
  ],

  // Pairs
  [
    "Pair",
    {
      summary: "Pair type",
      details: "Type of pairs (non-dependent).",
      examples: "(Pair Nat Atom)",
    },
  ],
  [
    "cons",
    {
      summary: "Pair constructor",
      details: "Creates a pair.",
      examples: "(cons 1 2)",
    },
  ],
  [
    "car",
    {
      summary: "First element of pair",
      details: "Extracts the first element of a pair.",
      examples: "(car (cons 1 2)) ; evaluates to 1",
    },
  ],
  [
    "cdr",
    {
      summary: "Second element of pair",
      details: "Extracts the second element of a pair.",
      examples: "(cdr (cons 1 2)) ; evaluates to 2",
    },
  ],

  // Eithers
  [
    "Either",
    {
      summary: "Either type",
      details: "Type representing a value that can be one of two types.",
      examples: "(Either Nat Atom)",
    },
  ],
  [
    "left",
    {
      summary: "Left constructor for Either",
      details: "Creates a left value of an Either type.",
      examples: "(left 5) ; if Either is (Either Nat Atom)",
    },
  ],
  [
    "right",
    {
      summary: "Right constructor for Either",
      details: "Creates a right value of an Either type.",
      examples: "(right 'hello) ; if Either is (Either Nat Atom)",
    },
  ],
  [
    "ind-Either",
    {
      summary: "Induction on Either type",
      details: "Performs induction on an Either value.",
      examples: "(ind-Either e motive left-case right-case)",
    },
  ],

  // Vectors
  [
    "Vec",
    {
      summary: "Vectors",
      details: "Type of vectors (lists with fixed length).",
      examples: "(Vec Nat 3) ; type of vectors of 3 natural numbers",
    },
  ],
  [
    "vecnil",
    {
      summary: "Empty vector",
      details: "The empty vector.",
      examples: "(the (Vec Nat 0) vecnil)",
    },
  ],
  [
    "vec::",
    {
      summary: "Vector constructor",
      details: "Adds an element to the front of a vector.",
      examples: "(vec:: 1 (vec:: 2 vecnil))",
    },
  ],
  [
    "ind-Vec",
    {
      summary: "Induction on vectors",
      details: "Performs induction on a vector.",
      examples: "(ind-Vec v len motive base step)",
    },
  ],

  // Equality
  [
    "=",
    {
      summary: "Equality type",
      details: "Type of equality proofs.",
      examples: "(= Nat 1 1)",
    },
  ],
  [
    "same",
    {
      summary: "Reflexivity of equality",
      details: "Proof that something equals itself.",
      examples: "(same 5)",
    },
  ],
  [
    "replace",
    {
      summary: "Substitution of equals for equals",
      details: "Uses an equality proof to replace equals for equals.",
      examples: "(replace proof-a=b target motive)",
    },
  ],
  [
    "trans",
    {
      summary: "Transitivity of equality",
      details: "Combines two equality proofs.",
      examples: "(trans proof-a=b proof-b=c)",
    },
  ],
  [
    "cong",
    {
      summary: "Congruence of equality",
      details: "Applies a function to both sides of an equality.",
      examples: "(cong proof-a=b function)",
    },
  ],
  [
    "symm",
    {
      summary: "Symmetry of equality",
      details: "Reverses an equality proof.",
      examples: "(symm proof-a=b)",
    },
  ],
  [
    "ind-=",
    {
      summary: "Induction on equality",
      details: "Performs induction on an equality proof.",
      examples: "(ind-= proof-a=b proof-b=c)",
    },
  ],

  // Special
  [
    "TODO",
    {
      summary: "Placeholder for incomplete code",
      details: "Indicates a hole to be filled in later.",
      examples: "(define my-function TODO)",
    },
  ],
  [
    "Absurd",
    {
      summary: "Absurd type",
      details: "A type with no elements, representing falsehood.",
      examples: "Absurd has no elements",
    },
  ],
  [
    "Trivial",
    {
      summary: "Trivial type",
      details: "A type with exactly one element.",
      examples: "(the Trivial 5)",
    },
  ],

  // Keywords
  [
    "define",
    {
      summary: "Define a value",
      details: "Defines a named value or function.",
      examples:
        "(define my-nat 5)\n(define add-two (lambda (x) (add1 (add1 x))))",
    },
  ],
  [
    "claim",
    {
      summary: "Claim the type of a name",
      details: "Declares the type of a name before defining it.",
      examples: "(claim my-nat Nat)\n(define my-nat 5)",
    },
  ],
  [
    "define-tactically",
    {
      summary: "Define using tactics",
      details: "Defines a value using the tactic system.",
      examples: "(define-tactically my-proof ...)",
    },
  ],
  [
    "check-same",
    {
      summary: "Check that two expressions are the same",
      details: "Verifies that two expressions evaluate to the same value.",
      examples: "(check-same Nat (add1 2) 3)",
    },
  ],
]);
