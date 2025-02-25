// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// This file contains the minimum subset
// required for lists to work.

export type Pair = [any, any];
// a loose definition of a list.
export type List = null | Pair;

export function pair(car: any, cdr: any): Pair {
  const val = [car, cdr] as Pair;
  (val as any).pair = true;
  return val;
}

// converts a vector to a list.
// needed because of the way rest parameters
// are handled in javascript.
export function vector$45$$62$list(v: any[]): List {
  if (v.length === 0) {
    return null;
  }
  return pair(v[0], vector$45$$62$list(v.slice(1)));
}
