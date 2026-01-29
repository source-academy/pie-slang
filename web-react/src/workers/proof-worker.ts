import * as Comlink from 'comlink';
import { nanoid } from 'nanoid';

console.log('[ProofWorker] Worker script starting...');

// ============================================
// Types - Must match what convert-proof-tree.ts expects
// ============================================

export type TacticType =
  | 'intro'
  | 'split'
  | 'left'
  | 'right'
  | 'induction'
  | 'exact'
  | 'exists'
  | 'elimVec'
  | 'elimEqual';

export interface TacticParameters {
  variableName?: string;
  expression?: string;
  lengthExpression?: string;  // For elimVec
}

// These types match the Pie interpreter's proofstate.ts exports
export interface SerializableContextEntry {
  id?: string;
  name: string;
  type: string;
  introducedBy?: string;
}

export interface SerializableGoal {
  id: string;
  type: string;
  context: SerializableContextEntry[];
  contextEntries?: SerializableContextEntry[]; // Alias for compatibility
  isComplete: boolean;
  isCurrent: boolean;
  parentId?: string;
}

export interface SerializableGoalNode {
  goal: SerializableGoal;
  children: SerializableGoalNode[];
  appliedTactic?: string;
  completedBy?: string;
}

export interface ProofTreeData {
  root: SerializableGoalNode;
  isComplete: boolean;
  currentGoalId: string | null;
}

export interface SerializableLemma {
  name: string;
  type: string;
}

/**
 * Global context entry - definitions and theorems from the source code
 */
export interface GlobalContextEntry {
  name: string;
  type: string;
  kind: 'definition' | 'claim' | 'theorem';  // theorem = proved claim
}

/**
 * Global context - definitions and theorems available in the proof
 */
export interface GlobalContext {
  definitions: GlobalContextEntry[];
  theorems: GlobalContextEntry[];
}

export interface StartSessionResponse {
  sessionId: string;
  proofTree: ProofTreeData;
  availableLemmas: SerializableLemma[];
  globalContext: GlobalContext;  // NEW: separated global context
  claimType: string;
}

export interface TacticAppliedResponse {
  success: boolean;
  proofTree: ProofTreeData;
  error?: string;
}

// ============================================
// Session storage
// ============================================

interface ProofSession {
  id: string;
  proofManager: any;
  ctx: any;
  claimName: string;
  claimType: string;
}

const sessions = new Map<string, ProofSession>();

// ============================================
// Worker API
// ============================================

export interface ProofWorkerAPI {
  test: () => string;
  testImports: () => Promise<{ success: boolean; results: string[]; error?: string }>;
  startSession: (sourceCode: string, claimName: string) => Promise<StartSessionResponse>;
  applyTactic: (
    sessionId: string,
    goalId: string,
    tacticType: string,
    params?: TacticParameters
  ) => Promise<TacticAppliedResponse>;
  closeSession: (sessionId: string) => void;
  getProofTree: (sessionId: string) => ProofTreeData | null;
}

const proofWorkerAPI: ProofWorkerAPI = {
  test() {
    console.log('[ProofWorker] test() called');
    return 'Proof worker is responding!';
  },

  async testImports() {
    console.log('[ProofWorker] testImports() called');
    const results: string[] = [];

    try {
      results.push('1. Testing parser imports...');
      const parser = await import('../../../src/pie-interpreter/parser/parser');
      results.push('   schemeParse: ' + (typeof parser.schemeParse === 'function' ? 'OK' : 'MISSING'));

      results.push('2. Testing context imports...');
      const ctx = await import('../../../src/pie-interpreter/utils/context');
      results.push('   initCtx: ' + (ctx.initCtx ? 'OK' : 'MISSING'));

      results.push('3. Testing ProofManager...');
      const pmModule = await import('../../../src/pie-interpreter/tactics/proof-manager');
      results.push('   ProofManager: ' + (pmModule.ProofManager ? 'OK' : 'MISSING'));

      results.push('ALL IMPORTS SUCCESSFUL!');
      return { success: true, results };
    } catch (e) {
      results.push('FAILED: ' + String(e));
      return { success: false, results, error: String(e) };
    }
  },

  async startSession(sourceCode: string, claimName: string): Promise<StartSessionResponse> {
    console.log('[ProofWorker] startSession() called for:', claimName);

    try {
      // Dynamically import Pie modules
      console.log('[ProofWorker] Importing modules...');
      const { schemeParse, pieDeclarationParser, Claim, Definition, DefineTactically } =
        await import('../../../src/pie-interpreter/parser/parser');
      const { initCtx, addClaimToContext, addDefineToContext, addDefineTacticallyToContext } =
        await import('../../../src/pie-interpreter/utils/context');
      const { go, stop } = await import('../../../src/pie-interpreter/types/utils');
      const { ProofManager } = await import('../../../src/pie-interpreter/tactics/proof-manager');
      const { Location, Syntax } = await import('../../../src/pie-interpreter/utils/locations');
      const { Position } = await import('../../../src/scheme-parser/transpiler/types/location');

      // Create a dummy location
      const pos = new Position(1, 0);
      const syntax = new Syntax(pos, pos, '');
      const dummyLoc = new Location(syntax, false);

      // Parse source code
      console.log('[ProofWorker] Parsing source code...');
      const astList = schemeParse(sourceCode);
      if (!astList || !Array.isArray(astList)) {
        throw new Error('Failed to parse source code');
      }
      console.log('[ProofWorker] Parsed', astList.length, 'AST nodes');

      // Build context and track definitions/claims for globalContext
      console.log('[ProofWorker] Building context...');
      let ctx = initCtx;
      const globalDefinitions: GlobalContextEntry[] = [];
      const globalTheorems: GlobalContextEntry[] = [];
      const pendingClaims: Array<{ name: string; type: string }> = [];

      for (let i = 0; i < astList.length; i++) {
        const src = pieDeclarationParser.parseDeclaration(astList[i]);
        if (src instanceof Claim) {
          const result = addClaimToContext(ctx, src.name, src.location, src.type);
          if (result instanceof go) {
            ctx = result.result;
            // Track claim for later - will become theorem if proved
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const srcType = src.type as any;
            const typeStr = srcType.readBackType ? srcType.readBackType(ctx).prettyPrint() : String(src.type);
            pendingClaims.push({ name: src.name, type: typeStr });
          } else if (result instanceof stop) {
            throw new Error(`Claim error: ${result.message}`);
          }
        } else if (src instanceof Definition) {
          const result = addDefineToContext(ctx, src.name, src.location, src.expr);
          if (result instanceof go) {
            ctx = result.result;
            // Track definition
            const binding = ctx.get(src.name);
            const typeStr = binding ? binding.type.readBackType(ctx).prettyPrint() : 'unknown';
            globalDefinitions.push({ name: src.name, type: typeStr, kind: 'definition' });
          } else if (result instanceof stop) {
            throw new Error(`Definition error: ${result.message}`);
          }
        } else if (src instanceof DefineTactically) {
          const result = addDefineTacticallyToContext(ctx, src.name, src.location, src.tactics);
          if (result instanceof go) {
            ctx = result.result.context;
            // This is a proved theorem
            const binding = ctx.get(src.name);
            const typeStr = binding ? binding.type.readBackType(ctx).prettyPrint() : 'unknown';
            globalTheorems.push({ name: src.name, type: typeStr, kind: 'theorem' });
            // Remove from pending claims if it was there
            const claimIdx = pendingClaims.findIndex(c => c.name === src.name);
            if (claimIdx >= 0) pendingClaims.splice(claimIdx, 1);
          } else if (result instanceof stop) {
            throw new Error(`DefineTactically error: ${result.message}`);
          }
        }
      }

      // Add remaining unproved claims to theorems list (as claims)
      for (const claim of pendingClaims) {
        globalTheorems.push({ name: claim.name, type: claim.type, kind: 'claim' });
      }

      // Start proof
      console.log('[ProofWorker] Starting proof for:', claimName);
      const pm = new ProofManager();
      const startResult = pm.startProof(claimName, ctx, dummyLoc);

      if (startResult instanceof stop) {
        throw new Error(`Failed to start proof: ${startResult.message}`);
      }
      console.log('[ProofWorker] Proof started successfully');

      // Get proof tree data from the ProofManager
      const rawProofTreeData = pm.getProofTreeData();
      if (!rawProofTreeData) {
        throw new Error('ProofManager returned null proof tree data');
      }
      console.log('[ProofWorker] Got raw proof tree data');

      // Transform the data to match our expected format
      const transformGoalNode = (node: any): SerializableGoalNode => {
        const goal: SerializableGoal = {
          id: node.goal.id,
          type: node.goal.type,
          context: (node.goal.contextEntries || []).map((e: any) => ({
            id: e.id || nanoid(8),
            name: e.name,
            type: e.type,
            // Include introducedBy to distinguish local (introduced by tactic) from global
            introducedBy: e.introducedBy || e.origin || undefined,
          })),
          isComplete: node.goal.isComplete,
          isCurrent: node.goal.isCurrent,
        };

        return {
          goal,
          children: (node.children || []).map(transformGoalNode),
          appliedTactic: node.appliedTactic,
          completedBy: node.completedBy,
        };
      };

      const proofTree: ProofTreeData = {
        root: transformGoalNode(rawProofTreeData.root),
        isComplete: rawProofTreeData.isComplete,
        currentGoalId: rawProofTreeData.currentGoalId,
      };

      // Get claim type
      const binding = ctx.get(claimName);
      const claimType = binding ? binding.type.readBackType(ctx).prettyPrint() : 'unknown';

      // Save session
      const sessionId = nanoid();
      sessions.set(sessionId, {
        id: sessionId,
        proofManager: pm,
        ctx,
        claimName,
        claimType,
      });

      console.log('[ProofWorker] Session created:', sessionId);
      console.log('[ProofWorker] Global context:', { definitions: globalDefinitions.length, theorems: globalTheorems.length });

      return {
        sessionId,
        proofTree,
        availableLemmas: [],
        globalContext: {
          definitions: globalDefinitions,
          theorems: globalTheorems,
        },
        claimType,
      };
    } catch (error) {
      console.error('[ProofWorker] Error:', error);
      throw error;
    }
  },

  async applyTactic(
    sessionId: string,
    goalId: string,
    tacticType: string,
    params: TacticParameters = {}
  ): Promise<TacticAppliedResponse> {
    console.log('[ProofWorker] applyTactic() called:', tacticType, 'on goal:', goalId, 'params:', params);

    const session = sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        proofTree: { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
        error: `Session not found: ${sessionId}`,
      };
    }

    try {
      // Import tactic classes
      const tactics = await import('../../../src/pie-interpreter/tactics/tactics');
      const { Location, Syntax } = await import('../../../src/pie-interpreter/utils/locations');
      const { Position } = await import('../../../src/scheme-parser/transpiler/types/location');
      const { Parser } = await import('../../../src/pie-interpreter/parser/parser');
      const { stop } = await import('../../../src/pie-interpreter/types/utils');

      // Set the current goal to the one the user dropped onto
      const pm = session.proofManager;
      if (pm.currentState) {
        const goalSet = pm.currentState.setCurrentGoalById(goalId);
        if (!goalSet) {
          return {
            success: false,
            proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
            error: `Goal not found: ${goalId}`,
          };
        }
        // Check if goal is already complete
        if (pm.currentState.currentGoal.isComplete) {
          return {
            success: false,
            proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
            error: 'Cannot apply tactic to a completed goal',
          };
        }
      }

      // Create dummy location
      const pos = new Position(1, 0);
      const syntax = new Syntax(pos, pos, '');
      const loc = new Location(syntax, false);

      // Create tactic based on type
      let tactic: InstanceType<typeof tactics.Tactic>;

      switch (tacticType) {
        case 'intro':
          tactic = new tactics.IntroTactic(loc, params.variableName);
          break;

        case 'exact':
          if (!params.expression) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'exact tactic requires an expression parameter',
            };
          }
          const exactTerm = Parser.parsePie(params.expression);
          tactic = new tactics.ExactTactic(loc, exactTerm);
          break;

        case 'exists':
          if (!params.expression) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'exists tactic requires an expression parameter',
            };
          }
          const existsValue = Parser.parsePie(params.expression);
          tactic = new tactics.ExistsTactic(loc, existsValue, params.variableName);
          break;

        case 'split':
          tactic = new tactics.SpiltTactic(loc); // Note: typo in original code
          break;

        case 'left':
          tactic = new tactics.LeftTactic(loc);
          break;

        case 'right':
          tactic = new tactics.RightTactic(loc);
          break;

        case 'elimNat':
        case 'induction':
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimNat tactic requires a target variable name',
            };
          }
          tactic = new tactics.EliminateNatTactic(loc, params.variableName);
          break;

        case 'elimList':
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimList tactic requires a target variable name',
            };
          }
          tactic = new tactics.EliminateListTactic(loc, params.variableName);
          break;

        case 'elimEither':
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimEither tactic requires a target variable name',
            };
          }
          tactic = new tactics.EliminateEitherTactic(loc, params.variableName);
          break;

        case 'elimAbsurd':
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimAbsurd tactic requires a target variable name',
            };
          }
          tactic = new tactics.EliminateAbsurdTactic(loc, params.variableName);
          break;

        case 'elimVec':
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimVec tactic requires a target variable name',
            };
          }
          // EliminateVecTactic requires motive and length expressions
          // For now, we require these via expression (motive) and a new lengthExpression param
          if (!params.expression) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimVec tactic requires a motive expression',
            };
          }
          const vecMotive = Parser.parsePie(params.expression);
          // Default length to the target variable if not provided
          const vecLength = params.lengthExpression
            ? Parser.parsePie(params.lengthExpression)
            : Parser.parsePie(params.variableName);
          tactic = new tactics.EliminateVecTactic(loc, params.variableName, vecMotive, vecLength);
          break;

        case 'elimEqual':
          if (!params.variableName) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimEqual tactic requires a target variable name',
            };
          }
          // EliminateEqualTactic needs a motive function parameter
          // For simplicity, we parse it from the expression parameter if provided
          if (params.expression) {
            const motiveExpr = Parser.parsePie(params.expression);
            tactic = new tactics.EliminateEqualTactic(loc, params.variableName, motiveExpr);
          } else {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'elimEqual tactic requires a motive expression',
            };
          }
          break;

        case 'apply':
          if (!params.expression) {
            return {
              success: false,
              proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
              error: 'apply tactic requires a function/lemma name',
            };
          }
          const funcExpr = Parser.parsePie(params.expression);
          tactic = new tactics.ApplyTactic(loc, funcExpr);
          break;

        default:
          return {
            success: false,
            proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
            error: `Unknown tactic type: ${tacticType}`,
          };
      }

      // Apply the tactic
      const result = session.proofManager.applyTactic(tactic);

      if (result instanceof stop) {
        return {
          success: false,
          proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
          error: result.message.toString(),
        };
      }

      console.log('[ProofWorker] Tactic applied successfully');

      // Get updated proof tree
      const proofTree = this.getProofTree(sessionId);
      if (!proofTree) {
        return {
          success: false,
          proofTree: { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
          error: 'Failed to get proof tree after applying tactic',
        };
      }

      return {
        success: true,
        proofTree,
      };
    } catch (error) {
      console.error('[ProofWorker] Error applying tactic:', error);
      return {
        success: false,
        proofTree: this.getProofTree(sessionId) || { root: { goal: { id: '', type: '', context: [], isComplete: false, isCurrent: false }, children: [] }, isComplete: false, currentGoalId: null },
        error: String(error),
      };
    }
  },

  closeSession(sessionId: string): void {
    console.log('[ProofWorker] closeSession():', sessionId);
    sessions.delete(sessionId);
  },

  getProofTree(sessionId: string): ProofTreeData | null {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const rawData = session.proofManager.getProofTreeData();
    if (!rawData) return null;

    // Transform the data
    const transformGoalNode = (node: any): SerializableGoalNode => ({
      goal: {
        id: node.goal.id,
        type: node.goal.type,
        context: (node.goal.contextEntries || []).map((e: any) => ({
          id: e.id || nanoid(8),
          name: e.name,
          type: e.type,
          // Include introducedBy to distinguish local (introduced by tactic) from global
          introducedBy: e.introducedBy || undefined,
        })),
        isComplete: node.goal.isComplete,
        isCurrent: node.goal.isCurrent,
      },
      children: (node.children || []).map(transformGoalNode),
      appliedTactic: node.appliedTactic,
      completedBy: node.completedBy,
    });

    return {
      root: transformGoalNode(rawData.root),
      isComplete: rawData.isComplete,
      currentGoalId: rawData.currentGoalId,
    };
  },
};

Comlink.expose(proofWorkerAPI);
console.log('[ProofWorker] API exposed');
