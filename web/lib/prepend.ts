// prepends[0] for chapters 1 to 3 incl.
// prepends[1] for chapters 4, and so on
const prepends = [
  `(claim +
  (→ Nat Nat Nat))
(claim step-plus
  (→ Nat Nat))
(define step-plus
  (λ (n-1)
    (add1 n-1)))
(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus)))
(claim *
  (→ Nat Nat
      Nat))
(claim step-*
  (→ Nat Nat Nat
      Nat))
(define step-*
  (λ (j n-1 multn-1)
    (+ j multn-1)))
(define *
  (λ (n j)
    (rec-Nat n
      0
      (step-* j))))
(claim +
  (→ Nat Nat Nat))
(claim step-plus
  (→ Nat Nat))
(define step-plus
  (λ (n-1)
    (add1 n-1)))
(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus)))
(claim Pear
  U)
(define Pear
  (Pair Nat Nat))
(claim Pear-maker
  U)
(define Pear-maker
  (→ Nat Nat
     Pear))
(claim elim-Pear
  (→ Pear Pear-maker
     Pear))
(define elim-Pear
  (λ (pear maker)
    (maker
      (car pear)
      (cdr pear))))
(claim pearwise+
  (→ Pear Pear
     Pear))
(define pearwise+
  (λ (anjou bosc)
    (elim-Pear anjou
      (λ (a1 d1)
        (elim-Pear bosc
          (λ (a2 d2)
            (cons
              (+ a1 a2)
              (+ d1 d2))))))))
(claim step-gauss
  (→ Nat Nat
     Nat))
(define step-gauss
  (λ (n-1 gaussn-1)
    (+ (add1 n-1) gaussn-1)))
(claim gauss
  (→ Nat Nat))
(define gauss
  (λ (n)
    (rec-Nat n
      0
      step-gauss)))
(claim step-fact
  (→ Nat Nat
     Nat))
(define step-fact
  (λ (n-1 almost)
    (* (add1 n-1) almost)))
(claim factorial
  (→ Nat
     Nat))
(define factorial
  (λ (n)
    (rec-Nat n
      1
      step-fact)))`,

  `(claim elim-Pair
  (Π ((A U)
      (D U)
      (X U))
     (→ (Pair A D)
        (→ A D
           X)
        X)))
(define elim-Pair
  (λ (A D X)
    (λ (p f)
      (f (car p)
         (cdr p)))))
(claim flip
  (Π ((A U)
      (D U))
     (→ (Pair A D)
        (Pair D A))))
(define flip
  (λ (A D)
    (λ (p)
      (cons (cdr p)
            (car p)))))
((claim kar (-> (Pair Nat Nat) Nat))
(define kar
  (λ (p)
    (elim-Pair
      Nat Nat
      Nat
      p
      (λ (a d)
        a))))
(claim kdr (-> (Pair Nat Nat) Nat))
(define kdr
  (λ (p)
    (elim-Pair
      Nat Nat
      Nat
      p
      (λ (a d)
        d))))
(claim swap
  (→ (Pair Nat Atom)
    (Pair Atom Nat)))
(define swap
  (λ (p)
    (elim-Pair
      Nat
      Atom
      (Pair Atom Nat)
      p
      (λ (a d)
        (cons d a)))))
(claim twin
  (Π ((Y U))
     (→ Y
        (Pair Y Y))))
(define twin
  (λ (Y)
    (λ (x)
      (cons x x))))
(claim twin-Atom
  (→ Atom
     (Pair Atom Atom)))
(define twin-Atom
  (twin Atom))`,

  `(claim length
  (Π ((E U))
     (→ (List E)
        Nat)))
(claim step-length
  (Π ((E U))
     (→ E
        (List E)
        Nat
        Nat)))
(define step-length
  (λ (E)
    (λ (e es lengthes)
      (add1 lengthes))))
(define length
  (λ (E)
    (λ (es)
      (rec-List es
        0
        (step-length E)))))
(claim length-Atom
  (→ (List Atom)
     Nat))
(define length-Atom
  (length Atom))
(claim length-Atom
  (→ (List Atom)
    Nat))
(define length-Atom
  (length Atom))
(claim append
  (Π ((E U))
     (→ (List E)
        (List E)
        (List E))))
(claim step-append
  (Π ((E U))
     (→ E
        (List E)
        (List E)
        (List E))))
(define step-append
  (λ (E)
    (λ (e es appendes)
      (:: e appendes))))
(define append
  (λ (E)
    (λ (start end)
      (rec-List start
        end
        (step-append E)))))
(claim snoc
  (Π ((E U))
     (→ (List E)
        E
        (List E))))
(define snoc
  (λ (E)
    (λ (start e)
      (rec-List start
        (:: e nil)
        (step-append E)))))
(claim concat
  (Π ((E U))
     (→ (List E)
        (List E)
        (List E))))
(claim step-concat
  (Π ((E U))
     (→ E
        (List E)
        (List E)
        (List E))))
(define step-concat
  (λ (E)
    (λ (e es concates)
      (snoc E concates e))))
(define concat
  (λ (E)
    (λ (start end)
      (rec-List end
        start
        (step-concat E)))))
(claim reverse
  (Π ((E U))
     (→ (List E)
        (List E))))
(claim step-reverse
  (Π ((E U))
     (→ E
        (List E)
        (List E)
        (List E))))
(define step-reverse
  (λ (E)
    (λ (e es reversees)
      (snoc E reversees e))))
(define reverse
  (λ (E)
    (λ (es)
      (rec-List es
        (the (List E) nil)
        (step-reverse E)))))`,

  `
(claim first-of-one
  (Π ((E U))
     (→ (Vec E 1)
        E)))
(define first-of-one
  (λ (E)
    (λ (es)
      (head es))))
(claim first-of-two
  (Π ((E U))
     (→ (Vec E 2)
        E)))
(define first-of-two
  (λ (E)
    (λ (es)
      (head es))))
(claim first
  (Π ((E U)
      (l Nat))
     (→ (Vec E (add1 l))
        E)))
(define first
  (λ (E l)
    (λ (es)
      (head es))))
(claim rest
  (Π ((E U)
      (l Nat))
     (→ (Vec E (add1 l))
        (Vec E l))))
(define rest
  (λ (E l)
    (λ (es)
      (tail es))))`,
  `
(claim last
(Π ((E U )
(l Nat))
(→ (Vec E (add1 l))
E)))
(claim base-last
(Π ((E U ))
(→ (Vec E (add1 zero))
E)))
(define base-last
(λ (E)
(λ (es)
(head es))))
(claim mot-last
(→ U Nat
U ))
(define mot-last
(λ (E k)
(→ (Vec E (add1 k))
E)))
(claim step-last
(Π ((E U )
(l-1 Nat))
(→ (mot-last E l-1)
(mot-last E (add1 l-1)))))
(define step-last
(λ (E l-1)
(λ (lastl-1)
(λ (es)
(lastl-1 (tail es))))))
(define last
(λ (E l)
(ind-Nat l
(mot-last E)
(base-last E)
(step-last E))))
(claim drop-last
(Π ((E U )
(l Nat))
(→ (Vec E (add1 l))
(Vec E l))))
(claim base-drop-last
(Π ((E U ))
(→ (Vec E (add1 zero))
(Vec E zero))))
(define base-drop-last
(λ (E)
(λ (es)
vecnil)))
(claim mot-drop-last
(→ U Nat
U ))
(define mot-drop-last
(λ (E k)
(→ (Vec E (add1 k))
(Vec E k))))
(claim step-drop-last
(Π ((E U )
(l-1 Nat))
(→ (mot-drop-last E l-1)
(mot-drop-last E (add1 l-1)))))
(define step-drop-last
(λ (E l-1)
(λ (drop-lastl-1)
(λ (es)
(vec:: (head es)
(drop-lastl-1 (tail es)))))))
(define drop-last
(λ (E l)
(ind-Nat l
(mot-drop-last E)
(base-drop-last E)
(step-drop-last E))))`,
];
