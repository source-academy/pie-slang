import { ProofState } from './proofstate';
import { Perhaps } from '../types/utils';
import { Source } from '../types/source';
import { Location } from '../utils/locations';
export declare abstract class Tactic {
    location: Location;
    constructor(location: Location);
    abstract apply(state: ProofState): Perhaps<ProofState>;
    abstract toString(): string;
}
export declare class IntroTactic extends Tactic {
    location: Location;
    private varName?;
    constructor(location: Location, varName?: string | undefined);
    getName(): string;
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class ExactTactic extends Tactic {
    location: Location;
    private term;
    constructor(location: Location, term: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class ExistsTactic extends Tactic {
    location: Location;
    value: Source;
    private varName?;
    constructor(location: Location, value: Source, varName?: string | undefined);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class EliminateNatTactic extends Tactic {
    location: Location;
    private target;
    private motive;
    constructor(location: Location, target: string, motive: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
    private eliminateNat;
}
export declare class EliminateListTactic extends Tactic {
    location: Location;
    private target;
    private motive;
    constructor(location: Location, target: string, motive: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
    private eliminateList;
}
export declare class EliminateVecTactic extends Tactic {
    location: Location;
    private target;
    private motive;
    private length;
    constructor(location: Location, target: string, motive: Source, length: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
    private eliminateVec;
}
export declare class EliminateEqualTactic extends Tactic {
    location: Location;
    target: string;
    motive: Source;
    constructor(location: Location, target: string, motive: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class LeftTactic extends Tactic {
    location: Location;
    constructor(location: Location);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class RightTactic extends Tactic {
    location: Location;
    constructor(location: Location);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class EliminateEitherTactic extends Tactic {
    location: Location;
    private target;
    private motive;
    constructor(location: Location, target: string, motive: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class SpiltTactic extends Tactic {
    constructor(location: Location);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
export declare class EliminateAbsurdTactic extends Tactic {
    location: Location;
    private target;
    private motive;
    constructor(location: Location, target: string, motive: Source);
    toString(): string;
    apply(state: ProofState): Perhaps<ProofState>;
}
//# sourceMappingURL=tactics.d.ts.map