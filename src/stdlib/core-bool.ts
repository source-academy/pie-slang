// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// this file contains the minimum subset
// required for boolean operations to work.

// important distinction between scheme truthy
// and falsy values and javascript truthy and falsy values.
// in scheme, only #f is false, everything else is true.
export function truthy(x: any): boolean {
  return !(x === false);
}

export function atomic_or(a: any, b: any): boolean {
  return truthy(a) || truthy(b);
}

export function atomic_and(a: any, b: any): boolean {
  return truthy(a) && truthy(b);
}

export function atomic_not(a: any): boolean {
  return !truthy(a);
}

export function is_boolean(x: any): boolean {
  return x === true || x === false;
}
