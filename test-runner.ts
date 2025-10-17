import { evaluatePie } from './src/pie_interpreter/main.js';

// Test with a simple Pie expression
const testCode = `
(claim zero Nat)
(define zero zero)
(claim one Nat)
(define one (add1 zero))
`;

console.log("Running Pie interpreter...");
try {
  const result = evaluatePie(testCode);
  console.log("Result:");
  console.log(result);
} catch (error) {
  console.error("Error:", error.message);
}