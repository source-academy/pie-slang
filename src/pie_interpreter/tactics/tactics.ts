import { ProofState, Goal, GoalNode } from './proofstate';
import { Perhaps, go, stop, Message, FirstOrderClosure, HigherOrderClosure } from '../types/utils';
import { Source } from '../types/source';
import { Core, Universe } from '../types/core';
import { Value, Lambda, Pi, Neutral, Nat } from '../types/value';
import { bindFree, Claim, Context, contextToEnvironment, extendContext, Free, valInContext } from '../utils/context';
import { readBack } from '../evaluator/utils';
import { doApp, indVecStepType } from '../evaluator/evaluator';
import { fresh } from '../types/utils';
import { Variable } from '../types/neutral';
import { convert, extendRenaming, Renaming, sameType } from '../typechecker/utils';
import { Location } from '../utils/locations';
import * as V from '../types/value';
import * as C from '../types/core';
import { inspect } from 'util';

export abstract class Tactic {
  constructor(public location: Location) { }

  abstract apply(state: ProofState): Perhaps<ProofState>;

  abstract toString(): string;
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

    let newRenaming = currentGoal.renaming
    if (name !== goalType.argName) {
      extendRenaming(newRenaming, goalType.argName, name)
    }

    const newContext = extendContext(currentGoal.context, name, new Free(goalType.argType))

    const newGoalType = goalType.resultType.valOfClosure(
      new Neutral(goalType.argType, new Variable(name))
    );

    const newGoalNode = new GoalNode(new Goal(state.generateGoalId(), newGoalType, newContext, newRenaming))
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

    console.log(inspect(state, true, null, true))
    const currentGoal = state.currentGoal.goal
    const goalType = currentGoal.type
    const result = this.term.check(currentGoal.context, currentGoal.renaming, goalType)

    if (result instanceof stop) {
      return result;
    }

    state.currentGoal.isComplete = true;

    state.nextGoal()

    return new go(state);
  }
}

export class EliminateNatTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
    private motive: Source
  ) {
    super(location);
  }

  toString(): string {
    return `elim-nat ${this.target} to prove ${this.motive.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const currentGoal_temp = state.getCurrentGoal()
    if (currentGoal_temp instanceof stop) {
      return currentGoal_temp;
    }

    const currentGoal = state.currentGoal.goal

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

    const name = fresh(currentGoal.context, "n");
    const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming,
      new Pi(
        name,
        new V.Nat(),
        new HigherOrderClosure((_) => new V.Universe())
      )
    )

    if (motiveRst instanceof stop) {
      return motiveRst;
    } else {
      const rst = this.eliminateNat(currentGoal.context, currentGoal.renaming, 
        (motiveRst as go<Core>).result.valOf(contextToEnvironment(currentGoal.context)))
      console.log("Eliminating Nat with motive:", inspect(rst, true, null, true))
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
    private motive: Source
  ) {
    super(location);
  }

  toString(): string {
    return `elim-list ${this.target} to prove ${this.motive.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const currentGoal_temp = state.getCurrentGoal()
    if (currentGoal_temp instanceof stop) {
      return currentGoal_temp;
    }

    const currentGoal = state.currentGoal.goal

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

    const listMotive = fresh(currentGoal.context, "motive")
    const E = targetType.entryType
    const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming,
      new V.Pi(
        'xs',
        new V.List(E),
        new FirstOrderClosure(
          contextToEnvironment(currentGoal.context),
          'xs',
          new C.Universe()
        )
      ))
    
    if (motiveRst instanceof stop) {
      return motiveRst;
    } else {
      const motiveType = (motiveRst as go<Core>).result.valOf(contextToEnvironment(currentGoal.context));
      const rst = this.eliminateList(currentGoal.context, currentGoal.renaming, motiveType, E);
      console.log("Eliminating List with motive:", inspect(rst, true, null, true))
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
    return `elim-list ${this.target} to prove ${this.motive.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const currentGoal_temp = state.getCurrentGoal()
    if (currentGoal_temp instanceof stop) {
      return currentGoal_temp;
    }

    const currentGoal = state.currentGoal.goal

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
    const vecMotive = fresh(currentGoal.context, "motive")
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
      const motiveType = (motiveRst as go<Core>).result.valOf(contextToEnvironment(currentGoal.context));
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
    public motive: Source
  ) {
    super(location);
  }

  toString(): string {
    return `elim-equal ${this.target} with motive ${this.motive.prettyPrint()}`;
  }

  public apply(state: ProofState): Perhaps<ProofState> {
    const currentGoal_temp = state.getCurrentGoal()
    if (currentGoal_temp instanceof stop) {
      return currentGoal_temp;
    }

    const currentGoal = state.currentGoal.goal

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

    const [Av, fromv, tov] = [targetType.type, targetType.from, targetType.to]

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
    } else {
      const motiveType = (motiveRst as go<Core>).result.valOf(contextToEnvironment(currentGoal.context));
      const rst = [doApp(doApp(motiveType, tov), new V.Same(fromv))];
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
}