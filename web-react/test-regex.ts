function extractParameters(typeString: string): string[] {
    if (!typeString) return [];
    const params: string[] = [];
    // Match `(Pi (` or `(Pi ((` followed by the variable name
    const regex = /\(Pi\s+\(\s*\(?\s*([^)\s]+)\s+[^)]+\)?\)/g;
    let match;
    while ((match = regex.exec(typeString)) !== null) {
        params.push(match[1]);
    }
    return params;
}

console.log(extractParameters("(Pi ((n Nat)) (= Nat (+ n 0) n))"));
console.log(extractParameters("(Pi (n Nat) (= Nat (+ n 0) n))"));
