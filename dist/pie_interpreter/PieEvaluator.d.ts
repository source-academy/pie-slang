import { BasicEvaluator } from "conductor/src/conductor/runner";
import { IRunnerPlugin } from "conductor/src/conductor/runner/types";
export declare class PieEvaluator extends BasicEvaluator {
    private executionCount;
    constructor(conductor: IRunnerPlugin);
    evaluateChunk(chunk: string): Promise<void>;
}
//# sourceMappingURL=PieEvaluator.d.ts.map