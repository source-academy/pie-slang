"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieEvaluator = void 0;
const runner_1 = require("conductor/src/conductor/runner");
const main_1 = require("./main");
class PieEvaluator extends runner_1.BasicEvaluator {
    executionCount;
    constructor(conductor) {
        super(conductor);
        this.executionCount = 0;
    }
    async evaluateChunk(chunk) {
        this.executionCount++;
        try {
            let result = (0, main_1.evaluatePie)(chunk);
            this.conductor.sendOutput(`Result of expression: execution ${result}`);
        }
        catch (error) {
            // Handle errors and send them to the REPL
            if (error instanceof Error) {
                this.conductor.sendOutput(`Error: ${error.message}`);
            }
            else {
                this.conductor.sendOutput(`Error: ${String(error)}`);
            }
        }
    }
}
exports.PieEvaluator = PieEvaluator;
//# sourceMappingURL=PieEvaluator.js.map