"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_js_1 = require("./pie_interpreter/main.js");
// Standalone entry point for the Pie interpreter
console.log("Pie Interpreter - Standalone Mode");
// Test with a simple Pie expression
const testCode = `
(claim zero Nat)
(define zero zero)

(claim one Nat) 
(define one (add1 zero))

(claim two Nat)
(define two (add1 one))

(claim addNat (-> Nat Nat Nat)) 
(define addNat 
  (lambda (x y) 
    (ind-Nat x 
      (lambda (x) Nat)
      y 
      (lambda (n-1 ih) (add1 ih)))))

(addNat two one)
`;
try {
    console.log("\n--- Evaluating Pie Code ---");
    const result = (0, main_js_1.evaluatePie)(testCode);
    console.log(result);
}
catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
        console.error("Stack:", error.stack);
    }
}
//# sourceMappingURL=standalone.js.map