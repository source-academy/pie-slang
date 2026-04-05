import { describe, it, expect } from "vitest";
import { TACTICS } from "../features/proof-editor/data/tactics";
import { TACTIC_REQUIREMENTS, type TacticType } from "@pie/protocol";
import fs from "fs";
import path from "path";

describe("frontend architecture constraints", () => {
  it("every tactic in TACTICS array exists in TACTIC_REQUIREMENTS", () => {
    const protocolTactics = Object.keys(TACTIC_REQUIREMENTS) as TacticType[];
    for (const tactic of TACTICS) {
      expect(
        protocolTactics,
        `Tactic "${tactic.type}" in TACTICS is not defined in TACTIC_REQUIREMENTS`,
      ).toContain(tactic.type);
    }
  });

  it("every TacticType in protocol is represented in TACTICS array", () => {
    const tacticTypes = TACTICS.map((t) => t.type);
    const protocolTactics = Object.keys(TACTIC_REQUIREMENTS) as TacticType[];
    for (const type of protocolTactics) {
      expect(
        tacticTypes,
        `TacticType "${type}" from protocol is missing from TACTICS array`,
      ).toContain(type);
    }
  });

  it("no frontend files re-declare TacticType", () => {
    const srcDir = path.resolve(__dirname, "..");
    const violations: string[] = [];

    function scanDir(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "__tests__") {
          scanDir(full);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf-8");
          // Check for local type TacticType declarations (not re-exports)
          if (/^\s*(?:export\s+)?type\s+TacticType\s*=/m.test(content)) {
            const relativePath = path.relative(srcDir, full);
            // Allow re-export from store/types.ts
            if (!relativePath.includes("store/types.ts")) {
              violations.push(relativePath);
            }
          }
        }
      }
    }

    scanDir(srcDir);
    expect(
      violations,
      `Found TacticType re-declarations in: ${violations.join(", ")}`,
    ).toHaveLength(0);
  });

  it("no frontend files import from interpreter internals", () => {
    const srcDir = path.resolve(__dirname, "..");
    const violations: string[] = [];
    const bannedPatterns = [
      /@pie\/evaluator\//,
      /@pie\/typechecker\//,
      /@pie\/types\/value/,
      /@pie\/types\/core/,
    ];

    function scanDir(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "node_modules") {
          scanDir(full);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf-8");
          for (const pattern of bannedPatterns) {
            if (pattern.test(content)) {
              const relativePath = path.relative(srcDir, full);
              // Workers are allowed to import interpreter code
              if (!relativePath.includes("workers/")) {
                violations.push(`${relativePath} imports ${pattern.source}`);
              }
            }
          }
        }
      }
    }

    scanDir(srcDir);
    expect(
      violations,
      `Found banned imports:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
