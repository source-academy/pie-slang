import { schemeParse } from "../src/scheme-parser/transpiler/parser/index.js";
import { SchemeParser } from "../src/scheme-parser/transpiler/parser/scheme-parser.js";

const code = `
(claim +         
    (-> Nat Nat Nat))                                                        
                     
  (define +                                                                  
    (lambda (n j)                                                            
      (iter-Nat n j (lambda (x) (add1 x)))))
                                                                             
  ; --- Theorem 1: prove this first ---                                      
  (claim +-right-zero                                                        
    (Pi ((n Nat))                                                            
      (= Nat (+ n 0) n)))                                                    
                                                                             
  ; --- Theorem 2: will reuse +-right-zero ---                               
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
    console.log("Parsing with schemeParse...");
    const astList = schemeParse(code);
    console.log("AST Length:", astList.length);

    const p = new SchemeParser();
    for (let i = 0; i < astList.length; i++) {
        console.log("Parsing declaration", i, "...");
        p.parseDeclaration(astList[i]);
        console.log("OK declaration", i);
    }
} catch (e) {
    console.error("Syntax Error Details:", e.message);
    console.error("EXPECTED:", e.expected);
    console.error("FORM:", e.form);
}
