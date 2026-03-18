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

// Count results
if (fs.existsSync(outputPath)) {
  const lines = fs.readFileSync(outputPath, 'utf-8').trim().split('\n').filter(Boolean);
  console.log(`\nExtraction complete: ${lines.length} training examples written to ${outputPath}`);
} else {
  console.log('\nNo output file generated.');
}
