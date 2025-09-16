"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
const main_1 = require("../main");
describe("and tests", () => {
    it("trivial", () => {
        const str = `
(claim test_and
  (Pair Nat Nat))

(define test_and
  (cons zero zero))`;
        console.log((0, main_1.evaluatePie)(str));
    });
    it("trivial tactic ver0", () => {
        const str = `(claim test_and
  (Pair Nat Nat))

(define-tactically test_and
     ((exists zero n)
      (exact zero))) `;
        console.log((0, main_1.evaluatePie)(str));
    });
    it("trivial tactic ver1", () => {
        const str = `(claim test_and
  (Pair Nat Nat))

(define-tactically test_and
     ((split)
      (exact zero)
      (exact zero))) `;
        console.log((0, main_1.evaluatePie)(str));
    });
});
//# sourceMappingURL=test_and.js.map