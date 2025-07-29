import 'jest';

import { evaluatePie } from '../main'

describe("demo", () => {
  it("Pie demo", () => {
    const src = 
//     `(claim +
//   (→ Nat Nat
//     Nat))

// (claim step-plus
//   (→ Nat
//     Nat))

// (define step-plus
//   (λ (n-1)
//     (add1 n-1 ) ))

// (define +
//   (λ (n j)
//     (iter-Nat n
//       j
//       step-plus)))

// (claim incr
//   (→ Nat
//     Nat))

// (define incr
//   (λ (n)
//     (iter-Nat n
//       1
//       (+ 1))))

// (claim incr=add1
//   (Π ((n Nat))
//     (= Nat (incr n) (add1 n))))

// (claim base-incr=add1
//   ( = Nat (incr zero) (add1 zero)))

// (define base-incr=add1
//   (same (add1 zero)))

// (claim mot-incr=add1
//   (→ Nat
//     U))

// (define mot-incr=add1
//   (λ (k)
//     ( = Nat (incr k) (add1 k))))

// (claim step-incr=add1
//   (Π ((n-1 Nat))
//       (→ (= Nat (incr n-1) (add1 n-1))
//          (= Nat (incr (add1 n-1)) (add1 (add1 n-1)))))
//   #;(Π ((n-1 Nat))
//     (→ (mot-incr=add1 n-1)
//        (mot-incr=add1 (add1 n-1)))))

// (claim claim-63
//   (= U
//     (Π ((n-1 Nat))
//       (→ (mot-incr=add1 n-1)
//         (mot-incr=add1 (add1 n-1))))
//     (Π ((n-1 Nat))
//       (→ (= Nat (incr n-1) (add1 n-1))
//          (= Nat (incr (add1 n-1)) (add1 (add1 n-1)))))))

// (define claim-63
//   (same (Π ((n-1 Nat))
//       (→ (mot-incr=add1 n-1)
//         (mot-incr=add1 (add1 n-1))))))

// (claim claim-69
//   (= U
//     (Π ((n-1 Nat))
//       (→ (= Nat (incr n-1) (add1 n-1))
//          (= Nat (incr (add1 n-1)) (add1 (add1 n-1)))))
//     (Π ((n-1 Nat))
//       (→ (= Nat (incr n-1) (add1 n-1))
//         (= Nat (add1 (incr n-1)) (add1 (add1 n-1)))))))

// (claim claim-68
//   (Pi ((n-1 Nat))
//     (= Nat (incr (add1 n-1))
//            (add1 (incr n-1)))))

// (define claim-68
//   (lambda (n-1)
//     (same (add1 (incr n-1)))))

// (define claim-69
//   (same
//     (Π ((n-1 Nat))
//       (→ (= Nat (incr n-1) (add1 n-1))
//          (= Nat (incr (add1 n-1)) (add1 (add1 n-1)))))))

// (define step-incr=add1
//   (λ (n-1)
//     (λ (incr=add1n-1)
//       (cong incr=add1n-1 (+ 1)))))

// (define incr=add1
//   (λ (n)
//     (ind-Nat n
//       mot-incr=add1
//       base-incr=add1
//       step-incr=add1
//      ))) `
// (claim peas
// (Π ((how-many-peas Nat))
// (Vec Atom how-many-peas)))

// (claim mot-peas
// (→ Nat
// U))

// (define mot-peas
// (λ (k)
// (Vec Atom k)))

// (claim step-peas
// (Π ((l-1 Nat))
// (→ (mot-peas l-1)
// (mot-peas (add1 l-1)))))

// (define step-peas
// (λ (l-1)
// (λ (peas-l-1)
// (vec:: 'pea peas-l-1))))

// (define peas
// (λ (how-many-peas)
// (ind-Nat how-many-peas
// mot-peas
// vecnil
// step-peas)))
// `
`
(claim +
  (→ Nat Nat
    Nat))

(claim step-plus
  (→ Nat
    Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1 ) ))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus )))

(claim double
  (→ Nat
    Nat))

(define double
  (λ (n)
    (iter-Nat n
      0
      (+ 2))))

(claim twice
  (→ Nat
    Nat))

(define twice
  (λ (n)
    (+ n n)))



(claim add1+=+add1
  (Π ((n Nat)
      (j Nat))
  (= Nat
    (add1 (+ n j))
    (+ n (add1 j)))))

(claim mot-add1+=+add1
  (→ Nat Nat
    U))

(define mot-add1+=+add1
  (λ (j k)
    (= Nat
      (add1 (+ k j))
      (+ k (add1 j)))))

(claim step-add1+=+add1
  (Π ((j Nat)
    (n-1 Nat))
  (→ (mot-add1+=+add1 j
      n-1)
    (mot-add1+=+add1 j
      (add1 n-1)))))

(define step-add1+=+add1
  (λ (j n-1)
    (λ (add1+=+add1n-1)
      (cong add1+=+add1n-1
        (+ 1)))))

(define add1+=+add1
  (λ (n j)
    (ind-Nat n
      (mot-add1+=+add1 j)
      (same (add1 j))
      (step-add1+=+add1 j))))

(claim twice=double
  (Π ((n Nat))
    (= Nat (twice n) (double n))))

(claim mot-twice=double
  (→ Nat
    U))

(define mot-twice=double
  (λ (k)
    (= Nat
      (twice k)
      (double k))))

(claim step-twice=double
  (Π ((n-1 Nat))
    (→ (mot-twice=double n-1)
      (mot-twice=double (add1 n-1)))))

(claim mot-step-twice=double
  (→ Nat Nat
    U))

(define mot-step-twice=double
  (λ (n-1 k)
    (= Nat
      (add1 k)
      (add1 (add1 (double n-1))))))

(define step-twice=double
  (λ (n-1)
    (λ (twice=doublen-1)
      (replace (add1+=+add1 n-1 n-1)
        (mot-step-twice=double n-1)
        (cong twice=doublen-1
          (+ 2))))))

(define twice=double
  (λ (n)
    (ind-Nat n
    mot-twice=double
    (same zero)
    step-twice=double)))
`

// `
// (claim +
// (→ Nat Nat
// Nat))

// (claim step-plus
// (→ Nat
// Nat))
// (define step-plus
// (λ (n-1)
// (add1 n-1 ) ))


// (define +
// (λ (n j)
// (iter-Nat n
// j
// step-plus )))

// (claim incr
// (→ Nat
// Nat))
// (define incr
// (λ (n)
// (iter-Nat n
// 1
// (+ n))))

// (claim one1 Nat)
// (define one1
// (incr zero))

// (claim two2 Nat)
// (define two2
// (incr (add1 zero)))`

// (claim zero-is-even
// (Even 0))
// (define zero-is-even
// (cons 0
// (same 0)))

    console.log(evaluatePie(src));
  });
});

describe("False_demo", () => {
  it("Pie demo", () => {
    const src = 
    `
(claim =consequence
  (→ Nat Nat
    U))

(define =consequence
  (λ (n j)
    (which-Nat n
      (which-Nat j
        Trivial
  (λ (j-1)
    Absurd))
  (λ (n-1)
    (which-Nat j
      Absurd
      (λ (j-1)
      (= Nat n-1 j-1)))))))   

(claim =consequence-same
  (Π ((n Nat))
    (=consequence n n)))

(define =consequence-same
  (λ (n)
    (ind-Nat n
      (λ (k)
      (=consequence k k))
        sole
      (λ (n-1 =consequencen-1)
        (same n-1)))))


(claim use-Nat=
  (Π ((n Nat)
    (j Nat))
      (→ (= Nat n j)
        (=consequence n j))))

(define use-Nat=
  (λ (n j)
    (λ (n=j)
      (replace n=j
        (λ (k)
          (=consequence n k))
          (=consequence-same n)))))        

(claim zero-not-add1
  (Π ((n Nat))
    (→ (= Nat zero (add1 n))
      Absurd)))

(define zero-not-add1
  (λ (n)
    (use-Nat= zero (add1 n))))
         `
    console.log(evaluatePie(src));
  });
});

describe("And_demo", () => {
  it("Pie demo", () => {
    const src = 
    `
(claim and-example
  (Π ((n Nat))
    (Pair (= Nat n n)
      (= Nat (add1 n) (add1 n)))))

(define and-example
  (λ (n)
    (cons (same n)  
      (same (add1 n)))))
         `
    console.log(evaluatePie(src));
  });
});

describe("Or_demo", () => {
  it("Pie demo", () => {
    const src = 
    `
(claim + (-> Nat Nat Nat))
(define +
  (lambda (i j)
    (rec-Nat j
      i
      (lambda (j-1 sum-j-1)
        (add1 sum-j-1)
      )
    )
  )
)


(claim zero+n=n
  (Pi ((n Nat))
    (= Nat (+ 0 n) n)))

(claim mot-zero+n=n
  (-> Nat U))

(define mot-zero+n=n
  (lambda (n)
    (= Nat (+ 0 n) n)))

(claim base-zero+n=n
  (= Nat (+ 0 0) 0))

(define base-zero+n=n
  (same 0))

(claim step-zero+n=n
  (Pi ((n Nat))
    (-> (= Nat (+ 0 n) n)
        (= Nat (add1 (+ 0 n)) (add1 n)))))

(claim +one
  (-> Nat
    Nat))

(define +one
  (lambda (n)
    (add1 n)))

(define step-zero+n=n
  (lambda (n stepn-1)
    (cong stepn-1
      +one)))

(define zero+n=n
  (lambda (n)
    (ind-Nat n
      mot-zero+n=n
      base-zero+n=n
      step-zero+n=n)))
         `
    console.log(evaluatePie(src));
  });

  it("Addition over nats", () => {
    const src =  `(claim addNat
                    (-> Nat Nat Nat)) 
                  (define addNat 
                    (lambda (x y) 
                      (ind-Nat x 
                        (lambda (x) Nat)
                        y 
                        (lambda (n-1 ih) (add1 ih)))))
                  (addNat 3 4)
                  (addNat 3 0)`;
    console.log(evaluatePie(src));
  });

  it("construct vector", () => {
    const src =  `(claim more-expectations (Vec Atom 3))
                  (define more-expectations 
                      (vec:: 'need-induction
                          (vec:: 'understood-induction
                              (vec:: 'built-function vecnil))))`;
    console.log(evaluatePie(src));
  });
  it("construct vector through replicate function", () => {
    const src =  
    `
    (claim mot-replicate (-> U Nat U))
    (define mot-replicate (lambda (E k) (Vec E k)))
    (claim step-replicate 
      (Pi ((E U) (e E) (l-1 Nat)) 
        (-> (mot-replicate E l-1) (mot-replicate E (add1 l-1)))))
    (define step-replicate 
      (lambda (E e l-1)
        (lambda (step-l-1)
          (vec:: e step-l-1))))
    (claim replicate
      (Pi ((E U) (len Nat)) 
          (-> E (Vec E len))))
    (define replicate
      (lambda (E l)
          (lambda (e) 
            (ind-Nat l
            (mot-replicate E)
            vecnil
            (step-replicate E e)))))
    (replicate Atom 3 'caonima)`;
    console.log(evaluatePie(src));
  });

  it("list length", () => {
    const src =  
    `
    (claim step-replicate 
      (Pi ((E U) (e E) (l-1 Nat)) 
        (-> (mot-replicate E l-1) (mot-replicate E (add1 l-1)))))
    (define step-replicate 
      (lambda (E e l-1)
        (lambda (step-l-1)
          (vec:: e step-l-1))))
    (claim replicate
      (Pi ((E U) (len Nat)) 
          (-> E (Vec E len))))
    (define replicate
      (lambda (E l)
          (lambda (e) 
            (ind-Nat l
            (mot-replicate E)
            vecnil
            (step-replicate E e)))))
    (replicate Atom 3 'caonima)`;
    console.log(evaluatePie(src));
  });
  
});