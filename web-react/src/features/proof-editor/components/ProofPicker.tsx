import { type GlobalContextEntry } from "@/workers/proof-worker";
import { Check, Circle, ShieldCheck } from "lucide-react";

interface ProofPickerProps {
    claims: GlobalContextEntry[];
    theorems: GlobalContextEntry[];
    selectedClaim: string | null;
    onSelect: (claimName: string) => void;
}

export function ProofPicker({
    claims,
    theorems,
    selectedClaim,
    onSelect,
}: ProofPickerProps) {
    // Combine and sort? Or keep separate?
    // Let's keep separate groups for clarity

    if (claims.length === 0 && theorems.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>No proofs found</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="proof-select" className="text-sm text-muted-foreground">
                Proof:
            </label>
            <select
                id="proof-select"
                value={selectedClaim || ""}
                onChange={(e) => onSelect(e.target.value)}
                className="h-8 max-w-[200px] rounded border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
                <option value="" disabled>
                    Select a proof...
                </option>

                {claims.length > 0 && (
                    <optgroup label="Pending Proofs">
                        {claims.map((claim) => (
                            <option key={claim.name} value={claim.name}>
                                ○ {claim.name}
                            </option>
                        ))}
                    </optgroup>
                )}

                {theorems.length > 0 && (
                    <optgroup label="Completed Theorems">
                        {theorems.map((theorem) => (
                            <option key={theorem.name} value={theorem.name}>
                                ✓ {theorem.name}
                            </option>
                        ))}
                    </optgroup>
                )}
            </select>
        </div>
    );
}
