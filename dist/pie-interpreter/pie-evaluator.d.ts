import { BasicEvaluator } from "conductor/dist/conductor/runner";
import { IRunnerPlugin } from "conductor/dist/conductor/runner/types";
export declare class PieEvaluator extends BasicEvaluator {
    private executionCount;
    constructor(conductor: IRunnerPlugin);
    evaluateChunk(chunk: string): Promise<void>;
}
//# sourceMappingURL=pie-evaluator.d.ts.map