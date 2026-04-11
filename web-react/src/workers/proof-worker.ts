import * as Comlink from "comlink";
import { nanoid } from "nanoid";
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
  /** Global definitions available before the proof started (for LoRA context) */
  globalDefinitions: GlobalEntry[];
  /** Global theorems available before the proof started (for LoRA context) */
  globalTheorems: GlobalEntry[];
}

const sessions = new Map<string, ProofSession>();

// ============================================
// LoRA prediction cache
// ============================================

interface LoraPrediction {
  tactic: string;
  tacticHead: string;
  category: string;
  validated: boolean;
}

/** Cache of validated LoRA predictions, keyed by goalId */
const loraPredictions = new Map<string, LoraPrediction>();

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

const proofWorkerAPI: ProofWorkerAPI = {
  test() {
    console.log("[ProofWorker] test() called");
    return "Proof worker is responding!";
  },

  async scanFile(sourceCode: string) {
    console.log("[ProofWorker] scanFile() called");
    try {
      // Dynamically import Pie modules
      const {
        schemeParse,
        pieDeclarationParser,
        Claim,
        Definition,
        DefineTactically,
      } = await import("@pie/parser/parser");
      const {
        initCtx,
        addClaimToContext,
        addDefineToContext,
        addDefineTacticallyToContext,
      } = await import("@pie/utils/context");
      const { go, stop } = await import("@pie/types/utils");
      const { Position } = await import("@scheme/transpiler/types/location");

      // Parse source code
      const astList = schemeParse(sourceCode);
      if (!astList || !Array.isArray(astList)) {
        throw new Error("Failed to parse source code");
      }

      let ctx = initCtx;
      const definitions: GlobalEntry[] = [];
      const theorems: GlobalEntry[] = [];
      const claims: GlobalEntry[] = [];
      const pendingClaims: Array<{ name: string; type: string }> = [];

      for (let i = 0; i < astList.length; i++) {
        const src = pieDeclarationParser.parseDeclaration(astList[i]);
        if (src instanceof Claim) {
          const result = addClaimToContext(
            ctx,
            src.name,
            src.location,
            src.type,
          );
          if (result instanceof go) {
            ctx = result.result;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const srcType = src.type as any;
            const typeStr = srcType.readBackType
              ? srcType.readBackType(ctx).prettyPrint()
              : String(src.type);
            pendingClaims.push({ name: src.name, type: typeStr });
          }
        } else if (src instanceof Definition) {
          const result = addDefineToContext(
            ctx,
            src.name,
            src.location,
            src.expr,
          );
          if (result instanceof go) {
            ctx = result.result;
            const binding = ctx.get(src.name);
            const typeStr = binding
              ? binding.type.readBackType(ctx).prettyPrint()
              : "unknown";
            definitions.push({
              name: src.name,
              type: typeStr,
              kind: "definition",
            });
          }
        } else if (src instanceof DefineTactically) {
          const result = addDefineTacticallyToContext(
            ctx,
            src.name,
            src.location,
            src.tactics,
          );
          if (result instanceof go) {
            ctx = result.result.context;
            const binding = ctx.get(src.name);
            const typeStr = binding
              ? binding.type.readBackType(ctx).prettyPrint()
              : "unknown";
            theorems.push({
              name: src.name,
              type: typeStr,
              kind: "theorem",
            });
            // Remove from pending claims if it was there
            const claimIdx = pendingClaims.findIndex(
              (c) => c.name === src.name,
            );
            if (claimIdx >= 0) pendingClaims.splice(claimIdx, 1);
          }
        }
      }

      // Add remaining unproved claims
      for (const claim of pendingClaims) {
        claims.push({
          name: claim.name,
          type: claim.type,
          kind: "claim",
        });
      }

      return { definitions, theorems, claims };
    } catch (e) {
      console.error("[ProofWorker] scanFile error:", e);
      return { definitions: [], theorems: [], claims: [] };
    }
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
    console.log("[ProofWorker] startSession() called for:", claimName);

    try {
      // Dynamically import Pie modules
      console.log("[ProofWorker] Importing modules...");
      const {
        schemeParse,
        pieDeclarationParser,
        Claim,
        Definition,
        DefineTactically,
      } = await import("@pie/parser/parser");
      const {
        initCtx,
        addClaimToContext,
        addDefineToContext,
        addDefineTacticallyToContext,
      } = await import("@pie/utils/context");
      const { go, stop } = await import("@pie/types/utils");
      const { ProofManager } = await import("@pie/tactics/proof-manager");
      const { Location, Syntax } = await import("@pie/utils/locations");
      const { Position } = await import("@scheme/transpiler/types/location");
      const { sugarType } = await import("@pie/unparser/sugar");

      // Create a dummy location
      const pos = new Position(1, 0);
      const syntax = new Syntax(pos, pos, "");
      const dummyLoc = new Location(syntax, false);

      // Parse source code
      console.log("[ProofWorker] Parsing source code...");
      const astList = schemeParse(sourceCode);
      if (!astList || !Array.isArray(astList)) {
        throw new Error("Failed to parse source code");
      }
      console.log("[ProofWorker] Parsed", astList.length, "AST nodes");

      // Build context and track definitions/claims for globalContext
      console.log("[ProofWorker] Building context...");
      // Pre-scan for valid definitions and theorems to filter the context
      console.log("[ProofWorker] Pre-scanning for definitions...");
      const validNames = new Set<string>();

      for (const node of astList) {
        const src = pieDeclarationParser.parseDeclaration(node);
        if (src instanceof Definition || src instanceof DefineTactically) {
          validNames.add(src.name);
        }
      }

      // Add the target claim to valid names so it's included (it won't have a definition yet)
      validNames.add(claimName);

      console.log(
        "[ProofWorker] Found valid definitions:",
        Array.from(validNames),
      );

      // Build context and track definitions/claims for globalContext
      console.log("[ProofWorker] Building context...");
      let ctx = initCtx;
      const globalDefinitions: GlobalEntry[] = [];
      const globalTheorems: GlobalEntry[] = [];
      const pendingClaims: Array<{ name: string; type: string }> = [];

      for (let i = 0; i < astList.length; i++) {
        const src = pieDeclarationParser.parseDeclaration(astList[i]);

        // Skip SamenessCheck or other non-declaration types if they don't have a name
        if (!("name" in src)) continue;

        // STOP CONDITION: If we've reached the target claim, we're done building context
        // The target claim itself should be added, but nothing after it
        const isTargetClaim = src.name === claimName;

        if (src instanceof Claim) {
          // FILTER: Only add claim to context if it is proven (has a definition) OR is the target claim
          if (!validNames.has(src.name)) {
            // Skip unproven claims (unless it's the target, but target is in validNames)
            continue;
          }

          const result = addClaimToContext(
            ctx,
            src.name,
            src.location,
            src.type,
          );

          if (result instanceof go) {
            ctx = result.result;
            // Track claim for later - will become theorem if proved
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const srcType = src.type as any;
            const typeStr = srcType.readBackType
              ? srcType.readBackType(ctx).prettyPrint()
              : String(src.type);

            // If this is the target claim, we don't treat it as "pending" for the global list
            // (or maybe we do? It doesn't matter for the proof session, but for the returned globalContext)
            // Actually, we should probably treat it as a claim to prove.
            if (!isTargetClaim) {
              pendingClaims.push({ name: src.name, type: typeStr });
            }
          } else if (result instanceof stop) {
            throw new Error(`Claim error: ${result.message}`);
          }
        } else if (src instanceof Definition) {
          // Definitions are always valid if their claim was valid (which we filtered above)
          // But strict check: is it in validNames? Yes by definition.

          const result = addDefineToContext(
            ctx,
            src.name,
            src.location,
            src.expr,
          );
          if (result instanceof go) {
            ctx = result.result;
            // Track definition — use sugarType to match training data format
            const binding = ctx.get(src.name);
            const typeStr = binding
              ? sugarType(binding.type.readBackType(ctx), ctx)
              : "unknown";
            globalDefinitions.push({
              name: src.name,
              type: typeStr,
              kind: "definition",
            });
            // Remove from pending claims (claim is now fulfilled by this definition)
            const claimIdx = pendingClaims.findIndex(
              (c) => c.name === src.name,
            );
            if (claimIdx >= 0) pendingClaims.splice(claimIdx, 1);
          } else if (result instanceof stop) {
            throw new Error(`Definition error: ${result.message}`);
          }
        } else if (src instanceof DefineTactically) {
          const result = addDefineTacticallyToContext(
            ctx,
            src.name,
            src.location,
            src.tactics,
          );
          if (result instanceof go) {
            ctx = result.result.context;
            // This is a proved theorem — use sugarType to match training data format
            const binding = ctx.get(src.name);
            const typeStr = binding
              ? sugarType(binding.type.readBackType(ctx), ctx)
              : "unknown";
            globalTheorems.push({
              name: src.name,
              type: typeStr,
              kind: "theorem",
            });
            // Remove from pending claims if it was there
            const claimIdx = pendingClaims.findIndex(
              (c) => c.name === src.name,
            );
            if (claimIdx >= 0) pendingClaims.splice(claimIdx, 1);
          } else if (result instanceof stop) {
            throw new Error(`DefineTactically error: ${result.message}`);
          }
        }

        // If we just processed the target claim, STOP building context.
        // We don't want anything declared *after* the claim to be available.
        if (isTargetClaim) {
          console.log(
            `[ProofWorker] Reached target claim '${claimName}', stopping context build.`,
          );
          break;
        }
      }

      // Add remaining unproved claims to theorems list (as claims)
      for (const claim of pendingClaims) {
        globalTheorems.push({
          name: claim.name,
          type: claim.type,
          kind: "claim",
        });
      }

      // Start proof
      console.log("[ProofWorker] Starting proof for:", claimName);
      const pm = new ProofManager();
      const startResult = pm.startProof(claimName, ctx, dummyLoc);

      if (startResult instanceof stop) {
        throw new Error(`Failed to start proof: ${startResult.message}`);
      }
      console.log("[ProofWorker] Proof started successfully");

      // Get proof tree data from the ProofManager
      const rawProofTreeData = pm.getProofTreeData();
      if (!rawProofTreeData) {
        throw new Error("ProofManager returned null proof tree data");
      }
      console.log("[ProofWorker] Got raw proof tree data");

      const proofTree = buildProofTree(rawProofTreeData);

      // Get claim type
      const binding = ctx.get(claimName);
      const claimType = binding
        ? binding.type.readBackType(ctx).prettyPrint()
        : "unknown";

      // Save session
      const sessionId = nanoid();
      sessions.set(sessionId, {
        id: sessionId,
        proofManager: pm,
        ctx,
        claimName,
        claimType,
        globalDefinitions,
        globalTheorems,
      });

      console.log("[ProofWorker] Session created:", sessionId);
      console.log("[ProofWorker] Global context:", {
        definitions: globalDefinitions.length,
        theorems: globalTheorems.length,
      });

      return {
        sessionId,
        proofTree,
        globalContext: {
          definitions: globalDefinitions,
          theorems: globalTheorems,
        },
        claimType,
      } satisfies StartSessionResponse;
    } catch (error) {
      console.error("[ProofWorker] Error:", error);
      throw error;
    }
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

        case "exact":
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

        case "exists":
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

      const context = goal.goal.context.map((c) => ({
        name: c.name,
        type: c.type,
      }));

      // Build proof state text matching LoRA training format for Gemini context
      const globalNames = new Set<string>();
      const defLines: string[] = [];
      for (const entry of [
        ...session.globalDefinitions,
        ...session.globalTheorems,
      ]) {
        if (!globalNames.has(entry.name)) {
          globalNames.add(entry.name);
          defLines.push(`  ${entry.name} : ${entry.type}`);
        }
      }
      const localLines = context
        .filter(
          (c) => !globalNames.has(c.name) && c.name !== session.claimName,
        )
        .map((c) => `  ${c.name} : ${c.type}`);
      const proofStateParts: string[] = [];
      if (defLines.length > 0)
        proofStateParts.push("Definitions:\n" + defLines.join("\n"));
      if (localLines.length > 0)
        proofStateParts.push("Local variables:\n" + localLines.join("\n"));
      proofStateParts.push(`Goal: ${goal.goal.type}`);
      const proofStateText = proofStateParts.join("\n");

      // ── LoRA path: predict → validate → cache → Gemini explain ──

      // Try to get LoRA prediction (only on first hint request for this goal)
      let loraPrediction: LoraPrediction | undefined =
        loraPredictions.get(request.goalId);

      if (!loraPrediction && request.loraServerUrl) {
        loraPrediction = (await fetchAndValidateLoraPrediction(
          request.loraServerUrl,
          request.sessionId,
          request.goalId,
          goal.goal.type,
          goal.goal.context,
          session,
        )) ?? undefined;
        if (loraPrediction) {
          loraPredictions.set(request.goalId, loraPrediction);
          console.log(
            "[ProofWorker] LoRA prediction cached:",
            loraPrediction.tactic,
            "validated:",
            loraPrediction.validated,
          );
        }
      }

      // If we have a validated LoRA prediction, use Gemini to explain it
      if (loraPrediction?.validated && request.apiKey) {
        try {
          const { explainTactic } = await import(
            "@pie/solver/hint-generator"
          );
          const explainRequest = {
            predictedTactic: loraPrediction.tactic,
            tacticCategory: loraPrediction.category,
            goalType: goal.goal.type,
            context,
            level: request.currentLevel,
            proofStateText,
          };
          console.log(
            "[ProofWorker] 📤 Sending to Gemini explainTactic:",
            JSON.stringify(explainRequest, null, 2),
          );
          const hint = await explainTactic(request.apiKey, explainRequest);
          console.log(
            "[ProofWorker] 📥 Gemini explainTactic returned:",
            JSON.stringify(hint, null, 2),
          );
          const finalHint = { ...hint, source: "lora" as const };
          console.log(
            "[ProofWorker] 🎯 Final hint to frontend:",
            JSON.stringify(finalHint, null, 2),
          );
          return finalHint;
        } catch (explainError) {
          console.warn(
            "[ProofWorker] Gemini explanation failed, using fallback:",
            explainError,
          );
          // Fall through to LoRA-without-Gemini path
        }
      }

      // If we have a validated LoRA prediction but no Gemini API key (or Gemini failed),
      // provide a simple structured hint from the prediction using the built-in fallback
      if (loraPrediction?.validated) {
        const { explainTactic } = await import("@pie/solver/hint-generator");
        const explainRequest = {
          predictedTactic: loraPrediction.tactic,
          tacticCategory: loraPrediction.category,
          goalType: goal.goal.type,
          context,
          level: request.currentLevel,
          proofStateText,
        };
        console.log(
          "[ProofWorker] 📤 Sending to fallback explainTactic (no API key):",
          JSON.stringify(explainRequest, null, 2),
        );
        const hint = await explainTactic("", explainRequest);
        console.log(
          "[ProofWorker] 📥 Fallback explainTactic returned:",
          JSON.stringify(hint, null, 2),
        );
        return { ...hint, source: "lora" };
      }

      // ── Legacy path: Gemini-only or rule-based ──

      const hintRequest = {
        goalType: goal.goal.type,
        context,
        availableTactics: (
          Object.keys(TACTIC_REQUIREMENTS) as TacticType[]
        ).filter((t) => t !== "todo"),
        currentLevel: request.currentLevel,
        previousHint: request.previousHint,
      };

      const { generateProgressiveHint, generateRuleBasedHint } =
        await import("@pie/solver/hint-generator");

      // Try AI-powered hint if API key is provided
      if (request.apiKey) {
        try {
          const hint = await generateProgressiveHint(
            request.apiKey,
            hintRequest,
          );
          console.log("[ProofWorker] Gemini-only hint generated:", hint);
          return { ...hint, source: "gemini" };
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
      return { ...hint, source: "rule-based" };
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
 * Fetch a tactic prediction from the local LoRA server and validate it
 * by dry-running the tactic against the proof state.
 *
 * Returns null if the server is unreachable or the prediction is invalid.
 */
async function fetchAndValidateLoraPrediction(
  loraServerUrl: string,
  _sessionId: string,
  _goalId: string,
  goalType: string,
  goalContext: ContextEntry[],
  session: ProofSession,
): Promise<LoraPrediction | null> {
  // 1. Fetch prediction from LoRA server
  let tactic: string;
  let tacticHead: string;
  let category: string;

  try {
    const url = loraServerUrl.replace(/\/+$/, "");

    // Global context: definitions + theorems from session (deduplicated).
    // Types are already sugared via sugarType in startSession.
    const globalNames = new Set<string>();
    const globalCtx: Array<{ name: string; type: string }> = [];
    for (const entry of [
      ...session.globalDefinitions,
      ...session.globalTheorems,
    ]) {
      if (!globalNames.has(entry.name)) {
        globalNames.add(entry.name);
        globalCtx.push({ name: entry.name, type: entry.type });
      }
    }

    // Local context: only entries NOT in global context and NOT the claim being proved.
    // Types are now sugared at the source (proofstate.ts uses sugarType).
    const localCtx = goalContext
      .filter(
        (c) => !globalNames.has(c.name) && c.name !== session.claimName,
      )
      .map((c) => ({ name: c.name, type: c.type }));

    const requestBody = {
      goal: goalType,
      globalContext: globalCtx,
      localContext: localCtx,
    };
    console.log(
      "[ProofWorker] 📤 LoRA request:",
      JSON.stringify(requestBody, null, 2),
    );

    const resp = await fetch(`${url}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      console.warn(
        "[ProofWorker] LoRA server returned",
        resp.status,
        resp.statusText,
      );
      return null;
    }

    const data = await resp.json();
    console.log(
      "[ProofWorker] 📥 LoRA response:",
      JSON.stringify(data, null, 2),
    );
    tactic = data.tactic.trim();
    tacticHead = data.tactic_head;
    category = data.category;

    // Sanitize: if the model produced multi-line output or a very long
    // "exact" expression (full proof term), it's not a useful single-step
    // tactic hint. Reject it so we fall back to Gemini.
    if (tactic.includes("\n") || tactic.length > 100) {
      console.warn(
        "[ProofWorker] LoRA output too complex for hint, rejecting:",
        tactic.slice(0, 80) + "...",
      );
      return null;
    }
  } catch (error) {
    console.warn("[ProofWorker] LoRA server unreachable:", error);
    return null;
  }

  // 2. Validate by parsing the tactic string.
  //    We verify the tactic parses correctly and has a recognized type.
  //    Full type-checking (dry-run) would require cloning the proof state,
  //    which ProofManager doesn't support. Parse validation catches most
  //    LoRA errors (malformed output, unknown tactic names).
  let validated = false;
  try {
    const { schemeParse, Parser } = await import("@pie/parser/parser");

    // Parse the tactic string
    const wrapped = tactic.trim().startsWith("(") ? tactic : `(${tactic})`;
    const parsed = schemeParse(wrapped);
    Parser.parseToTactics(parsed[0]);

    // If parsing succeeded, the tactic is structurally valid
    validated = true;
    console.log("[ProofWorker] LoRA prediction parsed successfully:", tactic);
  } catch (error) {
    console.warn("[ProofWorker] LoRA prediction parse error:", error);
    validated = false;
  }

  return { tactic, tacticHead, category, validated };
}

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
