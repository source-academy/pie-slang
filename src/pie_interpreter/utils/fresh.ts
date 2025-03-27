// Replace normal digits with subscript digits and vice versa
const subscriptReplacements: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉"
}

const nonSubscripts: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9"
}

// Main freshen function
export function freshen(used: string[], x: string): string {
  if (used.some(usedName => usedName === x)) {
    const split = splitName(x);
    return freshenAux(used, split);
  }
  return x;
}


function freshenAux(used: string[], split: [string, number]): string {
  const joined = unsplitName(split);
  if (used.map(sym => sym.toString()).includes(joined.toString())) {
    return freshenAux(used, nextSplitName(split));
  }
  return joined;
}

// Check if a character is a subscript digit
function isSubscriptDigit(c: string): boolean {
  return Object.keys(nonSubscripts).includes(c);
}

// Replaces regular digits in the number with subscript digits
function numberToSubscriptString(n: number): string {
  const subscriptStr = n.toString().split("").map(digit => subscriptReplacements[digit] || digit).join("");
  return subscriptStr;
}

// Replaces subscript digits with regular digits
function subscriptToNumber(str: string): number {
  const replaced = str.split("").map(char => nonSubscripts[char] || char).join("");
  return parseInt(replaced, 10) || 1;
}

// Helper function to split the name (base name and subscript)
function splitNameAux(str: string, i: number): [string, number] {
  if (i < 0) {
    return [str, 0]; // Default case if no subscript is found
  }
  if (isSubscriptDigit(str[i])) {
    return splitNameAux(str, i - 1);
  }
  return [str.substring(0, i + 1), subscriptToNumber(str.substring(i + 1))];
}

// Increments the subscript part of a name
function nextSplitName(split: [string, number]): [string, number] {
  return [split[0], split[1] + 1];
}

// Splits the name into base name and subscript number
function splitName(name: string): [string, number] {

  // Call splitNameAux on the string representation
  const [base, num] = splitNameAux(name, name.length - 1);
  return [base, num];
}

// Joins the base name and subscript into a new name
function unsplitName([base, num]: [string, number]): string {

  // Convert number to subscript string
  const subscriptStr = numberToSubscriptString(num);
  return base + subscriptStr;
}