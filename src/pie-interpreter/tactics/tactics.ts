import { ProofState, Goal, GoalNode } from './proofstate';
import { Perhaps, go, stop, Message, FirstOrderClosure, HigherOrderClosure } from '../types/utils';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Value, Pi, Neutral, Nat } from '../types/value';
import { Context, contextToEnvironment, Define, extendContext, Free, valInContext } from '../utils/context';

import { doApp, indVecStepType } from '../evaluator/evaluator';
import { readBack } from '../evaluator/utils';
import { fresh } from '../types/utils';
import { Variable } from '../types/neutral';
import { convert, extendRenaming, Renaming} from '../typechecker/utils';
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
      const result = tactic.apply(state);
      if (result instanceof stop) {
        return result;
      }
      state = (result as go<ProofState>).result;
    }

    // Restore the pending branches for sibling handling
    state.pendingBranches = savedPendingBranches;

    // After completing this branch, if no more pending branches and there are sibling goals,
    // move to the next sibling goal
    if (state.pendingBranches === 0) {
      state.nextGoal();
    }

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
