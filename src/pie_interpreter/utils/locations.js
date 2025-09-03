"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.Syntax = exports.SourceLocation = void 0;
exports.notForInfo = notForInfo;
var SourceLocation = /** @class */ (function () {
    function SourceLocation(source, startLine, startColumn, endLine, endColumn) {
        this.source = source;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
    }
    return SourceLocation;
}());
exports.SourceLocation = SourceLocation;
var Syntax = /** @class */ (function () {
    function Syntax(start, end, source) {
        this.start = start;
        this.end = end;
        this.source = source;
    }
    return Syntax;
}());
exports.Syntax = Syntax;
var Location = /** @class */ (function () {
    function Location(syntax, forInfo) {
        this.syntax = syntax;
        this.forInfo = forInfo;
    }
    Location.prototype.locationToSrcLoc = function () {
        return new SourceLocation(this.syntax.source, this.syntax.start.line, this.syntax.start.column, this.syntax.end.line, this.syntax.end.column);
    };
    Location.prototype.toString = function () {
        return "".concat(this.syntax.source, ":").concat(this.syntax.start.line, ":").concat(this.syntax.start.column);
    };
    return Location;
}());
exports.Location = Location;
function notForInfo(loc) {
    return new Location(loc.syntax, false);
}
