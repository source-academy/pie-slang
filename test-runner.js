"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_js_1 = require("./src/pie_interpreter/main.js");
// Test with a simple Pie expression
var testCode = "\n(claim zero Nat)\n(define zero zero)\n(claim one Nat)\n(define one (add1 zero))\n";
console.log("Running Pie interpreter...");
try {
    var result = (0, main_js_1.evaluatePie)(testCode);
    console.log("Result:");
    console.log(result);
}
catch (error) {
    console.error("Error:", error.message);
}
