import { BasicEvaluator } from "conductor/dist/conductor/runner";
import type { IRunnerPlugin } from "conductor/dist/conductor/runner/types";
import { ProgramSession, ProgramSessionError } from "./session";

export class PieEvaluator extends BasicEvaluator {
  private readonly session = new ProgramSession();

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      const result = this.session.execute(chunk);
      if (!result.success) throw new ProgramSessionError(result.diagnostics);
      this.conductor.sendOutput(`Result of expression: execution ${result.output}`);
    } catch (error) {
      this.conductor.sendOutput(`Error: ${error instanceof Error ? error.message : `${error}`}`);
    }
  }
}
