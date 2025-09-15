"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeU = makeU;
exports.makeArrow = makeArrow;
exports.makeNat = makeNat;
exports.makeZero = makeZero;
exports.makeAdd1 = makeAdd1;
exports.makeLambda = makeLambda;
exports.makePi = makePi;
exports.makeSigma = makeSigma;
exports.makeTypedBinders = makeTypedBinders;
exports.makeApp = makeApp;
exports.makeAtom = makeAtom;
exports.makeTrivial = makeTrivial;
exports.makeSole = makeSole;
exports.makeList = makeList;
exports.makeVec = makeVec;
exports.makeEither = makeEither;
exports.makeNil = makeNil;
exports.makeVecCons = makeVecCons;
exports.makeVecNil = makeVecNil;
exports.makeAbsurd = makeAbsurd;
exports.makePair = makePair;
exports.makeCons = makeCons;
exports.makeListCons = makeListCons;
exports.makeThe = makeThe;
exports.makeIndAbsurd = makeIndAbsurd;
exports.makeTrans = makeTrans;
exports.makeCong = makeCong;
exports.makeIndEqual = makeIndEqual;
exports.makeWhichNat = makeWhichNat;
exports.makeIterNat = makeIterNat;
exports.makeRecNat = makeRecNat;
exports.makeIndNat = makeIndNat;
exports.makeRecList = makeRecList;
exports.makeIndList = makeIndList;
exports.makeIndEither = makeIndEither;
exports.makeIndVec = makeIndVec;
exports.makeEqual = makeEqual;
exports.makeReplace = makeReplace;
exports.makeSymm = makeSymm;
exports.makeHead = makeHead;
exports.makeTail = makeTail;
exports.makeSame = makeSame;
exports.makeLeft = makeLeft;
exports.makeRight = makeRight;
exports.makeCar = makeCar;
exports.makeCdr = makeCdr;
exports.makeQuote = makeQuote;
exports.makeVarRef = makeVarRef;
exports.makeNatLiteral = makeNatLiteral;
exports.makeTODO = makeTODO;
exports.makeIntro = makeIntro;
exports.makeExact = makeExact;
exports.makeExists = makeExists;
exports.makeElimNat = makeElimNat;
exports.makeElimList = makeElimList;
exports.makeElimVec = makeElimVec;
exports.makeElimEqual = makeElimEqual;
exports.makeLeftTactic = makeLeftTactic;
exports.makeRightTactic = makeRightTactic;
exports.makeElimEither = makeElimEither;
exports.makeSplit = makeSplit;
exports.makeElimAbsurd = makeElimAbsurd;
const S = __importStar(require("../types/source"));
const parser_1 = require("./parser");
const tactics_1 = require("../tactics/tactics");
function makeU(stx) {
    return new S.Universe((0, parser_1.syntaxToLocation)(stx));
}
function makeArrow(stx, args) {
    return new S.Arrow((0, parser_1.syntaxToLocation)(stx), args[0], args[1], args[2]);
}
function makeNat(stx) {
    return new S.Nat((0, parser_1.syntaxToLocation)(stx));
}
function makeZero(stx) {
    return new S.Zero((0, parser_1.syntaxToLocation)(stx));
}
function makeAdd1(stx, n) {
    return new S.Add1((0, parser_1.syntaxToLocation)(stx), n);
}
function makeLambda(stx, binders, body) {
    return new S.Lambda((0, parser_1.syntaxToLocation)(stx), binders, body);
}
function makePi(stx, binders, body) {
    return new S.Pi((0, parser_1.syntaxToLocation)(stx), binders, body);
}
function makeSigma(stx, binders, body) {
    return new S.Sigma((0, parser_1.syntaxToLocation)(stx), binders, body);
}
function makeTypedBinders(head, tail) {
    return [head, ...tail];
}
function makeApp(stx, func, arg0, args) {
    return new S.Application((0, parser_1.syntaxToLocation)(stx), func, arg0, args);
}
function makeAtom(stx) {
    return new S.Atom((0, parser_1.syntaxToLocation)(stx));
}
function makeTrivial(stx) {
    return new S.Trivial((0, parser_1.syntaxToLocation)(stx));
}
function makeSole(stx) {
    return new S.Sole((0, parser_1.syntaxToLocation)(stx));
}
function makeList(stx, type) {
    return new S.List((0, parser_1.syntaxToLocation)(stx), type);
}
function makeVec(stx, type, len) {
    return new S.Vec((0, parser_1.syntaxToLocation)(stx), type, len);
}
function makeEither(stx, left, right) {
    return new S.Either((0, parser_1.syntaxToLocation)(stx), left, right);
}
function makeNil(stx) {
    return new S.Nil((0, parser_1.syntaxToLocation)(stx));
}
function makeVecCons(stx, head, tail) {
    return new S.VecCons((0, parser_1.syntaxToLocation)(stx), head, tail);
}
function makeVecNil(stx) {
    return new S.VecNil((0, parser_1.syntaxToLocation)(stx));
}
function makeAbsurd(stx) {
    return new S.Absurd((0, parser_1.syntaxToLocation)(stx));
}
function makePair(stx, head, tail) {
    return new S.Pair((0, parser_1.syntaxToLocation)(stx), head, tail);
}
function makeCons(stx, head, tail) {
    return new S.Cons((0, parser_1.syntaxToLocation)(stx), head, tail);
}
function makeListCons(stx, head, tail) {
    return new S.ListCons((0, parser_1.syntaxToLocation)(stx), head, tail);
}
function makeThe(stx, type, value) {
    return new S.The((0, parser_1.syntaxToLocation)(stx), type, value);
}
function makeIndAbsurd(stx, head, tail) {
    return new S.IndAbsurd((0, parser_1.syntaxToLocation)(stx), head, tail);
}
function makeTrans(stx, from, to) {
    return new S.Trans((0, parser_1.syntaxToLocation)(stx), from, to);
}
function makeCong(stx, from, to) {
    return new S.Cong((0, parser_1.syntaxToLocation)(stx), from, to);
}
function makeIndEqual(stx, target, mot, base) {
    return new S.IndEqual((0, parser_1.syntaxToLocation)(stx), target, mot, base);
}
function makeWhichNat(stx, target, base, step) {
    return new S.WhichNat((0, parser_1.syntaxToLocation)(stx), target, base, step);
}
function makeIterNat(stx, target, base, step) {
    return new S.IterNat((0, parser_1.syntaxToLocation)(stx), target, base, step);
}
function makeRecNat(stx, target, base, step) {
    return new S.RecNat((0, parser_1.syntaxToLocation)(stx), target, base, step);
}
function makeIndNat(stx, target, mot, base, step) {
    return new S.IndNat((0, parser_1.syntaxToLocation)(stx), target, mot, base, step);
}
function makeRecList(stx, target, base, step) {
    return new S.RecList((0, parser_1.syntaxToLocation)(stx), target, base, step);
}
function makeIndList(stx, target, mot, base, step) {
    return new S.IndList((0, parser_1.syntaxToLocation)(stx), target, mot, base, step);
}
function makeIndEither(stx, target, mot, base, step) {
    return new S.IndEither((0, parser_1.syntaxToLocation)(stx), target, mot, base, step);
}
function makeIndVec(stx, length, target, mot, base, step) {
    return new S.IndVec((0, parser_1.syntaxToLocation)(stx), length, target, mot, base, step);
}
function makeEqual(stx, type, left, right) {
    return new S.Equal((0, parser_1.syntaxToLocation)(stx), type, left, right);
}
function makeReplace(stx, target, mot, base) {
    return new S.Replace((0, parser_1.syntaxToLocation)(stx), target, mot, base);
}
function makeSymm(stx, equality) {
    return new S.Symm((0, parser_1.syntaxToLocation)(stx), equality);
}
function makeHead(stx, vec) {
    return new S.Head((0, parser_1.syntaxToLocation)(stx), vec);
}
function makeTail(stx, vec) {
    return new S.Tail((0, parser_1.syntaxToLocation)(stx), vec);
}
function makeSame(stx, type) {
    return new S.Same((0, parser_1.syntaxToLocation)(stx), type);
}
function makeLeft(stx, value) {
    return new S.Left((0, parser_1.syntaxToLocation)(stx), value);
}
function makeRight(stx, value) {
    return new S.Right((0, parser_1.syntaxToLocation)(stx), value);
}
function makeCar(stx, pair) {
    return new S.Car((0, parser_1.syntaxToLocation)(stx), pair);
}
function makeCdr(stx, pair) {
    return new S.Cdr((0, parser_1.syntaxToLocation)(stx), pair);
}
function makeQuote(stx, quoted) {
    return new S.Quote((0, parser_1.syntaxToLocation)(stx), quoted);
}
function makeVarRef(stx, ref) {
    return new S.Name((0, parser_1.syntaxToLocation)(stx), ref);
}
function makeNatLiteral(stx, num) {
    return new S.Number((0, parser_1.syntaxToLocation)(stx), Number(num));
}
function makeTODO(stx) {
    return new S.TODO((0, parser_1.syntaxToLocation)(stx));
}
function makeIntro(stx, name) {
    return new tactics_1.IntroTactic((0, parser_1.syntaxToLocation)(stx), name);
}
function makeExact(stx, expr) {
    return new tactics_1.ExactTactic((0, parser_1.syntaxToLocation)(stx), expr);
}
function makeExists(stx, value, name) {
    return new tactics_1.ExistsTactic((0, parser_1.syntaxToLocation)(stx), value, name);
}
function makeElimNat(stx, target, motive) {
    return new tactics_1.EliminateNatTactic((0, parser_1.syntaxToLocation)(stx), target, motive);
}
function makeElimList(stx, target, motive) {
    return new tactics_1.EliminateListTactic((0, parser_1.syntaxToLocation)(stx), target, motive);
}
function makeElimVec(stx, target, motive, length) {
    return new tactics_1.EliminateVecTactic((0, parser_1.syntaxToLocation)(stx), target, motive, length);
}
function makeElimEqual(stx, target, motive) {
    return new tactics_1.EliminateEqualTactic((0, parser_1.syntaxToLocation)(stx), target, motive);
}
function makeLeftTactic(stx) {
    return new tactics_1.LeftTactic((0, parser_1.syntaxToLocation)(stx));
}
function makeRightTactic(stx) {
    return new tactics_1.RightTactic((0, parser_1.syntaxToLocation)(stx));
}
function makeElimEither(stx, target, motive) {
    return new tactics_1.EliminateEitherTactic((0, parser_1.syntaxToLocation)(stx), target, motive);
}
function makeSplit(stx) {
    return new tactics_1.SpiltTactic((0, parser_1.syntaxToLocation)(stx));
}
function makeElimAbsurd(stx, target, motive) {
    return new tactics_1.EliminateAbsurdTactic((0, parser_1.syntaxToLocation)(stx), target, motive);
}
//# sourceMappingURL=makers.js.map