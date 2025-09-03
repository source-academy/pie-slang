"use strict";
// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.even$63$ = exports.odd$63$ = exports.angle = exports.magnitude = exports.imag$45$part = exports.real$45$part = exports.make$45$polar = exports.make$45$rectangular = exports.round = exports.truncate = exports.ceiling = exports.floor = exports.atan = exports.acos = exports.asin = exports.tan = exports.cos = exports.sin = exports.sqrt = exports.log = exports.exp = exports.expt = exports.inexact = exports.exact = exports.denominator = exports.numerator = exports.SQRT1_2 = exports.LOG10E = exports.LOG2E = exports.LN10 = exports.LN2 = exports.SQRT2 = exports.E = exports.PI = exports.nan = exports.infinity = exports.SchemeComplex = exports.SchemeReal = exports.SchemeRational = exports.SchemeInteger = exports.make_number = exports.Match = exports.NumberType = void 0;
exports.isInteger = isInteger;
exports.isRational = isRational;
exports.isReal = isReal;
exports.isComplex = isComplex;
exports.stringIsSchemeNumber = stringIsSchemeNumber;
exports.coerce_to_number = coerce_to_number;
exports.is_number = is_number;
exports.is_integer = is_integer;
exports.is_rational = is_rational;
exports.is_real = is_real;
exports.is_complex = is_complex;
exports.is_exact = is_exact;
exports.is_inexact = is_inexact;
exports.atomic_negate = atomic_negate;
exports.atomic_inverse = atomic_inverse;
exports.atomic_equals = atomic_equals;
exports.atomic_less_than = atomic_less_than;
exports.atomic_less_than_or_equals = atomic_less_than_or_equals;
exports.atomic_greater_than = atomic_greater_than;
exports.atomic_greater_than_or_equals = atomic_greater_than_or_equals;
exports.atomic_add = atomic_add;
exports.atomic_multiply = atomic_multiply;
exports.atomic_subtract = atomic_subtract;
exports.atomic_divide = atomic_divide;
// define here the functions used to check and split the number into its parts
var NumberType;
(function (NumberType) {
    NumberType[NumberType["INTEGER"] = 1] = "INTEGER";
    NumberType[NumberType["RATIONAL"] = 2] = "RATIONAL";
    NumberType[NumberType["REAL"] = 3] = "REAL";
    NumberType[NumberType["COMPLEX"] = 4] = "COMPLEX";
})(NumberType || (exports.NumberType = NumberType = {}));
var Match = /** @class */ (function () {
    function Match(result) {
        this.result = result;
    }
    return Match;
}());
exports.Match = Match;
var IntegerMatch = /** @class */ (function (_super) {
    __extends(IntegerMatch, _super);
    function IntegerMatch(result, value) {
        var _this = _super.call(this, result) || this;
        _this.result = result;
        _this.value = value;
        return _this;
    }
    IntegerMatch.prototype.isSigned = function () {
        return this.result
            ? this.value[0] === "+" || this.value[0] === "-"
            : false;
    };
    IntegerMatch.prototype.build = function () {
        return SchemeInteger.build(this.value);
    };
    return IntegerMatch;
}(Match));
var RationalMatch = /** @class */ (function (_super) {
    __extends(RationalMatch, _super);
    function RationalMatch(result, numerator, denominator) {
        var _this = _super.call(this, result) || this;
        _this.result = result;
        _this.numerator = numerator;
        _this.denominator = denominator;
        return _this;
    }
    RationalMatch.prototype.build = function () {
        return SchemeRational.build(this.numerator, this.denominator);
    };
    return RationalMatch;
}(Match));
var RealMatch = /** @class */ (function (_super) {
    __extends(RealMatch, _super);
    function RealMatch(result, integer, decimal, exponent) {
        var _this = _super.call(this, result) || this;
        _this.result = result;
        _this.integer = integer;
        _this.decimal = decimal;
        _this.exponent = exponent;
        return _this;
    }
    RealMatch.prototype.build = function () {
        var _a, _b;
        if ((_a = this.integer) === null || _a === void 0 ? void 0 : _a.includes("inf")) {
            return this.integer.includes("-")
                ? SchemeReal.NEG_INFINITY
                : SchemeReal.INFINITY;
        }
        if ((_b = this.integer) === null || _b === void 0 ? void 0 : _b.includes("nan")) {
            return SchemeReal.NAN;
        }
        // recursively build the exponent
        var exponent = (this.exponent ? this.exponent.build() : SchemeReal.INEXACT_ZERO).coerce();
        // we are assured that either part exists
        var value = Number((this.integer ? this.integer : "0") +
            "." +
            (this.decimal ? this.decimal : "0"));
        // apply the exponent
        value *= Math.pow(10, exponent);
        return SchemeReal.build(value);
    };
    return RealMatch;
}(Match));
var ComplexMatch = /** @class */ (function (_super) {
    __extends(ComplexMatch, _super);
    function ComplexMatch(result, real, sign, imaginary) {
        var _this = _super.call(this, result) || this;
        _this.result = result;
        _this.real = real;
        _this.sign = sign;
        _this.imaginary = imaginary;
        return _this;
    }
    ComplexMatch.prototype.build = function () {
        var real = this.real
            ? this.real.build()
            : SchemeInteger.EXACT_ZERO;
        var imaginary = this.imaginary.build();
        if (this.sign && this.sign === "-") {
            return SchemeComplex.build(real, imaginary.negate());
        }
        return SchemeComplex.build(real, imaginary);
    };
    return ComplexMatch;
}(Match));
// these are used to determine the type of the number and to separate it into its parts as well
function isInteger(value) {
    // <integer> = [+-]?<digit>+
    // check if the value is an integer. if it is, return true and the value.
    // if not, return false and an empty array.
    var integerRegex = new RegExp("^([+-]?)(\\d+)$");
    var match = integerRegex.exec(value);
    if (match) {
        return new IntegerMatch(true, match[0]);
    }
    return new IntegerMatch(false);
}
function isRational(value) {
    // <rational> = <integer>/<integer>
    // both sides of the rational should parse as integers
    // we can split the rational into two parts and check if both are integers
    // make sure there is a /
    var count = (value.match(/\//g) || []).length;
    if (count !== 1) {
        return new RationalMatch(false);
    }
    var parts = value.split("/");
    if (parts.length !== 2) {
        return new RationalMatch(false);
    }
    var numerator = parts[0], denominator = parts[1];
    var numeratorMatch = isInteger(numerator);
    var denominatorMatch = isInteger(denominator);
    if (!(numeratorMatch.result && denominatorMatch.result)) {
        return new RationalMatch(false);
    }
    return new RationalMatch(true, numerator, denominator);
}
function isReal(value) {
    // <real> = <basic> | <extended>
    // <basic>: [+-]?a.b | [+-]?a | [+-]?.b | [+-]?a.
    // <extended>: <basic>[eE]<integer | rational | real>
    // where a = <digit>+ | inf | nan
    //       b = <digit>+
    //
    // keep in mind that the value matches an integer too! but
    // by the point of time this is called, we have already checked for an integer
    function checkBasicReal(value) {
        // checks if the value is one of the 4 forms of special numbers
        function isSpecialNumber(value) {
            return (value === "+inf.0" ||
                value === "-inf.0" ||
                value === "+nan.0" ||
                value === "-nan.0");
        }
        // check if the value is a special number
        if (isSpecialNumber(value)) {
            return new RealMatch(true, value);
        }
        // check for the presence of a dot
        var count = (value.match(/\./g) || []).length;
        if (count > 1) {
            return new RealMatch(false);
        }
        if (count === 0) {
            var result = isInteger(value);
            return new RealMatch(result.result, result.value);
        }
        // check for a basic real number
        var _a = value.split("."), integerPart = _a[0], decimalPart = _a[1];
        var integerMatch = isInteger(integerPart);
        var decimalMatch = isInteger(decimalPart);
        var properInteger = integerMatch.result || integerPart === "";
        var properDecimal = decimalMatch.result || decimalPart === "";
        // if the integer part is just a sign, the decimal part should be non-empty
        if (integerPart === "+" || integerPart === "-") {
            if (decimalPart === "") {
                return new RealMatch(false);
            }
            return new RealMatch(true, "".concat(integerPart, "0"), value);
        }
        // at least one of the parts should be non-empty
        if (!((integerMatch.result && properDecimal) ||
            (properInteger && decimalMatch.result))) {
            return new RealMatch(false);
        }
        // if there is a decimal match, there should have no sign
        if (decimalMatch.result && decimalMatch.isSigned()) {
            return new RealMatch(false);
        }
        return new RealMatch(true, integerMatch.value, decimalMatch.value);
    }
    function checkExtendedReal(value) {
        // split the value into two parts by e/E
        var first_e_index = value.indexOf("e");
        var first_E_index = value.indexOf("E");
        if (first_e_index === -1 && first_E_index === -1) {
            return new RealMatch(false);
        }
        var exponentIndex = first_e_index === -1 ? first_E_index : first_e_index;
        var basicRealPart = value.substring(0, exponentIndex);
        var exponentPart = value.substring(exponentIndex + 1);
        // both should not be empty
        if (basicRealPart === "" || exponentPart == "") {
            return new RealMatch(false);
        }
        // parse each part
        var basicRealMatch = checkBasicReal(basicRealPart);
        if (!basicRealMatch.result) {
            return new RealMatch(false);
        }
        // match the exponent part across types up to real
        var exponentMatch = universalMatch(exponentPart, NumberType.REAL);
        if (!exponentMatch.result) {
            return new RealMatch(false);
        }
        return new RealMatch(true, basicRealMatch.integer, basicRealMatch.decimal, exponentMatch);
    }
    // check for the presence of e/E
    var count = (value.match(/[eE]/g) || []).length;
    if (count === 0) {
        // check for a basic real number
        return checkBasicReal(value);
    }
    // check for an extended real number
    return checkExtendedReal(value);
}
function isComplex(value) {
    // <basic-num> = <integer> | <rational> | <real>
    // <complex> = <basic-num>[+-]<basic-num>i
    // check if the value is a complex number. if it is, return true and the value.
    // if not, return a failed match.
    var count = (value.match(/i/g) || []).length;
    if (count < 1) {
        return new ComplexMatch(false);
    }
    if (value[value.length - 1] !== "i") {
        return new ComplexMatch(false);
    }
    // find the first + or - that is not at the start of the string
    // this is the split point
    var splitPoint = value.search(/(?<!^)[+-]/);
    // if no such point was found,
    if (splitPoint === -1) {
        // the value may be purely imaginary
        var imaginaryPart_1 = value.slice(0, -1);
        var imaginaryMatch_1 = universalMatch(imaginaryPart_1, NumberType.REAL);
        if (imaginaryMatch_1.result) {
            return new ComplexMatch(true, undefined, undefined, imaginaryMatch_1);
        }
        return new ComplexMatch(false);
    }
    var realPart = value.slice(0, splitPoint);
    var imaginaryPart = value.slice(splitPoint + 1, -1);
    // if imaginaryPart doesn't start with a sign, add one
    // this lets us properly parse expressions such as 1+inf.0i
    // even if the + belongs to the complex number
    if (imaginaryPart[0] !== "+" && imaginaryPart[0] !== "-") {
        imaginaryPart = "+" + imaginaryPart;
    }
    var realMatch = universalMatch(realPart, NumberType.REAL);
    var imaginaryMatch = universalMatch(imaginaryPart, NumberType.REAL);
    if (!(realMatch.result && imaginaryMatch.result)) {
        return new ComplexMatch(false);
    }
    return new ComplexMatch(true, realMatch, value[splitPoint], imaginaryMatch);
}
// tests the value across all possible types
// only limited by the finalWillingType of
function universalMatch(value, finalWillingType) {
    var integerMatch = isInteger(value);
    if (integerMatch.result && finalWillingType >= NumberType.INTEGER) {
        return integerMatch;
    }
    var rationalMatch = isRational(value);
    if (rationalMatch.result && finalWillingType >= NumberType.RATIONAL) {
        return rationalMatch;
    }
    var realMatch = isReal(value);
    if (realMatch.result && finalWillingType >= NumberType.REAL) {
        return realMatch;
    }
    var complexMatch = isComplex(value);
    if (complexMatch.result && finalWillingType >= NumberType.COMPLEX) {
        return complexMatch;
    }
    return new IntegerMatch(false);
}
// for the lexer.
function stringIsSchemeNumber(value) {
    var match = universalMatch(value, NumberType.COMPLEX);
    return match.result;
}
// Each class has a numberType property that is used to determine the type of the number.
// If another instance's numbertype is higher in an operation, it will "promote" itself to the higher type.
// Each class also has a convert method that converts the number back into a javascript number.
// This is used when the number is used in a context where a javascript number is expected.
// If used in contexts where the values are too extreme for a javascript number, it will throw an error.
// This includes attempting to convert a complex number to a javascript number.
// If a simplified rational number has a denominator of 1, it will convert to an integer.
// We are assured that the string passed to this function is a valid number.
var make_number = function (value) {
    var match = universalMatch(value, NumberType.COMPLEX);
    if (!match.result) {
        throw new Error("Invalid number");
    }
    return match.build();
};
exports.make_number = make_number;
var SchemeInteger = /** @class */ (function () {
    function SchemeInteger(value) {
        this.numberType = NumberType.INTEGER;
        this.value = value;
    }
    // Factory method for creating a new SchemeInteger instance.
    // Force prevents automatic downcasting to a lower type.
    SchemeInteger.build = function (value, _force) {
        if (_force === void 0) { _force = false; }
        var val = BigInt(value);
        if (val === 0n) {
            return SchemeInteger.EXACT_ZERO;
        }
        return new SchemeInteger(val);
    };
    SchemeInteger.prototype.promote = function (nType) {
        switch (nType) {
            case NumberType.INTEGER:
                return this;
            case NumberType.RATIONAL:
                return SchemeRational.build(this.value, 1n, true);
            case NumberType.REAL:
                return SchemeReal.build(this.coerce(), true);
            case NumberType.COMPLEX:
                return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
        }
    };
    SchemeInteger.prototype.equals = function (other) {
        return other instanceof SchemeInteger && this.value === other.value;
    };
    SchemeInteger.prototype.greaterThan = function (other) {
        return this.value > other.value;
    };
    SchemeInteger.prototype.negate = function () {
        if (this === SchemeInteger.EXACT_ZERO) {
            return this;
        }
        return SchemeInteger.build(-this.value);
    };
    SchemeInteger.prototype.multiplicativeInverse = function () {
        if (this === SchemeInteger.EXACT_ZERO) {
            throw new Error("Division by zero");
        }
        return SchemeRational.build(1n, this.value, false);
    };
    SchemeInteger.prototype.add = function (other) {
        return SchemeInteger.build(this.value + other.value);
    };
    SchemeInteger.prototype.multiply = function (other) {
        return SchemeInteger.build(this.value * other.value);
    };
    SchemeInteger.prototype.getBigInt = function () {
        return this.value;
    };
    SchemeInteger.prototype.coerce = function () {
        if (this.value > Number.MAX_SAFE_INTEGER) {
            return Infinity;
        }
        if (this.value < Number.MIN_SAFE_INTEGER) {
            return -Infinity;
        }
        return Number(this.value);
    };
    SchemeInteger.prototype.toString = function () {
        return this.value.toString();
    };
    SchemeInteger.EXACT_ZERO = new SchemeInteger(0n);
    return SchemeInteger;
}());
exports.SchemeInteger = SchemeInteger;
var SchemeRational = /** @class */ (function () {
    function SchemeRational(numerator, denominator) {
        this.numberType = NumberType.RATIONAL;
        this.numerator = numerator;
        this.denominator = denominator;
    }
    // Builds a rational number.
    // Force prevents automatic downcasting to a lower type.
    SchemeRational.build = function (numerator, denominator, force) {
        if (force === void 0) { force = false; }
        return SchemeRational.simplify(BigInt(numerator), BigInt(denominator), force);
    };
    SchemeRational.simplify = function (numerator, denominator, force) {
        if (force === void 0) { force = false; }
        var gcd = function (a, b) {
            if (b === 0n) {
                return a;
            }
            return gcd(b, a.valueOf() % b.valueOf());
        };
        var divisor = gcd(numerator, denominator);
        var numeratorSign = numerator < 0n ? -1n : 1n;
        var denominatorSign = denominator < 0n ? -1n : 1n;
        // determine the sign of the result
        var sign = numeratorSign * denominatorSign;
        // remove the sign from the numerator and denominator
        numerator = numerator * numeratorSign;
        denominator = denominator * denominatorSign;
        // if the denominator is 1, we can return an integer
        if (denominator === 1n && !force) {
            return SchemeInteger.build(sign * numerator);
        }
        return new SchemeRational((sign * numerator) / divisor, denominator / divisor);
    };
    SchemeRational.prototype.getNumerator = function () {
        return this.numerator;
    };
    SchemeRational.prototype.getDenominator = function () {
        return this.denominator;
    };
    SchemeRational.prototype.promote = function (nType) {
        switch (nType) {
            case NumberType.RATIONAL:
                return this;
            case NumberType.REAL:
                return SchemeReal.build(this.coerce(), true);
            case NumberType.COMPLEX:
                return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
            default:
                throw new Error("Unable to demote rational");
        }
    };
    SchemeRational.prototype.equals = function (other) {
        return (other instanceof SchemeRational &&
            this.numerator === other.numerator &&
            this.denominator === other.denominator);
    };
    SchemeRational.prototype.greaterThan = function (other) {
        return (this.numerator * other.denominator > other.numerator * this.denominator);
    };
    SchemeRational.prototype.negate = function () {
        return SchemeRational.build(-this.numerator, this.denominator);
    };
    SchemeRational.prototype.multiplicativeInverse = function () {
        if (this.numerator === 0n) {
            throw new Error("Division by zero");
        }
        return SchemeRational.build(this.denominator, this.numerator);
    };
    SchemeRational.prototype.add = function (other) {
        var newNumerator = this.numerator * other.denominator + other.numerator * this.denominator;
        var newDenominator = this.denominator * other.denominator;
        return SchemeRational.build(newNumerator, newDenominator);
    };
    SchemeRational.prototype.multiply = function (other) {
        var newNumerator = this.numerator * other.numerator;
        var newDenominator = this.denominator * other.denominator;
        return SchemeRational.build(newNumerator, newDenominator);
    };
    SchemeRational.prototype.coerce = function () {
        var workingNumerator = this.numerator < 0n ? -this.numerator : this.numerator;
        var converterDenominator = this.denominator;
        // we can take the whole part directly
        var wholePart = Number(workingNumerator / converterDenominator);
        if (wholePart > Number.MAX_VALUE) {
            return this.numerator < 0n ? -Infinity : Infinity;
        }
        // remainder should be lossily converted below safe levels
        var remainder = workingNumerator % converterDenominator;
        // we lossily convert both values below safe number thresholds
        while (remainder > Number.MAX_SAFE_INTEGER ||
            converterDenominator > Number.MAX_SAFE_INTEGER) {
            remainder = remainder / 2n;
            converterDenominator = converterDenominator / 2n;
        }
        // coerce the now safe parts into a remainder number
        var remainderPart = Number(remainder) / Number(converterDenominator);
        return this.numerator < 0n
            ? -(wholePart + remainderPart)
            : wholePart + remainderPart;
    };
    SchemeRational.prototype.toString = function () {
        return "".concat(this.numerator, "/").concat(this.denominator);
    };
    return SchemeRational;
}());
exports.SchemeRational = SchemeRational;
// it is allowable to represent the Real number using
// float/double representation, and so we shall do that.
// the current schemeReal implementation is fully based
// on JavaScript numbers.
var SchemeReal = /** @class */ (function () {
    function SchemeReal(value) {
        this.numberType = NumberType.REAL;
        this.value = value;
    }
    SchemeReal.build = function (value, _force) {
        if (_force === void 0) { _force = false; }
        if (value === Infinity) {
            return SchemeReal.INFINITY;
        }
        else if (value === -Infinity) {
            return SchemeReal.NEG_INFINITY;
        }
        else if (isNaN(value)) {
            return SchemeReal.NAN;
        }
        else if (value === 0) {
            return SchemeReal.INEXACT_ZERO;
        }
        else if (value === -0) {
            return SchemeReal.INEXACT_NEG_ZERO;
        }
        return new SchemeReal(value);
    };
    SchemeReal.prototype.promote = function (nType) {
        switch (nType) {
            case NumberType.REAL:
                return this;
            case NumberType.COMPLEX:
                return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
            default:
                throw new Error("Unable to demote real");
        }
    };
    SchemeReal.prototype.equals = function (other) {
        return other instanceof SchemeReal && this.value === other.value;
    };
    SchemeReal.prototype.greaterThan = function (other) {
        return this.value > other.value;
    };
    SchemeReal.prototype.negate = function () {
        return SchemeReal.build(-this.value);
    };
    SchemeReal.prototype.multiplicativeInverse = function () {
        if (this === SchemeReal.INEXACT_ZERO ||
            this === SchemeReal.INEXACT_NEG_ZERO) {
            throw new Error("Division by zero");
        }
        return SchemeReal.build(1 / this.value);
    };
    SchemeReal.prototype.add = function (other) {
        return SchemeReal.build(this.value + other.value);
    };
    SchemeReal.prototype.multiply = function (other) {
        return SchemeReal.build(this.value * other.value);
    };
    SchemeReal.prototype.coerce = function () {
        return this.value;
    };
    SchemeReal.prototype.toString = function () {
        if (this === SchemeReal.INFINITY) {
            return "+inf.0";
        }
        if (this === SchemeReal.NEG_INFINITY) {
            return "-inf.0";
        }
        if (this === SchemeReal.NAN) {
            return "+nan.0";
        }
        return this.value.toString();
    };
    SchemeReal.INEXACT_ZERO = new SchemeReal(0);
    SchemeReal.INEXACT_NEG_ZERO = new SchemeReal(-0);
    SchemeReal.INFINITY = new SchemeReal(Infinity);
    SchemeReal.NEG_INFINITY = new SchemeReal(-Infinity);
    SchemeReal.NAN = new SchemeReal(NaN);
    return SchemeReal;
}());
exports.SchemeReal = SchemeReal;
var SchemeComplex = /** @class */ (function () {
    function SchemeComplex(real, imaginary) {
        this.numberType = NumberType.COMPLEX;
        this.real = real;
        this.imaginary = imaginary;
    }
    SchemeComplex.build = function (real, imaginary, force) {
        if (force === void 0) { force = false; }
        return SchemeComplex.simplify(new SchemeComplex(real, imaginary), force);
    };
    SchemeComplex.simplify = function (complex, force) {
        if (!force && atomic_equals(complex.imaginary, SchemeInteger.EXACT_ZERO)) {
            return complex.real;
        }
        return complex;
    };
    SchemeComplex.prototype.promote = function (nType) {
        switch (nType) {
            case NumberType.COMPLEX:
                return this;
            default:
                throw new Error("Unable to demote complex");
        }
    };
    SchemeComplex.prototype.negate = function () {
        return SchemeComplex.build(this.real.negate(), this.imaginary.negate());
    };
    SchemeComplex.prototype.equals = function (other) {
        return (atomic_equals(this.real, other.real) &&
            atomic_equals(this.imaginary, other.imaginary));
    };
    SchemeComplex.prototype.greaterThan = function (other) {
        return (atomic_greater_than(this.real, other.real) &&
            atomic_greater_than(this.imaginary, other.imaginary));
    };
    SchemeComplex.prototype.multiplicativeInverse = function () {
        // inverse of a + bi = a - bi / a^2 + b^2
        // in this case, we use a / a^2 + b^2 and -b / a^2 + b^2 as the new values required
        var denominator = atomic_add(atomic_multiply(this.real, this.real), atomic_multiply(this.imaginary, this.imaginary));
        return SchemeComplex.build(atomic_multiply(denominator.multiplicativeInverse(), this.real), atomic_multiply(denominator.multiplicativeInverse(), this.imaginary.negate()));
    };
    SchemeComplex.prototype.add = function (other) {
        return SchemeComplex.build(atomic_add(this.real, other.real), atomic_add(this.imaginary, other.imaginary));
    };
    SchemeComplex.prototype.multiply = function (other) {
        // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
        var realPart = atomic_subtract(atomic_multiply(this.real, other.real), atomic_multiply(this.imaginary, other.imaginary));
        var imaginaryPart = atomic_add(atomic_multiply(this.real, other.imaginary), atomic_multiply(this.imaginary, other.real));
        return SchemeComplex.build(realPart, imaginaryPart);
    };
    SchemeComplex.prototype.getReal = function () {
        return this.real;
    };
    SchemeComplex.prototype.getImaginary = function () {
        return this.imaginary;
    };
    SchemeComplex.prototype.coerce = function () {
        throw new Error("Cannot coerce a complex number to a javascript number");
    };
    SchemeComplex.prototype.toPolar = function () {
        // force both the real and imaginary parts to be inexact
        var real = this.real.promote(NumberType.REAL);
        var imaginary = this.imaginary.promote(NumberType.REAL);
        // schemeReals can be reasoned with using the same logic as javascript numbers
        // r = sqrt(a^2 + b^2)
        var magnitude = SchemeReal.build(Math.sqrt(real.coerce() * real.coerce() + imaginary.coerce() * imaginary.coerce()));
        // theta = atan(b / a)
        var angle = SchemeReal.build(Math.atan2(imaginary.coerce(), real.coerce()));
        return SchemePolar.build(magnitude, angle);
    };
    SchemeComplex.prototype.toString = function () {
        return "".concat(this.real, "+").concat(this.imaginary, "i");
    };
    return SchemeComplex;
}());
exports.SchemeComplex = SchemeComplex;
// an alternative form of the complex number.
// only used in intermediate steps, will be converted back at the end of the operation.
// current scm-slang will force any polar complex numbers to be made
// inexact, hence we opt to limit the use of polar form as much as possible.
var SchemePolar = /** @class */ (function () {
    function SchemePolar(magnitude, angle) {
        this.magnitude = magnitude;
        this.angle = angle;
    }
    SchemePolar.build = function (magnitude, angle) {
        return new SchemePolar(magnitude, angle);
    };
    // converts the polar number back to a cartesian complex number
    SchemePolar.prototype.toCartesian = function () {
        // a + bi = r * cos(theta) + r * sin(theta)i
        // a = r * cos(theta)
        // b = r * sin(theta)
        var real = SchemeReal.build(this.magnitude.coerce() * Math.cos(this.angle.coerce()));
        var imaginary = SchemeReal.build(this.magnitude.coerce() * Math.sin(this.angle.coerce()));
        return SchemeComplex.build(real, imaginary);
    };
    return SchemePolar;
}());
exports.infinity = SchemeReal.INFINITY;
exports.nan = SchemeReal.NAN;
// this function is used to convert a number to a javascript number.
// it should only be limited to numbers used for indexing, integers.
function coerce_to_number(a) {
    return a.coerce();
}
// these functions deal with checking the type of a number.
function is_number(a) {
    return (a.numberType !== undefined &&
        Object.values(NumberType).includes(a.numberType));
}
function is_integer(a) {
    return is_number(a) && a.numberType <= 1;
}
function is_rational(a) {
    return is_number(a) && a.numberType <= 2;
}
function is_real(a) {
    return is_number(a) && a.numberType <= 3;
}
function is_complex(a) {
    return is_number(a) && a.numberType <= 4;
}
function is_exact(a) {
    // if the number is a complex number, we need to check both the real and imaginary parts
    return is_number(a)
        ? a.numberType === 4
            ? is_exact(a.real) && is_exact(a.imaginary)
            : a.numberType <= 2
        : false;
}
function is_inexact(a) {
    // defined in terms of is_exact
    return is_number(a) && !is_exact(a);
}
// the functions below are used to perform operations on numbers
function simplify(a) {
    switch (a.numberType) {
        case NumberType.INTEGER:
            return a;
        case NumberType.RATIONAL:
            return a.getDenominator() === 1n
                ? SchemeInteger.build(a.getNumerator())
                : a;
        case NumberType.REAL:
            return a;
        case NumberType.COMPLEX:
            // safe to cast as simplify never promotes a number
            return SchemeComplex.build(simplify(a.getReal()), simplify(a.getImaginary()));
    }
}
/**
 * This function takes two numbers and brings them to the same level.
 */
function equalify(a, b) {
    if (a.numberType > b.numberType) {
        return [a, b.promote(a.numberType)];
    }
    else if (a.numberType < b.numberType) {
        return [a.promote(b.numberType), b];
    }
    return [a, b];
}
function atomic_negate(a) {
    return a.negate();
}
function atomic_inverse(a) {
    return a.multiplicativeInverse();
}
function atomic_equals(a, b) {
    var _a = equalify(a, b), newA = _a[0], newB = _a[1];
    // safe to cast as we are assured they are of the same type
    return newA.equals(newB);
}
function atomic_less_than(a, b) {
    return !atomic_greater_than(a, b) && !atomic_equals(a, b);
}
function atomic_less_than_or_equals(a, b) {
    return !atomic_greater_than(a, b);
}
function atomic_greater_than(a, b) {
    var _a = equalify(a, b), newA = _a[0], newB = _a[1];
    // safe to cast as we are assured they are of the same type
    return newA.greaterThan(newB);
}
function atomic_greater_than_or_equals(a, b) {
    return atomic_greater_than(a, b) || atomic_equals(a, b);
}
function atomic_add(a, b) {
    var _a = equalify(a, b), newA = _a[0], newB = _a[1];
    // safe to cast as we are assured they are of the same type
    return simplify(newA.add(newB));
}
function atomic_multiply(a, b) {
    var _a = equalify(a, b), newA = _a[0], newB = _a[1];
    // safe to cast as we are assured they are of the same type
    return simplify(newA.multiply(newB));
}
function atomic_subtract(a, b) {
    return atomic_add(a, atomic_negate(b));
}
function atomic_divide(a, b) {
    return atomic_multiply(a, atomic_inverse(b));
}
/**
 * Important constants
 */
exports.PI = SchemeReal.build(Math.PI);
exports.E = SchemeReal.build(Math.E);
exports.SQRT2 = SchemeReal.build(Math.SQRT2);
exports.LN2 = SchemeReal.build(Math.LN2);
exports.LN10 = SchemeReal.build(Math.LN10);
exports.LOG2E = SchemeReal.build(Math.LOG2E);
exports.LOG10E = SchemeReal.build(Math.LOG10E);
exports.SQRT1_2 = SchemeReal.build(Math.SQRT1_2);
// other important functions
var numerator = function (n) {
    if (!is_number(n)) {
        throw new Error("numerator: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // always return an integer
        return is_exact(n) ? SchemeInteger.build(1) : SchemeReal.build(1);
    }
    if (!is_rational(n)) {
        // is real number
        // get the value of the number
        var val = n.coerce();
        // if the value is a defined special case, return accordingly
        if (val === Infinity) {
            return SchemeReal.build(1);
        }
        if (val === -Infinity) {
            return SchemeReal.build(1);
        }
        if (isNaN(val)) {
            return SchemeReal.NAN;
        }
        // if the value is an integer, return it
        if (Number.isInteger(val)) {
            return SchemeReal.build(val);
        }
        // else if the value is a float,
        // multiply it till it becomes an integer
        var multiplier = 1;
        while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
        }
        var numerator_1 = val * multiplier;
        var denominator_1 = multiplier;
        // simplify the fraction
        var gcd_1 = function (a, b) {
            if (b === 0) {
                return a;
            }
            return gcd_1(b, a % b);
        };
        var divisor = gcd_1(numerator_1, denominator_1);
        numerator_1 = numerator_1 / divisor;
        return SchemeReal.build(numerator_1);
    }
    return SchemeInteger.build(n.promote(NumberType.RATIONAL).getNumerator());
};
exports.numerator = numerator;
var denominator = function (n) {
    if (!is_number(n)) {
        throw new Error("denominator: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // always return an integer
        return is_exact(n) ? SchemeInteger.build(1) : SchemeReal.build(1);
    }
    if (!is_rational(n)) {
        // is real number
        // get the value of the number
        var val = n.coerce();
        // if the value is a defined special case, return accordingly
        if (val === Infinity) {
            return SchemeReal.INEXACT_ZERO;
        }
        if (val === -Infinity) {
            return SchemeReal.INEXACT_ZERO;
        }
        if (isNaN(val)) {
            return SchemeReal.NAN;
        }
        // if the value is an integer, return 1
        if (Number.isInteger(val)) {
            return SchemeReal.build(1);
        }
        // else if the value is a float,
        // multiply it till it becomes an integer
        var multiplier = 1;
        while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
        }
        var numerator_2 = val * multiplier;
        var denominator_2 = multiplier;
        // simplify the fraction
        var gcd_2 = function (a, b) {
            if (b === 0) {
                return a;
            }
            return gcd_2(b, a % b);
        };
        var divisor = gcd_2(numerator_2, denominator_2);
        denominator_2 = denominator_2 / divisor;
        return SchemeReal.build(denominator_2);
    }
    return SchemeInteger.build(n.promote(NumberType.RATIONAL).getDenominator());
};
exports.denominator = denominator;
var exact = function (n) {
    if (!is_number(n)) {
        throw new Error("exact: expected number");
    }
    if (is_exact(n)) {
        return n;
    }
    if (is_real(n)) {
        // if the number is a real number, we can convert it to a rational number
        // by multiplying it by a power of 10 until it becomes an integer
        // and then dividing by the same power of 10
        var multiplier = 1;
        var val = n.coerce();
        while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
        }
        return SchemeRational.build(val * multiplier, multiplier);
    }
    // if the number is a complex number, we can convert both the real and imaginary parts
    // to exact numbers
    return SchemeComplex.build((0, exports.exact)(n.getReal()), (0, exports.exact)(n.getImaginary()));
};
exports.exact = exact;
var inexact = function (n) {
    if (!is_number(n)) {
        throw new Error("inexact: expected number");
    }
    if (is_inexact(n)) {
        return n;
    }
    if (is_real(n)) {
        // if the number is a real number, we can convert it to a float
        return SchemeReal.build(n.coerce());
    }
    // if the number is a complex number, we can convert both the real and imaginary parts
    // to inexact numbers
    return SchemeComplex.build((0, exports.inexact)(n.getReal()), (0, exports.inexact)(n.getImaginary()));
};
exports.inexact = inexact;
// for now, exponentials, square roots and the like will be treated as
// inexact functions, and will return inexact results. this allows us to
// leverage on the inbuilt javascript Math library.
// additional logic is required to handle complex numbers, which we can do with
// our polar form representation.
var expt = function (n, e) {
    if (!is_number(n) || !is_number(e)) {
        throw new Error("expt: expected numbers");
    }
    if (!is_real(n) || !is_real(e)) {
        // complex number case
        // we can convert both parts to polar form and use the
        // polar form exponentiation formula.
        // given a * e^(bi) and c * e^(di),
        // (a * e^(bi)) ^ (c * e^(di)) can be represented by
        // the general formula for complex exponentiation:
        // (a^c * e^(-bd)) * e^(i(bc * ln(a) + ad))
        // convert both numbers to polar form
        var nPolar = n.promote(NumberType.COMPLEX).toPolar();
        var ePolar = e.promote(NumberType.COMPLEX).toPolar();
        var a = nPolar.magnitude.coerce();
        var b = nPolar.angle.coerce();
        var c = ePolar.magnitude.coerce();
        var d = ePolar.angle.coerce();
        // we can construct a new polar form following the formula above
        var mag = SchemeReal.build(Math.pow(a, c) * Math.pow(Math.E, (-b * d)));
        var angle_1 = SchemeReal.build(b * c * Math.log(a) + a * d);
        return SchemePolar.build(mag, angle_1).toCartesian();
    }
    // coerce both numbers to javascript numbers
    var base = n.coerce();
    var exponent = e.coerce();
    // there are probably cases here i am not considering yet.
    // for now, we will just use the javascript Math library and hope for the best.
    return SchemeReal.build(Math.pow(base, exponent));
};
exports.expt = expt;
var exp = function (n) {
    if (!is_number(n)) {
        throw new Error("exp: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        throw new Error("exp: expected real number");
    }
    return SchemeReal.build(Math.exp(n.coerce()));
};
exports.exp = exp;
var log = function (n, base) {
    if (base === void 0) { base = exports.E; }
    if (!is_number(n) || !is_number(base)) {
        throw new Error("log: expected numbers");
    }
    if (!is_real(n) || !is_real(base)) {
        // complex number case
        // we can convert both parts to polar form and use the
        // polar form logarithm formula.
        // where log(a * e^(bi)) = log(a) + bi
        // and log(c * e^(di)) = log(c) + di
        // and so result is log(a) + bi / log(c) + di
        // which is just (log(a) - log(c)) + (b / d) i
        // convert both numbers to polar form
        var nPolar = n.promote(NumberType.COMPLEX).toPolar();
        var basePolar = base.promote(NumberType.COMPLEX).toPolar();
        var a = nPolar.magnitude.coerce();
        var b = nPolar.angle.coerce();
        var c = basePolar.magnitude.coerce();
        var d = basePolar.angle.coerce();
        return SchemeComplex.build(SchemeReal.build(Math.log(a) - Math.log(c)), SchemeReal.build(b / d));
    }
    return SchemeReal.build(Math.log(n.coerce()) / Math.log(base.coerce()));
};
exports.log = log;
var sqrt = function (n) {
    if (!is_number(n)) {
        throw new Error("sqrt: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        var polar = n.promote(NumberType.COMPLEX).toPolar();
        var mag = polar.magnitude;
        var angle_2 = polar.angle;
        // the square root of a complex number is given by
        // the square root of the magnitude and half the angle
        var newMag = (0, exports.sqrt)(mag);
        var newAngle = SchemeReal.build(angle_2.coerce() / 2);
        return SchemePolar.build(newMag, newAngle).toCartesian();
    }
    var value = n.coerce();
    if (value < 0) {
        return SchemeComplex.build(SchemeReal.INEXACT_ZERO, SchemeReal.build(Math.sqrt(-value)));
    }
    return SchemeReal.build(Math.sqrt(n.coerce()));
};
exports.sqrt = sqrt;
var sin = function (n) {
    if (!is_number(n)) {
        throw new Error("sin: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // we can use euler's formula to find sin(x) for a complex number x = a + bi
        // e^(ix) = cos(x) + i * sin(x)
        // that can be rearranged into
        // sin(x) = (e^(ix) - e^(-ix)) / 2i
        // and finally into
        // sin(x) = (sin(a) * (e^(-b) + e^(b)) / 2) + i * (cos(a) * (e^(-b) - e^(b)) / 2)
        var complex = n.promote(NumberType.COMPLEX);
        var real = complex.getReal();
        var imaginary = complex.getImaginary();
        var a = real.coerce();
        var b = imaginary.coerce();
        return SchemeComplex.build(SchemeReal.build((Math.sin(a) * (Math.exp(-b) + Math.exp(b))) / 2), SchemeReal.build((Math.cos(a) * (Math.exp(-b) - Math.exp(b))) / 2));
    }
    return SchemeReal.build(Math.sin(n.coerce()));
};
exports.sin = sin;
var cos = function (n) {
    if (!is_number(n)) {
        throw new Error("cos: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // we can use euler's formula to find cos(x) for a complex number x = a + bi
        // e^(ix) = cos(x) + i * sin(x)
        // that can be rearranged into
        // cos(x) = (e^(ix) + e^(-ix)) / 2
        // and finally into
        // cos(x) = (cos(a) * (e^(-b) + e^(b)) / 2) - i * (sin(a) * (e^(-b) - e^(b)) / 2)
        var complex = n.promote(NumberType.COMPLEX);
        var real = complex.getReal();
        var imaginary = complex.getImaginary();
        var a = real.coerce();
        var b = imaginary.coerce();
        return SchemeComplex.build(SchemeReal.build((Math.cos(a) * (Math.exp(-b) + Math.exp(b))) / 2), SchemeReal.build((-Math.sin(a) * (Math.exp(-b) - Math.exp(b))) / 2));
    }
    return SchemeReal.build(Math.cos(n.coerce()));
};
exports.cos = cos;
var tan = function (n) {
    if (!is_number(n)) {
        throw new Error("tan: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        var sinValue = (0, exports.sin)(n);
        var cosValue = (0, exports.cos)(n);
        return atomic_divide(sinValue, cosValue);
    }
    return SchemeReal.build(Math.tan(n.coerce()));
};
exports.tan = tan;
var asin = function (n) {
    if (!is_number(n)) {
        throw new Error("asin: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // asin(n) = -i * ln(i * n + sqrt(1 - n^2))
        // we already have the building blocks needed to compute this
        var i = SchemeComplex.build(SchemeInteger.EXACT_ZERO, SchemeInteger.build(1));
        return atomic_multiply(atomic_negate(i), (0, exports.log)(atomic_add(atomic_multiply(i, n), (0, exports.sqrt)(atomic_subtract(SchemeInteger.build(1), atomic_multiply(n, n))))));
    }
    return SchemeReal.build(Math.asin(n.coerce()));
};
exports.asin = asin;
var acos = function (n) {
    if (!is_number(n)) {
        throw new Error("acos: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // acos(n) = -i * ln(n + sqrt(n^2 - 1))
        // again, we have the building blocks needed to compute this
        var i = SchemeComplex.build(SchemeInteger.EXACT_ZERO, SchemeInteger.build(1));
        return atomic_multiply(atomic_negate(i), (0, exports.log)(atomic_add(n, (0, exports.sqrt)(atomic_subtract(atomic_multiply(n, n), SchemeInteger.build(1))))));
    }
    return SchemeReal.build(Math.acos(n.coerce()));
};
exports.acos = acos;
var atan = function (n, m) {
    if (!is_number(n)) {
        throw new Error("atan: expected number");
    }
    if (m !== undefined) {
        // two argument case, we construct a complex number with n + mi
        // if neither n nor m are real, it's an error
        if (!is_real(n) || !is_real(m)) {
            throw new Error("atan: expected real numbers");
        }
        return (0, exports.atan)(SchemeComplex.build(n, m));
    }
    if (!is_real(n)) {
        // complex number case
        // atan(n) = 1/2 * i * ln((1 - i * n) / (1 + i * n))
        var i = SchemeComplex.build(SchemeInteger.EXACT_ZERO, SchemeInteger.build(1));
        return atomic_multiply(
        // multiply is associative so the order here doesn't matter
        atomic_multiply(SchemeRational.build(1, 2), i), (0, exports.log)(atomic_divide(atomic_subtract(SchemeInteger.build(1), atomic_multiply(i, n)), atomic_add(SchemeInteger.build(1), atomic_multiply(i, n)))));
    }
    return SchemeReal.build(Math.atan(n.coerce()));
};
exports.atan = atan;
var floor = function (n) {
    if (!is_number(n)) {
        throw new Error("floor: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        throw new Error("floor: expected real number");
    }
    if (n.numberType === NumberType.INTEGER) {
        return n;
    }
    if (n.numberType === NumberType.RATIONAL) {
        // floor is numerator // denominator
        var rational = n;
        var numerator_3 = rational.getNumerator();
        var denominator_3 = rational.getDenominator();
        return SchemeInteger.build(numerator_3 / denominator_3);
    }
    return SchemeReal.build(Math.floor(n.coerce()));
};
exports.floor = floor;
var ceiling = function (n) {
    if (!is_number(n)) {
        throw new Error("ceiling: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        throw new Error("ceiling: expected real number");
    }
    if (n.numberType === NumberType.INTEGER) {
        return n;
    }
    if (n.numberType === NumberType.RATIONAL) {
        // ceiling is (numerator + denominator - 1) // denominator
        var rational = n;
        var numerator_4 = rational.getNumerator();
        var denominator_4 = rational.getDenominator();
        return SchemeInteger.build((numerator_4 + denominator_4 - 1n) / denominator_4);
    }
    return SchemeReal.build(Math.ceil(n.coerce()));
};
exports.ceiling = ceiling;
var truncate = function (n) {
    if (!is_number(n)) {
        throw new Error("truncate: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        throw new Error("truncate: expected real number");
    }
    if (n.numberType === NumberType.INTEGER) {
        return n;
    }
    if (n.numberType === NumberType.RATIONAL) {
        // truncate is also just numerator // denominator
        // exactly like floor
        var rational = n;
        var numerator_5 = rational.getNumerator();
        var denominator_5 = rational.getDenominator();
        return SchemeInteger.build(numerator_5 / denominator_5);
    }
    return SchemeReal.build(Math.trunc(n.coerce()));
};
exports.truncate = truncate;
var round = function (n) {
    if (!is_number(n)) {
        throw new Error("round: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        throw new Error("round: expected real number");
    }
    if (n.numberType === NumberType.INTEGER) {
        return n;
    }
    if (n.numberType === NumberType.RATIONAL) {
        // round is numerator + denominator // 2 * denominator
        var rational = n;
        var numerator_6 = rational.getNumerator();
        var denominator_6 = rational.getDenominator();
        return SchemeInteger.build((numerator_6 + denominator_6 / 2n) / denominator_6);
    }
    return SchemeReal.build(Math.round(n.coerce()));
};
exports.round = round;
var make$45$rectangular = function (a, b) {
    if (!is_number(a) || !is_number(b)) {
        throw new Error("make-rectangular: expected numbers");
    }
    if (!is_real(a) || !is_real(b)) {
        // complex number case
        throw new Error("make-rectangular: expected real numbers");
    }
    return SchemeComplex.build(a, b);
};
exports.make$45$rectangular = make$45$rectangular;
var make$45$polar = function (a, b) {
    if (!is_number(a) || !is_number(b)) {
        throw new Error("make-polar: expected numbers");
    }
    if (!is_real(a) || !is_real(b)) {
        // complex number case
        throw new Error("make-polar: expected real numbers");
    }
    return SchemePolar.build(a.promote(NumberType.REAL), b.promote(NumberType.REAL)).toCartesian();
};
exports.make$45$polar = make$45$polar;
var real$45$part = function (n) {
    if (!is_number(n)) {
        throw new Error("real-part: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        return n.getReal();
    }
    return n;
};
exports.real$45$part = real$45$part;
var imag$45$part = function (n) {
    if (!is_number(n)) {
        throw new Error("imag-part: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        return n.getImaginary();
    }
    return SchemeInteger.EXACT_ZERO;
};
exports.imag$45$part = imag$45$part;
var magnitude = function (n) {
    if (!is_number(n)) {
        throw new Error("magnitude: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        return n.toPolar().magnitude;
    }
    // abs is not defined here so we should just use direct comparison
    if (atomic_less_than(n, SchemeInteger.EXACT_ZERO)) {
        return atomic_negate(n);
    }
    return n;
};
exports.magnitude = magnitude;
var angle = function (n) {
    if (!is_number(n)) {
        throw new Error("angle: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        return n.toPolar().angle;
    }
    if (atomic_less_than(n, SchemeInteger.EXACT_ZERO)) {
        return exports.PI;
    }
    return SchemeInteger.EXACT_ZERO;
};
exports.angle = angle;
var odd$63$ = function (n) {
    if (!is_number(n)) {
        throw new Error("odd?: expected integer");
    }
    if (!is_integer(n)) {
        throw new Error("odd?: expected integer");
    }
    return n.getBigInt() % 2n === 1n;
};
exports.odd$63$ = odd$63$;
var even$63$ = function (n) {
    if (!is_number(n)) {
        throw new Error("even?: expected integer");
    }
    if (!is_integer(n)) {
        throw new Error("even?: expected integer");
    }
    return n.getBigInt() % 2n === 0n;
};
exports.even$63$ = even$63$;
