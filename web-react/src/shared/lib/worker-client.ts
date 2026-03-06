import * as Comlink from "comlink";
import type { Remote } from "comlink";
import type { ProofWorkerAPI } from "@/workers/proof-worker";
import type { DiagnosticsWorkerAPI } from "@/workers/diagnostics-worker";
import ProofWorkerConstructor from "@/workers/proof-worker.ts?worker";
import DiagnosticsWorkerConstructor from "@/workers/diagnostics-worker.ts?worker";
import TestWorkerConstructor from "@/workers/test-worker.ts?worker";

interface TestWorkerAPI {
  test: () => string;
  echo: (msg: string) => string;
}

function wrapWorker<T>(worker: Worker): Remote<T> {
  worker.onerror = (e) => {
    console.error("[Main] Worker error:", e.message, e.filename, e.lineno);
  };
  worker.onmessageerror = (e) => {
    console.error("[Main] Worker message error:", e);
  };
  return Comlink.wrap<T>(worker);
}

/**
 * Proof worker instance
 * Handles proof sessions and tactic applications
 */
export const proofWorker = wrapWorker<ProofWorkerAPI>(
  new ProofWorkerConstructor(),
);

/**
 * Diagnostics worker instance
 * Handles code analysis and editor diagnostics
 */
export const diagnosticsWorker = wrapWorker<DiagnosticsWorkerAPI>(
  new DiagnosticsWorkerConstructor(),
);

/**
 * Test worker instance - for debugging
 */
export const testWorker = wrapWorker<TestWorkerAPI>(
  new TestWorkerConstructor(),
);

/**
 * Quick test function - call from browser console: testProofWorker()
 */
export async function testProofWorker() {
  console.log("[Main] Testing proof worker...");
  try {
    const result = await proofWorker.test();
    console.log("[Main] Proof worker test result:", result);
    return result;
  } catch (e) {
    console.error("[Main] Proof worker error:", e);
    throw e;
  }
}

/**
 * Test imports function - call from browser console: testImports()
 */
export async function testImports() {
  console.log("[Main] Testing proof worker imports...");
  try {
    const result = await proofWorker.testImports();
    console.log("[Main] Import test results:", result);
    return result;
  } catch (e) {
    console.error("[Main] Import test error:", e);
    throw e;
  }
}

// Make workers and test functions available globally for debugging
if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.testProofWorker = testProofWorker;
  w.testImports = testImports;
  w.proofWorker = proofWorker;
  w.testWorker = testWorker;
}
