import { BasicEvaluator } from "conductor/src/conductor/runner";
import { IRunnerPlugin } from "conductor/src/conductor/runner/types";
import { evaluatePie } from "./main";

// const eval2 = eval;

export class PieEvaluator extends BasicEvaluator {
    private executionCount: number;

    constructor(conductor: IRunnerPlugin) {
        super(conductor);
        this.executionCount = 0;
    }
    
    async evaluateChunk(chunk: string): Promise<void> {
        this.executionCount++;
        try {
            evaluatePie(chunk);
            this.conductor.sendOutput(`Chunk ${this.executionCount} evaluated!`);
        } catch (error) {
            // Handle errors and send them to the REPL
            if (error instanceof Error) {
                this.conductor.sendOutput(`Error: ${error.message}`);
            } else {
                this.conductor.sendOutput(`Error: ${String(error)}`);
            }
        }
        
    }
}