"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = exports.Location = void 0;
// A data structure representing the span of the scheme node.
class Location {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    merge(other) {
        return new Location(this.start, other.end);
    }
}
exports.Location = Location;
// A data structure representing a particular position of a token.
class Position {
    constructor(line, column) {
        this.line = line;
        this.column = column;
    }
}
exports.Position = Position;
//# sourceMappingURL=location.js.map