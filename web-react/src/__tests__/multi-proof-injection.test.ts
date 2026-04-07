/**
 * Tests for proof script injection in multi-proof scenarios.
 *
 * Covers:
 * - injectProofIntoSource: inserting define-tactically after claim
 * - Replacing an existing define-tactically for the same claim
 * - Multiple claims in same source: injection targets the correct one
 * - Injection preserves other claims and proofs
 */
import { describe, it, expect } from "vitest";

// --------------------------------------------------------------------------
// Inline the injection logic (same as useProofSession.ts) for unit testing
// without needing React hooks or workers.
// --------------------------------------------------------------------------

function findClosingParen(source: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return source.length - 1;
}

function injectProofIntoSource(
  sourceCode: string,
  claimName: string,
  proofScript: string,
): string {
  let src = sourceCode;

  // Remove existing (define-tactically claimName ...) if present
  const definePattern = `(define-tactically ${claimName}`;
  const defineIdx = src.indexOf(definePattern);
  if (defineIdx !== -1) {
    const end = findClosingParen(src, defineIdx);
    const before = src.slice(0, defineIdx).trimEnd();
    const after = src.slice(end + 1);
    src = before + after;
  }

  // Find (claim claimName ...) and insert proof script after it
  const claimPattern = `(claim ${claimName}`;
  const claimIdx = src.indexOf(claimPattern);
  if (claimIdx === -1) {
    return src.trimEnd() + "\n\n" + proofScript;
  }
  const claimEnd = findClosingParen(src, claimIdx);
  const before = src.slice(0, claimEnd + 1);
  const after = src.slice(claimEnd + 1);
  return before + "\n\n" + proofScript + after;
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe("injectProofIntoSource", () => {
  it("inserts proof after a single claim", () => {
    const source = `(claim self-eq (= Nat Nat))`;
    const script = `(define-tactically self-eq (exact same))`;
    const result = injectProofIntoSource(source, "self-eq", script);

    expect(result).toBe(
      `(claim self-eq (= Nat Nat))\n\n(define-tactically self-eq (exact same))`,
    );
  });

  it("replaces existing define-tactically for the same claim", () => {
    const source = [
      `(claim self-eq (= Nat Nat))`,
      ``,
      `(define-tactically self-eq (todo))`,
    ].join("\n");
    const script = `(define-tactically self-eq (exact same))`;
    const result = injectProofIntoSource(source, "self-eq", script);

    expect(result).toContain("(exact same)");
    expect(result).not.toContain("(todo)");
    // Should still have the claim
    expect(result).toContain("(claim self-eq (= Nat Nat))");
  });

  it("injects after the correct claim in multi-claim source", () => {
    const source = [
      `(claim self-eq (= Nat Nat))`,
      ``,
      `(claim add-comm (-> Nat (-> Nat (= Nat Nat))))`,
    ].join("\n");
    const script = `(define-tactically self-eq (exact same))`;
    const result = injectProofIntoSource(source, "self-eq", script);

    // Proof for self-eq should appear between the two claims
    const selfEqClaimIdx = result.indexOf("(claim self-eq");
    const proofIdx = result.indexOf("(define-tactically self-eq");
    const addCommIdx = result.indexOf("(claim add-comm");

    expect(selfEqClaimIdx).toBeLessThan(proofIdx);
    expect(proofIdx).toBeLessThan(addCommIdx);
  });

  it("does not affect other claims or proofs in the source", () => {
    const source = [
      `(claim self-eq (= Nat Nat))`,
      ``,
      `(define-tactically self-eq (todo))`,
      ``,
      `(claim add-comm (-> Nat (-> Nat (= Nat Nat))))`,
      ``,
      `(define-tactically add-comm (intro n (intro m (todo))))`,
    ].join("\n");
    const script = `(define-tactically self-eq (exact same))`;
    const result = injectProofIntoSource(source, "self-eq", script);

    // add-comm's proof should be untouched
    expect(result).toContain("(define-tactically add-comm (intro n (intro m (todo))))");
    // self-eq's proof should be replaced
    expect(result).toContain("(define-tactically self-eq (exact same))");
    expect(result).not.toContain("(define-tactically self-eq (todo))");
  });

  it("appends proof at end if claim is not found in source", () => {
    const source = `; some comment`;
    const script = `(define-tactically unknown (exact x))`;
    const result = injectProofIntoSource(source, "unknown", script);

    expect(result).toBe(`; some comment\n\n(define-tactically unknown (exact x))`);
  });

  it("handles nested parens in claim types correctly", () => {
    const source = `(claim deep-type (-> (Pair Nat (List Nat)) (= Nat Nat)))`;
    const script = `(define-tactically deep-type (intro p (exact same)))`;
    const result = injectProofIntoSource(source, "deep-type", script);

    expect(result).toBe(
      `(claim deep-type (-> (Pair Nat (List Nat)) (= Nat Nat)))\n\n(define-tactically deep-type (intro p (exact same)))`,
    );
  });

  it("handles multiple injections sequentially (proving proofs one by one)", () => {
    let source = [
      `(claim self-eq (= Nat Nat))`,
      ``,
      `(claim double (-> Nat Nat))`,
    ].join("\n");

    // Prove self-eq first
    source = injectProofIntoSource(source, "self-eq", `(define-tactically self-eq (exact same))`);
    expect(source).toContain("(define-tactically self-eq (exact same))");

    // Then prove double
    source = injectProofIntoSource(source, "double", `(define-tactically double (intro n (exact (add n n))))`);
    expect(source).toContain("(define-tactically double (intro n (exact (add n n))))");
    // Both proofs should be present
    expect(source).toContain("(define-tactically self-eq (exact same))");
  });

  it("replacing a proof preserves correct ordering", () => {
    let source = [
      `(claim A (= Nat Nat))`,
      ``,
      `(define-tactically A (todo))`,
      ``,
      `(claim B (-> Nat Nat))`,
      ``,
      `(define-tactically B (todo))`,
      ``,
      `(claim C (= Atom Atom))`,
    ].join("\n");

    // Replace B's proof
    source = injectProofIntoSource(source, "B", `(define-tactically B (intro x (exact x)))`);

    const idxA = source.indexOf("(define-tactically A");
    const idxB = source.indexOf("(define-tactically B");
    const idxC = source.indexOf("(claim C");

    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });
});
