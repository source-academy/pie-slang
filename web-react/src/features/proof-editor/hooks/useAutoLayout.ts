import { useEffect, useRef } from "react";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useProofStore } from "../store";
import { computeTreeLayout } from "../utils/convert-proof-tree";
import type { ProofTree } from "@pie/protocol";

/**
 * useAutoLayout
 *
 * Runs a second layout pass after React Flow has measured all proof nodes.
 * The first pass (in convertProofTreeToReactFlow) places nodes using fallback
 * size constants.  This hook fires once those nodes are rendered and replaces
 * every position with one computed from the actual measured width/height,
 * so the tree stays properly spaced regardless of content length or context
 * variable count.
 *
 * It re-runs automatically after each syncFromWorker call (tactic apply or
 * retract), because proofTreeData gets a new object reference each time.
 *
 * Nodes the user has manually dragged are left in place.
 */
export function useAutoLayout() {
  const nodesInitialized = useNodesInitialized();
  const { getNodes } = useReactFlow();
  const proofTreeData = useProofStore((s) => s.proofTreeData);
  const setLayoutPositions = useProofStore((s) => s.setLayoutPositions);

  // Track which tree we last laid out so we don't repeat work
  const lastTree = useRef<ProofTree | null>(null);

  useEffect(() => {
    if (!nodesInitialized || !proofTreeData) return;
    if (proofTreeData === lastTree.current) return;

    const nodes = getNodes();

    // Collect measured sizes for every proof node (goal + tactic).
    // Ghost and lemma nodes are not part of the tree layout, so we skip them.
    const measuredSizes = new Map<string, { width: number; height: number }>();
    for (const node of nodes) {
      if (node.type !== "goal" && node.type !== "tactic") continue;
      if (node.measured?.width != null && node.measured?.height != null) {
        measuredSizes.set(node.id, {
          width: node.measured.width,
          height: node.measured.height,
        });
      }
    }

    // Wait until every goal and tactic node has been measured
    const proofNodes = nodes.filter(
      (n) => n.type === "goal" || n.type === "tactic",
    );
    if (proofNodes.some((n) => !measuredSizes.has(n.id))) return;

    // Compute positions using actual node sizes
    const newPositions = computeTreeLayout(proofTreeData.root, measuredSizes);

    // Skip nodes the user has manually moved — read directly from store to
    // avoid adding manualPositions as a reactive dependency (which would cause
    // this effect to re-run on every drag).
    const manualPositions = useProofStore.getState().manualPositions;
    const toApply = new Map<string, { x: number; y: number }>();
    for (const [id, pos] of newPositions) {
      if (!manualPositions.has(id)) {
        toApply.set(id, pos);
      }
    }

    if (toApply.size > 0) {
      setLayoutPositions(toApply);
    }

    lastTree.current = proofTreeData;
  }, [nodesInitialized, proofTreeData, getNodes, setLayoutPositions]);
}
