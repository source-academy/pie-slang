import { schemeParse, pieDeclarationParser, Claim, Definition, DefineTactically } from './src/scheme-parser/transpiler/parser/scheme-parser';
import { initCtx, addClaimToContext, addDefineToContext, addDefineTacticallyToContext } from './src/pie-interpreter/utils/context';
import { go, stop } from './src/pie-interpreter/types/utils';

const sourceCode = `
(claim +
  (-> Nat Nat Nat))

(define +
  (lambda (n j)
    (iter-Nat n j (lambda (x) (add1 x)))))

(claim +-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically +-right-zero
  (
    (intro n)
    (exact (ind-Nat n (mot n) (base) (step)))
  )
)

(claim use-right-zero
  (Pi ((n Nat))
    (= Nat (+ n 0) n)))
`;

try {
    const astList = schemeParse(sourceCode);
    const claimName = "use-right-zero";

    const validNames = new Set<string>();
    for (const node of astList) {
        const src = pieDeclarationParser.parseDeclaration(node);
        if (src instanceof Definition || src instanceof DefineTactically) {
            validNames.add(src.name);
        }
    }
    validNames.add(claimName);
    console.log("Valid names:", Array.from(validNames));

    let ctx = initCtx;
    const globalTheorems = [];
    const pendingClaims = [];

    for (let i = 0; i < astList.length; i++) {
        const src = pieDeclarationParser.parseDeclaration(astList[i]);
        if (!('name' in src)) continue;

        const isTargetClaim = src.name === claimName;

        if (src instanceof Claim) {
            if (!validNames.has(src.name)) continue;
            const result = addClaimToContext(ctx, src.name, src.location, src.type);
            if (result instanceof go) {
                ctx = result.result;
                if (!isTargetClaim) {
                    pendingClaims.push({ name: src.name, type: "some-type" });
                }
            }
        } else if (src instanceof Definition) {
            const result = addDefineToContext(ctx, src.name, src.location, src.expr);
            if (result instanceof go) {
                ctx = result.result;
            }
        } else if (src instanceof DefineTactically) {
            if (src.name === claimName) break;
            const result = addDefineTacticallyToContext(ctx, src.name, src.location, src.tactics);
            if (result instanceof go) {
                ctx = result.result.context;
                globalTheorems.push({ name: src.name, kind: "theorem" });
                const claimIdx = pendingClaims.findIndex(c => c.name === src.name);
                if (claimIdx >= 0) pendingClaims.splice(claimIdx, 1);
            }
        }

        if (isTargetClaim) break;
    }

    for (const claim of pendingClaims) {
        globalTheorems.push({ name: claim.name, kind: "claim" });
    }

    console.log("Global Theorems:", globalTheorems);

} catch (e) {
    console.log("Error:", e.message);
}
