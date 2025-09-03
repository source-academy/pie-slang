"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = exports.Location = void 0;
// A data structure representing the span of the scheme node.
var Location = /** @class */ (function () {
    function Location(start, end) {
        this.start = start;
        this.end = end;
    }
    Location.prototype.merge = function (other) {
        return new Location(this.start, other.end);
    };
    return Location;
}());
exports.Location = Location;
// A data structure representing a particular position of a token.
var Position = /** @class */ (function () {
    function Position(line, column) {
        this.line = line;
        this.column = column;
    }
    return Position;
}());
exports.Position = Position;
