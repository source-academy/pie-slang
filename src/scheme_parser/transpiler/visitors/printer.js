"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Printer = void 0;
/**
 * Visitor implementation that prints the AST.
 */
var Printer = /** @class */ (function () {
    function Printer(indentationLevel) {
        this.indentationLevel = indentationLevel;
    }
    // Factory method for creating a new Printer instance.
    Printer.create = function () {
        // Since the entire AST is wrapped in a sequence node, we start with an indentation level of 0.
        // Sequences increment the indentation level by 1.
        return new Printer(0);
    };
    Printer.prototype.increment = function () {
        this.indentationLevel += 1;
        return this;
    };
    Printer.prototype.decrement = function () {
        this.indentationLevel -= 1;
        return this;
    };
    Printer.prototype.indent = function () {
        process.stdout.write(" ".repeat(this.indentationLevel * 0));
    };
    Printer.prototype.display = function (value) {
        process.stdout.write(value);
    };
    // Atomic AST
    Printer.prototype.visitSequence = function (node) {
        var _this = this;
        this.indent();
        var indentedPrinter = this.increment();
        node.expressions.forEach(function (expression) {
            _this.indent();
            expression.accept(indentedPrinter);
            _this.display("\n");
        });
        this.decrement();
        this.indent();
    };
    Printer.prototype.visitNumericLiteral = function (node) {
        //   this.indent();
        this.display(node.value.toString());
    };
    Printer.prototype.visitBooleanLiteral = function (node) {
        //   this.indent();
        this.display(node.value.toString());
    };
    Printer.prototype.visitStringLiteral = function (node) {
        //   this.indent();
        this.display(node.value);
    };
    Printer.prototype.visitLambda = function (node) {
        var _this = this;
        //   this.indent();
        this.display("( lambda ");
        this.display("( ");
        node.params.forEach(function (parameter) {
            parameter.accept(_this.increment());
            _this.display(" ");
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
    };
    Printer.prototype.visitIdentifier = function (node) {
        this.display(node.name);
    };
    Printer.prototype.visitDefinition = function (node) {
        // this.indent();
        this.display("( define ");
        node.name.accept(this.increment());
        this.display(" ");
        node.value.accept(this.increment());
        this.display(") ");
    };
    Printer.prototype.visitApplication = function (node) {
        var _this = this;
        // this.indent();
        this.display("( ");
        node.operator.accept(this.increment());
        node.operands.forEach(function (operand) {
            _this.display(" ");
            operand.accept(_this.increment());
        });
        this.display(") ");
    };
    Printer.prototype.visitConditional = function (node) {
        // this.indent();
        this.display("( if ");
        node.test.accept(this.increment());
        this.display(" ");
        node.consequent.accept(this.increment());
        this.display(" ");
        node.alternate.accept(this.increment());
        this.display(")");
    };
    Printer.prototype.visitPair = function (node) {
        // this.indent();
        this.display("( cons ");
        node.car.accept(this.increment());
        this.display(" ");
        node.cdr.accept(this.increment());
        this.display(")");
    };
    Printer.prototype.visitNil = function (node) {
        // this.indent();
        this.display("()");
    };
    Printer.prototype.visitSymbol = function (node) {
        // this.indent();
        this.display(node.value);
    };
    Printer.prototype.visitSpliceMarker = function (node) {
        // this.indent();
        this.display(",@");
        this.display(node.value);
        this.display(" ");
    };
    Printer.prototype.visitReassignment = function (node) {
        // this.indent();
        this.display("( set! ");
        node.name.accept(this.increment());
        node.value.accept(this.increment());
        this.display(")");
    };
    Printer.prototype.visitImport = function (node) {
        throw new Error("Method not implemented.");
    };
    Printer.prototype.visitExport = function (node) {
        throw new Error("Method not implemented.");
    };
    Printer.prototype.visitVector = function (node) {
        var _this = this;
        // this.indent();
        this.display("#( ");
        node.elements.forEach(function (element) {
            _this.display(" ");
            element.accept(_this.increment());
        });
        this.display(") ");
    };
    // Extended AST
    Printer.prototype.visitFunctionDefinition = function (node) {
        var _this = this;
        // this.indent();
        this.display("( define ");
        this.display("( ");
        node.name.accept(this);
        this.display(" ");
        node.params.forEach(function (parameter) {
            parameter.accept(_this.increment());
            _this.display(" ");
        });
        if (node.rest) {
            this.display(". ");
            node.rest.accept(this);
        }
        this.display(") ");
        this.display("\n");
        node.body.accept(this.increment());
        this.display(") ");
    };
    Printer.prototype.visitLet = function (node) {
        throw new Error("Method not implemented.");
    };
    Printer.prototype.visitCond = function (node) {
        throw new Error("Method not implemented.");
    };
    Printer.prototype.visitList = function (node) {
        var _this = this;
        // this.indent();
        this.display("( list ");
        node.elements.forEach(function (value) {
            _this.display(" ");
            value.accept(_this.increment());
        });
        if (node.terminator) {
            node.terminator.accept(this);
        }
        this.display(") ");
    };
    Printer.prototype.visitBegin = function (node) {
        var _this = this;
        // this.indent();
        this.display("( begin ");
        node.expressions.forEach(function (expression) {
            _this.display(" ");
            expression.accept(_this.increment());
        });
        this.display(") ");
    };
    Printer.prototype.visitDelay = function (node) {
        // this.indent();
        this.display("( delay ");
        node.expression.accept(this.increment());
        this.display(") ");
    };
    Printer.prototype.visitDefineSyntax = function (node) {
        // this.indent();
        this.display("( define-syntax ");
        node.name.accept(this.increment());
        this.display(" ");
        node.transformer.accept(this.increment());
        this.display(") ");
    };
    Printer.prototype.visitSyntaxRules = function (node) {
        var _this = this;
        // this.indent();
        this.display("( syntax-rules ");
        this.display("( ");
        node.literals.forEach(function (literal) {
            literal.accept(_this.increment());
            _this.display(" ");
        });
        this.display(") ");
        node.rules.forEach(function (rule) {
            _this.display("\n");
            _this.display("( ");
            rule[0].accept(_this.increment());
            _this.display(" ");
            rule[1].accept(_this.increment());
            _this.display(") ");
        });
        this.display(") ");
    };
    return Printer;
}());
exports.Printer = Printer;
