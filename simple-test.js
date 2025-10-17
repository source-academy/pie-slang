// Simple test to run the Pie interpreter
console.log("Starting Pie interpreter test...");

// Since we can't easily import the TypeScript directly, 
// let's try to run one of the existing compiled tests via Jest directly
import { execSync } from 'child_process';

try {
  console.log("Running a single test file...");
  const result = execSync('npx jest src/pie_interpreter/__tests__/test_main.ts --testNamePattern="Addition over nats"', { 
    encoding: 'utf8', 
    cwd: process.cwd() 
  });
  console.log(result);
} catch (error) {
  console.error('Error running test:', error.message);
  console.log('Stdout:', error.stdout);
  console.log('Stderr:', error.stderr);
}