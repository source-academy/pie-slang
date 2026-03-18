/**
 * Batch extraction script for tactic training data.
 *
 * Reads test files from tactics-math-tactic/, extracts Pie source strings,
 * runs them through the interpreter with tactic listener instrumentation,
 * and outputs JSONL training data.
 *
 * Usage: npx ts-node src/pie-interpreter/scripts/extract-training-data.ts [output-path]
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractFromSource, TrainingExample } from '../tactics/training-data-extractor';

const TEST_DIR = path.resolve(__dirname, '../__tests__/tactics-math-tactic');
const DEFAULT_OUTPUT = path.resolve(__dirname, '../../../training-data.jsonl');

/**
 * Extract Pie source strings from a TypeScript test file.
 * Finds all template literal strings assigned to `str` variables
 * and resolves preamble references.
 */
function extractPieSourcesFromTestFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sources: string[] = [];

  // Extract preamble constants (const xxxPreamble = `...`)
  const preambles = new Map<string, string>();
  const preambleRegex = /const\s+(\w+)\s*=\s*`([^`]*)`\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = preambleRegex.exec(content)) !== null) {
    preambles.set(match[1], match[2]);
  }

  // Also handle preambles that reference other preambles: const x = `${y}\n...`
  const compoundPreambleRegex = /const\s+(\w+)\s*=\s*`\$\{(\w+)\}\s*((?:[^`])*)`\s*;/g;
  while ((match = compoundPreambleRegex.exec(content)) !== null) {
    const name = match[1];
    const refName = match[2];
    const rest = match[3];
    const refValue = preambles.get(refName) ?? '';
    preambles.set(name, refValue + rest);
  }

  // Extract test body strings: const str = `${preamble}\n...` or const str = `\n...`
  // Pattern 1: const str = `${preambleName}\n...`
  const testStrRegex = /const\s+str\s*=\s*`\$\{(\w+)\}\s*((?:[^`])*)`\s*;/g;
  while ((match = testStrRegex.exec(content)) !== null) {
    const preambleName = match[1];
    const rest = match[2];
    const preambleValue = preambles.get(preambleName) ?? '';
    const fullSource = preambleValue + rest;
    // Only include sources that have define-tactically
    if (fullSource.includes('define-tactically')) {
      sources.push(fullSource);
    }
  }

  // Pattern 2: const str = `\n...` (no preamble reference)
  const plainStrRegex = /const\s+str\s*=\s*`\n((?:[^`$]|(?:\$(?!\{)))*)`\s*;/g;
  while ((match = plainStrRegex.exec(content)) !== null) {
    const source = match[1];
    if (source.includes('define-tactically')) {
      sources.push(source);
    }
  }

  return sources;
}

function main() {
  const outputPath = process.argv[2] ?? DEFAULT_OUTPUT;
  const testFiles = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.ts')).sort();

  console.log(`Found ${testFiles.length} test files in ${TEST_DIR}`);

  let totalExamples = 0;
  let totalSources = 0;
  let failedSources = 0;
  const allExamples: TrainingExample[] = [];

  for (const file of testFiles) {
    const filePath = path.join(TEST_DIR, file);
    const pieSources = extractPieSourcesFromTestFile(filePath);
    console.log(`  ${file}: ${pieSources.length} Pie sources`);
    totalSources += pieSources.length;

    for (const source of pieSources) {
      try {
        const examples = extractFromSource(source);
        allExamples.push(...examples);
        totalExamples += examples.length;
      } catch (e) {
        failedSources++;
      }
    }
  }

  // Write JSONL
  const outputLines = allExamples.map(ex => JSON.stringify(ex));
  fs.writeFileSync(outputPath, outputLines.join('\n') + '\n');

  console.log(`\nExtraction complete:`);
  console.log(`  Test files: ${testFiles.length}`);
  console.log(`  Pie sources: ${totalSources} (${failedSources} failed)`);
  console.log(`  Training examples: ${totalExamples}`);
  console.log(`  Output: ${outputPath}`);
}

main();
