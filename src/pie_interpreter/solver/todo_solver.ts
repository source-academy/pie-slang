// src/ai/todo_solver.ts
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs/promises";
import * as path from "path";
import { Parser } from "../parser/parser";
import { stop } from "../types/utils";
import { Location } from "../utils/locations";
import { Context, readBackContext } from "../utils/context";
import { Value } from "../types/value";
import { Renaming } from "../typechecker/utils";
import 'dotenv/config';

const MISSING_API_KEY_ERROR = new Error(
  'GOOGLE_API_KEY environment variable is not set. ' +
  'Please create a .env file in the project root with: GOOGLE_API_KEY=your_key_here'
);

let genAI: GoogleGenAI | null = null;

function ensureClient(): GoogleGenAI {
  if (genAI) {
    return genAI;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw MISSING_API_KEY_ERROR;
  }

  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

// Cache for project context string (in-memory)
let cachedProjectContext: string | null = null;

export interface TodoInfo {
  location: Location;
  context: Context;
  expectedType: Value;
  renaming: Renaming;
}

export const todoQueue: TodoInfo[] = [];

export function addTodo(todo: TodoInfo) {
  todoQueue.push(todo);
}

export function clearQueue() {
  todoQueue.length = 0;
}

export function clearCache() {
  cachedProjectContext = null;
}

// Collect all .ts files from src/pie_interpreter
async function getProjectFiles(): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const dir = "src/pie_interpreter";

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        await walk(fullPath);
      } else if (entry.name.endsWith(".ts") && !entry.name.includes("test")) {
        files.set(fullPath, await fs.readFile(fullPath, "utf-8"));
      }
    }
  }

  await walk(dir);
  return files;
}

// Build and cache project context string
async function getOrBuildProjectContext(): Promise<string> {
  if (cachedProjectContext) {
    return cachedProjectContext;
  }

  const projectFiles = await getProjectFiles();

  // Build comprehensive project context with file contents
  let projectContext = "# Project structure and files:\n\n";

  // Add file paths list for overview
  projectContext += "## File listing:\n";
  for (const path of projectFiles.keys()) {
    projectContext += `- ${path}\n`;
  }

  // Add actual file contents (with size limit per file)
  projectContext += "\n## File contents:\n\n";
  for (const [path, content] of projectFiles) {
    const lines = content.split('\n');
    const truncatedContent = lines.slice(0, 10000).join('\n'); // Limit to first 100 lines per file
    projectContext += `### ${path}\n\`\`\`typescript\n${truncatedContent}\n\`\`\`\n\n`;
  }

  // Cache the built context
  cachedProjectContext = projectContext;
  return projectContext;
}

export async function solveTodo(todo: TodoInfo): Promise<string> {
  const genAI = ensureClient();
  // Get cached or build project context
  const projectContext = await getOrBuildProjectContext();

  const startTime = Date.now();
  const TIMEOUT_MS = 30000; // 30 seconds

  // Stringify objects for AI prompt
  const serializedContext = JSON.stringify(readBackContext(todo.context));
  const serializedRenaming = JSON.stringify(Array.from(todo.renaming.entries()));
  const expectedTypeStr = todo.expectedType.readBackType(todo.context).prettyPrint();

  // Use the real objects for typechecking
  const ctx = todo.context;
  const renaming = todo.renaming;

  const basePrompt = `You are helping to fill in TODO expressions in Pie language 
          code (a dependently-typed language from "The Little Typer").

${projectContext}

## TODO Context:
Available context (variable bindings): ${serializedContext}
Renaming map: ${serializedRenaming}
Expected type: ${expectedTypeStr}

## Task:
Generate ONLY a valid Pie expression (not TypeScript!) that has the expected type.

Common Pie types and their values:
- Nat: zero, (add1 zero), (add1 (add1 zero)), etc.
- Atom: 'foo, 'bar, etc. (quoted symbols)
- Trivial: sole (the only value of type Trivial)
- (List T): (the (List T) nil), (:: head tail)
  Note: nil needs explicit typing like (the (List Nat) nil)
- (Pair A D): (cons a d)
- (→ A B): (lambda (x) body) or (λ (x) body)

Important: When you need to provide an explicit type annotation, use (the Type value).
For example: (the Nat zero), (the (List Nat) nil)

Do not include code fences, markdown, or explanations. Just the Pie expression.
`;

  let errorHistory = "";
  let attempts = 0;

  while (Date.now() - startTime < TIMEOUT_MS) {
    attempts++;

    const prompt = basePrompt + errorHistory;

    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      if (!result.text) {
        errorHistory += `\n\nAttempt ${attempts} failed - No text generated by the model.`;
        continue;
      }
      const pieCode = result.text.trim()
        .replace(/^```[\w]*\n?/, '')  // Remove opening code fence
        .replace(/\n?```$/, '')        // Remove closing code fence
        .trim();

      // Try to parse the Pie expression
      let parsed;
      try {
        parsed = Parser.parsePie(pieCode);
      } catch (parseError: any) {
        errorHistory += `\n\nAttempt ${attempts} failed - Parse error: ${parseError.message}\nYou generated: ${pieCode}\nPlease fix the syntax and try again.`;
        continue;
      }

      // Try to typecheck it
      try {
        // Use check mode since we have the expected type (already as Value)
        const checkResult = parsed.check(ctx, renaming, todo.expectedType);

        if (checkResult instanceof stop) {
          // Typecheck failed
          errorHistory += `\n\nAttempt ${attempts} failed - Type error: ${checkResult.message.toString()}\nYou generated: ${pieCode}\nPlease generate a correct expression.`;
          continue;
        }

        // Success! Return the expression
        return pieCode;
      } catch (typecheckError: any) {
        errorHistory += `\n\nAttempt ${attempts} failed - Typecheck error: ${typecheckError.message}\nYou generated: ${pieCode}\nPlease fix and try again.`;
        continue;
      }
    } catch (error: any) {
      errorHistory += `\n\nAttempt ${attempts} failed - API error: ${error.message}`;
      // Wait a bit before retrying API errors
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
  }

  // Timeout reached
  throw new Error(`Failed to solve TODO after ${attempts} attempts in 30 seconds. Last errors: ${errorHistory}`);
}
