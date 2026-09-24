import { BasicEvaluator } from "conductor/dist/conductor/runner";
import type { IRunnerPlugin } from "conductor/dist/conductor/runner/types";
import { evaluatePie } from "./main";

export class PieEvaluator extends BasicEvaluator {
  constructor(conductor: IRunnerPlugin) {
    super(conductor);
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      const output = evaluatePie(chunk);
      this.conductor.sendOutput(`Result of expression: execution ${output}`);
    } catch (error) {
      this.conductor.sendOutput(`Error: ${error instanceof Error ? error.message : `${error}`}`);
    }
  }
}
