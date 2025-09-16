"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieInfoHook = PieInfoHook;
exports.SendPieInfo = SendPieInfo;
exports.rename = rename;
exports.extendRenaming = extendRenaming;
exports.sameType = sameType;
exports.convert = convert;
exports.atomOk = atomOk;
exports.makeApp = makeApp;
const source_1 = require("../types/source");
const utils_1 = require("../types/utils");
const alphaeqv_1 = require("../utils/alphaeqv");
const utils_2 = require("../evaluator/utils");
// TODO: Implement PieInfoHook
function PieInfoHook(where, what) {
}
function SendPieInfo(where, what) {
    if (where.forInfo) {
        PieInfoHook(where, what);
    }
}
// Function to rename a symbol using the Renaming list
function rename(renames, x) {
    const rename = renames.get(x);
    return rename ? rename : x;
}
// Function to extend the Renaming list with a new pair
function extendRenaming(renames, from, to) {
    const newRenames = new Map([[from, to], ...renames]);
    return newRenames;
}
// ### Check the form of judgment Γ ⊢ c ≡ c type
function sameType(ctx, where, given, expected) {
    const givenE = given.readBackType(ctx);
    const expectedE = expected.readBackType(ctx);
    if ((0, alphaeqv_1.alphaEquiv)(givenE, expectedE)) {
        return new utils_1.go(undefined);
    }
    else {
        return new utils_1.stop(where, new utils_1.Message([`Expected ${expectedE} but got ${givenE}`]));
    }
}
// ### Check the form of judgment Γ ⊢ c : A type
function convert(ctx, where, type, from, to) {
    const fromE = (0, utils_2.readBack)(ctx, type, from);
    const toE = (0, utils_2.readBack)(ctx, type, to);
    if ((0, alphaeqv_1.alphaEquiv)(fromE, toE)) {
        return new utils_1.go(undefined);
    }
    else {
        return new utils_1.stop(where, new utils_1.Message([`The terms ${from.prettyPrint()} and ${to.prettyPrint()} are not the same ${type.prettyPrint()}.`]));
    }
}
// ### Claims + defines ###
function atomOk(a) {
    return allOkAtom(a.split(''));
}
function allOkAtom(cs) {
    if (cs.length === 0) {
        return true;
    }
    else if (isAlphabetic(cs[0]) || cs[0] === '-') {
        return allOkAtom(cs.slice(1));
    }
    else {
        return false;
    }
}
function isAlphabetic(char) {
    return /^[a-zA-Z]$/.test(char);
}
// Helper to concoct a function application form in source syntax
function makeApp(a, b, cs) {
    return new source_1.Application(a.location, a, b, cs);
}
//# sourceMappingURL=utils.js.map