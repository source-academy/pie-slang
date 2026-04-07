import fs from 'fs';
import { schemeParse, pieDeclarationParser, Claim, Definition, DefineTactically } from '@pie/parser/parser';

const sourceCode = `
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

; --- Theorem 1: prove this first ---
(claim +-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically +-right-zero
  (intro n)
  (exact (ind-Nat n
    (mot n)
    (base)
    (step))))

; --- Theorem 2: will reuse +-right-zero ---
(claim use-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))
`;

try {
    const astList = schemeParse(sourceCode);
    console.log("Parsed AST nodes:", astList.length);

    for (let i = 0; i < astList.length; i++) {
        try {
            const src = pieDeclarationParser.parseDeclaration(astList[i]);
            if ('name' in src) {
                console.log("Found declaration:", src.constructor.name, src.name);
            }
        } catch (e: any) {
            console.log("Error parsing AST node", i, ":", e.message);
        }
    }

} catch (e: any) {
    console.log("Failed to parse source code:", e.message);
}
