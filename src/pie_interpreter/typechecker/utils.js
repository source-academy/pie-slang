"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieInfoHook = PieInfoHook;
exports.SendPieInfo = SendPieInfo;
exports.rename = rename;
exports.extendRenaming = extendRenaming;
exports.sameType = sameType;
exports.convert = convert;
exports.atomOk = atomOk;
exports.makeApp = makeApp;
var source_1 = require("../types/source");
var utils_1 = require("../types/utils");
var alphaeqv_1 = require("../utils/alphaeqv");
var utils_2 = require("../evaluator/utils");
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
    var rename = renames.get(x);
    return rename ? rename : x;
}
// Function to extend the Renaming list with a new pair
function extendRenaming(renames, from, to) {
    var newRenames = new Map(__spreadArray([[from, to]], renames, true));
    return newRenames;
}
// ### Check the form of judgment Γ ⊢ c ≡ c type
function sameType(ctx, where, given, expected) {
    var givenE = given.readBackType(ctx);
    var expectedE = expected.readBackType(ctx);
    if ((0, alphaeqv_1.alphaEquiv)(givenE, expectedE)) {
        return new utils_1.go(undefined);
    }
    else {
        return new utils_1.stop(where, new utils_1.Message(["Expected ".concat(expectedE, " but got ").concat(givenE)]));
    }
}
// ### Check the form of judgment Γ ⊢ c : A type
function convert(ctx, where, type, from, to) {
    var fromE = (0, utils_2.readBack)(ctx, type, from);
    var toE = (0, utils_2.readBack)(ctx, type, to);
    if ((0, alphaeqv_1.alphaEquiv)(fromE, toE)) {
        return new utils_1.go(undefined);
    }
    else {
        return new utils_1.stop(where, new utils_1.Message(["The terms ".concat(from.prettyPrint(), " and ").concat(to.prettyPrint(), " are not the same ").concat(type.prettyPrint(), ".")]));
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
