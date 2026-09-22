import { PieCommandHandler } from "../pie-command-handler";
import type { PieOutputProvider } from "../pie-output-provider";

jest.mock("vscode", () => ({}), { virtual: true });

type Interpreter = { evaluatePie: (code: string) => string };

function loadInterpreter(): Interpreter {
  const handler = new PieCommandHandler({} as PieOutputProvider);
  return (handler as unknown as { getEvaluatePieFunction(): Interpreter })
    .getEvaluatePieFunction();
}

beforeEach(() => jest.resetModules());

describe("interpreter loading errors", () => {
  const original = Object.assign(new Error("synthetic module load failure"), {
    code: "MODULE_NOT_FOUND",
  });

  test.each<[string, unknown]>([
    ["Error", original],
    ["string", "plain thrown value"],
    ["plain object", { reason: "module initialization failed" }],
  ])(
    "keeps the original thrown %s and unchanged message",
    (_label, thrown) => {
      jest.doMock("./fixtures/interpreter", () => { throw thrown; });
      let caught: unknown;
      try {
        loadInterpreter();
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(Error);
      const error = caught as Error;
      const detail = thrown instanceof Error ? thrown.message : String(thrown);
      expect(error.message).toBe(
        `Could not load Pie interpreter. Make sure the extension is compiled. Error: ${detail}`
      );
      expect(Object.hasOwn(error, "cause")).toBe(true);
      expect(error.cause).toBe(thrown);
      if (thrown instanceof Error) {
        expect((error.cause as Error).stack).toBe(thrown.stack);
      }
    }
  );

  test("retains null thrown when reading the interpreter export", () => {
    // Throw outside Jest's module factory: its loader inspects thrown.code,
    // which would itself fail for null before the handler could catch it.
    jest.doMock("./fixtures/interpreter", () => ({
      get evaluatePie() { throw null; },
    }));
    let caught: unknown;
    try {
      loadInterpreter();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe(
      "Could not load Pie interpreter. Make sure the extension is compiled. Error: null"
    );
    expect(Object.hasOwn(caught as Error, "cause")).toBe(true);
    expect((caught as Error).cause).toBeNull();
  });

  test("retains the missing-export error as the cause", () => {
    jest.doMock("./fixtures/interpreter", () => ({}));
    let caught: unknown;
    try {
      loadInterpreter();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    const error = caught as Error;
    expect(error.message).toContain("evaluatePie function not found in module");
    expect(error.cause).toBeInstanceOf(Error);
    expect((error.cause as Error).message)
      .toBe("evaluatePie function not found in module");
  });

  test("successful loading preserves the interpreter function", () => {
    const evaluatePie = jest.fn((code: string) => `result: ${code}`);
    jest.doMock("./fixtures/interpreter", () => ({ evaluatePie }));
    const interpreter = loadInterpreter();
    expect(interpreter.evaluatePie).toBe(evaluatePie);
    expect(interpreter.evaluatePie("zero")).toBe("result: zero");
  });
});
