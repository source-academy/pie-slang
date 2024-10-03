type Core = any; // Core would be the AST data structure; needs further refinement
type Bindings = Array<[Symbol, number]>; // (Symbol, Natural) equivalent in TS

// Helper function to find a symbol in the bindings
function findBinding(bindings: Bindings, symbol: Symbol): [Symbol, number] | undefined {
    return bindings.find(binding => binding[0] === symbol);
}

// Bind function, adding a new symbol binding
function bind(bindings: Bindings, symbol: Symbol, lvl: number): Bindings {
    return [[symbol, lvl], ...bindings];
}

// α-equiv? public function
export function alphaEquiv(e1: Core, e2: Core): boolean {
    return alphaEquivAux(0, [], [], e1, e2);
}

// Main α-equivalence auxiliary function
function alphaEquivAux(lvl: number, b1: Bindings, b2: Bindings, e1: Core, e2: Core): boolean {
    if (typeof e1 === 'symbol' && typeof e2 === 'symbol') {
        // Handle variable cases
        const xBinding = findBinding(b1, e1 as Symbol);
        const yBinding = findBinding(b2, e2 as Symbol);
        
        if (xBinding && yBinding) {
            return xBinding[1] === yBinding[1];
        } else if (!xBinding && !yBinding) {
            return e1 === e2;
        } else {
            return false;
        }
    } else if (Array.isArray(e1) && Array.isArray(e2)) {
        // Handle complex expressions like Π, Σ, λ, etc.
        if (e1[0] === 'Π' && e2[0] === 'Π') {
            return alphaEquivAux(lvl, b1, b2, e1[1][1], e2[1][1]) &&
                alphaEquivAux(lvl + 1, bind(b1, e1[1][0], lvl), bind(b2, e2[1][0], lvl), e1[2], e2[2]);
        } else if (e1[0] === 'Σ' && e2[0] === 'Σ') {
            return alphaEquivAux(lvl, b1, b2, e1[1][1], e2[1][1]) &&
                alphaEquivAux(lvl + 1, bind(b1, e1[1][0], lvl), bind(b2, e2[1][0], lvl), e1[2], e2[2]);
        } else if (e1[0] === 'λ' && e2[0] === 'λ') {
            return alphaEquivAux(lvl + 1, bind(b1, e1[1], lvl), bind(b2, e2[1], lvl), e1[2], e2[2]);
        } else if (e1[0] === 'TODO' && e2[0] === 'TODO') {
            return e1[1] === e2[1] && alphaEquivAux(lvl, b1, b2, e1[2], e2[2]);
        } else if (e1[0] === e2[0]) {
            return alphaEquivAuxList(lvl, b1, b2, e1.slice(1), e2.slice(1));
        }
    } else if (e1 === e2) {
        return true;
    }
    
    return false;
}

// Auxiliary function to handle lists of arguments
function alphaEquivAuxList(lvl: number, b1: Bindings, b2: Bindings, args1: Core[], args2: Core[]): boolean {
    if (args1.length === 0 && args2.length === 0) {
        return true;
    }
    if (args1.length !== args2.length) {
        return false;
    }
    
    for (let i = 0; i < args1.length; i++) {
        if (!alphaEquivAux(lvl, b1, b2, args1[i], args2[i])) {
            return false;
        }
    }
    
    return true;
}

// Unit tests (using Jest or similar testing framework)
import { test, expect } from '@jest/globals';

test('alphaEquiv basic tests', () => {
    expect(alphaEquiv(['λ', 'x', 'x'], ['λ', 'x', 'x'])).toBe(true);
    expect(alphaEquiv(['λ', 'x', 'x'], ['λ', 'y', 'y'])).toBe(true);
    expect(alphaEquiv(['λ', 'x', ['λ', 'y', 'x']], ['λ', 'x', ['λ', 'y', 'x']])).toBe(true);
    expect(alphaEquiv(['λ', 'x', ['λ', 'y', 'x']], ['λ', 'y', ['λ', 'z', 'y']])).toBe(true);
    expect(alphaEquiv(['λ', 'x', ['λ', 'y', 'x']], ['λ', 'y', ['λ', 'z', 'z']])).toBe(false);
    expect(alphaEquiv(['f', 'x'], ['f', 'x'])).toBe(true);
    expect(alphaEquiv(['f', 'x'], ['g', 'x'])).toBe(false);
});
