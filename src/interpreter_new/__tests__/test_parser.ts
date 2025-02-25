import 'jest';
import * as util from 'util';
import { syntaxParse } from "../parser";


test("Test parsing result 1", () => {
  const input = `
  (claim step-length   (-> Nat (List Nat) Nat
   Nat))
       
  (define step-length
    (lambda (e es length)
    (add1 length)))`;
  console.log(util.inspect(syntaxParse(input), false, null, true));
});