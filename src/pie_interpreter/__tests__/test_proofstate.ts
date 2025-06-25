import 'jest';
import { describe } from 'node:test';
import { Goal, ProofState, GoalNode } from '../tactics/proofstate';
import { Location } from '../utils/locations';
import * as V from '../types/value';
import { inspect } from 'util';
  
  describe("Basic Goal Navigation", () => {
    it("simple case 0 - initial state", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      proofstate.addGoal([
        new GoalNode(new Goal("goal_1", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_2", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_3", new V.Nat(), new Map(), new Map())),
      ]);
      
      console.log("Initial state:");
      console.log(inspect(proofstate.currentGoal, true, null, true));
      console.log(proofstate.visualizeTree());
      
      expect(proofstate.currentGoal.goal.id).toBe("goal_1");
      expect(proofstate.isComplete()).toBe(false);
    });

    it("simple case 1 - next goal navigation", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      proofstate.addGoal([
        new GoalNode(new Goal("goal_1", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_2", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_3", new V.Nat(), new Map(), new Map())),
      ]);

      const completed = proofstate.nextGoal();
      console.log("After nextGoal:");
      console.log(inspect(proofstate.currentGoal, true, null, true));
      console.log(proofstate.visualizeTree());
      
      expect(proofstate.currentGoal.goal.id).toBe("goal_2");
      expect(completed).toBe(false);
    });

    it("navigate through all goals sequentially", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      proofstate.addGoal([
        new GoalNode(new Goal("goal_1", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_2", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_3", new V.Nat(), new Map(), new Map())),
      ]);

      // Move to goal_2
      let completed = proofstate.nextGoal();
      expect(proofstate.currentGoal.goal.id).toBe("goal_2");
      expect(completed).toBe(false);

      // Move to goal_3
      completed = proofstate.nextGoal();
      expect(proofstate.currentGoal.goal.id).toBe("goal_3");
      expect(completed).toBe(false);

      // Complete all goals
      completed = proofstate.nextGoal();
      expect(completed).toBe(true);
      expect(proofstate.isComplete()).toBe(true);
      
      console.log("Final state:");
      console.log(proofstate.visualizeTree());
    });
  });

  describe("Nested Goal Structure", () => {
    it("nested goals - single level", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      
      // Add top-level goals
      const goal1 = new GoalNode(new Goal("goal_1", new V.Nat(), new Map(), new Map()));
      const goal2 = new GoalNode(new Goal("goal_2", new V.Atom(), new Map(), new Map()));
      proofstate.addGoal([goal1, goal2]);

      // Add subgoals to goal_1
      proofstate.currentGoal = goal1;
      proofstate.addGoal([
        new GoalNode(new Goal("goal_1_1", new V.Zero(), new Map(), new Map())),
        new GoalNode(new Goal("goal_1_2", new V.Zero(), new Map(), new Map())),
      ]);

      console.log("Nested structure:");
      console.log(proofstate.visualizeTree());
      
      expect(proofstate.currentGoal.goal.id).toBe("goal_1_1");
      expect(goal1.children.length).toBe(2);
    });

    it("deep nesting - three levels", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Universe(), new Location(null, false));
      
      // Level 1
      const level1Goal = new GoalNode(new Goal("level_1", new V.Nat(), new Map(), new Map()));
      proofstate.addGoal([level1Goal]);

      // Level 2
      proofstate.currentGoal = level1Goal;
      const level2Goal = new GoalNode(new Goal("level_2", new V.Atom(), new Map(), new Map()));
      proofstate.addGoal([level2Goal]);

      // Level 3
      proofstate.currentGoal = level2Goal;
      proofstate.addGoal([
        new GoalNode(new Goal("level_3_1", new V.Zero(), new Map(), new Map())),
        new GoalNode(new Goal("level_3_2", new V.Zero(), new Map(), new Map())),
      ]);

      console.log("Three-level nesting:");
      console.log(proofstate.visualizeTree());
      
      expect(proofstate.currentGoal.goal.id).toBe("level_3_1");
    });

    it("navigate through nested structure", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      
      const parentGoal = new GoalNode(new Goal("parent", new V.Nat(), new Map(), new Map()));
      proofstate.addGoal([parentGoal]);

      proofstate.currentGoal = parentGoal;
      proofstate.addGoal([
        new GoalNode(new Goal("child_1", new V.Zero(), new Map(), new Map())),
        new GoalNode(new Goal("child_2", new V.Zero(), new Map(), new Map())),
      ]);

      // Should start at child_1
      expect(proofstate.currentGoal.goal.id).toBe("child_1");

      // Move to child_2
      proofstate.nextGoal();
      expect(proofstate.currentGoal.goal.id).toBe("child_2");

      // Complete children, should mark parent as complete
      const completed = proofstate.nextGoal();
      expect(completed).toBe(true);
      expect(parentGoal.isComplete).toBe(true);
    });
  });

  describe("Goal Types and Context", () => {
    it("different value types", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Universe(), new Location(null, false));
      
      proofstate.addGoal([
        new GoalNode(new Goal("nat_goal", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("atom_goal", new V.Atom(), new Map(), new Map())),
        new GoalNode(new Goal("universe_goal", new V.Universe(), new Map(), new Map())),
        new GoalNode(new Goal("trivial_goal", new V.Trivial(), new Map(), new Map())),
        new GoalNode(new Goal("absurd_goal", new V.Absurd(), new Map(), new Map())),
      ]);

      console.log("Different value types:");
      console.log(proofstate.visualizeTree());
      
      // Navigate through each type
      expect(proofstate.currentGoal.goal.type).toBeInstanceOf(V.Nat);
      
      proofstate.nextGoal();
      expect(proofstate.currentGoal.goal.type).toBeInstanceOf(V.Atom);
      
      proofstate.nextGoal();
      expect(proofstate.currentGoal.goal.type).toBeInstanceOf(V.Universe);
    });

    it("goals with context", () => {
      const context = new Map();
      // Add some hypotheses to context (this would need proper context setup)
      
      let proofstate = ProofState.initialize(context, new V.Nat(), new Location(null, false));
      
      const goalWithContext = new Goal("contextual_goal", new V.Nat(), context, new Map());
      proofstate.addGoal([new GoalNode(goalWithContext)]);
      
      expect(proofstate.currentGoal.goal.context).toBe(context);
    });
  });

  describe("Goal Cloning and State Management", () => {
    it("checkpoint and clone functionality", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      proofstate.addGoal([
        new GoalNode(new Goal("goal_1", new V.Nat(), new Map(), new Map())),
        new GoalNode(new Goal("goal_2", new V.Nat(), new Map(), new Map())),
      ]);

      const checkpoint = proofstate.checkpoint();
      
      // Modify original
      proofstate.nextGoal();
      
      // Checkpoint should be unchanged
      expect(checkpoint.currentGoal.goal.id).toBe("goal_1");
      expect(proofstate.currentGoal.goal.id).toBe("goal_2");
      expect(checkpoint.proofHistory.length).toBe(1);
    });

    it("goal cloning preserves structure", () => {
      const originalGoal = new Goal("original", new V.Nat(), new Map(), new Map());
      const clonedGoal = originalGoal.clone({ id: "cloned" });
      
      expect(clonedGoal.id).toBe("cloned");
      expect(clonedGoal.type).toBe(originalGoal.type);
      expect(clonedGoal.context).not.toBe(originalGoal.context); // Different map instance
      expect(clonedGoal.renaming).not.toBe(originalGoal.renaming); // Different map instance
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    it("empty goal list", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      
      // Initially should have root goal
      expect(proofstate.currentGoal).toBeDefined();
      expect(proofstate.currentGoal.goal.id).toBe("goal_0");
    });

    it("single goal completion", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      proofstate.addGoal([
        new GoalNode(new Goal("only_goal", new V.Nat(), new Map(), new Map())),
      ]);

      expect(proofstate.currentGoal.goal.id).toBe("only_goal");
      
      const completed = proofstate.nextGoal();
      expect(completed).toBe(true);
      expect(proofstate.isComplete()).toBe(true);
    });

    it("goal tree finding by id", () => {
      let proofstate = ProofState.initialize(new Map(), new V.Nat(), new Location(null, false));
      
      const goal1 = new GoalNode(new Goal("findable_goal", new V.Nat(), new Map(), new Map()));
      const goal2 = new GoalNode(new Goal("other_goal", new V.Atom(), new Map(), new Map()));
      
      proofstate.addGoal([goal1, goal2]);
      
      const found = proofstate.goalTree.findById("findable_goal");
      expect(found).toBeDefined();
      expect(found?.goal.id).toBe("findable_goal");
      
      const notFound = proofstate.goalTree.findById("nonexistent");
      expect(notFound).toBeNull();
    });
  });

//   describe("Complex Workflow Scenarios", () => {
//     it("branching and merging proof structure", () => {
//       let proofstate = ProofState.initialize(new Map(), new V.Pi("x", new V.Nat(), new V.Nat()), new Location(null, false));
      
//       // Main proof splits into two subproofs
//       const lemma1 = new GoalNode(new Goal("lemma_1", new V.Nat(), new Map(), new Map()));
//       const lemma2 = new GoalNode(new Goal("lemma_2", new V.Nat(), new Map(), new Map()));
//       proofstate.addGoal([lemma1, lemma2]);

//       // Each lemma has its own subgoals
//       proofstate.currentGoal = lemma1;
//       proofstate.addGoal([
//         new GoalNode(new Goal("lemma_1_step_1", new V.Zero(), new Map(), new Map())),
//         new GoalNode(new Goal("lemma_1_step_2", new V.Zero(), new Map(), new Map())),
//       ]);

//       console.log("Complex branching structure:");
//       console.log(proofstate.visualizeTree());
      
//       expect(proofstate.currentGoal.goal.id).toBe("lemma_1_step_1");
//     });

//     it("proof with mixed goal types and contexts", () => {
//       let proofstate = ProofState.initialize(new Map(), new V.Equal(new V.Nat(), new V.Zero(), new V.Zero()), new Location(null, false));
      
//       proofstate.addGoal([
//         new GoalNode(new Goal("equality_goal", new V.Equal(new V.Nat(), new V.Zero(), new V.Zero()), new Map(), new Map())),
//         new GoalNode(new Goal("function_goal", new V.Pi("x", new V.Nat(), new V.Nat()), new Map(), new Map())),
//         new GoalNode(new Goal("list_goal", new V.List(new V.Nat()), new Map(), new Map())),
//       ]);

//       console.log("Mixed goal types:");
//       console.log(proofstate.visualizeTree());
      
//       // Navigate through different proof obligations
//       expect(proofstate.currentGoal.goal.type).toBeInstanceOf(V.Equal);
      
//       proofstate.nextGoal();
//       expect(proofstate.currentGoal.goal.type).toBeInstanceOf(V.Pi);
      
//       proofstate.nextGoal();
//       expect(proofstate.currentGoal.goal.type).toBeInstanceOf(V.List);
//     });
//   });
// });