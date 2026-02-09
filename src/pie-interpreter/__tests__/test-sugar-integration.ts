import 'jest';
import { evaluatePieAndGetContext } from '../main';
import { ProofState } from '../tactics/proofstate';
import { Nat, Neutral, Lambda } from '../types/value';
import { Variable } from '../types/neutral';
import { Define, bindFree } from '../utils/context';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme-parser/transpiler/types/location';

// Create a mock location for testing
function mockLocation(): Location {
  const start = new Position(1, 1);
  const end = new Position(1, 1);
  const mockSyntax = new Syntax(start, end, 'test');
  return new Location(mockSyntax, false);
}

describe("Type Sugaring Integration Test", () => {
  it("should sugar types in ProofState.getProofTreeData()", () => {
    const code = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus (→ Nat Nat))
(define step-plus (λ (n-1) (add1 n-1)))
(define + (λ (n j) (iter-Nat n j step-plus)))

(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))

(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))
`;

    const result = evaluatePieAndGetContext(code);
    const ctx = result.context;

    // Get the Even definition and simulate starting a proof for (Even n)
    const evenDef = ctx.get('Even') as Define;
    const evenLambda = evenDef.value as Lambda;

    // Create a neutral variable for n
    const natValue = new Nat();
    const neutralN = new Neutral(natValue, new Variable('n'));

    // Apply Even to n to get (Even n) as a Value
    const evenOfN = evenLambda.body.valOfClosure(neutralN);

    // Create a goal context (like in proof state)
    const goalCtx = bindFree(ctx, 'n', natValue);

    // Create proof state with mock location
    const proofState = ProofState.initialize(goalCtx, evenOfN, mockLocation());

    // Get the proof tree data - this calls toSerializable which uses sugarType
    const proofTreeData = proofState.getProofTreeData();

    console.log('Goal type (sugared):', proofTreeData.root.goal.type);
    console.log('Goal type (expanded):', proofTreeData.root.goal.expandedType);

    // The type should be sugared to (Even n)
    expect(proofTreeData.root.goal.type).toBe('(Even n)');
  });
});
