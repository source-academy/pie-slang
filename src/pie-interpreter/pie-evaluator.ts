import { BasicEvaluator } from "conductor/dist/conductor/runner";
import { IRunnerPlugin } from "conductor/dist/conductor/runner/types";
import { evaluatePie } from "./main";

export class PieEvaluator extends BasicEvaluator {
  private executionCount: number;

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
    this.executionCount = 0;
  }

  async evaluateChunk(chunk: string): Promise<void> {
    this.executionCount++;
    try {
      const result = evaluatePie(chunk);
      this.conductor.sendOutput(`Result of expression: execution ${result}`);
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
