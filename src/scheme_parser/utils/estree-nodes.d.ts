import { Program, Expression, Statement, ExpressionStatement, BlockStatement, ArrayExpression, VariableDeclaration, CallExpression, ArrowFunctionExpression, Literal, Identifier, SourceLocation, ConditionalExpression, AssignmentExpression, ImportSpecifier, ModuleDeclaration, RestElement } from "estree";
export declare function makeProgram(body?: Statement[]): Program;
export declare function makeDeclaration(kind: "var" | "let" | "const", id: Identifier, init: Expression, loc?: SourceLocation): VariableDeclaration;
export declare function makeIdentifier(name: string, loc?: SourceLocation): Identifier;
export declare function makeLiteral(value: string | number | boolean | null | undefined, loc?: SourceLocation): Literal;
export declare function makeArrowFunctionExpression(params: (Identifier | RestElement)[], body: Expression | BlockStatement, loc?: SourceLocation): ArrowFunctionExpression;
export declare function makeBlockStatement(body: Statement[], loc?: SourceLocation): BlockStatement;
export declare function makeCallExpression(callee: Expression, args: Expression[], loc?: SourceLocation): CallExpression;
export declare function makeConditionalExpression(test: Expression, consequent: Expression, alternate: Expression, loc?: SourceLocation): ConditionalExpression;
export declare function makeAssignmentExpression(left: Identifier, right: Expression, loc?: SourceLocation): AssignmentExpression;
export declare function makeExpressionStatement(expression: Expression, loc?: SourceLocation): ExpressionStatement;
export declare function makeReturnStatement(argument: Expression, loc?: SourceLocation): Statement;
export declare function makeRestElement(argument: Identifier, loc?: SourceLocation): RestElement;
export declare function makeArrayExpression(elements: Expression[], loc?: SourceLocation): ArrayExpression;
export declare function makeImportSpecifier(imported: Identifier, local: Identifier, loc?: SourceLocation): ImportSpecifier;
export declare function makeImportDeclaration(specifiers: ImportSpecifier[], source: Literal, loc?: SourceLocation): ModuleDeclaration;
export declare function makeExportNamedDeclaration(declaration: VariableDeclaration, loc?: SourceLocation): ModuleDeclaration;
//# sourceMappingURL=estree-nodes.d.ts.map