"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Printer = void 0;
/**
 * Visitor implementation that prints the AST.
 */
class Printer {
    constructor(indentationLevel) {
        this.indentationLevel = indentationLevel;
    }
    // Factory method for creating a new Printer instance.
    static create() {
        // Since the entire AST is wrapped in a sequence node, we start with an indentation level of 0.
        // Sequences increment the indentation level by 1.
        return new Printer(0);
    }
    increment() {
        this.indentationLevel += 1;
        return this;
    }
    decrement() {
        this.indentationLevel -= 1;
        return this;
    }
    indent() {
        process.stdout.write(" ".repeat(this.indentationLevel * 0));
    }
    display(value) {
        process.stdout.write(value);
    }
    // Atomic AST
    visitSequence(node) {
        this.indent();
        const indentedPrinter = this.increment();
        node.expressions.forEach(expression => {
            this.indent();
            expression.accept(indentedPrinter);
            this.display("\n");
        });
        this.decrement();
        this.indent();
    }
    visitNumericLiteral(node) {
        //   this.indent();
        this.display(node.value.toString());
    }
    visitBooleanLiteral(node) {
        //   this.indent();
        this.display(node.value.toString());
    }
    visitStringLiteral(node) {
        //   this.indent();
        this.display(node.value);
    }
    visitLambda(node) {
        //   this.indent();
        this.display("( lambda ");
        this.display("( ");
        node.params.forEach(parameter => {
            parameter.accept(this.increment());
            this.display(" ");
        });
        if (node.rest) {
            this.display(". ");
            node.rest.accept(this);
        }
        this.display(") ");
        node.body.accept(this.increment());
        this.decrement();
        this.indent();
        this.display(") ");
    }
    visitIdentifier(node) {
        this.display(node.name);
    }
    visitDefinition(node) {
        // this.indent();
        this.display("( define ");
        node.name.accept(this.increment());
        this.display(" ");
        node.value.accept(this.increment());
        this.display(") ");
    }
    visitApplication(node) {
        // this.indent();
        this.display("( ");
        node.operator.accept(this.increment());
        node.operands.forEach(operand => {
            this.display(" ");
            operand.accept(this.increment());
        });
        this.display(") ");
    }
    visitConditional(node) {
        // this.indent();
        this.display("( if ");
        node.test.accept(this.increment());
        this.display(" ");
        node.consequent.accept(this.increment());
        this.display(" ");
        node.alternate.accept(this.increment());
        this.display(")");
    }
    visitPair(node) {
        // this.indent();
        this.display("( cons ");
        node.car.accept(this.increment());
        this.display(" ");
        node.cdr.accept(this.increment());
        this.display(")");
    }
    visitNil(node) {
        // this.indent();
        this.display("()");
    }
    visitSymbol(node) {
        // this.indent();
        this.display(node.value);
    }
    visitSpliceMarker(node) {
        // this.indent();
        this.display(",@");
        this.display(node.value);
        this.display(" ");
    }
    visitReassignment(node) {
        // this.indent();
        this.display("( set! ");
        node.name.accept(this.increment());
        node.value.accept(this.increment());
        this.display(")");
    }
    visitImport(node) {
        throw new Error("Method not implemented.");
    }
    visitExport(node) {
        throw new Error("Method not implemented.");
    }
    visitVector(node) {
        // this.indent();
        this.display("#( ");
        node.elements.forEach(element => {
            this.display(" ");
            element.accept(this.increment());
        });
        this.display(") ");
    }
    // Extended AST
    visitFunctionDefinition(node) {
        // this.indent();
        this.display("( define ");
        this.display("( ");
        node.name.accept(this);
        this.display(" ");
        node.params.forEach(parameter => {
            parameter.accept(this.increment());
            this.display(" ");
        });
        if (node.rest) {
            this.display(". ");
            node.rest.accept(this);
        }
        this.display(") ");
        this.display("\n");
        node.body.accept(this.increment());
        this.display(") ");
    }
    visitLet(node) {
        throw new Error("Method not implemented.");
    }
    visitCond(node) {
        throw new Error("Method not implemented.");
    }
    visitList(node) {
        // this.indent();
        this.display("( list ");
        node.elements.forEach(value => {
            this.display(" ");
            value.accept(this.increment());
        });
        if (node.terminator) {
            node.terminator.accept(this);
        }
        this.display(") ");
    }
    visitBegin(node) {
        // this.indent();
        this.display("( begin ");
        node.expressions.forEach(expression => {
            this.display(" ");
            expression.accept(this.increment());
        });
        this.display(") ");
    }
    visitDelay(node) {
        // this.indent();
        this.display("( delay ");
        node.expression.accept(this.increment());
        this.display(") ");
    }
    visitDefineSyntax(node) {
        // this.indent();
        this.display("( define-syntax ");
        node.name.accept(this.increment());
        this.display(" ");
        node.transformer.accept(this.increment());
        this.display(") ");
    }
    visitSyntaxRules(node) {
        // this.indent();
        this.display("( syntax-rules ");
        this.display("( ");
        node.literals.forEach(literal => {
            literal.accept(this.increment());
            this.display(" ");
        });
        this.display(") ");
        node.rules.forEach(rule => {
            this.display("\n");
            this.display("( ");
            rule[0].accept(this.increment());
            this.display(" ");
            rule[1].accept(this.increment());
            this.display(") ");
        });
        this.display(") ");
    }
}
exports.Printer = Printer;
//# sourceMappingURL=printer.js.map