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
            // Track definition
            const binding = ctx.get(src.name);
            const typeStr = binding
              ? binding.type.readBackType(ctx).prettyPrint()
              : "unknown";
            globalDefinitions.push({
              name: src.name,
              type: typeStr,
              kind: "definition",
            });
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
            // This is a proved theorem
            const binding = ctx.get(src.name);
            const typeStr = binding
              ? binding.type.readBackType(ctx).prettyPrint()
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
