"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.Syntax = exports.SourceLocation = void 0;
exports.notForInfo = notForInfo;
class SourceLocation {
    constructor(source, startLine, startColumn, endLine, endColumn) {
        this.source = source;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
    }
}
exports.SourceLocation = SourceLocation;
class Syntax {
    constructor(start, end, source) {
        this.start = start;
        this.end = end;
        this.source = source;
    }
}
exports.Syntax = Syntax;
class Location {
    constructor(syntax, forInfo) {
        this.syntax = syntax;
        this.forInfo = forInfo;
    }
    locationToSrcLoc() {
        return new SourceLocation(this.syntax.source, this.syntax.start.line, this.syntax.start.column, this.syntax.end.line, this.syntax.end.column);
    }
    toString() {
        return `${this.syntax.source}:${this.syntax.start.line}:${this.syntax.start.column}`;
    }
}
exports.Location = Location;
function notForInfo(loc) {
    return new Location(loc.syntax, false);
}
//# sourceMappingURL=locations.js.map