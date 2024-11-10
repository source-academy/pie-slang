import * as base from "./base";

export * from "./base";
export { infinity, nan } from "./core-math";

// Extracts the arguments from a function as a string array.
// Taken from https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
// Adapted to work on both arrow functions and default functions.
function $args(func: any): string[] {
  return (func + "")
    .replace(/[/][/].*$/gm, "") // strip single-line comments
    .replace(/\s+/g, "") // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, "") // strip multi-line comments
    .split(")", 1)[0] // In case of a default/arrow function, extract the parameters
    .replace(/^[^(]*[(]/, "") // extract the parameters
    .replace(/=[^,]+/g, "") // strip any ES6 defaults
    .split(",")
    .filter(Boolean); // split & filter [""]
}

// Display is defined in js-slang. This helps to format whatever scheme creates first.
export function schemeToString(x: any): string {
  let str: string = "";
  if (x === undefined) {
    str = "undefined";
  } else if (base.promise$63$(x)) {
    str = `#<promise <${base.promise$45$forced$63$(x) ? "evaluated" : "non-evaluated"}>>`;
  } else if (base.circular$45$list$63$(x)) {
    // we should refactor this in the future to use a set to keep track of visited nodes
    // and be able to handle circular references, not just circular lists but perhaps in car position as well
    str = "(";
    let p = x;
    do {
      str += schemeToString(base.car(p));
      p = base.cdr(p);
      if (p !== null) {
        str += " ";
      }
    } while (p !== x);
    str.trimEnd();
    str += "...";
  } else if (base.proper$45$list$63$(x)) {
    str = "(";
    let p = x;
    while (p !== null) {
      str += schemeToString(base.car(p));
      p = base.cdr(p);
      if (p !== null) {
        str += " ";
      }
    }
    str += ")";
  } else if (base.dotted$45$list$63$(x) && base.pair$63$(x)) {
    str = "(";
    let p = x;
    while (base.pair$63$(p)) {
      str = `${str}${schemeToString(base.car(p))} `;
      p = base.cdr(p);
    }
    str = `${str}. ${schemeToString(p)})`;
  } else if (base.vector$63$(x)) {
    str = "#(";
    let v = x;
    for (let i = 0; i < v.length; i++) {
      str += schemeToString(v[i]);
      if (i !== v.length - 1) {
        str += " ";
      }
    }
    str += ")";
  } else if (base.procedure$63$(x)) {
    str = `#<procedure (${$args(x)
      .reduce((a, b) => `${a} ${b.replace("...", ". ")}`, "")
      .trimStart()})>`;
  } else if (base.boolean$63$(x)) {
    str = x ? "#t" : "#f";
  } else {
    str = x.toString();
  }
  return str;
}
