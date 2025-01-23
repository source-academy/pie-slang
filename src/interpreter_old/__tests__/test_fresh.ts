import { freshen } from '../fresh';
// Test cases with Symbols
describe("test fresh name functionality", () => {

    it("return fresh name 1", () => {
      // Expected: Symbol('x₁')
      expect(freshen([Symbol('x')], Symbol('x')).toString()).toBe('Symbol(x₁)');
    });
    it("return fresh name 2", () => {
      // Expected: Symbol('x₃')
      expect(freshen([Symbol('x'), Symbol('x₁'), Symbol('x₂')], Symbol('x')).toString()).toBe('Symbol(x₃)');
    });
    it("return fresh name 3", () => {
      // Expected: Symbol('x₂')
      expect(freshen([Symbol('x₁')], Symbol('x₁')).toString()).toBe('Symbol(x₂)');
    });
    it("return fresh name 4", () => {
      // Expected: Symbol('r2d₂')
      expect(freshen([Symbol('r2d'), Symbol('r2d₀'), Symbol('r2d₁')], Symbol('r2d')).toString()).toBe('Symbol(r2d₂)');
    });
    it("return fresh name 5", () => {
      // Expected: Symbol('A')
      expect(freshen([], Symbol('A')).toString()).toBe('Symbol(A)');
    });
  }
);
