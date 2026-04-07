import { schemeParse } from "./src/scheme-parser/transpiler/parser/index.js";

const code = `
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

(claim +-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))

(claim use-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically +-right-zero
  (intro)
  (ind-nat n)
  (then
    (exact (same 0))
    (intro)
    (intro)
    (exact (cong ih (the (-> Nat Nat ) (lambda k (add1 k)))))
  )
)
`;

try {
    console.log("Parsing...");
    const ast = schemeParse(code, 4);
    console.log("Success! AST length:", ast.length);
} catch (e) {
    console.error("Syntax error:");
    console.error(e.message);
}
