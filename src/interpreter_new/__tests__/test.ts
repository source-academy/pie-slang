// import 'jest';

// import {parsePie} from ''

// test("Transforming function type -> to Π", () => {
//   const parsed = parsePie("(the (-> Nat Nat Nat) (lambda (x x) x))");
//   expect(parsed).toEqual(
//     ["the", ["Π", [["x", "Nat"]], ["Π", [["x₁", "Nat"]], "Nat"]], ["λ", ["x", "x"], "x"]]
//   );
// });

// test("", () => {
//   const parsed = parsePie('(the (-> Nat Nat) (λ (z) z))');
//   expect(parsed).toEqual(
//     ["the", ['Π', [["x", 'Nat']], 'Nat'],['λ', ["z"], "z"]]
//   )
// });

// test("Evaluating which-Nat expression", () => {
//   const parsed = parsePie("(which-Nat 1 2 (lambda (x) x))");
//   expect(parsed).toEqual(["the", "Nat", "zero"]);
// });

// test("", () => {
//   const parsed = parsePie("(which-Nat 0 2 (lambda (x) x))");
//   expect(parsed).toEqual(["the", "Nat", ["add1", ["add1", "zero"]]])
// });

// test("Transforming higher-order function type", () => {
//   const parsed = parsePie("(the (-> (-> Nat Nat) Nat Nat) (lambda (f x) (f x)))");
//   expect(parsed).toEqual(
//     ["the", 
//       ["Π", [["x", ["Π", [["x", "Nat"]], "Nat"]]], ["Π", [["x₁", "Nat"]], "Nat"]], 
//       ["λ", ["f"], ["λ", ["x"], ["f", "x"]]]
//     ]
//   );
// });

// test("Evaluating higher-order function with `which-Nat`", () => {
//   const parsed = parsePie(`
//     (the (-> Nat (-> Nat Nat) Nat)
//          (lambda (x f)
//            (which-Nat 2 x f)))
//   `);
//   expect(parsed).toEqual(
//     [
//       "the",
//       [
//         "Π", 
//         [["x", "Nat"]],
//         [
//           "Π", 
//           [["x₁", ["Π", [["x₁", "Nat"]], "Nat"]]], 
//           "Nat"
//         ]
//       ],
//       ["λ", ["x"], ["λ", ["f"], ["f", ["add1", "zero"]]]]
//     ]
//   );
// });

// test("", () => {
//   const parsed = parsePie(`
//     (the (-> Nat (-> Nat Nat) Nat)
//          (lambda (x f)
//            (which-Nat x (add1 (add1 zero)) f)))
//   `);
//   expect(parsed).toEqual(
//     [
//       "the",
//       [
//         "Π", 
//         [["x", "Nat"]],
//         [
//           "Π", 
//           [["x₁", ["Π", [["x₁", "Nat"]], "Nat"]]], 
//           "Nat"
//         ]
//       ],
//       ["λ", ["x"], ["λ", ["f"], ["which-Nat", "x", ["the", "Nat", ["add1", ["add1", "zero"]]] , ["λ", ["n"], ["f", "n"]]]]]
//     ]
//   );
// });

import 'jest';
import * as util from 'util';
import { syntaxParse } from "../parser";


// test("Test parsing result 1", () => {
  const input = `
  (claim step-length   (-> Nat (List Nat) Nat
   Nat))
       
  (define step-length
    (lambda (e es length)
    (add1 length)))`;
  console.log(util.inspect(syntaxParse(input), false, null, true));
// });