import { Core, isCore, isVarName } from './basics';

// α-equiv? public interface
export function alphaEquiv(e1: Core, e2: Core): boolean {
  return alphaEquivAux(0, [], [], e1, e2);
}

//-------------------------------------------------------------------------------------------//

// ### Helpers ###

type Bindings = Array<[Symbol, number]>;

function bind(b: Bindings, x: Symbol, lvl: number): Bindings {
  return [[x, lvl], ...b];
}

function findBinding(x: Symbol, b: Bindings): [Symbol, number] | undefined {
  return b.find(([name, _]) => x.description === name.description);
}

function alphaEquivAux(lvl: number, b1: Bindings, b2: Bindings, e1: Core, e2: Core): boolean {
  if (typeof e1 === 'symbol' && typeof e2 === 'symbol') {
    return e1.description === e2.description;
  } else if (typeof e1 === 'string' && typeof e2 === 'string') {
    const e1s = Symbol(e1);
    const e2s = Symbol(e2);
    if (isVarName(e1s) && isVarName(e2s)) {
      const xBinding = findBinding(e1s as Symbol, b1);
      const yBinding = findBinding(e2s as Symbol, b2);
      if (xBinding && yBinding) {
        // Both variables are bound, so we compare their levels
        return xBinding[1] === yBinding[1];
      } else if (!xBinding && !yBinding) {
        // Both variables are free, so we compare their names
        return e1 === e2;
      } else {
        // One variable is bound and the other is free
        return false;
      }
    } else if (!isVarName(e1s) && !isVarName(e2s)) {
      // Constructor equality (e.g., 'U' === 'U')
      return e1 === e2;
    } else return false;
  } else if (Array.isArray(e1) && Array.isArray(e2)) {
    
    if (e1[0] === 'quote' && e2[0] === 'quote') {
      return e1[1].toString() === e2[1].toString();
    } else if (e1[0] === 'Π' && e2[0] === 'Π') {
      return alphaEquivAux(lvl, b1, b2, e1[1][1], e2[1][1]) &&
        alphaEquivAux(lvl + 1, bind(b1, e1[1][0][0], lvl), bind(b2, e2[1][0][0], lvl), e1[2], e2[2]);
    } else if (e1[0] === 'Σ' && e2[0] === 'Σ') {
      return alphaEquivAux(lvl, b1, b2, e1[1][1], e2[1][1]) &&
        alphaEquivAux(lvl + 1, bind(b1, e1[1][0][0], lvl), bind(b2, e2[1][0][0], lvl), e1[2], e2[2]);
    } else if (e1[0] === 'λ' && e2[0] === 'λ') {
      return alphaEquivAux(lvl + 1, bind(b1, e1[1][0], lvl), bind(b2, e2[1][0], lvl), e1[2], e2[2]);
    } else if (e1[0] === 'the' && e2[0] === 'the') {
      return e1[1] === 'Absurd' && e2[1] === 'Absurd';
    } else if (e1.length === 2 && e2.length === 2) {
      // all other cases of pairs
      if (typeof e1[0] === 'symbol' && typeof e2[0] === 'symbol') {
        const kw1 = e1[0].toString(); 
        const kw2 = e2[0].toString();
        if(!(kw1 === 'λ' || kw1 === 'Π' || kw1 === 'Σ' || kw1 === 'TODO') &&
           !(kw2 === 'λ' || kw2 === 'Π' || kw2 === 'Σ' || kw2 === 'TODO') &&
          !isVarName(e1[0]) && !isVarName(e2[0])) {
          return kw1 === kw2 && alphaEquivAux(lvl, b1, b2, e1[1], e2[1]);
        }
      } else if (isCore(e1[0]) && isCore(e2[0]) && isCore(e1[1]) && isCore(e2[1])) {
        // should be function application case
        return alphaEquivAux(lvl, b1, b2, e1[0], e2[0]) && alphaEquivAux(lvl, b1, b2, e1[1], e2[1]);
      }
    } else if (e1[0] === 'TODO' && e2[0] === 'TODO') {
      // Holes from the same location are equal
      return e1[1] === e2[1] && alphaEquivAux(lvl, b1, b2, e1[2], e2[2]);
    }
  } 
  return false;
}

// Auxiliary function to handle lists of arguments
function alphaEquivAuxList(lvl: number, b1: Bindings, b2: Bindings, args1: Core[], args2: Core[]): boolean {
  if (args1.length === 0 && args2.length === 0) {
    return true;
  } else if (args1.length !== 0 && args2.length !== 0) {
    return alphaEquivAux(lvl, b1, b2, args1[0], args2[0]) &&
      alphaEquivAuxList(lvl, b1, b2, args1.slice(1), args2.slice(1));
  } else return false;
}

// Unit tests (using Jest or similar testing framework)
import { test, expect } from '@jest/globals';
