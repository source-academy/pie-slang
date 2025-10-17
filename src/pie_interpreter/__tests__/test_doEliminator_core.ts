import 'jest';
import * as C from '../types/core';
import * as V from '../types/value';
import * as Evaluator from '../evaluator/evaluator';
import { Environment } from '../utils/environment';
import { readBack } from '../evaluator/utils';
import { Context } from '../utils/context';

// Test examples for doEliminator function using Core data structures

// Example 1: List elimination test
export function createListExample(): {
  listType: C.InductiveTypeConstructor,
  sampleList: C.Core,
  eliminator: C.Eliminator
} {

  const listType = new C.InductiveTypeConstructor(
    "List",
    [new C.Nat()], // parameters
    [],                   // no indices
  );

  // Create List constructors
  const nilConstructor = new C.Constructor(
    "nil",   // name
    0,       // constructor index
    "List",  // type: List A
    [],      // no arguments
    []       // no recursive arguments
  );

  // Create a sample list: cons 1 (cons 2 (cons 3 nil))
  // Create cons 3 nil
  const cons3Nil = new C.Constructor(
    "cons",  // name
    1,       // constructor index
    "List",  // type
    [
      new C.Add1(new C.Add1(new C.Add1(new C.Zero())))  // head = 3
    ],       // non-recursive arguments
    [nilConstructor]  // recursive arguments (tail)
  );

  // Create cons 2 (cons 3 nil)
  const cons2 = new C.Constructor(
    "cons",  // name
    1,       // constructor index
    "List",  // type
    [new C.Add1(new C.Add1(new C.Zero()))], // head = 2 (non-recursive argument)
    [cons3Nil]  // recursive arguments (tail)
  );


  // Create eliminator for summing the list with proper lambda expressions
  const sumEliminator = new C.Eliminator(
    "List",
    cons2,
    new C.Lambda("xs", new C.Nat()), // motive: List A -> Nat
    [
      new C.Zero(), // base case: nil -> 0
      new C.Lambda("head",
        new C.Lambda("tail",
          new C.Lambda(
            'n',
            new C.Add1(new C.VarName('n'))
          )
        )
      ) // step case: head -> tail -> sum_tail -> add1 sum_tail
    ]
  );

  return {
    listType,
    sampleList: cons2,
    eliminator: sumEliminator
  };
}

// // Example 2: Binary Tree elimination test  
// export function createBinaryTreeExample(): {
//   treeType: C.InductiveType,
//   sampleTree: C.Core,
//   eliminator: C.Eliminator
// } {

//   // Create Tree constructors
//   const leafConstructor = new C.Constructor(
//     "leaf",
//     new C.VarName("Tree"), // type: Tree A
//     [],  // no arguments
//     0,   // constructor index
//     false // not recursive
//   );

//   const nodeConstructor = new C.Constructor(
//     "node",
//     new C.Pi("value", new C.VarName("A"),
//       new C.Pi("left", new C.VarName("Tree"),
//         new C.Pi("right", new C.VarName("Tree"), 
//           new C.VarName("Tree")))), // type: A -> Tree A -> Tree A -> Tree A
//     [], // no arguments for constructor schema
//     1,   // constructor index
//     true // recursive (contains Tree A)
//   );

//   // Create the Tree inductive type
//   const treeType = new C.InductiveType(
//     "Tree", 
//     [new C.VarName("A")], // parameters
//     [],                   // no indices
//     [leafConstructor, nodeConstructor],
//     new C.Eliminator("Tree",
//       new C.VarName("tree"), // target
//       new C.VarName("P"),    // motive
//       [
//         new C.VarName("base_leaf"),     // method for leaf
//         new C.VarName("step_node")     // method for node
//       ]
//     )
//   );

//   // Create a sample tree: node 5 (node 3 leaf (node 4 leaf leaf)) (node 7 leaf leaf)

//   // Create leaf instances
//   const leaf1 = new C.Constructor("leaf", new C.VarName("Tree"), [], 0, false);
//   const leaf2 = new C.Constructor("leaf", new C.VarName("Tree"), [], 0, false);
//   const leaf3 = new C.Constructor("leaf", new C.VarName("Tree"), [], 0, false);
//   const leaf4 = new C.Constructor("leaf", new C.VarName("Tree"), [], 0, false);

//   // Create node 4 leaf leaf
//   const node4 = new C.Constructor(
//     "node",
//     new C.VarName("Tree"),
//     [
//       new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Zero())))), // 4
//       leaf1,
//       leaf2
//     ],
//     1,
//     true
//   );

//   // Create node 3 leaf (node 4 leaf leaf)
//   const node3 = new C.Constructor(
//     "node", 
//     new C.VarName("Tree"),
//     [
//       new C.Add1(new C.Add1(new C.Add1(new C.Zero()))), // 3
//       leaf3,
//       node4
//     ],
//     1,
//     true
//   );

//   // Create node 7 leaf leaf
//   const node7 = new C.Constructor(
//     "node",
//     new C.VarName("Tree"),
//     [
//       new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Zero()))))))), // 7
//       leaf4,
//       new C.Constructor("leaf", new C.VarName("Tree"), [], 0, false)
//     ],
//     1,
//     true
//   );

//   // Create root node 5 (node 3 ...) (node 7 ...)
//   const sampleTree = new C.Constructor(
//     "node",
//     new C.VarName("Tree"),
//     [
//       new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Add1(new C.Zero()))))), // 5
//       node3,
//       node7
//     ],
//     1,
//     true
//   );

//   // Create eliminator for summing tree values
//   const sumEliminator = new C.Eliminator(
//     "Tree",
//     sampleTree,
//     new C.Lambda("tree", new C.Nat()), // motive: always Nat
//     [
//       new C.Zero(), // base case: leaf -> 0
//       new C.Lambda("value",
//         new C.Lambda("left",
//           new C.Lambda("right", 
//             new C.Lambda("left_sum",
//               new C.Lambda("right_sum",
//                 new C.Application( // value + (left_sum + right_sum)
//                   new C.Application(
//                     new C.VarName("+"),
//                     new C.VarName("value")
//                   ),
//                   new C.Application(
//                     new C.Application(
//                       new C.VarName("+"),
//                       new C.VarName("left_sum")
//                     ),
//                     new C.VarName("right_sum")
//                   )
//                 )
//               )
//             )
//           )
//         )
//       ) // step case: value -> left -> right -> left_sum -> right_sum -> value + left_sum + right_sum
//     ]
//   );

//   return {
//     treeType,
//     sampleTree,
//     eliminator: sumEliminator
//   };
// }

// Jest test cases
describe("doEliminator tests", () => {

  it("should handle list elimination", () => {
    const env: Environment = new Map();
    const listExample = createListExample();

    expect(() => {
      const listResult = Evaluator.doEliminator(
        "List",
        listExample.sampleList.toLazy(env),
        listExample.eliminator.motive.toLazy(env),
        listExample.eliminator.methods.map(m => m.toLazy(env))
      );
      const context: Context = new Map();
      const normalizedResult = readBack(context, new V.Nat(), listResult);
      console.log("List elimination result (normalized):", normalizedResult);
    }).not.toThrow();
  });

  // it("should handle binary tree elimination", () => {
  
  //   const env: Environment = new Map();
  //   const treeExample = createBinaryTreeExample();

  //   expect(() => {
  //     const treeResult = Evaluator.doEliminator(
  //       "Tree", 
  //       treeExample.sampleTree.toLazy(env),
  //       treeExample.eliminator.motive.toLazy(env),
  //       treeExample.eliminator.methods.map(m => m.toLazy(env))
  //     );
  //     console.log("Tree elimination result:", treeResult);
  //   }).not.toThrow();
  // });

  it("should test list elimination with specific values", () => {
    const env: Environment = new Map();
    const listExample = createListExample();

    const listResult = Evaluator.doEliminator(
      "List",
      listExample.sampleList.toLazy(env),
      listExample.eliminator.motive.toLazy(env),
      listExample.eliminator.methods.map(m => m.toLazy(env))
    );

    // Add specific assertions based on expected behavior
    expect(listResult).toBeDefined();
  });

  // it("should test tree elimination with specific values", () => {
  //   const env: Environment = new Map();
  //   const treeExample = createBinaryTreeExample();

  //   const treeResult = Evaluator.doEliminator(
  //     "Tree",
  //     treeExample.sampleTree.toLazy(env),
  //     treeExample.eliminator.motive.toLazy(env),
  //     treeExample.eliminator.methods.map(m => m.toLazy(env))
  //   );

  //   // Add specific assertions based on expected behavior
  //   expect(treeResult).toBeDefined();
  //   });
});
