"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = exports.TokenType = exports.Token = void 0;
exports.isToken = isToken;
exports.isGroup = isGroup;
const group_1 = require("./group");
const token_1 = require("./token");
var token_2 = require("./token");
Object.defineProperty(exports, "Token", { enumerable: true, get: function () { return token_2.Token; } });
var token_type_1 = require("./token-type");
Object.defineProperty(exports, "TokenType", { enumerable: true, get: function () { return token_type_1.TokenType; } });
var group_2 = require("./group");
Object.defineProperty(exports, "Group", { enumerable: true, get: function () { return group_2.Group; } });
function isToken(datum) {
    return datum instanceof token_1.Token;
}
function isGroup(datum) {
    return datum instanceof group_1.Group;
}
//# sourceMappingURL=index.js.map