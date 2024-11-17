import { Pair, car, cdr } from "./scheme-base";

export let caaar = function (x: Pair): any {
  return car(car(car(x)));
};

export let caadr = function (x: Pair): any {
  return car(car(cdr(x)));
};

export let cadar = function (x: Pair): any {
  return car(cdr(car(x)));
};

export let caddr = function (x: Pair): any {
  return car(cdr(cdr(x)));
};

export let cdaar = function (x: Pair): any {
  return cdr(car(car(x)));
};

export let cdadr = function (x: Pair): any {
  return cdr(car(cdr(x)));
};

export let cddar = function (x: Pair): any {
  return cdr(cdr(car(x)));
};

export let cdddr = function (x: Pair): any {
  return cdr(cdr(cdr(x)));
};

export let caaaar = function (x: Pair): any {
  return car(car(car(car(x))));
};

export let caaadr = function (x: Pair): any {
  return car(car(car(cdr(x))));
};

export let caadar = function (x: Pair): any {
  return car(car(cdr(car(x))));
};

export let caaddr = function (x: Pair): any {
  return car(car(cdr(cdr(x))));
};

export let cadaar = function (x: Pair): any {
  return car(cdr(car(car(x))));
};

export let cadadr = function (x: Pair): any {
  return car(cdr(car(cdr(x))));
};

export let caddar = function (x: Pair): any {
  return car(cdr(cdr(car(x))));
};

export let cadddr = function (x: Pair): any {
  return car(cdr(cdr(cdr(x))));
};

export let cdaaar = function (x: Pair): any {
  return cdr(car(car(car(x))));
};

export let cdaadr = function (x: Pair): any {
  return cdr(car(car(cdr(x))));
};

export let cdadar = function (x: Pair): any {
  return cdr(car(cdr(car(x))));
};

export let cdaddr = function (x: Pair): any {
  return cdr(car(cdr(cdr(x))));
};

export let cddaar = function (x: Pair): any {
  return cdr(cdr(car(car(x))));
};

export let cddadr = function (x: Pair): any {
  return cdr(cdr(car(cdr(x))));
};

export let cdddar = function (x: Pair): any {
  return cdr(cdr(cdr(car(x))));
};

export let cddddr = function (x: Pair): any {
  return cdr(cdr(cdr(cdr(x))));
};
