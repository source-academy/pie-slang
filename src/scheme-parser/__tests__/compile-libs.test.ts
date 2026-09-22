import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Script } from "node:vm";
import { buildSync } from "esbuild";

let directory: string;
let cli: string;

beforeAll(() => {
  directory = mkdtempSync(path.join(tmpdir(), "pie-encoding-cli-"));
  cli = path.join(directory, "compile-libs.cjs");
  // Exercise the real CLI without relying on stale JS emitted beside TS sources.
  buildSync({
    entryPoints: [path.resolve(__dirname, "../compile-libs.ts")],
    outfile: cli,
    bundle: true,
    platform: "node",
    format: "cjs",
    resolveExtensions: [".ts", ".js", ".json"],
    logLevel: "silent",
  });
});

afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
});

test.each([false, true])("compiles an actual .scm file (explicit output: %s)", explicitOutput => {
  const source = path.join(directory, `input-${explicitOutput}.scm`);
  const output = explicitOutput
    ? path.join(directory, "custom-output.js")
    : source.replace(/\.scm$/, ".js");
  writeFileSync(source, '(define (is-empty? xs) xs) (is-empty? "null?")', "utf8");
  const stdout = execFileSync(process.execPath, [cli, source, ...(explicitOutput ? [output] : [])], {
    encoding: "utf8",
    timeout: 10000,
  });
  expect(stdout).toContain(`${source} has been transpiled to ${output}`);
  const javascript = readFileSync(output, "utf8");
  // Default macro mode uses encoded runtime names but leaves Scheme data as strings.
  expect(javascript).toContain("$scheme_ZXZhbA$61$$61$");
  expect(javascript).toContain("is-empty?");
  expect(javascript).toContain("null?");
  expect(() => new Script(javascript)).not.toThrow();
});
