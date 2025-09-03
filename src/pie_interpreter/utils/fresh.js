"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshen = freshen;
// Replace normal digits with subscript digits and vice versa
var subscriptReplacements = {
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
};
var nonSubscripts = {
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
};
// Main freshen function
function freshen(used, x) {
    if (used.some(function (usedName) { return usedName === x; })) {
        var split = splitName(x);
        return freshenAux(used, split);
    }
    return x;
}
function freshenAux(used, split) {
    var joined = unsplitName(split);
    if (used.map(function (sym) { return sym.toString(); }).includes(joined.toString())) {
        return freshenAux(used, nextSplitName(split));
    }
    return joined;
}
// Check if a character is a subscript digit
function isSubscriptDigit(c) {
    return Object.keys(nonSubscripts).includes(c);
}
// Replaces regular digits in the number with subscript digits
function numberToSubscriptString(n) {
    var subscriptStr = n.toString().split("").map(function (digit) { return subscriptReplacements[digit] || digit; }).join("");
    return subscriptStr;
}
// Replaces subscript digits with regular digits
function subscriptToNumber(str) {
    var replaced = str.split("").map(function (char) { return nonSubscripts[char] || char; }).join("");
    return parseInt(replaced, 10) || 1;
}
// Helper function to split the name (base name and subscript)
function splitNameAux(str, i) {
    if (i < 0) {
        return [str, 0]; // Default case if no subscript is found
    }
    if (isSubscriptDigit(str[i])) {
        return splitNameAux(str, i - 1);
    }
    return [str.substring(0, i + 1), subscriptToNumber(str.substring(i + 1))];
}
// Increments the subscript part of a name
function nextSplitName(split) {
    return [split[0], split[1] + 1];
}
// Splits the name into base name and subscript number
function splitName(name) {
    // Call splitNameAux on the string representation
    var _a = splitNameAux(name, name.length - 1), base = _a[0], num = _a[1];
    return [base, num];
}
// Joins the base name and subscript into a new name
function unsplitName(_a) {
    var base = _a[0], num = _a[1];
    // Convert number to subscript string
    var subscriptStr = numberToSubscriptString(num);
    return base + subscriptStr;
}
