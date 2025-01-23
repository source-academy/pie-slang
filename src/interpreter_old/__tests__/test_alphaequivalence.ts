import { alphaEquiv } from "../alpha";

test('alphaEquiv basic tests', () => {
  expect(alphaEquiv(['λ', [Symbol('x')], Symbol('x')], ['λ', [Symbol('x')], Symbol('x')])).toBe(true);
  // expect(alphaEquiv(['λ', [Symbol('x')], Symbol('x')], ['λ', [Symbol('y')], Symbol('y')])).toBe(true);
  expect(alphaEquiv(['λ', [Symbol('x')], ['λ', [Symbol('y')], Symbol('x')]], ['λ', [Symbol('x')], ['λ', [Symbol('y')], Symbol('x')]])).toBe(true);
  // expect(alphaEquiv(['λ', [Symbol('x')], ['λ', [Symbol('y')], Symbol('x')]], ['λ', [Symbol('y')], ['λ', [Symbol('z')], Symbol('y')]])).toBe(true);
  expect(alphaEquiv(['λ', [Symbol('x')], ['λ', [Symbol('y')], Symbol('x')]], ['λ', [Symbol('y')], ['λ', [Symbol('z')], Symbol('z')]])).toBe(false);
  // expect(alphaEquiv([Symbol('f'), Symbol('x')], [Symbol('f'), Symbol('x')])).toBe(true);
  expect(alphaEquiv([Symbol('f'), Symbol('x')], [Symbol('g'), Symbol('x')])).toBe(false);
});
