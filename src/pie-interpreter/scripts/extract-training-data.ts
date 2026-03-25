/**
 * Training data extraction script.
 *
 * Training data is collected by running the tactic tests with the
 * COLLECT_TRAINING_DATA environment variable set. The interpreter
 * automatically captures each tactic step for successful proofs.
 *
 * Usage:
 *   COLLECT_TRAINING_DATA=training-data.jsonl npx jest --testPathPatterns="tactics-math" --runInBand --no-coverage
 *
 * Or use this script as a convenience wrapper:
 *   npx ts-node src/pie-interpreter/scripts/extract-training-data.ts [output-path]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

const outputPath = process.argv[2] ?? path.resolve(projectRoot, 'training-data.jsonl');

// Clear the output file
fs.writeFileSync(outputPath, '');

console.log(`Extracting training data to: ${outputPath}`);
console.log('Running tactic tests with COLLECT_TRAINING_DATA...\n');

try {
  execSync(
    `npx jest --testPathPatterns="tactics-math" --runInBand --no-coverage`,
    {
      env: { ...process.env, COLLECT_TRAINING_DATA: outputPath },
      stdio: 'inherit',
      cwd: projectRoot,
    }
  );
} catch {
  // Jest may exit non-zero if some tests fail, but we still want the data
  console.log('\nNote: Some tests may have failed, but training data from successful proofs was still collected.');
}

// Filter, deduplicate, and count results
if (fs.existsSync(outputPath)) {
  const lines = fs.readFileSync(outputPath, 'utf-8').trim().split('\n').filter(Boolean);
  const rawCount = lines.length;

  // Phase 1: Filter low-value examples
  const filtered: string[] = [];
  let filteredReflexivity = 0;
  let filteredResultTheorems = 0;
  for (const line of lines) {
    const ex = JSON.parse(line);

    // Skip single-step "exact (same ...)" reflexivity proofs — trivial, no reasoning signal
    if (ex.tactic.startsWith('exact (same')) {
      filteredReflexivity++;
      continue;
    }

    // Skip "-result" validation theorems — just ground-truth checks
    if (ex.theoremName.endsWith('-result')) {
      filteredResultTheorems++;
      continue;
    }

    filtered.push(line);
  }

  // Phase 2: Deduplicate by (goal, tactic, localContext)
  const seen = new Set<string>();
  const dedupedLines: string[] = [];
  for (const line of filtered) {
    const ex = JSON.parse(line);
    const key = JSON.stringify({ goal: ex.goal, tactic: ex.tactic, localContext: ex.localContext });
    if (!seen.has(key)) {
      seen.add(key);
      dedupedLines.push(line);
    }
  }

  // Phase 3: Cap identical tactic sequences — keep at most N theorems with same proof pattern
  const MAX_IDENTICAL_PROOFS = 3;
  const tacticSeqs = new Map<string, string[]>(); // tactic sequence → theorem names
  const allExamples = dedupedLines.map(l => JSON.parse(l));

  // Group examples by theorem, build tactic sequence per theorem
  const theoremTactics = new Map<string, string[]>();
  for (const ex of allExamples) {
    if (!theoremTactics.has(ex.theoremName)) {
      theoremTactics.set(ex.theoremName, []);
    }
    theoremTactics.get(ex.theoremName)!.push(ex.tactic);
  }

  // Group theorems by their tactic sequence
  for (const [name, tactics] of theoremTactics) {
    const seqKey = JSON.stringify(tactics);
    if (!tacticSeqs.has(seqKey)) {
      tacticSeqs.set(seqKey, []);
    }
    tacticSeqs.get(seqKey)!.push(name);
  }

  // Find theorems to exclude (beyond the cap)
  const excludedTheorems = new Set<string>();
  let cappedCount = 0;
  for (const [, names] of tacticSeqs) {
    if (names.length > MAX_IDENTICAL_PROOFS) {
      for (const name of names.slice(MAX_IDENTICAL_PROOFS)) {
        excludedTheorems.add(name);
        cappedCount++;
      }
    }
  }

  const finalLines = dedupedLines.filter(line => {
    const ex = JSON.parse(line);
    return !excludedTheorems.has(ex.theoremName);
  });

  fs.writeFileSync(outputPath, finalLines.join('\n') + '\n');
  console.log(`\nExtraction complete:`);
  console.log(`  ${rawCount} raw examples`);
  console.log(`  -${filteredReflexivity} reflexivity (exact same), -${filteredResultTheorems} result theorems`);
  console.log(`  ${filtered.length} after filtering → ${dedupedLines.length} after dedup`);
  console.log(`  -${cappedCount} theorems capped (>${MAX_IDENTICAL_PROOFS} identical proof patterns)`);
  console.log(`  ${finalLines.length} final examples`);
  console.log(`Written to ${outputPath}`);
} else {
  console.log('\nNo output file generated.');
}
