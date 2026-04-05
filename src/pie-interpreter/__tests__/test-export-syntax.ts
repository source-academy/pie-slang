import { schemeParse } from "../../scheme-parser/transpiler/parser";

describe("Export syntax test", () => {
    it("should parse without error", () => {
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
            const ast = schemeParse(code);
            console.log("AST Length:", ast.length);
        } catch (e) {
            console.error("Syntax Error Details:", e);
            throw e;
        }
    });
});
