import { ProofState, Goal, GoalNode } from './proofstate';
import { Perhaps, go, stop, Message, FirstOrderClosure, HigherOrderClosure } from '../types/utils';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Value, Pi, Neutral, Nat } from '../types/value';
import { Context, contextToEnvironment, Define, extendContext, Free, valInContext } from '../utils/context';

import { doApp, doReplace, indVecStepType } from '../evaluator/evaluator';
import { readBack } from '../evaluator/utils';
import { fresh } from '../types/utils';
import { Variable } from '../types/neutral';
import { convert, sameType, extendRenaming, Renaming} from '../typechecker/utils';
import { Location } from '../utils/locations';
import * as V from '../types/value';
import * as C from '../types/core';

export abstract class Tactic {
  constructor(public location: Location) { }

  abstract apply(state: ProofState): Perhaps<ProofState>;

  abstract toString(): string;

  // Check if branches are pending and this tactic is not allowed
  protected requiresNoBranches(): boolean {
    return true; // Most tactics require no pending branches
  }

  // Wrapper to check pending branches before applying
  protected checkPendingBranches(state: ProofState): Perhaps<null> {
    if (this.requiresNoBranches() && state.pendingBranches > 0) {
      return new stop(
        this.location,
        new Message([
          `Expected 'then' block to handle subgoal branch. ` +
          `${state.pendingBranches} branch(es) remaining. ` +
          `Use (then ...) to group tactics for each subgoal.`
        ])
      );
    }
    return new go(null);
  }
}

export class IntroTactic extends Tactic {
  constructor(
    public location: Location,
    private varName?: string
  ) {
    super(location);
  }

  getName(): string {
    return "intro";
  }

  toString(): string {
    return `intro ${this.varName || ""}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {

    const currentGoal = state.currentGoal.goal
    const goalType = currentGoal.type;

    if (!(goalType instanceof Pi)) {
      return new stop(state.location,
        new Message([`Cannot introduce a variable for non-function type: ${goalType.prettyPrint()}`]));
    }

    const name = this.varName || goalType.argName || fresh(currentGoal.context, "x");

    const newRenaming = currentGoal.renaming
    if (name !== goalType.argName) {
      extendRenaming(newRenaming, goalType.argName, name)
    }

    const newContext = extendContext(currentGoal.context, name, new Free(goalType.argType))

    const newGoalType = goalType.resultType.valOfClosure(
      new Neutral(goalType.argType, new Variable(name))
    );

    const newGoalNode = new GoalNode(new Goal(state.generateGoalId(), newGoalType, newContext, newRenaming))
    
    // Set term builder: wrap the subgoal's term in a lambda
    const paramName = name;
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Lambda(paramName, childTerms[0]);
    };
    
    state.addGoal([newGoalNode])

    return new go(state);
  }
}

export class ExactTactic extends Tactic {
  constructor(
    public location: Location,
    private term: Source
  ) {
    super(location);
  }

  toString(): string {
    return `exact ${this.term.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type

    const result = this.term.check(currentGoal.context, currentGoal.renaming, goalType)

    if (result instanceof stop) {
      return result;
    }

    // Set the proof term for this goal
    state.currentGoal.goal.term = (result as go<Core>).result;

    state.currentGoal.isComplete = true;
    state.currentGoal.completedBy = this.toString();

    state.nextGoal()

    return new go(state);
  }
}

export class ExistsTactic extends Tactic {
  constructor(
    public location: Location,
    public value: Source,
    private varName?: string
  ) {
    super(location);
  }

  toString(): string {
    return `exists ${this.varName || ""}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type;

    if (!(goalType instanceof V.Sigma)) {
      return new stop(state.location,
        new Message([`Cannot use exists on non-product type: ${goalType.prettyPrint()}`]));
    }

    const name = this.varName || goalType.carName || fresh(currentGoal.context, "x");

    const newRenaming = currentGoal.renaming
    if (name !== goalType.carName) {
      extendRenaming(newRenaming, goalType.carName, name)
    }

    const result_temp = this.value.check(currentGoal.context, currentGoal.renaming, goalType.carType);

    if (result_temp instanceof stop) {
      return result_temp;
    }

    const firstCore = (result_temp as go<Core>).result;
    const result = firstCore.valOf(contextToEnvironment(currentGoal.context));

    const newContext = extendContext(currentGoal.context, name, new Define(goalType.carType, result));


    const newGoalType = goalType.cdrType.valOfClosure(
      result
    );

    // Set term builder: wrap in cons with the provided first value
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Cons(firstCore, childTerms[0]);
    };

    const newGoalNode = new GoalNode(new Goal(state.generateGoalId(), newGoalType, newContext, newRenaming))
    state.addGoal([newGoalNode])

    return new go(state);
  }
}

export class EliminateNatTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
  ) {
    super(location);
  }

  toString(): string {
    return `ind-nat ${this.target}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const targetType_temp = currentGoal.context.get(this.target);

    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now()
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    if (!(targetType instanceof Nat)) {
      return new stop(state.location, new Message([`Cannot eliminate non-Nat type: ${targetType.prettyPrint()}`]));
    }

    // Use the same variable name as the target for the motive parameter
    const motiveValue = this.generateNatMotive(currentGoal.context, currentGoal.type, this.target);
    // The motive is a function (-> Nat U), so we read it back with that type
    const motiveType = new V.Pi(this.target, new V.Nat(), new HigherOrderClosure(() => new V.Universe()));
    const motiveCore = readBack(currentGoal.context, motiveType, motiveValue);
    const targetName = this.target;
    
    // Set term builder for ind-Nat: (ind-Nat target motive base step)
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      // childTerms[0] = base case term
      // childTerms[1] = step case term
      return new C.IndNat(
        new C.VarName(targetName),
        motiveCore,
        childTerms[0],
        childTerms[1]
      );
    };
    
    const rst = this.eliminateNat(currentGoal.context, currentGoal.renaming, motiveValue)
    state.addGoal(
      rst.map((type) => {
        const newGoalNode = new GoalNode(
          new Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming)
        );
        return newGoalNode;
      }))
    return new go(state);

  }

  private generateNatMotive(context: Context, goal: Value, targetVar: string): Value {
    // The goal contains references to targetVar as a neutral variable.
    // We need to create a lambda (λ (targetVar) goal) such that when applied to a value v,
    // it produces the goal with targetVar substituted by v.

    // Directly create a Lambda value without read-back round-trip.
    // Read back the goal to Core, then create a FirstOrderClosure.
    const goalCore = goal.readBackType(context);

    // Remove targetVar from context so it becomes a free variable in goalCore
    const contextWithoutTarget = new Map(context);
    contextWithoutTarget.delete(targetVar);
    const env = contextToEnvironment(contextWithoutTarget);

    // Create a Lambda with a FirstOrderClosure that will bind targetVar when applied
    return new V.Lambda(
      targetVar,
      new FirstOrderClosure(env, targetVar, goalCore)
    );
  }

  private eliminateNat(context: Context, r: Renaming, motiveType: Value): Value[] {
    // 1. A base case: (motive zero)
    const baseType = doApp(motiveType, new V.Zero());

    // 2. A step case: (Π (n-1 Nat) (→ (motive n-1) (motive (add1 n-1))))
    const stepType = new V.Pi(
      fresh(context, "n-1"),
      new V.Nat(),
      new HigherOrderClosure((n_minus_1) => {
        return new V.Pi(
          fresh(context, "ih"),
          doApp(motiveType, n_minus_1),
          new HigherOrderClosure((_) =>
            doApp(motiveType, new V.Add1(n_minus_1))
          )
        );
      })
    );

    return [baseType, stepType]
  }
}

export class EliminateListTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
    private motive?: Source
  ) {
    super(location);
  }

  toString(): string {
    return this.motive
      ? `ind-list ${this.target} to prove ${this.motive.prettyPrint()}`
      : `ind-list ${this.target}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;

    const targetType_temp = currentGoal.context.get(this.target);

    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now()
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    // Check that target is actually a List
    if (!(targetType instanceof V.List)) {
      return new stop(state.location, new Message([`Cannot eliminate non-List type: ${targetType.prettyPrint()}`]));
    }

    const E = targetType.entryType

    let motiveType: Value;
    let motiveCore: Core;
    // The type of the motive is (-> (List E) U)
    const motiveMetaType = new V.Pi(
      'xs',
      new V.List(E),
      new HigherOrderClosure((_) => new V.Universe())
    );
    
    if (this.motive) {
      // User provided a motive
      const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, motiveMetaType)

      if (motiveRst instanceof stop) {
        return motiveRst;
      }
      motiveCore = (motiveRst as go<Core>).result;
      motiveType = motiveCore.valOf(contextToEnvironment(currentGoal.context));
    } else {
      // Auto-generate motive from goal
      motiveType = this.generateListMotive(currentGoal.context, currentGoal.type, this.target);
      motiveCore = readBack(currentGoal.context, motiveMetaType, motiveType);
    }

    const targetName = this.target;
    
    // Set term builder for ind-List: (ind-List target motive base step)
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.IndList(
        new C.VarName(targetName),
        motiveCore,
        childTerms[0],
        childTerms[1]
      );
    };

    const rst = this.eliminateList(currentGoal.context, currentGoal.renaming, motiveType, E);
    state.addGoal(
      rst.map((type) => {
        const newGoalNode = new GoalNode(
          new Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming)
        );
        return newGoalNode;
      }))
    return new go(state);
  }

  private generateListMotive(context: Context, goal: Value, targetVar: string): Value {
    // Create a lambda (λ (targetVar) goal) for List elimination
    const goalCore = goal.readBackType(context);

    const contextWithoutTarget = new Map(context);
    contextWithoutTarget.delete(targetVar);
    const env = contextToEnvironment(contextWithoutTarget);

    return new V.Lambda(
      targetVar,
      new FirstOrderClosure(env, targetVar, goalCore)
    );
  }

  private eliminateList(context: Context, r: Renaming, motiveType: Value, entryType: Value): Value[] {
    //1. A base case: (motive nil)
    const baseType = doApp(motiveType, new V.Nil());

    //2. A step case: (Π (x E) (Π (xs (V.List E)) (→ (motive xs) (motive (cons x xs)))))
    const stepType = new V.Pi(
      fresh(context, "x"),
      entryType,
      new HigherOrderClosure(
        (x) => new V.Pi(
          fresh(context, "xs"),
          new V.List(entryType),
          new HigherOrderClosure(
            (xs) => new V.Pi(
              fresh(context, "ih"),
              doApp(motiveType, xs),
              new HigherOrderClosure(
                (_) => doApp(motiveType, new V.ListCons(x, xs))
              )
            )
          )
        )
      )
    )
    return [baseType, stepType];
  }
}

export class EliminateVecTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
    private motive: Source,
    private length: Source
  ) {
    super(location);
  }

  toString(): string {
    return `ind-list ${this.target} to prove ${this.motive.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;

    const targetType_temp = currentGoal.context.get(this.target);

    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now()
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    // Check that target is actually a List
    if (!(targetType instanceof V.Vec)) {
      return new stop(state.location, new Message([`Cannot eliminate non-Vec type: ${targetType.prettyPrint()}`]));
    }

    const lenout = this.length.check(currentGoal.context, currentGoal.renaming, new V.Nat())

    if (lenout instanceof stop) {
      return lenout;
    }

    const [E, len2v] = [targetType.entryType, targetType.length]
    convert(
      currentGoal.context, this.location, new V.Nat(),
      valInContext(currentGoal.context, (lenout as go<Core>).result),
      len2v
    )
    
    const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming,
      new V.Pi(
        'k',
        new V.Nat(),
        new HigherOrderClosure(
          (k) => new V.Pi(
            'es',
            new V.Vec(E, k),
            new HigherOrderClosure(
              (_) => new V.Universe()
            )
          )
        )
      ))

    if (motiveRst instanceof stop) {
      return motiveRst;
    } else {
      const motiveCore = (motiveRst as go<Core>).result;
      const motiveType = motiveCore.valOf(contextToEnvironment(currentGoal.context));
      const lengthCore = (lenout as go<Core>).result;
      const targetName = this.target;
      
      // Set term builder for ind-Vec: (ind-Vec length target motive base step)
      state.currentGoal.termBuilder = (childTerms: Core[]) => {
        return new C.IndVec(
          lengthCore,
          new C.VarName(targetName),
          motiveCore,
          childTerms[0],
          childTerms[1]
        );
      };
      
      const rst = this.eliminateVec(currentGoal.context, currentGoal.renaming, motiveType, E);
      state.addGoal(
        rst.map((type) => {
          const newGoalNode = new GoalNode(
            new Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming)
          );
          return newGoalNode;
        }))
      return new go(state);
    }
  }

  private eliminateVec(context: Context, r: Renaming, motiveType: Value, entryType: Value): Value[] {
    const baseType = doApp(doApp(motiveType, new V.Zero()), new V.VecNil())
    const stepType = indVecStepType(entryType, motiveType)
    return [baseType, stepType];
  }
}

export class EliminateEqualTactic extends Tactic {
  constructor(
    public location: Location,
    public target: string,
    public motive?: Source
  ) {
    super(location);
  }

  toString(): string {
    return this.motive
      ? `ind-equal ${this.target} with motive ${this.motive.prettyPrint()}`
      : `ind-equal ${this.target}`;
  }

  public apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const targetType_temp = currentGoal.context.get(this.target);

    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now()
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    if (!(targetType instanceof V.Equal)) {
      return new stop(state.location, new Message([`Cannot eliminate non-Equal type: ${targetType.prettyPrint()}`]));
    }

    const [Av, fromv,] = [targetType.type, targetType.from, targetType.to]

    let motiveType: Value;
    let motiveCore: Core;
    if (this.motive) {
      // User provided a motive
      const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming,
        new V.Pi(
          'to',
          Av,
          new HigherOrderClosure(
            (to) => new V.Pi(
              'p',
              new V.Equal(Av, fromv, to),
              new HigherOrderClosure(
                (_) => new V.Universe()
              )
            )
          )
        )
      )

      if (motiveRst instanceof stop) {
        return motiveRst;
      }
      motiveCore = (motiveRst as go<Core>).result;
      motiveType = motiveCore.valOf(contextToEnvironment(currentGoal.context));
    } else {
      // Auto-generate motive from goal
      // For = elimination, the motive doesn't depend on the target variable directly
      // but rather needs to abstract over the 'to' and the equality proof
      // This is too complex for auto-generation, so we require the user to provide it
      return new stop(this.location, new Message([`Motive required for = elimination (too complex for auto-generation)`]));
    }

    const targetName = this.target;
    
    // Set term builder for ind-=: (ind-= target motive base)
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.IndEqual(
        new C.VarName(targetName),
        motiveCore,
        childTerms[0]
      );
    };

    const rst = [doApp(doApp(motiveType, fromv), new V.Same(fromv))];
    state.addGoal(
      rst.map((type) => {
        const newGoalNode = new GoalNode(
          new Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming)
          );
          return newGoalNode;
        }))
      return new go(state);
  }
}

export class LeftTactic extends Tactic {
  constructor(
    public location: Location,
  ) {
    super(location);
  }

  toString(): string {
    return `go-Left`;
  }

  public apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    if (!(currentGoal.type.now() instanceof V.Either)) {
      return new stop(state.location, new Message([`"go-Left" expected goal type to be Either, but got: ${currentGoal.type.prettyPrint()}`]));
    }

    const leftType = (currentGoal.type as V.Either).leftType.now();

    // Set term builder: wrap the subgoal's term in Left
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Left(childTerms[0]);
    };

    state.addGoal([new GoalNode(
      new Goal(
        state.generateGoalId(),
        leftType,
        currentGoal.context,
        currentGoal.renaming
      )
    )]);
    return new go(state);
  }
}

export class RightTactic extends Tactic {
  constructor(
    public location: Location,
  ) {
    super(location);
  }

  toString(): string {
    return `go-Right`;
  }

  public apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    if (!(currentGoal.type.now() instanceof V.Either)) {
      return new stop(state.location, new Message([`"go-Right" expected goal type to be Either, but got: ${currentGoal.type.prettyPrint()}`]));
    }

    const rightType = (currentGoal.type as V.Either).rightType.now();

    // Set term builder: wrap the subgoal's term in Right
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Right(childTerms[0]);
    };

    state.addGoal([new GoalNode(
      new Goal(
        state.generateGoalId(),
        rightType,
        currentGoal.context,
        currentGoal.renaming
      )
    )]);
    return new go(state);
  }
}

export class EliminateEitherTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
    private motive?: Source
  ) {
    super(location);
  }

  toString(): string {
    return this.motive
      ? `ind-Either ${this.target} with motive ${this.motive.prettyPrint()}`
      : `ind-Either ${this.target}`;
  }

  public apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result
    const targetType_temp = currentGoal.context.get(this.target)
    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now()
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    if (!(targetType instanceof V.Either)) {
      return new stop(state.location, new Message([`Cannot eliminate non-Either type: ${targetType.prettyPrint()}`]));
    }

    const [Lv, Rv] = [targetType.leftType, targetType.rightType]

    let motiveType: Value;
    let motiveCore: Core;
    // The type of the motive is (-> (Either L R) U)
    const motiveMetaType = new V.Pi(
      'x',
      new V.Either(Lv, Rv),
      new HigherOrderClosure((_) => new V.Universe())
    );
    
    if (this.motive) {
      // User provided a motive
      const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, motiveMetaType)

      if (motiveRst instanceof stop) {
        return motiveRst;
      }
      motiveCore = (motiveRst as go<Core>).result;
      motiveType = motiveCore.valOf(contextToEnvironment(currentGoal.context));
    } else {
      // Auto-generate motive from goal
      motiveType = this.generateEitherMotive(currentGoal.context, currentGoal.type, this.target);
      motiveCore = readBack(currentGoal.context, motiveMetaType, motiveType);
    }

    const targetName = this.target;
    
    // Set term builder for ind-Either: (ind-Either target motive leftCase rightCase)
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.IndEither(
        new C.VarName(targetName),
        motiveCore,
        childTerms[0],
        childTerms[1]
      );
    };

    const leftType = new V.Pi(
      'x',
      Lv,
      new HigherOrderClosure(
        (x) => doApp(motiveType, new V.Left(x))
      )
    )
    const rightType = new V.Pi(
      'x',
      Rv,
      new HigherOrderClosure(
        (x) => doApp(motiveType, new V.Right(x))
      )
    )

    state.addGoal(
      [
        new GoalNode(
          new Goal(
            state.generateGoalId(),
            leftType,
            currentGoal.context,
            currentGoal.renaming
          )
        ),
        new GoalNode(
          new Goal(
            state.generateGoalId(),
            rightType,
            currentGoal.context,
            currentGoal.renaming
          )
        )
        ]);
      return new go(state);
    }

  private generateEitherMotive(context: Context, goal: Value, targetVar: string): Value {
    // Create a lambda (λ (targetVar) goal) for Either elimination
    const goalCore = goal.readBackType(context);

    const contextWithoutTarget = new Map(context);
    contextWithoutTarget.delete(targetVar);
    const env = contextToEnvironment(contextWithoutTarget);

    return new V.Lambda(
      targetVar,
      new FirstOrderClosure(env, targetVar, goalCore)
    );
  }
}

export class SpiltTactic extends Tactic {
  constructor(
    location: Location
  ) {
    super(location);
  } 

  toString(): string {
    return `split-Pair`;
  }

  public apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state. getCurrentGoal() as go<Goal>).result

    if (!(currentGoal.type.now() instanceof V.Sigma)) {
      return new stop(state.location, new Message([`"split-Pair" expected goal type to be Sigma, but got: ${currentGoal.type.prettyPrint()}`]));
    }

    const pairType = currentGoal.type.now() as V.Sigma;
    const carType = pairType.carType.now();
    const cdrType = pairType.cdrType.valOfClosure(
      pairType
    );

    // Set term builder: combine car and cdr into cons
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Cons(childTerms[0], childTerms[1]);
    };

    state.addGoal(
      [
        new GoalNode(
          new Goal(
            state.generateGoalId(),
            carType,
            currentGoal.context,
            currentGoal.renaming
          )
        ),
        new GoalNode(
          new Goal(
            state.generateGoalId(),
            cdrType,
            currentGoal.context,
            currentGoal.renaming
          )
        )
      ]
    )
    return new go(state);
  }
}

export class EliminateAbsurdTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
    private motive?: Source
  ) {
    super(location);
  }

  toString(): string {
    return this.motive
      ? `ind-Absurd ${this.target} with motive ${this.motive.prettyPrint()}`
      : `ind-Absurd ${this.target}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;

    const targetType_temp = currentGoal.context.get(this.target);

    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType: Value;
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now();
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    if (!(targetType instanceof V.Absurd)) {
      return new stop(state.location, new Message([`Cannot eliminate non-Absurd type: ${targetType.prettyPrint()}`]));
    }

    // Get the motive (the goal type we're proving)
    const goalType = currentGoal.type;
    const goalTypeCore = goalType.readBackType(currentGoal.context);
    const targetName = this.target;

    if (this.motive) {
      // User provided a motive, check it
      const motiveRst = this.motive.check(
        currentGoal.context,
        currentGoal.renaming,
        new V.Universe()
      );

      if (motiveRst instanceof stop) {
        return motiveRst;
      }
    }
    
    // For Absurd elimination, we directly produce the proof term
    // (ind-Absurd target motive) where motive is the goal type
    state.currentGoal.goal.term = new C.IndAbsurd(
      new C.VarName(targetName),
      goalTypeCore
    );
    
    state.currentGoal.isComplete = true;
    state.currentGoal.completedBy = this.toString();
    state.nextGoal()

    return new go(state);
  }
}

/**
 * ThenTactic: Groups a sequence of tactics to apply to a single subgoal.
 * This provides hierarchy when elimination tactics create multiple subgoals.
 * Each (then ...) block applies to one subgoal branch.
 * 
 * When pendingBranches > 0, ThenTactic consumes one branch and applies its
 * tactics to that branch. After completing, it moves to the next branch.
 */
export class ThenTactic extends Tactic {
  constructor(
    public location: Location,
    private tactics: Tactic[]
  ) {
    super(location);
  }

  // ThenTactic doesn't require no branches - it handles them
  protected requiresNoBranches(): boolean {
    return false;
  }

  toString(): string {
    return `then (${this.tactics.map(t => t.toString()).join(', ')})`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // If there are pending branches, consume one
    const hadPendingBranches = state.pendingBranches > 0;
    if (hadPendingBranches) {
      state.pendingBranches--;
    }

    // Save the remaining pending branches and clear for the inner tactics
    // (they should not see the sibling branches as "pending")
    const savedPendingBranches = state.pendingBranches;
    state.pendingBranches = 0;

    // Apply each tactic in sequence to the current goal
    for (const tactic of this.tactics) {
      // Notify listener before applying tactic inside then block
      // Skip for nested ThenTactic (it will call the listener for its own inner tactics)
      if (state.tacticListener && !(tactic instanceof ThenTactic)) {
        state.tacticListener(
          state.currentGoal.goal,
          tactic.toString()
        );
      }
      const result = tactic.apply(state);
      if (result instanceof stop) {
        return result;
      }
      state = (result as go<ProofState>).result;
    }

    // Restore the pending branches for sibling handling
    state.pendingBranches = savedPendingBranches;

    // Note: do NOT call nextGoal() here. The last tactic in the then block
    // (typically `exact`) already calls nextGoal() when it solves a goal.
    // Calling nextGoal() again would double-advance, breaking 3+ level
    // nested elimination (e.g., nested elim-Either for 3-variable boolean proofs).

    return new go(state);
  }
}

/**
 * ApplyTactic: If the current goal is of type B and f is of type A -> B,
 * then (apply f) transforms the goal to proving A.
 */
export class ApplyTactic extends Tactic {
  constructor(
    public location: Location,
    private funcExpr: Source
  ) {
    super(location);
  }

  toString(): string {
    return `apply ${this.funcExpr.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    // Check if we need 'then' blocks first
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) {
      return branchCheck;
    }

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type;

    // Synthesize the type of the function expression
    const synthResult = this.funcExpr.synth(currentGoal.context, currentGoal.renaming);
    
    if (synthResult instanceof stop) {
      return synthResult;
    }

    const theResult = (synthResult as go<C.The>).result;
    const funcCore = theResult.expr;
    const funcTypeCore = theResult.type;
    const funcType = funcTypeCore.valOf(contextToEnvironment(currentGoal.context));

    // The function must be of type (-> A B) or (Pi (x A) B)
    // where B matches the current goal type
    if (!(funcType instanceof V.Pi)) {
      return new stop(
        this.location,
        new Message([`Cannot apply non-function type: ${funcType.prettyPrint()}`])
      );
    }

    // Check that the result type of the function matches the goal type
    // For (-> A B), the result type is B (when we apply it to some A)
    // We need to check if funcType.resultType can produce goalType
    
    // Get the argument type (what we need to prove)
    const argType = funcType.argType;
    
    // Get the result type by applying to a neutral variable
    const neutralArg = new Neutral(argType, new Variable(fresh(currentGoal.context, "x")));
    const resultType = funcType.resultType.valOfClosure(neutralArg);

    // Check if the result type matches the goal type
    // We need to verify that the function's result type can produce the goal
    // This is a simplified check - in general, we'd need unification
    try {
      convert(currentGoal.context, this.location, new V.Universe(), resultType, goalType);
    } catch {
      return new stop(
        this.location,
        new Message([`Function result type ${resultType.prettyPrint()} does not match goal type ${goalType.prettyPrint()}`])
      );
    }

    // Set term builder: apply the function to the argument
    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Application(funcCore, childTerms[0]);
    };

    // Create a new goal with the argument type
    const newGoalNode = new GoalNode(
      new Goal(
        state.generateGoalId(),
        argType,
        currentGoal.context,
        currentGoal.renaming
      )
    );
    
    state.addGoal([newGoalNode]);

    return new go(state);
  }
}

/**
 * SymmetryTactic: If the current goal is (= A x y), transform it to (= A y x).
 */
export class SymmetryTactic extends Tactic {
  constructor(public location: Location) {
    super(location);
  }

  toString(): string {
    return `symm`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) return branchCheck;

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type.now();

    if (!(goalType instanceof V.Equal)) {
      return new stop(this.location,
        new Message([`symm requires an = goal, but got: ${goalType.prettyPrint()}`]));
    }

    const newGoalType = new V.Equal(goalType.type, goalType.to, goalType.from);

    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Symm(childTerms[0]);
    };

    const newGoalNode = new GoalNode(
      new Goal(state.generateGoalId(), newGoalType, currentGoal.context, currentGoal.renaming)
    );
    state.addGoal([newGoalNode]);

    return new go(state);
  }
}

/**
 * TransitivityTactic: If the current goal is (= A x z), split it into
 * two subgoals (= A x middle) and (= A middle z), handled via then blocks.
 */
export class TransitivityTactic extends Tactic {
  constructor(
    public location: Location,
    private middleExpr: Source
  ) {
    super(location);
  }

  toString(): string {
    return `trans ${this.middleExpr.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) return branchCheck;

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type.now();

    if (!(goalType instanceof V.Equal)) {
      return new stop(this.location,
        new Message([`trans requires an = goal, but got: ${goalType.prettyPrint()}`]));
    }

    const [Av, fromv, tov] = [goalType.type, goalType.from, goalType.to];

    // Type-check the middle expression against A
    const midResult = this.middleExpr.check(currentGoal.context, currentGoal.renaming, Av);
    if (midResult instanceof stop) return midResult;

    const midCore = (midResult as go<Core>).result;
    const midVal = midCore.valOf(contextToEnvironment(currentGoal.context));

    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Trans(childTerms[0], childTerms[1]);
    };

    const leftGoalType = new V.Equal(Av, fromv, midVal);
    const rightGoalType = new V.Equal(Av, midVal, tov);

    state.addGoal([
      new GoalNode(new Goal(state.generateGoalId(), leftGoalType, currentGoal.context, currentGoal.renaming)),
      new GoalNode(new Goal(state.generateGoalId(), rightGoalType, currentGoal.context, currentGoal.renaming)),
    ]);

    return new go(state);
  }
}

/**
 * ForwardTransTactic: Given two equality proofs p1 : (= A x m) and p2 : (= A m y),
 * produce (= A x y) and close the current goal.
 * Works forward like exact — no subgoal created.
 */
export class ForwardTransTactic extends Tactic {
  constructor(
    public location: Location,
    private leftExpr: Source,
    private rightExpr: Source
  ) {
    super(location);
  }

  toString(): string {
    return `trans ${this.leftExpr.prettyPrint()} ${this.rightExpr.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) return branchCheck;

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type;

    // Synth both proofs
    const leftSynth = this.leftExpr.synth(currentGoal.context, currentGoal.renaming);
    if (leftSynth instanceof stop) return leftSynth;

    const rightSynth = this.rightExpr.synth(currentGoal.context, currentGoal.renaming);
    if (rightSynth instanceof stop) return rightSynth;

    const leftThe = (leftSynth as go<C.The>).result;
    const rightThe = (rightSynth as go<C.The>).result;

    const leftType = valInContext(currentGoal.context, leftThe.type);
    const rightType = valInContext(currentGoal.context, rightThe.type);

    if (!(leftType instanceof V.Equal)) {
      return new stop(this.location,
        new Message([`trans: first argument must be an equality proof, got: ${leftType.prettyPrint()}`]));
    }
    if (!(rightType instanceof V.Equal)) {
      return new stop(this.location,
        new Message([`trans: second argument must be an equality proof, got: ${rightType.prettyPrint()}`]));
    }

    // Check types match
    const typeCheck = sameType(currentGoal.context, this.location, leftType.type, rightType.type);
    if (typeCheck instanceof stop) return typeCheck;

    // Check middle terms match: left.to == right.from
    const midCheck = convert(currentGoal.context, this.location, leftType.type, leftType.to, rightType.from);
    if (midCheck instanceof stop) {
      return new stop(this.location,
        new Message([`trans: middle terms don't match. Left proves (= _ _ ${leftType.to.prettyPrint()}), right proves (= _ ${rightType.from.prettyPrint()} _)`]));
    }

    // Result type: (= A left.from right.to)
    const resultType = new V.Equal(leftType.type, leftType.from, rightType.to);

    // Verify result matches goal
    const matchCheck = convert(currentGoal.context, this.location, new V.Universe(), resultType, goalType);
    if (matchCheck instanceof stop) {
      return new stop(this.location,
        new Message([`trans result type does not match goal. Expected: ${goalType.prettyPrint()}, got: ${resultType.prettyPrint()}`]));
    }

    state.currentGoal.goal.term = new C.Trans(leftThe.expr, rightThe.expr);
    state.currentGoal.isComplete = true;
    state.currentGoal.completedBy = this.toString();
    state.nextGoal();

    return new go(state);
  }
}

/**
 * CongTactic: Given proof p : (= A x y) and function f : (-> A B),
 * produce (= B (f x) (f y)) and close the current goal.
 * Works forward like exact — no subgoal created.
 */
export class CongTactic extends Tactic {
  constructor(
    public location: Location,
    private proofExpr: Source,
    private funcExpr: Source
  ) {
    super(location);
  }

  toString(): string {
    return `cong ${this.proofExpr.prettyPrint()} ${this.funcExpr.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) return branchCheck;

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type;

    // Synth the equality proof
    const proofSynth = this.proofExpr.synth(currentGoal.context, currentGoal.renaming);
    if (proofSynth instanceof stop) return proofSynth;

    const proofThe = (proofSynth as go<C.The>).result;
    const proofCore = proofThe.expr;
    const proofType = valInContext(currentGoal.context, proofThe.type);

    if (!(proofType instanceof V.Equal)) {
      return new stop(this.location,
        new Message([`cong requires an equality proof, but got type: ${proofType.prettyPrint()}`]));
    }

    const [Av, fromv, tov] = [proofType.type, proofType.from, proofType.to];

    // Synth the function
    const funcSynth = this.funcExpr.synth(currentGoal.context, currentGoal.renaming);
    if (funcSynth instanceof stop) return funcSynth;

    const funcThe = (funcSynth as go<C.The>).result;
    const funcCore = funcThe.expr;
    const funcType = valInContext(currentGoal.context, funcThe.type);

    if (!(funcType instanceof V.Pi)) {
      return new stop(this.location,
        new Message([`cong requires a function, but got type: ${funcType.prettyPrint()}`]));
    }

    // Check that the function's argument type matches the equality's type
    const argTypeCheck = sameType(currentGoal.context, this.location, Av, funcType.argType);
    if (argTypeCheck instanceof stop) return argTypeCheck;

    // Compute the result type: (= C (f from) (f to))
    const Cv = funcType.resultType.valOfClosure(fromv);
    const funcVal = valInContext(currentGoal.context, funcCore);
    const resultType = new V.Equal(Cv, doApp(funcVal, fromv), doApp(funcVal, tov));

    // Verify the result matches the goal
    const matchCheck = convert(currentGoal.context, this.location, new V.Universe(), resultType, goalType);
    if (matchCheck instanceof stop) {
      return new stop(this.location,
        new Message([`cong result type does not match goal. Expected: ${goalType.prettyPrint()}, got: ${resultType.prettyPrint()}`]));
    }

    // Build the proof term: (cong proof resultTypeCore func)
    const resultTypeCore = Cv.readBackType(currentGoal.context);
    state.currentGoal.goal.term = new C.Cong(proofCore, resultTypeCore, funcCore);
    state.currentGoal.isComplete = true;
    state.currentGoal.completedBy = this.toString();
    state.nextGoal();

    return new go(state);
  }
}

/**
 * RewriteTactic: Given proof p : (= A from to) and the current goal G,
 * rewrite occurrences of `to` in G to `from`, producing subgoal G[from/to].
 * Uses Pie's `replace` under the hood.
 *
 * Optionally takes a motive (→ A U). If not provided, auto-generates one
 * by abstracting `to` out of the goal.
 */
export class RewriteTactic extends Tactic {
  constructor(
    public location: Location,
    private proofExpr: Source,
    private motiveExpr?: Source
  ) {
    super(location);
  }

  toString(): string {
    return this.motiveExpr
      ? `rewrite ${this.proofExpr.prettyPrint()} ${this.motiveExpr.prettyPrint()}`
      : `rewrite ${this.proofExpr.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const branchCheck = this.checkPendingBranches(state);
    if (branchCheck instanceof stop) return branchCheck;

    const currentGoal = (state.getCurrentGoal() as go<Goal>).result;
    const goalType = currentGoal.type;

    // Synth the equality proof
    const proofSynth = this.proofExpr.synth(currentGoal.context, currentGoal.renaming);
    if (proofSynth instanceof stop) return proofSynth;

    const proofThe = (proofSynth as go<C.The>).result;
    const proofCore = proofThe.expr;
    const proofType = valInContext(currentGoal.context, proofThe.type);

    if (!(proofType instanceof V.Equal)) {
      return new stop(this.location,
        new Message([`rewrite requires an equality proof, but got type: ${proofType.prettyPrint()}`]));
    }

    const [Av, fromv, tov] = [proofType.type, proofType.from, proofType.to];

    // Determine the motive: (→ A U) such that (motive to) = goalType
    let motiveCore: Core;
    let motiveVal: Value;
    const motiveMetaType = new V.Pi('x', Av, new HigherOrderClosure((_) => new V.Universe()));

    if (this.motiveExpr) {
      // User-provided motive
      const motiveResult = this.motiveExpr.check(currentGoal.context, currentGoal.renaming, motiveMetaType);
      if (motiveResult instanceof stop) return motiveResult;
      motiveCore = (motiveResult as go<Core>).result;
      motiveVal = motiveCore.valOf(contextToEnvironment(currentGoal.context));
    } else {
      // Auto-generate motive by abstracting `to` out of the goal
      // Read back the goal type and `to` value, then structurally replace
      const goalCore = goalType.readBackType(currentGoal.context);
      const toCore = readBack(currentGoal.context, Av, tov);

      const varName = fresh(currentGoal.context, "x");
      const replaced = substituteCore(goalCore, toCore, new C.VarName(varName));

      if (replaced === null) {
        return new stop(this.location,
          new Message([`rewrite: could not find the 'to' side of the equality in the goal. Provide a motive explicitly.`]));
      }

      motiveCore = new C.Lambda(varName, replaced);
      motiveVal = motiveCore.valOf(contextToEnvironment(currentGoal.context));

      // Verify (motive to) matches the goal
      try {
        convert(currentGoal.context, this.location, new V.Universe(), doApp(motiveVal, tov), goalType);
      } catch {
        return new stop(this.location,
          new Message([`rewrite: auto-generated motive does not match the goal. Provide a motive explicitly.`]));
      }
    }

    // The new subgoal is (motive from) — the goal with `to` replaced by `from`
    const newGoalType = doApp(motiveVal, fromv);

    state.currentGoal.termBuilder = (childTerms: Core[]) => {
      return new C.Replace(proofCore, motiveCore, childTerms[0]);
    };

    const newGoalNode = new GoalNode(
      new Goal(state.generateGoalId(), newGoalType, currentGoal.context, currentGoal.renaming)
    );
    state.addGoal([newGoalNode]);

    return new go(state);
  }
}

/**
 * Structurally substitute occurrences of `target` with `replacement` in a Core expression.
 * Returns null if no substitution was made (target not found).
 */
function substituteCore(expr: Core, target: Core, replacement: Core): Core | null {
  // Check if the entire expression matches the target
  if (coreEqual(expr, target)) {
    return replacement;
  }

  // Recursively substitute in sub-expressions
  let changed = false;
  const sub = (e: Core): Core => {
    if (coreEqual(e, target)) {
      changed = true;
      return replacement;
    }
    // Recurse into known Core constructors
    if (e instanceof C.Application) {
      const f = sub(e.fun);
      const a = sub(e.arg);
      return (f !== e.fun || a !== e.arg) ? new C.Application(f, a) : e;
    }
    if (e instanceof C.Lambda) {
      const b = sub(e.body);
      return b !== e.body ? new C.Lambda(e.param, b) : e;
    }
    if (e instanceof C.Pi) {
      const at = sub(e.type);
      const rt = sub(e.body);
      return (at !== e.type || rt !== e.body) ? new C.Pi(e.name, at, rt) : e;
    }
    if (e instanceof C.Equal) {
      const t = sub(e.type);
      const l = sub(e.left);
      const r = sub(e.right);
      return (t !== e.type || l !== e.left || r !== e.right) ? new C.Equal(t, l, r) : e;
    }
    if (e instanceof C.Same) {
      const t = sub(e.type);
      return t !== e.type ? new C.Same(t) : e;
    }
    if (e instanceof C.Add1) {
      const n = sub(e.n);
      return n !== e.n ? new C.Add1(n) : e;
    }
    if (e instanceof C.Sigma) {
      const ct = sub(e.type);
      const cdt = sub(e.body);
      return (ct !== e.type || cdt !== e.body) ? new C.Sigma(e.name, ct, cdt) : e;
    }
    if (e instanceof C.Cons) {
      const a = sub(e.first);
      const d = sub(e.second);
      return (a !== e.first || d !== e.second) ? new C.Cons(a, d) : e;
    }
    if (e instanceof C.Cong) {
      const tg = sub(e.target);
      const b = sub(e.base);
      const f = sub(e.fun);
      return (tg !== e.target || b !== e.base || f !== e.fun) ? new C.Cong(tg, b, f) : e;
    }
    if (e instanceof C.Symm) {
      const eq = sub(e.equality);
      return eq !== e.equality ? new C.Symm(eq) : e;
    }
    if (e instanceof C.Trans) {
      const l = sub(e.left);
      const r = sub(e.right);
      return (l !== e.left || r !== e.right) ? new C.Trans(l, r) : e;
    }
    if (e instanceof C.Replace) {
      const tg = sub(e.target);
      const m = sub(e.motive);
      const b = sub(e.base);
      return (tg !== e.target || m !== e.motive || b !== e.base) ? new C.Replace(tg, m, b) : e;
    }
    if (e instanceof C.IndNat) {
      const tg = sub(e.target);
      const m = sub(e.motive);
      const b = sub(e.base);
      const s = sub(e.step);
      return (tg !== e.target || m !== e.motive || b !== e.base || s !== e.step) ? new C.IndNat(tg, m, b, s) : e;
    }
    if (e instanceof C.List) {
      const et = sub(e.elemType);
      return et !== e.elemType ? new C.List(et) : e;
    }
    if (e instanceof C.ListCons) {
      const h = sub(e.head);
      const t2 = sub(e.tail);
      return (h !== e.head || t2 !== e.tail) ? new C.ListCons(h, t2) : e;
    }
    if (e instanceof C.Vec) {
      const t2 = sub(e.type);
      const l = sub(e.length);
      return (t2 !== e.type || l !== e.length) ? new C.Vec(t2, l) : e;
    }
    if (e instanceof C.Either) {
      const l = sub(e.left);
      const r = sub(e.right);
      return (l !== e.left || r !== e.right) ? new C.Either(l, r) : e;
    }
    if (e instanceof C.Left) {
      const v = sub(e.value);
      return v !== e.value ? new C.Left(v) : e;
    }
    if (e instanceof C.Right) {
      const v = sub(e.value);
      return v !== e.value ? new C.Right(v) : e;
    }
    // For other constructors (VarName, Zero, Nil, etc.), no sub-expressions to recurse into
    return e;
  };

  const result = sub(expr);
  return changed ? result : null;
}

/**
 * Structural equality check for Core expressions by comparing prettyPrint output.
 */
function coreEqual(a: Core, b: Core): boolean {
  return a.prettyPrint() === b.prettyPrint();
}
