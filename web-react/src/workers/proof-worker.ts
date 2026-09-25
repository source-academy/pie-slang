import * as Comlink from "comlink";
import { nanoid } from "nanoid";
import type { ProcessorAnalysisResult } from "@pie/processor";
import {
  type TacticType,
  type TacticParams,
  type AppliedTactic,
  type Goal,
  type GoalNode as ProtoGoalNode,
  type ProofTree,
  type ContextEntry,
  type GlobalEntry,
  type StartSessionResponse,
  type ApplyTacticResponse,
  type HintLevel,
  type HintResponse,
  type HintRequest,
  type ScanFileResponse,
  TACTIC_REQUIREMENTS,
} from "@pie/protocol";

console.log("[ProofWorker] Worker script starting...");

// Re-export protocol types so existing frontend imports still work
export type {
  TacticType,
  TacticParams as TacticParameters,
  Goal as SerializableGoal,
  ProofTree as ProofTreeData,
  ContextEntry as SerializableContextEntry,
  GlobalEntry as GlobalEntry,
  StartSessionResponse,
  ApplyTacticResponse as TacticAppliedResponse,
  HintLevel,
  HintResponse as ProgressiveHintResponse,
  HintRequest as GetHintRequest,
};
export type { GoalNode as SerializableGoalNode } from "@pie/protocol";

// Re-export compound types for backward compatibility
export type GlobalContext = {
  definitions: GlobalEntry[];
  theorems: GlobalEntry[];
};
export type SerializableLemma = { name: string; type: string };

// ============================================
// Session storage
// ============================================

interface ProofSession {
  id: string;
  proofManager: any; // ProofManager from @pie/tactics — dynamic import
  ctx: any;          // Context from @pie/utils — dynamic import
  claimName: string;
  claimType: string;
}

const sessions = new Map<string, ProofSession>();

// ============================================
// Shared helpers
// ============================================

/**
 * Transform raw proof tree data from ProofManager into protocol-conformant GoalNode.
 * Single implementation — used by both startSession and getProofTree.
 */
function transformGoalNode(node: any): ProtoGoalNode {
  const computeIsSubtreeComplete = (n: any): boolean => {
    const isComplete = n.goal?.isComplete || n.completedBy;
    if (!isComplete) return false;
    if (!n.children || n.children.length === 0) return true;
    return n.children.every((child: any) => computeIsSubtreeComplete(child));
  };

  const goal: Goal = {
    id: node.goal.id,
    type: node.goal.type,
    expandedType: node.goal.expandedType,
    context: (node.goal.contextEntries || []).map((e: any): ContextEntry => ({
      name: e.name,
      type: e.type,
      introducedBy: e.introducedBy || undefined,
    })),
    isComplete: node.goal.isComplete,
    isCurrent: node.goal.isCurrent,
  };

  return {
    goal,
    children: (node.children || []).map(transformGoalNode),
    appliedTactic: node.appliedTactic as AppliedTactic | undefined,
    completedBy: node.completedBy as AppliedTactic | undefined,
    isSubtreeComplete: computeIsSubtreeComplete(node),
  };
}

/** Build a ProofTree from raw ProofManager data. */
function buildProofTree(rawData: any): ProofTree {
  return {
    root: transformGoalNode(rawData.root),
    isComplete: rawData.isComplete,
    currentGoalId: rawData.currentGoalId,
  };
}

/** Create an empty proof tree for error responses. */
function emptyProofTree(): ProofTree {
  return {
    root: {
      goal: { id: "", type: "", context: [], isComplete: false, isCurrent: false },
      children: [],
    },
    isComplete: false,
    currentGoalId: null,
  };
}

/** Render checked bindings once; declarations no longer have a worker-specific checker. */
function toScanFileResponse(result: ProcessorAnalysisResult): ScanFileResponse {
  const definitions: GlobalEntry[] = [];
  const theorems: GlobalEntry[] = [];
  const claims: GlobalEntry[] = [];
  for (const binding of result.checkedBindings) {
    const { name, type, kind } = binding;
    if (kind === "claim") claims.push({ name, type, kind });
    else if (kind === "theorem") theorems.push({ name, type, kind });
    else definitions.push({ name, type, kind: "definition" });
  }
  return { definitions, theorems, claims, diagnostics: result.diagnostics };
}

// ============================================
// Worker API
// ============================================

export interface ProofWorkerAPI {
  test: () => string;
  testImports: () => Promise<{
    success: boolean;
    results: string[];
    error?: string;
  }>;
  startSession: (
    sourceCode: string,
    claimName: string,
  ) => Promise<StartSessionResponse>;
  applyTactic: (
    sessionId: string,
    goalId: string,
    tacticType: string,
    params?: TacticParams,
  ) => Promise<ApplyTacticResponse>;
  closeSession: (sessionId: string) => void;
  getProofTree: (sessionId: string) => ProofTree | null;
  getHint: (request: HintRequest) => Promise<HintResponse>;
  scanFile: (sourceCode: string) => Promise<ScanFileResponse>;
}

export const proofWorkerAPI: ProofWorkerAPI = {
  test() {
    console.log("[ProofWorker] test() called");
    return "Proof worker is responding!";
  },

  async scanFile(sourceCode: string) {
    const { PieProcessor } = await import("@pie/processor");
    return toScanFileResponse(new PieProcessor().analyze(sourceCode));
  },

  async testImports() {
    console.log("[ProofWorker] testImports() called");
    const results: string[] = [];

    try {
      results.push("1. Testing parser imports...");
      const parser = await import("@pie/parser/parser");
      results.push(
        "   schemeParse: " +
          (typeof parser.schemeParse === "function" ? "OK" : "MISSING"),
      );

      results.push("2. Testing context imports...");
      const ctx = await import("@pie/utils/context");
      results.push("   initCtx: " + (ctx.initCtx ? "OK" : "MISSING"));

      results.push("3. Testing ProofManager...");
      const pmModule = await import("@pie/tactics/proof-manager");
      results.push(
        "   ProofManager: " + (pmModule.ProofManager ? "OK" : "MISSING"),
      );

      results.push("ALL IMPORTS SUCCESSFUL!");
      return { success: true, results };
    } catch (e) {
      results.push("FAILED: " + String(e));
      return { success: false, results, error: String(e) };
    }
  },

  async startSession(
    sourceCode: string,
    claimName: string,
  ): Promise<StartSessionResponse> {
    const { PieProcessor, PieProcessorError } = await import("@pie/processor");
    const { ProofManager } = await import("@pie/tactics/proof-manager");
    const { stop } = await import("@pie/types/utils");
    const { Location, Syntax } = await import("@pie/utils/locations");
    const { Position } = await import("@scheme/transpiler/types/location");

    const result = new PieProcessor().prepareProof(sourceCode, claimName);
    if (!result.success) throw new PieProcessorError(result.diagnostics);

    const ctx = result.checkedContext;
    const pos = new Position(1, 0);
    const pm = new ProofManager();
    const startResult = pm.startProof(claimName, ctx, new Location(new Syntax(pos, pos, ""), false));
    if (startResult instanceof stop) {
      throw new Error(`Failed to start proof: ${startResult.message}`);
    }
    const rawProofTreeData = pm.getProofTreeData();
    if (!rawProofTreeData) throw new Error("ProofManager returned null proof tree data");

    const binding = ctx.get(claimName);
    const claimType = binding ? binding.type.readBackType(ctx).prettyPrint() : "unknown";
    const sessionId = nanoid();
    sessions.set(sessionId, { id: sessionId, proofManager: pm, ctx, claimName, claimType });

    const scan = toScanFileResponse(result);
    return {
      sessionId,
      proofTree: buildProofTree(rawProofTreeData),
      globalContext: {
        definitions: scan.definitions,
        theorems: [...scan.theorems, ...scan.claims.filter(claim => claim.name !== claimName)],
      },
      claimType,
    };
  },

  async applyTactic(
    sessionId: string,
    goalId: string,
    tacticType: string,
    params: TacticParams = {},
  ): Promise<ApplyTacticResponse> {
    console.log(
      "[ProofWorker] applyTactic() called:",
      tacticType,
      "on goal:",
      goalId,
      "params:",
      params,
    );

    const session = sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        proofTree: {
          root: {
            goal: {
              id: "",
              type: "",
              context: [],
              isComplete: false,
              isCurrent: false,
            },
            children: [],
          },
          isComplete: false,
          currentGoalId: null,
        },
        error: `Session not found: ${sessionId}`,
      };
    }

    try {
      // Import tactic classes
      const tactics = await import("@pie/tactics/tactics");
      const { Location, Syntax } = await import("@pie/utils/locations");
      const { Position } = await import("@scheme/transpiler/types/location");
      const { Parser } = await import("@pie/parser/parser");
      const { stop } = await import("@pie/types/utils");

      // Set the current goal to the one the user dropped onto
      const pm = session.proofManager;
      if (pm.currentState) {
        const goalSet = pm.currentState.setCurrentGoalById(goalId);
        if (!goalSet) {
          return {
            success: false,
            proofTree: this.getProofTree(sessionId) || emptyProofTree(),
            error: `Goal not found: ${goalId}`,
          };
        }
        // Check if goal is already complete
        if (pm.currentState.currentGoal.isComplete) {
          return {
            success: false,
            proofTree: this.getProofTree(sessionId) || emptyProofTree(),
            error: "Cannot apply tactic to a completed goal",
          };
        }
        // In the visual editor, users explicitly select which goal to work on,
        // so we reset pendingBranches. The "then block" requirement is for
        // the textual DSL where tactics are applied in sequence.
        pm.currentState.pendingBranches = 0;
      }

      // Create dummy location
      const pos = new Position(1, 0);
      const syntax = new Syntax(pos, pos, "");
      const loc = new Location(syntax, false);

      // Create tactic based on type
      let tactic: InstanceType<typeof tactics.Tactic>;

      switch (tacticType) {
        case "intro":
          tactic = new tactics.IntroTactic(loc, params.variableName);
          break;

        case "exact": {
          if (!params.expression) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || {
                root: {
                  goal: {
                    id: "",
                    type: "",
                    context: [],
                    isComplete: false,
                    isCurrent: false,
                  },
                  children: [],
                },
                isComplete: false,
                currentGoalId: null,
              },
              error: "exact tactic requires an expression parameter",
            };
          }
          const exactTerm = Parser.parsePie(params.expression);
          tactic = new tactics.ExactTactic(loc, exactTerm);
          break;
        }

        case "exists": {
          if (!params.expression) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || {
                root: {
                  goal: {
                    id: "",
                    type: "",
                    context: [],
                    isComplete: false,
                    isCurrent: false,
                  },
                  children: [],
                },
                isComplete: false,
                currentGoalId: null,
              },
              error: "exists tactic requires an expression parameter",
            };
          }
          const existsValue = Parser.parsePie(params.expression);
          tactic = new tactics.ExistsTactic(
            loc,
            existsValue,
            params.variableName,
          );
          break;
        }

        case "split":
          tactic = new tactics.SpiltTactic(loc); // Note: typo in original code
          break;

        case "left":
          tactic = new tactics.LeftTactic(loc);
          break;

        case "right":
          tactic = new tactics.RightTactic(loc);
          break;

        case "elimNat":
        case "induction":
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || {
                root: {
                  goal: {
                    id: "",
                    type: "",
                    context: [],
                    isComplete: false,
                    isCurrent: false,
                  },
                  children: [],
                },
                isComplete: false,
                currentGoalId: null,
              },
              error: "elimNat tactic requires a target variable name",
            };
          }
          tactic = new tactics.EliminateNatTactic(loc, params.variableName);
          break;

        case "elimList":
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || {
                root: {
                  goal: {
                    id: "",
                    type: "",
                    context: [],
                    isComplete: false,
                    isCurrent: false,
                  },
                  children: [],
                },
                isComplete: false,
                currentGoalId: null,
              },
              error: "elimList tactic requires a target variable name",
            };
          }
          tactic = new tactics.EliminateListTactic(loc, params.variableName);
          break;

        case "elimEither":
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || {
                root: {
                  goal: {
                    id: "",
                    type: "",
                    context: [],
                    isComplete: false,
                    isCurrent: false,
                  },
                  children: [],
                },
                isComplete: false,
                currentGoalId: null,
              },
              error: "elimEither tactic requires a target variable name",
            };
          }
          tactic = new tactics.EliminateEitherTactic(loc, params.variableName);
          break;

        case "elimAbsurd":
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || {
                root: {
                  goal: {
                    id: "",
                    type: "",
                    context: [],
                    isComplete: false,
                    isCurrent: false,
                  },
                  children: [],
                },
                isComplete: false,
                currentGoalId: null,
              },
              error: "elimAbsurd tactic requires a target variable name",
            };
          }
          tactic = new tactics.EliminateAbsurdTactic(loc, params.variableName);
          break;

        default:
          return {
            success: false,
            proofTree: this.getProofTree(sessionId) || emptyProofTree(),
            error: `Unknown tactic type: ${tacticType}`,
          };
      }

      // Apply the tactic
      const result = session.proofManager.applyTactic(tactic);

      if (result instanceof stop) {
        return {
          success: false,
          proofTree: this.getProofTree(sessionId) || {
            root: {
              goal: {
                id: "",
                type: "",
                context: [],
                isComplete: false,
                isCurrent: false,
              },
              children: [],
            },
            isComplete: false,
            currentGoalId: null,
          },
          error: result.message.toString(),
        };
      }

      console.log("[ProofWorker] Tactic applied successfully");

      // Get updated proof tree
      const proofTree = this.getProofTree(sessionId);
      if (!proofTree) {
        return {
          success: false,
          proofTree: {
            root: {
              goal: {
                id: "",
                type: "",
                context: [],
                isComplete: false,
                isCurrent: false,
              },
              children: [],
            },
            isComplete: false,
            currentGoalId: null,
          },
          error: "Failed to get proof tree after applying tactic",
        };
      }

      return {
        success: true,
        proofTree,
      };
    } catch (error) {
      console.error("[ProofWorker] Error applying tactic:", error);
      return {
        success: false,
        proofTree: this.getProofTree(sessionId) || {
          root: {
            goal: {
              id: "",
              type: "",
              context: [],
              isComplete: false,
              isCurrent: false,
            },
            children: [],
          },
          isComplete: false,
          currentGoalId: null,
        },
        error: String(error),
      };
    }
  },

  closeSession(sessionId: string): void {
    console.log("[ProofWorker] closeSession():", sessionId);
    sessions.delete(sessionId);
  },

  getProofTree(sessionId: string): ProofTree | null {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const rawData = session.proofManager.getProofTreeData();
    if (!rawData) return null;

    return buildProofTree(rawData);
  },

  async getHint(request: HintRequest): Promise<HintResponse> {
    console.log(
      "[ProofWorker] getHint() called for goal:",
      request.goalId,
      "level:",
      request.currentLevel,
    );

    const session = sessions.get(request.sessionId);
    if (!session) {
      return {
        level: request.currentLevel,
        explanation: "Session not found. Please start a new proof.",
        confidence: 0,
      };
    }

    try {
      // Find the goal in the proof tree
      const proofTree = this.getProofTree(request.sessionId);
      if (!proofTree) {
        return {
          level: request.currentLevel,
          explanation: "Could not get proof tree.",
          confidence: 0,
        };
      }

      // Find the specific goal
      const goal = findGoalById(proofTree.root, request.goalId);
      if (!goal) {
        return {
          level: request.currentLevel,
          explanation: "Goal not found.",
          confidence: 0,
        };
      }

      // Build hint request
      const hintRequest = {
        goalType: goal.goal.type,
        context: goal.goal.context.map((c) => ({ name: c.name, type: c.type })),
        availableTactics: (Object.keys(TACTIC_REQUIREMENTS) as TacticType[]).filter(
          (t) => t !== "todo",
        ),
        currentLevel: request.currentLevel,
        previousHint: request.previousHint,
      };

      // Import hint generator
      const { generateProgressiveHint, generateRuleBasedHint } =
        await import("@pie/solver/hint-generator");

      // Try AI-powered hint if API key is provided
      if (request.apiKey) {
        try {
          const hint = await generateProgressiveHint(
            request.apiKey,
            hintRequest,
          );
          console.log("[ProofWorker] AI hint generated:", hint);
          return hint;
        } catch (aiError) {
          console.warn(
            "[ProofWorker] AI hint failed, falling back to rule-based:",
            aiError,
          );
        }
      }

      // Fallback to rule-based hints
      const hint = generateRuleBasedHint(hintRequest);
      console.log("[ProofWorker] Rule-based hint generated:", hint);
      return hint;
    } catch (error) {
      console.error("[ProofWorker] Error generating hint:", error);
      return {
        level: request.currentLevel,
        explanation: `Error generating hint: ${String(error)}`,
        confidence: 0,
      };
    }
  },
};

/**
 * Helper to find a goal by ID in the proof tree
 */
function findGoalById(
  node: ProtoGoalNode,
  goalId: string,
): ProtoGoalNode | null {
  if (node.goal.id === goalId) {
    return node;
  }
  for (const child of node.children) {
    const found = findGoalById(child, goalId);
    if (found) return found;
  }
  return null;
}

Comlink.expose(proofWorkerAPI);
console.log("[ProofWorker] API exposed");
