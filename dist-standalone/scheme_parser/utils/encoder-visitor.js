"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estreeEncode = estreeEncode;
exports.estreeDecode = estreeDecode;
const __1 = require("..");
const walk = require("acorn-walk");
// A function to modify all names in the estree program.
// Prevents any name collisions with JS keywords and invalid characters.
function estreeEncode(ast) {
    walk.full(ast, (node) => {
        if (node.encoded === true) {
            return;
        }
        if (node.type === "Identifier") {
            node.name = (0, __1.encode)(node.name);
            // ensures the conversion is only done once
            node.encoded = true;
        }
    });
    walk.full(ast, (node) => {
        node.encoded = undefined;
    });
    return ast;
}
function estreeDecode(ast) {
    walk.full(ast, (node) => {
        if (node.decoded === true) {
            return;
        }
        if (node.type === "Identifier") {
            node.name = (0, __1.decode)(node.name);
            // ensures the conversion is only done once
            node.decoded = true;
        }
    });
    walk.full(ast, (node) => {
        node.decoded = undefined;
    });
    return ast;
}
//# sourceMappingURL=encoder-visitor.js.map