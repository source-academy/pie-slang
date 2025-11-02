import { ProofState } from './proofstate';
import { Tactic } from './tactics';
import { Context } from '../utils/context';
import { Location } from '../utils/locations';
import { Perhaps } from '../types/utils';
export declare class ProofManager {
    currentState: ProofState | null;
    startProof(name: string, context: Context, location: Location): Perhaps<string>;
    applyTactic(tactic: Tactic): Perhaps<string>;
}
//# sourceMappingURL=proofmanager.d.ts.map