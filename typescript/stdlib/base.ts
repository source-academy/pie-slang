import * as core from "./core";
import { schemeToString } from "./source-scheme-library";

// error definition follows sicp package
export const error: Function = (value: any, ...strs: string[]) => {
  const output =
    (strs[0] === undefined ? "" : strs[0] + "") + schemeToString(value);
  throw new Error(output);
};

// delay and force operations

// in scm-slang, we will represent promises as a list, consisting of a promise tag
// and a pair of whether the promise has already been evaluated and the thunk itself.
// this is similar to the way promises are implemented in chibi-scheme.
// the boolean will be used to check if the promise has previously been forced.
// currently based on SRFI 155.

export const make$45$promise: Function = (thunk: Function) => {
  return list(cons(false, thunk), new _Symbol("promise"));
};

export const promise$63$: Function = (p: any) => {
  return (
    pair$63$(p) &&
    pair$63$(cdr(p)) &&
    symbol$61$$63$(cadr(p), new _Symbol("promise"))
  );
};

export const force: Function = (p: any) => {
  if (!promise$63$(p)) {
    error("force: expected promise");
  }

  // get the pair of the promise
  const promise_pair = car(p);

  // if previously forced
  if (car(promise_pair)) {
    return cdr(promise_pair);
  }

  // else force the promise
  const result = cdr(promise_pair)();

  // and update the promise
  set$45$car$33$(promise_pair, true);
  set$45$cdr$33$(promise_pair, result);
  return result;
};

export const promise$45$forced$63$: Function = (p: any) => {
  if (!promise$63$(p)) {
    return false;
  }
  return caar(p);
};

// procedural operations

const identity: Function = (x: any) => x;
export const compose: Function = (...fs: Function[]) => {
  return fs.reduce((f, g) => (x: any) => f(g(x)), identity);
};
export const apply: Function = (fun: Function, ...args: any[]): any => {
  // the last argument must be a list.
  // we need to convert it into an array,
  const lastList = args.pop();
  if (!list$63$(lastList)) {
    error("apply: last argument must be a list");
  }
  // convert the list into an array.
  const lastArray: any[] = [];
  let current = lastList;
  while (current !== null) {
    lastArray.push(car(current));
    current = cdr(current);
  }
  // append the array to the rest of the arguments.
  const allArgs = args.concat(lastArray);
  return fun(...allArgs);
};

export const procedure$63$: Function = (p: any) => typeof p === "function";

// boolean operations

export const boolean$63$: (a: any) => boolean = core.is_boolean;
export const truthy: (a: any) => boolean = core.truthy;
const atomic_or: (a: any, b: any) => boolean = core.atomic_or;
const atomic_and: (a: any, b: any) => boolean = core.atomic_and;

export const not: Function = core.atomic_not;
export const and: Function = (...args: any[]) => args.reduce(atomic_and, true);
export const or: Function = (...args: any[]) => args.reduce(atomic_or, false);
export const boolean$61$$63$: Function = (p1: any, p2: any) =>
  and(boolean$63$(p1), boolean$63$(p2), or(and(p1, p2), not(or(p1, p2))));

// math operations

export const make_number: Function = core.make_number;
export const number$63$: Function = core.is_number;
export const integer$63$: Function = core.is_integer;
export const rational$63$: Function = core.is_rational;
export const real$63$: Function = core.is_real;
export const complex$63$: Function = core.is_complex;
export const exact$63$: Function = core.is_exact;
export const inexact$63$: Function = core.is_inexact;
const atomic_negate: Function = core.atomic_negate;
const atomic_inverse: Function = core.atomic_inverse;
const atomic_less_than: Function = core.atomic_less_than;
const atomic_less_than_or_equals: Function = core.atomic_less_than_or_equals;
const atomic_greater_than: Function = core.atomic_greater_than;
const atomic_greater_than_or_equals: Function =
  core.atomic_greater_than_or_equals;
const atomic_equals: (a: core.SchemeNumber, b: core.SchemeNumber) => boolean =
  core.atomic_equals;
const atomic_add: (
  a: core.SchemeNumber,
  b: core.SchemeNumber
) => core.SchemeNumber = core.atomic_add;
const atomic_subtract: (
  a: core.SchemeNumber,
  b: core.SchemeNumber
) => core.SchemeNumber = core.atomic_subtract;
const atomic_multiply: (
  a: core.SchemeNumber,
  b: core.SchemeNumber
) => core.SchemeNumber = core.atomic_multiply;
const atomic_divide: (
  a: core.SchemeNumber,
  b: core.SchemeNumber
) => core.SchemeNumber = core.atomic_divide;

export const $61$: Function = (
  first: core.SchemeNumber,
  second: core.SchemeNumber,
  ...rest: core.SchemeNumber[]
) => {
  if (rest.length === 0) {
    return atomic_equals(first, second);
  }

  return atomic_equals(first, second) && $61$(second, ...rest);
};

export const $60$: Function = (
  first: core.SchemeNumber,
  second: core.SchemeNumber,
  ...rest: core.SchemeNumber[]
) => {
  if (rest.length === 0) {
    return atomic_less_than(first, second);
  }

  return atomic_less_than(first, second) && $60$(second, ...rest);
};

export const $60$$61$: Function = (
  first: core.SchemeNumber,
  second: core.SchemeNumber,
  ...rest: core.SchemeNumber[]
) => {
  if (rest.length === 0) {
    return atomic_less_than_or_equals(first, second);
  }

  return atomic_less_than_or_equals(first, second) && $60$$61$(second, ...rest);
};

export const $62$: Function = (
  first: core.SchemeNumber,
  second: core.SchemeNumber,
  ...rest: core.SchemeNumber[]
) => {
  if (rest.length === 0) {
    return atomic_greater_than(first, second);
  }

  return atomic_greater_than(first, second) && $62$(second, ...rest);
};

export const $62$$61$: Function = (
  first: core.SchemeNumber,
  second: core.SchemeNumber,
  ...rest: core.SchemeNumber[]
) => {
  if (rest.length === 0) {
    return atomic_greater_than_or_equals(first, second);
  }

  return (
    atomic_greater_than_or_equals(first, second) && $62$$61$(second, ...rest)
  );
};

export const zero$63$: Function = (n: core.SchemeNumber) =>
  $61$(n, make_number(0));
export const infinity$63$: Function = (n: core.SchemeNumber) =>
  $61$(n, core.SchemeReal.INFINITY) || $61$(n, core.SchemeReal.NEG_INFINITY);
export const nan$63$: Function = (n: core.SchemeNumber) =>
  n === core.SchemeReal.NAN;
export const positive$63$: Function = (n: core.SchemeNumber) =>
  $62$(n, make_number(0));
export const negative$63$: Function = (n: core.SchemeNumber) =>
  $60$(n, make_number(0));
export const max: Function = (
  first: core.SchemeNumber,
  ...args: core.SchemeNumber[]
) =>
  args.reduce(
    (max, current, index, array) =>
      atomic_greater_than(current, max) ? current : max,
    first
  );
export const min: Function = (
  first: core.SchemeNumber,
  ...args: core.SchemeNumber[]
) =>
  args.reduce(
    (min, current, index, array) =>
      atomic_less_than(current, min) ? current : min,
    first
  );
export const $43$: Function = (...args: core.SchemeNumber[]) =>
  args.reduce(atomic_add, make_number(0));
export const $45$: Function = (
  first: core.SchemeNumber,
  ...args: core.SchemeNumber[]
) =>
  args.length === 0
    ? atomic_negate(first)
    : atomic_subtract(first, $43$(...args));
export const $42$: Function = (...args: core.SchemeNumber[]) =>
  args.reduce(atomic_multiply, make_number(1));
export const $47$: Function = (
  first: core.SchemeNumber,
  ...args: core.SchemeNumber[]
) =>
  args.length === 0
    ? atomic_inverse(first)
    : atomic_divide(first, $42$(...args));
export const abs: Function = (n: core.SchemeNumber[]) =>
  negative$63$(n) ? atomic_negate(n) : n;

export const quotient: Function = (
  a: core.SchemeInteger,
  b: core.SchemeInteger
) => {
  if (!integer$63$(a) || !integer$63$(b)) {
    error("quotient: expected integers");
  }
  if (atomic_equals(b, make_number(0))) {
    error("quotient: division by zero");
  }

  let remainder = modulo(a, b);

  let quotient = atomic_divide(
    atomic_subtract(a, remainder),
    b
  ) as core.SchemeInteger;

  if (atomic_equals(remainder, make_number(0))) {
    return quotient;
  }

  // if both a and b are same-signed, we are done
  if (
    atomic_less_than(a, make_number(0)) &&
    atomic_less_than(b, make_number(0))
  ) {
    return quotient;
  }

  if (
    atomic_greater_than(a, make_number(0)) &&
    atomic_greater_than(b, make_number(0))
  ) {
    return quotient;
  }

  // if a is negative, we need to increment the quotient
  // to account for the remainder
  if (atomic_less_than(a, make_number(0))) {
    quotient = atomic_add(quotient, make_number(1)) as core.SchemeInteger;
  }

  // if b is negative, we need to decrement the quotient
  // to account for the remainder
  if (atomic_less_than(b, make_number(0))) {
    quotient = atomic_add(quotient, make_number(1)) as core.SchemeInteger;
  }

  return quotient;
};

export const remainder: Function = (
  a: core.SchemeInteger,
  b: core.SchemeInteger
) => {
  if (!integer$63$(a) || !integer$63$(b)) {
    error("remainder: expected integers");
  }
  if (atomic_equals(b, make_number(0))) {
    error("remainder: division by zero");
  }

  let q = quotient(a, b);

  let remainder = atomic_subtract(
    a,
    atomic_multiply(q, b)
  ) as core.SchemeInteger;

  return remainder;
};

export const modulo: Function = (
  a: core.SchemeInteger,
  b: core.SchemeInteger
) => {
  if (!integer$63$(a) || !integer$63$(b)) {
    error("modulo: expected integers");
  }
  if (atomic_equals(b, make_number(0))) {
    error("modulo: division by zero");
  }

  let working = a;

  while (atomic_greater_than_or_equals(abs(working), abs(b))) {
    if (atomic_less_than(working, make_number(0))) {
      if (atomic_less_than(b, make_number(0))) {
        working = atomic_subtract(working, b) as core.SchemeInteger;
      } else {
        working = atomic_add(working, b) as core.SchemeInteger;
      }
    } else {
      if (atomic_less_than(b, make_number(0))) {
        working = atomic_add(working, b) as core.SchemeInteger;
      } else {
        working = atomic_subtract(working, b) as core.SchemeInteger;
      }
    }
  }

  // we need to deal with the sign of the result
  // in 4 separate cases
  if (atomic_less_than(working, make_number(0))) {
    if (atomic_less_than(b, make_number(0))) {
      // both are negative
      // do nothing
      return working;
    } else {
      // b is positive
      // result needs to be positive - add b to the working
      return atomic_add(working, b) as core.SchemeInteger;
    }
  } else {
    if (atomic_less_than(b, make_number(0))) {
      // b is negative
      // result needs to be negative - add b to the working
      return atomic_add(working, b) as core.SchemeInteger;
    } else {
      // both are positive
      // do nothing
      return working;
    }
  }
};

function atomic_gcd(
  a: core.SchemeInteger,
  b: core.SchemeInteger
): core.SchemeInteger {
  if (atomic_equals(b, make_number(0))) {
    return abs(a);
  }
  return abs(atomic_gcd(b, remainder(a, b)));
}

export const gcd: Function = (...vals: core.SchemeInteger[]) => {
  if (vals.length === 0) {
    return core.SchemeInteger.EXACT_ZERO;
  }

  if (vals.length === 1) {
    return vals[0];
  }

  return vals.reduce(atomic_gcd);
};

function atomic_lcm(
  a: core.SchemeInteger,
  b: core.SchemeInteger
): core.SchemeInteger {
  return abs(atomic_multiply(quotient(a, gcd(a, b)), b)) as core.SchemeInteger;
}

export const lcm: Function = (...vals: core.SchemeInteger[]) => {
  if (vals.length === 0) {
    return core.SchemeInteger.build(1);
  }

  if (vals.length === 1) {
    return vals[0];
  }

  return vals.reduce(atomic_lcm);
};

export const odd$63$: Function = core.odd$63$;
export const even$63$: Function = core.even$63$;

export const numerator: Function = core.numerator;
export const denominator: Function = core.denominator;
export const exact: Function = core.exact;
export const inexact: Function = core.inexact;

export const square: Function = (n: core.SchemeNumber) => $42$(n, n);
export const expt: Function = core.expt;
export const exp: Function = core.exp;
export const log: Function = core.log;
export const sqrt: Function = core.sqrt;
export const sin: Function = core.sin;
export const cos: Function = core.cos;
export const tan: Function = core.tan;
export const asin: Function = core.asin;
export const acos: Function = core.acos;
export const atan: Function = core.atan;
export const floor: Function = core.floor;
export const ceiling: Function = core.ceiling;
export const truncate: Function = core.truncate;
export const round: Function = core.round;
export const make$45$rectangular: Function = core.make$45$rectangular;
export const make$45$polar: Function = core.make$45$polar;
export const real$45$part: Function = core.real$45$part;
export const imag$45$part: Function = core.imag$45$part;
export const magnitude: Function = core.magnitude;
export const angle: Function = core.angle;

export const PI = core.PI;
export const E = core.E;
export const SQRT2 = core.SQRT2;
export const SQRT1$47$2 = core.SQRT1_2;
export const LN2 = core.LN2;
export const LN10 = core.LN10;
export const LOG2E = core.LOG2E;
export const LOG10E = core.LOG10E;

// pair operations

export const cons: Function = core.pair;
export const xcons: Function = (x: any, y: any) => core.pair(y, x);

// low level, but it works.
// follows SICP's implementation.
const array_test: Function = (p: any) => {
  if (Array.isArray === undefined) {
    return p instanceof Array;
  }
  return Array.isArray(p);
};
export const pair$63$: Function = (p: any) =>
  array_test(p) && p.length === 2 && p.pair === true;
export const not$45$pair$63$: Function = compose(not, pair$63$);
export const set$45$car$33$: Function = (p: core.Pair | core.List, v: any) => {
  if (pair$63$(p)) {
    (p as core.Pair)[0] = v;
    return;
  }
  error("set-car!: expected pair");
};
export const set$45$cdr$33$: Function = (p: core.Pair | core.List, v: any) => {
  if (pair$63$(p)) {
    (p as core.Pair)[1] = v;
    return;
  }
  error("set-cdr!: expected pair");
};

// cxr operations

export const car: (p: core.Pair | core.List) => any = (
  p: core.Pair | core.List
) => {
  if (pair$63$(p)) {
    return (p as core.Pair)[0];
  }
  error("car: expected pair");
};
export const cdr: (p: core.Pair | core.List) => any = (
  p: core.Pair | core.List
) => {
  if (pair$63$(p)) {
    return (p as core.Pair)[1];
  }
  error("cdr: expected pair");
};
export const caar: Function = compose(car, car);
export const cadr: Function = compose(car, cdr);
export const cdar: Function = compose(cdr, car);
export const cddr: Function = compose(cdr, cdr);
export const caaar: Function = compose(car, caar);
export const caadr: Function = compose(car, cadr);
export const cadar: Function = compose(car, cdar);
export const caddr: Function = compose(car, cddr);
export const cdaar: Function = compose(cdr, caar);
export const cdadr: Function = compose(cdr, cadr);
export const cddar: Function = compose(cdr, cdar);
export const cdddr: Function = compose(cdr, cddr);
export const caaaar: Function = compose(car, caaar);
export const caaadr: Function = compose(car, caadr);
export const caadar: Function = compose(car, cadar);
export const caaddr: Function = compose(car, caddr);
export const cadaar: Function = compose(car, cdaar);
export const cadadr: Function = compose(car, cdadr);
export const caddar: Function = compose(car, cddar);
export const cadddr: Function = compose(car, cdddr);
export const cdaaar: Function = compose(cdr, caaar);
export const cdaadr: Function = compose(cdr, caadr);
export const cdadar: Function = compose(cdr, cadar);
export const cdaddr: Function = compose(cdr, caddr);
export const cddaar: Function = compose(cdr, cadaar);
export const cddadr: Function = compose(cdr, cadadr);
export const cdddar: Function = compose(cdr, caddar);
export const cddddr: Function = compose(cdr, cadddr);

// list operations (SRFI-1)

export const list: Function = (...args: any[]) => {
  if (args.length === 0) {
    return null;
  }
  return cons(args[0], list(...args.slice(1)));
};
export const null$63$: Function = (xs: core.List) => xs === null;
export const list$42$: Function = (curr: any, ...rest: any[]) =>
  rest.length === 0 ? curr : cons(curr, list$42$(...rest));
export const cons$42$: Function = list$42$;
export const make$45$list: Function = (
  n: core.SchemeNumber,
  v: any = make_number(0)
) =>
  $61$(n, make_number(0))
    ? null
    : cons(v, make$45$list(atomic_subtract(n, make_number(1)), v));
export const list$45$tabulate: Function = (
  n: core.SchemeNumber,
  f: (a: core.SchemeNumber) => any
) =>
  $61$(n, make_number(0))
    ? null
    : cons(f(n), list$45$tabulate(atomic_subtract(n, make_number(1)), f));

export const list$45$tail: Function = (xs: core.List, k: core.SchemeNumber) =>
  $61$(k, make_number(0)) ? xs : list$45$tail(cdr(xs), $45$(k, make_number(1)));
export const list$45$ref: Function = (xs: core.List, k: core.SchemeNumber) =>
  car(list$45$tail(xs, k));

export const last: Function = (xs: core.List) =>
  null$63$(xs)
    ? error("last: empty list")
    : null$63$(cdr(xs))
      ? car(xs)
      : last(cdr(xs));
export const last$45$pair: Function = (xs: core.List) =>
  null$63$(xs)
    ? error("last-pair: empty list")
    : null$63$(cdr(xs))
      ? xs
      : last$45$pair(cdr(xs));

export const circular$45$list: Function = (...args: any[]) => {
  const normal_list = list(...args);
  if (null$63$(normal_list)) {
    return normal_list;
  }
  // else set the last pair to the list
  set$45$cdr$33$(last$45$pair(normal_list), normal_list);
  return normal_list;
};

export const first: Function = car;
export const second: Function = cadr;
export const third: Function = caddr;
export const fourth: Function = cadddr;
export const fifth: Function = compose(car, cddddr);
export const sixth: Function = compose(cadr, cddddr);
export const seventh: Function = compose(caddr, cddddr);
export const eighth: Function = compose(cadddr, cddddr);
export const ninth: Function = compose(car, cddddr, cddddr);
export const tenth: Function = compose(cadr, cddddr, cddddr);

export const list$45$set$33$: Function = (
  xs: core.List,
  k: core.SchemeNumber,
  v: any
) => set$45$car$33$(list$45$tail(xs, k), v);

export const circular$45$list$63$: Function = (cxs: any) => {
  function c_list_helper(xs: core.List, ys: core.List): boolean {
    // we shall do this with the fast and slow pointer method
    if (null$63$(xs) || null$63$(ys)) {
      return false;
    }

    if (not$45$pair$63$(xs) || not$45$pair$63$(ys)) {
      return false;
    }

    if (not$45$pair$63$(cdr(ys))) {
      return false;
    }

    if (xs === ys) {
      return true;
    }

    return c_list_helper(cdr(xs), cddr(ys));
  }

  if (null$63$(cxs) || not$45$pair$63$(cxs)) {
    return false;
  }

  return c_list_helper(cxs, cdr(cxs));
};

export const proper$45$list$63$: Function = (pxs: any) => {
  function is_list(xs: core.List): boolean {
    if (null$63$(xs)) {
      return true;
    }
    if (not$45$pair$63$(xs)) {
      return false;
    }
    return is_list(cdr(xs));
  }
  return !circular$45$list$63$(pxs) && is_list(pxs);
};
export const dotted$45$list$63$: Function = (dxs: any) =>
  !proper$45$list$63$(dxs) && !circular$45$list$63$(dxs);

export const null$45$list$63$: Function = null$63$;

export const list$63$: Function = proper$45$list$63$;

export const filter: Function = (pred: Function, xs: core.List) =>
  null$63$(xs)
    ? null
    : pred(car(xs))
      ? cons(car(xs), filter(pred, cdr(xs)))
      : filter(pred, cdr(xs));

export const any: Function = (pred: Function, xs: core.List) =>
  null$63$(xs) ? false : pred(car(xs)) ? true : any(pred, cdr(xs));

export const map: Function = (
  f: Function,
  xs: core.List,
  ...rest: core.List[]
) => {
  const all_lists = [xs, ...rest];
  return any(null$63$, core.vector$45$$62$list(all_lists))
    ? null
    : cons(f(...all_lists.map(car)), map(f, ...all_lists.map(cdr)));
};

export const fold: Function = (
  f: Function,
  acc: any,
  xs: core.List,
  ...rest: core.List[]
) => {
  const all_lists = [xs, ...rest];
  return any(null$63$, core.vector$45$$62$list(all_lists))
    ? acc
    : fold(f, f(acc, ...all_lists.map(car)), ...all_lists.map(cdr));
};

export const fold$45$left: Function = fold;

export const fold$45$right: Function = (
  f: Function,
  acc: any,
  xs: core.List,
  ...rest: core.List[]
) => {
  const all_lists = [xs, ...rest];
  return any(null$63$, core.vector$45$$62$list(all_lists))
    ? acc
    : f(...all_lists.map(car), fold$45$right(f, acc, ...all_lists.map(cdr)));
};

export const reduce: Function = (f: Function, ridentity: any, xs: core.List) =>
  null$63$(xs) ? ridentity : fold(f, car(xs), cdr(xs));

export const reduce$45$left: Function = reduce;

export const reduce$45$right: Function = (
  f: Function,
  ridentity: any,
  xs: core.List
) => (null$63$(xs) ? ridentity : fold$45$right(f, car(xs), cdr(xs)));

export const list$61$: Function = (
  elt: (x: any, y: any) => boolean,
  ...rest: core.List[]
) => {
  if (rest.length === 0 || rest.length === 1) {
    return true;
  }

  const first = rest[0];
  const next = rest[1];

  const next_rest = rest.slice(1);

  return elt(first, next) && list$61$(elt, ...next_rest);
};

export const list$45$copy: Function = (xs: core.List) =>
  fold$45$right(cons, null, xs);

export const length: Function = (xs: core.List) =>
  fold$45$left(
    (acc: core.SchemeNumber, _: any) => atomic_add(acc, make_number(1)),
    make_number(0),
    xs
  );

export const length$43$: Function = (xs: core.List) =>
  circular$45$list$63$(xs) ? error("length: infinite list") : length(xs);

export const append: Function = (...xss: core.List[]) => {
  if (xss.length === 0) {
    return null;
  }

  const first = xss[0];
  const rest = xss.slice(1);

  if (null$63$(first)) {
    return append(...rest);
  }

  return cons(car(first), append(cdr(first), ...rest));
};

export const concatenate: Function = (xss: core.List) => apply(append, xss);

export const reverse: Function = (xs: core.List) =>
  fold$45$left(xcons, null, xs);

export const take: Function = (xs: core.List, i: core.SchemeNumber) => {
  if ($61$(i, make_number(0))) {
    return null;
  } else {
    return cons(car(xs), take(cdr(xs), atomic_subtract(i, make_number(1))));
  }
};

export const take$45$right: Function = (
  xs: core.List,
  i: core.SchemeNumber
) => {
  const reversed_list = reverse(xs);
  return reverse(take(reversed_list, i));
};

export const drop: Function = (xs: core.List, i: core.SchemeNumber) => {
  if ($61$(i, make_number(0))) {
    return xs;
  } else {
    return drop(cdr(xs), atomic_subtract(i, make_number(1)));
  }
};

export const drop$45$right: Function = (
  xs: core.List,
  i: core.SchemeNumber
) => {
  const reversed_list = reverse(xs);
  return reverse(drop(reversed_list, i));
};

// splice resolution

class SpliceMarker {
  value: core.List;
  constructor(value: core.List) {
    this.value = value;
  }
}

export const $36$make$45$splice: Function = (xs: core.List) =>
  new SpliceMarker(xs);

// at runtime, splices the list into the parent list.
export const $36$resolve$45$splice: Function = (xs: core.List) => {
  if (null$63$(xs)) {
    return null;
  }

  const first = car(xs);
  const rest = cdr(xs);

  if (first instanceof SpliceMarker) {
    if (!list$63$(first.value)) {
      error("splice: expected list");
    }
    return append(first.value, $36$resolve$45$splice(rest));
  } else {
    return cons(first, $36$resolve$45$splice(rest));
  }
};

// vectors (SRFI-133)

export const make$45$vector: Function = (
  size: core.SchemeNumber,
  fill?: any
) => {
  const vector = new Array(size);
  if (fill !== undefined) {
    vector.fill(fill);
  }
  return vector;
};

export const vector: Function = (...args: any[]) => args;

// vector-unfold

// vector-unfold-right

// vector-copy

// vector-append

// vector-concatenate

// vector-append-subvectors

export const vector$63$: Function = (v: any) => Array.isArray(v);

export const vector$45$empty$63$: Function = (v: any[]) =>
  vector$63$(v) && v.length === 0;

// vector=

export const vector$45$ref: Function = (v: any[], i: core.SchemeNumber) => {
  const index = core.coerce_to_number(i);
  if (index < 0 || index >= v.length) {
    error("vector-ref: index out of bounds");
  }
  return v[index];
};

export const vector$45$length: Function = (v: any[]) => make_number(v.length);

// all iteration functions not implemented yet

// all search functions not implemented yet

export const vector$45$set$33$: Function = (
  v: any[],
  i: core.SchemeNumber,
  x: any
) => {
  const index = core.coerce_to_number(i);
  if (index < 0 || index >= v.length) {
    error("vector-set!: index out of bounds");
  }
  v[index] = x;
};

export const vector$45$$62$list = core.vector$45$$62$list;

export const list$45$$62$vector = (l: core.List) => {
  const arr: any[] = [];
  let current = l;
  while (current !== null) {
    arr.push(car(current));
    current = cdr(current);
  }
  return arr;
};

export const vector$45$fill$33$: Function = (
  v: any[],
  fill: any,
  start?: core.SchemeNumber,
  end?: core.SchemeNumber
) => {
  const s = start === undefined ? 0 : core.coerce_to_number(start);
  const e = end === undefined ? v.length : core.coerce_to_number(end);
  v.fill(fill, s, e);
};

// symbols

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

export const symbol$63$ = function (s: any): boolean {
  return s instanceof _Symbol;
};

export const symbol$61$$63$ = function (s1: any, s2: any): boolean {
  return s1 instanceof _Symbol && s2 instanceof _Symbol && s1.equals(s2);
};

export const string$45$$62$symbol = (s: string) => new _Symbol(s);

// equality predicates

export const eq$63$ = function (x: any, y: any): boolean {
  if (symbol$63$(x) && symbol$63$(y)) {
    return x.sym === y.sym;
  } else if (number$63$(x) && number$63$(y)) {
    return $61$(x, y);
  } else {
    return x === y;
  }
};

export const eqv$63$ = eq$63$;

export const equal$63$ = function (x: any, y: any): boolean {
  if (x === y) {
    return true;
  } else if (number$63$(x) && number$63$(y)) {
    return $61$(x, y);
  } else if (pair$63$(x) && pair$63$(y)) {
    return equal$63$(car(x), car(y)) && equal$63$(cdr(x), cdr(y));
  } else if (symbol$63$(x) && symbol$63$(y)) {
    return x.sym === y.sym;
  } else if (vector$63$(x) && vector$63$(y)) {
    if (vector$45$length(x) !== vector$45$length(y)) {
      return false;
    }
    for (let i = 0; i < vector$45$length(x); i++) {
      if (!equal$63$(x[i], y[i])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};

// string operations

export const string$63$: Function = (s: any) => typeof s === "string";

export const make$45$string: Function = (
  n: core.SchemeNumber,
  ch: string = " "
) => {
  // make sure that the character is a single character
  if (ch.length !== 1) {
    error("make-string: expected single character");
  }

  let result = "";

  for (let i = 0; i < core.coerce_to_number(n); i++) {
    result += ch;
  }

  return result;
};

export const string = (...args: string[]) => args.join("");

export const string$45$length: Function = (s: string) =>
  make_number(String(s.length));

export const string$45$ref: Function = (s: string, i: core.SchemeNumber) => {
  const index = core.coerce_to_number(i);
  if (index < 0 || index >= s.length) {
    error("string-ref: index out of bounds");
  }
  return s[index];
};

export const string$61$$63$: Function = (s1: string, s2: string) => s1 === s2;

export const string$60$$63$: Function = (s1: string, s2: string) => s1 < s2;

export const string$62$$63$: Function = (s1: string, s2: string) => s1 > s2;

export const string$60$$61$$63$: Function = (s1: string, s2: string) =>
  s1 <= s2;

export const string$62$$61$$63$: Function = (s1: string, s2: string) =>
  s1 >= s2;

export const substring: Function = (
  s: string,
  start: core.SchemeNumber,
  end?: core.SchemeNumber
) => {
  const s_start = core.coerce_to_number(start);
  const s_end = end === undefined ? s.length : core.coerce_to_number(end);
  if (s_start < 0 || s_end > s.length || s_start > s_end) {
    error("substring: index out of bounds");
  }
  return s.substring(s_start, s_end);
};

export const string$45$append: Function = string;

export const string$45$copy: Function = (s: string) => s;

export const string$45$map: Function = (f: Function, s: string) => {
  let result = "";
  for (let i = 0; i < s.length; i++) {
    result += f(s[i]);
  }
  return result;
};

export const string$45$for$45$each: Function = (f: Function, s: string) => {
  for (let i = 0; i < s.length; i++) {
    f(s[i]);
  }
};

export const string$45$$62$number: Function = (s: string) => {
  try {
    return make_number(s);
  } catch (e) {
    error("string->number: invalid number");
  }
};

export const number$45$$62$string: Function = (n: core.SchemeNumber) =>
  n.toString();

export const string$45$$62$list: Function = (s: string) => {
  let result = null;
  for (let i = s.length - 1; i >= 0; i--) {
    result = cons(s[i], result);
  }
  return result;
};

export const list$45$$62$string: Function = (l: core.List) => {
  let result = "";
  let current = l;
  while (current !== null) {
    result += String(car(current));
    current = cdr(current);
  }
  return result;
};
