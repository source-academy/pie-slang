// Delay is defined in the parser itself.

export const force = function (x: Function): any {
  return x();
};

export const promiseQ = function (x: any): boolean {
  return x instanceof Function && x.length === 0;
};
