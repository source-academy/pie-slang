import { PieOutputProvider } from './pie-output-provider';
export declare class PieCommandHandler {
    private outputProvider;
    constructor(outputProvider: PieOutputProvider);
    runPieCode(): Promise<void>;
    private getEvaluatePieFunction;
    refreshOutput(): void;
}
//# sourceMappingURL=pie-command-handler.d.ts.map