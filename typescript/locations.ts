
interface Syntax {
    source: string;
    line: number;
    column: number;
    position: number;
    span: number;
}

// Define the Location type
export interface StxLoc {
    syntax: any; // TODO: figure out the type of syntax
    forInfo: boolean;
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to true.
*/
export function syntaxToLocation(syntax: any): StxLoc {
    return { syntax, forInfo: true };
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to false.
*/
export function notForInfo(loc: StxLoc): StxLoc {
    return { syntax: loc.syntax, forInfo: false };
}

/*
    * Function to convert a Location to a source location.
    * The source location is a tuple of the form:
    *   [source, line, column, position, span]
*/
export function locationToSrcLoc(loc: StxLoc): [string, number, number, number, number] {
    const stx = loc.syntax;
    return [
        stx.source, // Assume stx has a source property
        stx.line,   // Assume stx has a line property
        stx.column, // Assume stx has a column property
        stx.position, // Assume stx has a position property
        stx.span,   // Assume stx has a span property
    ];
}

// Test cases
const exampleSyntax = {
    source: 'example.rkt',
    line: 10,
    column: 5,
    position: 100,
    span: 20,
};

const loc = syntaxToLocation(exampleSyntax);
const notInfoLoc = notForInfo(loc);
const srcLoc = locationToSrcLoc(loc);

console.log(srcLoc);
