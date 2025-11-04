import { PieOutputProvider } from './pie_output_provider';
export declare class PieCommandHandler {
    private outputProvider;
    constructor(outputProvider: PieOutputProvider);
    runPieCode(): Promise<void>;
    private getEvaluatePieFunction;
    refreshOutput(): void;
}
//# sourceMappingURL=pie_command_handler.d.ts.map