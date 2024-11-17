/*
convention:

_ --> - 
E --> = (since all scheme basic procedures are in lower case)
Q --> ?
B --> !
L --> <
G --> >

to be changed with regex.
*/

// Splice resolver

// class SpliceMark {
//   val: Pair | null;
// }

// // maps over a list. if the list contains a splice mark, it will
// // splice the list into the result list.
// export let resolve_splice = function (xs: any): Pair | null {
//   if (!pairQ(xs)) {
//     if (xs instanceof SpliceMark) {
//       return xs.val;

//   }
//   const car_xs = car(xs);
//   const cdr_xs = cdr(xs);
//   if (car_xs instanceof SpliceMark) {
//     return append(car_xs.val, resolve_splice(cdr_xs as Pair));
//   } else {
//     return cons(car_xs, resolve_splice(cdr_xs as Pair));
//   }
// }

// export let make_splice = function(xs: any) {
//   if (!listQ(xs)) {
//     throw new Error("unquote-splicing: expected list, got " + xs.toString());
//   }
//   return new SpliceMark(xs);
// }

// Equivalence predicates

export let eqQ = function (x: any, y: any): boolean {
  if (x instanceof _Symbol && y instanceof _Symbol) {
    return x.sym === y.sym;
  }
  return x === y;
};

export let eqvQ = function (x: any, y: any): boolean {
  if (x === y) {
    return true;
  } else if (typeof x === "number" && typeof y === "number") {
    return isNaN(x) && isNaN(y);
  } else if (x instanceof _Symbol && y instanceof _Symbol) {
    return x.sym === y.sym;
  } else {
    return false;
  }
};

export let equalQ = function (x: any, y: any): boolean {
  if (x === y) {
    return true;
  } else if (typeof x === "number" && typeof y === "number") {
    return isNaN(x) && isNaN(y);
  } else if (pairQ(x) && pairQ(y)) {
    return equalQ(car(x), car(y)) && equalQ(cdr(x), cdr(y));
  } else if (x instanceof _Symbol && y instanceof _Symbol) {
    return x.sym === y.sym;
  } else {
    return false;
  }
};

// Numbers

export let numberQ = function (n: any): boolean {
  return typeof n === "number";
};

export let complexQ = function (n: any): boolean {
  return typeof n === "number";
};

export let realQ = function (n: any): boolean {
  return typeof n === "number";
};

export let rationalQ = function (n: any): boolean {
  return typeof n === "number";
};

export let integerQ = function (n: any): boolean {
  return typeof n === "number" && n % 1 === 0;
};

export let exactQ = function (n: any): boolean {
  return typeof n === "number" && n % 1 === 0;
};

export let exact_integerQ = function (n: any): boolean {
  return typeof n === "number" && n % 1 === 0;
};

export let E = function (...args: number[]): boolean {
  let acc: boolean = true;
  for (let i: number = 0; i < args.length - 1; i++) {
    if (!numberQ(args[i])) {
      throw new Error(
        "procedure =: expected number, got " + args[i].toString()
      );
    }
    acc = acc && args[i] === args[i + 1];
  }
  return acc;
};

export let L = function (...args: number[]): boolean {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    if (!numberQ(args[i])) {
      throw new Error(
        "procedure <: expected number, got " + args[i].toString()
      );
    }
    acc = acc && args[i] < args[i + 1];
  }
  return acc;
};

export let G = function (...args: number[]): boolean {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    if (!numberQ(args[i])) {
      throw new Error(
        "procedure >: expected number, got " + args[i].toString()
      );
    }
    acc = acc && args[i] > args[i + 1];
  }
  return acc;
};

export let LE = function (...args: number[]): boolean {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    if (!numberQ(args[i])) {
      throw new Error(
        "procedure <=: expected number, got " + args[i].toString()
      );
    }
    acc = acc && args[i] <= args[i + 1];
  }
  return acc;
};

export let GE = function (...args: number[]): boolean {
  let acc = true;
  for (let i = 0; i < args.length - 1; i++) {
    if (!numberQ(args[i])) {
      throw new Error(
        "procedure >=: expected number, got " + args[i].toString()
      );
    }
    acc = acc && args[i] >= args[i + 1];
  }
  return acc;
};

export let zeroQ = function (n: number): boolean {
  return E(n, 0);
};

export let positiveQ = function (n: number): boolean {
  return G(n, 0);
};

export let negativeQ = function (n: number): boolean {
  return L(n, 0);
};

export let oddQ = function (n: number): boolean {
  if (!numberQ(n)) {
    throw new Error("procedure odd?: expected number, got " + n.toString());
  }
  return n % 2 !== 0;
};

export let evenQ = function (n: number): boolean {
  if (!numberQ(n)) {
    throw new Error("procedure even?: expected number, got " + n.toString());
  }
  return n % 2 === 0;
};

export let max = function (...args: number[]): number {
  return Math.max(...args);
};

export let min = function (...args: number[]): number {
  return Math.min(...args);
};

export let plus = function (...args: number[]): number {
  return args.reduce((a, b) => a + b, 0);
};

export let multiply = function (...args: number[]): number {
  return args.reduce((a, b) => a * b, 1);
};

export let minus = function (...args: number[]): number {
  if (args.length < 2) {
    return -args[0];
  }
  return args.slice(1).reduce((a, b) => a - b, args[0]);
};

export let divide = function (...args: number[]): number {
  if (args.length < 2) {
    return 1 / args[0];
  }
  return args.slice(1).reduce((a, b) => a / b, args[0]);
};

export let abs = function (x: number): number {
  return Math.abs(x);
};

export let quotient = function (x: number, y: number): number {
  return Math.trunc(x / y);
};

export let modulo = function (x: number, y: number): number {
  return x % y;
};

export let remainder = function (x: number, y: number): number {
  return x % y;
};

export let gcd = function (...args: number[]): number {
  return args.reduce((a, b) => {
    if (a === 0) {
      return abs(b);
    }
    return gcd(abs(b % a), abs(a));
  }, 0);
};

export let lcm = function (...args: number[]): number {
  return args.reduce((a, b) => {
    return abs(a * b) / gcd(a, b);
  }, 1);
};

export let floor = function (x: number): number {
  return Math.floor(x);
};

export let ceiling = function (x: number): number {
  return Math.ceil(x);
};

export let truncate = function (x: number): number {
  return Math.trunc(x);
};

export let round = function (x: number): number {
  return Math.round(x);
};

export let rationalize = function (x: number, y: number): number {
  return x / y;
};

export let square = function (x: number): number {
  return x * x;
};

export let exact_integer_sqrt = function (x: number): number {
  return Math.sqrt(x);
};

export let expt = function (x: number, y: number): number {
  return Math.pow(x, y);
};

export let inexact = function (x: number): number {
  return x;
};

export let exact = function (x: number): number {
  return x;
};

export let number_Gstring = function (x: number): string {
  return x.toString();
};

export let string_Gnumber = function (x: string): number {
  return Number(x);
};

// Booleans

// Important value for the interpreter:
// As truthy and falsy values in Scheme are different
// from JavaScript, this will convert the value to Scheme's truthy value.
export const $true = function (b: any): boolean {
  if (b === false) {
    return false;
  }
  return true;
};

export let and = function (...args: any[]): boolean {
  return args.reduce((a, b) => $true(a) && b, true);
};

export let or = function (...args: any[]): boolean {
  return args.reduce((a, b) => $true(a) || b, false);
};

export let not = function (b: any): boolean {
  if (b === false) {
    return true;
  }
  return false;
};

export let booleanQ = function (b: any): boolean {
  return b === true || b === false;
};

export let booleanEQ = function (b1: boolean, b2: boolean): boolean {
  return b1 === b2;
};

// Pairs

// Special function needed by base scm-slang
// to work with lists.
export const $list_to_array = function (l: List): any[] {
  let acc: any = [];
  while (!nullQ(l)) {
    acc.push(car(l as Pair));
    l = cdr(l as Pair);
  }
  return acc;
};

export type Pair = [any, any];
export type List = Pair | null;

export let pairQ = function (p: any): boolean {
  return p instanceof Array && p.length === 2;
};

export let cons = function (car: any, cdr: any): Pair {
  return [car, cdr];
};

export let car = function (p: Pair): any {
  if (p === null) {
    error("car: null pair");
  }
  return p[0];
};

export let cdr = function (p: Pair): any {
  if (p === null) {
    error("cdr: null pair");
  }
  return p[1];
};

export let set_carB = function (p: Pair, val: any): void {
  if (p === null) {
    error("set-car!: null pair");
  }
  p[0] = val;
};

export let set_cdrB = function (p: Pair, val: any): void {
  if (p === null) {
    error("set-cdr!: null pair");
  }
  p[1] = val;
};

export let caar = function (p: Pair): any {
  return car(car(p));
};

export let cadr = function (p: Pair): any {
  return car(cdr(p));
};

export let cdar = function (p: Pair): any {
  return cdr(car(p));
};

export let cddr = function (p: Pair): any {
  return cdr(cdr(p));
};

export let nullQ = function (p: any): boolean {
  return p === null;
};

export let listQ = function (p: any): boolean {
  return p === null ? true : pairQ(p) && listQ(cdr(p));
};

export let make_list = function (n: number, val: any = null): Pair | null {
  let acc: Pair | null = null;
  for (let i = 0; i < n; i++) {
    acc = cons(val, acc);
  }
  return acc;
};

export let list = function (...args: any[]): Pair | null {
  let acc: Pair | null = null;
  for (let i = args.length - 1; i >= 0; i--) {
    acc = cons(args[i], acc);
  }
  return acc;
};

export let list_star = function (...args: any[]): Pair | any {
  let acc: any = args[args.length - 1];
  for (let i = args.length - 2; i >= 0; i--) {
    acc = cons(args[i], acc);
  }
  return acc;
};

export let length = function (p: Pair | null): number {
  let acc = 0;
  while (p !== null) {
    acc++;
    p = cdr(p);
  }
  return acc;
};

export let append = function (...args: (Pair | null)[]): Pair | null {
  if (args.length === 0) {
    return null;
  } else if (args.length === 1) {
    return args[0];
  } else {
    if (args[0] === null) {
      return append(...args.slice(1));
    } else {
      return cons(
        car(args[0] as Pair),
        append(cdr(args[0] as Pair), ...args.slice(1))
      );
    }
  }
};

export let reverse = function (p: Pair | null): Pair | null {
  let acc: Pair | null = null;
  while (p !== null) {
    acc = cons(car(p), acc);
    p = cdr(p);
  }
  return acc;
};

export let list_tail = function (p: Pair | null, n: number): Pair | null {
  if (n === 0) {
    return p;
  } else {
    return list_tail(cdr(p as Pair), n - 1);
  }
};

export let list_ref = function (p: Pair | null, n: number): any {
  return car(list_tail(p, n) as Pair);
};

export let list_setB = function (p: Pair | null, n: number, val: any): void {
  set_carB(list_tail(p, n) as Pair, val);
};

export let memq = function (item: any, p: Pair | null): Pair | null | boolean {
  if (p === null) {
    return false;
  } else if (eqQ(car(p), item)) {
    return p;
  } else {
    return memq(item, cdr(p));
  }
};

export let memv = function (item: any, p: Pair | null): Pair | null | boolean {
  if (p === null) {
    return false;
  } else if (eqvQ(car(p), item)) {
    return p;
  } else {
    return memv(item, cdr(p));
  }
};

export let member = function (
  item: any,
  p: Pair | null
): Pair | null | boolean {
  if (p === null) {
    return false;
  } else if (equalQ(car(p), item)) {
    return p;
  } else {
    return member(item, cdr(p));
  }
};

export let assq = function (item: any, p: Pair | null): Pair | null | boolean {
  if (p === null) {
    return false;
  } else if (eqQ(caar(p), item)) {
    return car(p);
  } else {
    return assq(item, cdr(p));
  }
};

export let assv = function (item: any, p: Pair | null): Pair | null | boolean {
  if (p === null) {
    return false;
  } else if (eqvQ(caar(p), item)) {
    return car(p);
  } else {
    return assv(item, cdr(p));
  }
};

export let assoc = function (item: any, p: Pair | null): Pair | null | boolean {
  if (p === null) {
    return false;
  } else if (equalQ(caar(p), item)) {
    return car(p);
  } else {
    return assoc(item, cdr(p));
  }
};

export let list_copy = function (p: Pair | null): Pair | null {
  if (p === null) {
    return null;
  } else {
    return cons(car(p), list_copy(cdr(p)));
  }
};

// Symbols

export class _Symbol {
  sym: string;
  constructor(sym: string) {
    this.sym = sym;
  }

  toString() {
    return this.sym;
  }

  equals(other: any) {
    return other instanceof _Symbol && this.sym === other.sym;
  }
}

export let symbolQ = function (s: any): boolean {
  return s instanceof _Symbol;
};

export let symbolEQ = function (s1: any, s2: any): boolean {
  return s1 instanceof _Symbol && s2 instanceof _Symbol && s1.equals(s2);
};

export let symbol_Gstring = function (s: _Symbol): string {
  return s.sym;
};

export let string_Gsymbol = function (s: string): _Symbol {
  return new _Symbol(s);
};

// Strings

export let stringQ = function (s: any): boolean {
  return typeof s === "string";
};

export let make_string = function (n: number, ch: string = " "): string {
  let acc = "";
  for (let i = 0; i < n; i++) {
    acc += ch;
  }
  return acc;
};

export let string = function (...args: string[]): string {
  return args.join("");
};

export let string_length = function (s: string): number {
  return s.length;
};

export let string_ref = function (s: string, n: number): string {
  return s[n];
};

// Immutable strings. this does not work.
export let string_setB = function (s: string, n: number, ch: string): void {
  //s[n] = ch;
};

export let stringEQ = function (s1: string, s2: string): boolean {
  return s1 === s2;
};

export let stringLQ = function (s1: string, s2: string): boolean {
  return s1 < s2;
};

export let stringGQ = function (s1: string, s2: string): boolean {
  return s1 > s2;
};

export let stringLEQ = function (s1: string, s2: string): boolean {
  return s1 <= s2;
};

export let stringGEQ = function (s1: string, s2: string): boolean {
  return s1 >= s2;
};

export let substring = function (
  s: string,
  start: number,
  end: number = s.length
): string {
  return s.slice(start, end);
};

export let string_append = function (...args: string[]): string {
  return args.join("");
};

export let string_Glist = function (s: string): Pair | null {
  let acc: Pair | null = null;
  for (let i = s.length - 1; i >= 0; i--) {
    acc = cons(s[i], acc);
  }
  return acc;
};

export let list_Gstring = function (p: Pair | null): string {
  let acc = "";
  while (p !== null) {
    acc += car(p);
    p = cdr(p);
  }
  return acc;
};

export let string_copy = function (s: string): string {
  return s;
};

// Does nothing.
export let string_copyB = function (s: string): string {
  return s;
};

// Does nothing.
export let string_fillB = function (s: string, ch: string): void {
  for (let i = 0; i < s.length; i++) {
    //s[i] = ch;
  }
};

export let string_map = function (f: Function, s: string): string {
  let acc = "";
  for (let i = 0; i < s.length; i++) {
    acc += f(s[i]);
  }
  return acc;
};

export let string_for_each = function (f: Function, s: string): void {
  for (let i = 0; i < s.length; i++) {
    f(s[i]);
  }
};

// Vectors

export type Vector = Array<any>;

export let vectorQ = function (v: any): boolean {
  return v instanceof Array;
};

export let make_vector = function (n: number, fill: any = null): Vector {
  let acc: any[] = [];
  for (let i = 0; i < n; i++) {
    acc.push(fill);
  }
  return acc;
};

export let vector = function (...args: any[]): Vector {
  return args;
};

export let vector_length = function (v: Vector): number {
  return v.length;
};

export let vector_ref = function (v: Vector, n: number): any {
  return v[n];
};

export let vector_setB = function (v: Vector, n: number, item: any): void {
  v[n] = item;
};

export let vector_Glist = function (v: Vector): Pair | null {
  let acc: Pair | null = null;
  for (let i = v.length - 1; i >= 0; i--) {
    acc = cons(v[i], acc);
  }
  return acc;
};

export let list_Gvector = function (p: Pair | null): Vector {
  let acc: any[] = [];
  while (p !== null) {
    acc.push(car(p));
    p = cdr(p);
  }
  return acc;
};

export let vector_Gstring = function (v: Vector): string {
  let acc = "";
  for (let i = 0; i < v.length; i++) {
    acc += v[i];
  }
  return acc;
};

export let string_Gvector = function (s: string): Vector {
  let acc: any[] = [];
  for (let i = 0; i < s.length; i++) {
    acc.push(s[i]);
  }
  return acc;
};

export let vector_copy = function (v: Vector): Vector {
  return [...v];
};

export let vector_copyB = function (
  to: Vector,
  at: number,
  from: Vector,
  start: number | undefined = undefined,
  end: number | undefined = undefined
): Vector {
  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = from.length;
  }
  to.splice(at, end - start, ...from.slice(start, end));
  return to;
};

export let vector_append = function (...args: Vector[]): Vector {
  return args.reduce((a, b) => a.concat(b), []);
};

export let vector_fillB = function (v: Vector, fill: any): void {
  for (let i = 0; i < v.length; i++) {
    v[i] = fill;
  }
};

// Control features

export let procedureQ = function (p: any): boolean {
  return typeof p === "function";
};

export let apply = function (proc: Function, ...args: any[]): any {
  if (!pairQ(args[args.length - 1])) {
    throw new Error("Last argument to apply must be a list");
  }
  let last = args.pop() as Pair;
  args = args.concat($list_to_array(last));
  return proc(...args);
};

export let map = function (
  proc: Function,
  ...args: (Pair | null)[]
): Pair | null {
  const arg: any[] = [];
  for (let j = 0; j < args.length; j++) {
    if (args[j] === null) {
      return null;
    }
    arg.push(car(args[j] as Pair));
    args[j] = cdr(args[j] as Pair);
  }
  return cons(proc(...arg), map(proc, ...args));
};

// Exception handling

export let error = function (msg: string): void {
  throw new Error(msg);
};

// Environments and evaluation

// Input and output

export let newline = function (): void {
  console.log();
};
