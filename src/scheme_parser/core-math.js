"use strict";
// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.
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
class Match {
    constructor(result) {
        this.result = result;
    }
}
exports.Match = Match;
class IntegerMatch extends Match {
    constructor(result, value) {
        super(result);
        this.result = result;
        this.value = value;
    }
    isSigned() {
        return this.result
            ? this.value[0] === "+" || this.value[0] === "-"
            : false;
    }
    build() {
        return SchemeInteger.build(this.value);
    }
}
class RationalMatch extends Match {
    constructor(result, numerator, denominator) {
        super(result);
        this.result = result;
        this.numerator = numerator;
        this.denominator = denominator;
    }
    build() {
        return SchemeRational.build(this.numerator, this.denominator);
    }
}
class RealMatch extends Match {
    constructor(result, integer, decimal, exponent) {
        super(result);
        this.result = result;
        this.integer = integer;
        this.decimal = decimal;
        this.exponent = exponent;
    }
    build() {
        if (this.integer?.includes("inf")) {
            return this.integer.includes("-")
                ? SchemeReal.NEG_INFINITY
                : SchemeReal.INFINITY;
        }
        if (this.integer?.includes("nan")) {
            return SchemeReal.NAN;
        }
        // recursively build the exponent
        let exponent = (this.exponent ? this.exponent.build() : SchemeReal.INEXACT_ZERO).coerce();
        // we are assured that either part exists
        let value = Number((this.integer ? this.integer : "0") +
            "." +
            (this.decimal ? this.decimal : "0"));
        // apply the exponent
        value *= Math.pow(10, exponent);
        return SchemeReal.build(value);
    }
}
class ComplexMatch extends Match {
    constructor(result, real, sign, imaginary) {
        super(result);
        this.result = result;
        this.real = real;
        this.sign = sign;
        this.imaginary = imaginary;
    }
    build() {
        const real = this.real
            ? this.real.build()
            : SchemeInteger.EXACT_ZERO;
        const imaginary = this.imaginary.build();
        if (this.sign && this.sign === "-") {
            return SchemeComplex.build(real, imaginary.negate());
        }
        return SchemeComplex.build(real, imaginary);
    }
}
// these are used to determine the type of the number and to separate it into its parts as well
function isInteger(value) {
    // <integer> = [+-]?<digit>+
    // check if the value is an integer. if it is, return true and the value.
    // if not, return false and an empty array.
    const integerRegex = new RegExp(`^([+-]?)(\\d+)$`);
    const match = integerRegex.exec(value);
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
    const count = (value.match(/\//g) || []).length;
    if (count !== 1) {
        return new RationalMatch(false);
    }
    const parts = value.split("/");
    if (parts.length !== 2) {
        return new RationalMatch(false);
    }
    const [numerator, denominator] = parts;
    const numeratorMatch = isInteger(numerator);
    const denominatorMatch = isInteger(denominator);
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
        const count = (value.match(/\./g) || []).length;
        if (count > 1) {
            return new RealMatch(false);
        }
        if (count === 0) {
            const result = isInteger(value);
            return new RealMatch(result.result, result.value);
        }
        // check for a basic real number
        const [integerPart, decimalPart] = value.split(".");
        const integerMatch = isInteger(integerPart);
        const decimalMatch = isInteger(decimalPart);
        const properInteger = integerMatch.result || integerPart === "";
        const properDecimal = decimalMatch.result || decimalPart === "";
        // if the integer part is just a sign, the decimal part should be non-empty
        if (integerPart === "+" || integerPart === "-") {
            if (decimalPart === "") {
                return new RealMatch(false);
            }
            return new RealMatch(true, `${integerPart}0`, value);
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
        const first_e_index = value.indexOf("e");
        const first_E_index = value.indexOf("E");
        if (first_e_index === -1 && first_E_index === -1) {
            return new RealMatch(false);
        }
        const exponentIndex = first_e_index === -1 ? first_E_index : first_e_index;
        const basicRealPart = value.substring(0, exponentIndex);
        const exponentPart = value.substring(exponentIndex + 1);
        // both should not be empty
        if (basicRealPart === "" || exponentPart == "") {
            return new RealMatch(false);
        }
        // parse each part
        const basicRealMatch = checkBasicReal(basicRealPart);
        if (!basicRealMatch.result) {
            return new RealMatch(false);
        }
        // match the exponent part across types up to real
        const exponentMatch = universalMatch(exponentPart, NumberType.REAL);
        if (!exponentMatch.result) {
            return new RealMatch(false);
        }
        return new RealMatch(true, basicRealMatch.integer, basicRealMatch.decimal, exponentMatch);
    }
    // check for the presence of e/E
    const count = (value.match(/[eE]/g) || []).length;
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
    const count = (value.match(/i/g) || []).length;
    if (count < 1) {
        return new ComplexMatch(false);
    }
    if (value[value.length - 1] !== "i") {
        return new ComplexMatch(false);
    }
    // find the first + or - that is not at the start of the string
    // this is the split point
    const splitPoint = value.search(/(?<!^)[+-]/);
    // if no such point was found,
    if (splitPoint === -1) {
        // the value may be purely imaginary
        let imaginaryPart = value.slice(0, -1);
        const imaginaryMatch = universalMatch(imaginaryPart, NumberType.REAL);
        if (imaginaryMatch.result) {
            return new ComplexMatch(true, undefined, undefined, imaginaryMatch);
        }
        return new ComplexMatch(false);
    }
    const realPart = value.slice(0, splitPoint);
    let imaginaryPart = value.slice(splitPoint + 1, -1);
    // if imaginaryPart doesn't start with a sign, add one
    // this lets us properly parse expressions such as 1+inf.0i
    // even if the + belongs to the complex number
    if (imaginaryPart[0] !== "+" && imaginaryPart[0] !== "-") {
        imaginaryPart = "+" + imaginaryPart;
    }
    const realMatch = universalMatch(realPart, NumberType.REAL);
    const imaginaryMatch = universalMatch(imaginaryPart, NumberType.REAL);
    if (!(realMatch.result && imaginaryMatch.result)) {
        return new ComplexMatch(false);
    }
    return new ComplexMatch(true, realMatch, value[splitPoint], imaginaryMatch);
}
// tests the value across all possible types
// only limited by the finalWillingType of
function universalMatch(value, finalWillingType) {
    const integerMatch = isInteger(value);
    if (integerMatch.result && finalWillingType >= NumberType.INTEGER) {
        return integerMatch;
    }
    const rationalMatch = isRational(value);
    if (rationalMatch.result && finalWillingType >= NumberType.RATIONAL) {
        return rationalMatch;
    }
    const realMatch = isReal(value);
    if (realMatch.result && finalWillingType >= NumberType.REAL) {
        return realMatch;
    }
    const complexMatch = isComplex(value);
    if (complexMatch.result && finalWillingType >= NumberType.COMPLEX) {
        return complexMatch;
    }
    return new IntegerMatch(false);
}
// for the lexer.
function stringIsSchemeNumber(value) {
    const match = universalMatch(value, NumberType.COMPLEX);
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
let make_number = (value) => {
    const match = universalMatch(value, NumberType.COMPLEX);
    if (!match.result) {
        throw new Error("Invalid number");
    }
    return match.build();
};
exports.make_number = make_number;
class SchemeInteger {
    constructor(value) {
        this.numberType = NumberType.INTEGER;
        this.value = value;
    }
    // Factory method for creating a new SchemeInteger instance.
    // Force prevents automatic downcasting to a lower type.
    static build(value, _force = false) {
        const val = BigInt(value);
        if (val === 0n) {
            return SchemeInteger.EXACT_ZERO;
        }
        return new SchemeInteger(val);
    }
    promote(nType) {
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
    }
    equals(other) {
        return other instanceof SchemeInteger && this.value === other.value;
    }
    greaterThan(other) {
        return this.value > other.value;
    }
    negate() {
        if (this === SchemeInteger.EXACT_ZERO) {
            return this;
        }
        return SchemeInteger.build(-this.value);
    }
    multiplicativeInverse() {
        if (this === SchemeInteger.EXACT_ZERO) {
            throw new Error("Division by zero");
        }
        return SchemeRational.build(1n, this.value, false);
    }
    add(other) {
        return SchemeInteger.build(this.value + other.value);
    }
    multiply(other) {
        return SchemeInteger.build(this.value * other.value);
    }
    getBigInt() {
        return this.value;
    }
    coerce() {
        if (this.value > Number.MAX_SAFE_INTEGER) {
            return Infinity;
        }
        if (this.value < Number.MIN_SAFE_INTEGER) {
            return -Infinity;
        }
        return Number(this.value);
    }
    toString() {
        return this.value.toString();
    }
}
exports.SchemeInteger = SchemeInteger;
SchemeInteger.EXACT_ZERO = new SchemeInteger(0n);
class SchemeRational {
    constructor(numerator, denominator) {
        this.numberType = NumberType.RATIONAL;
        this.numerator = numerator;
        this.denominator = denominator;
    }
    // Builds a rational number.
    // Force prevents automatic downcasting to a lower type.
    static build(numerator, denominator, force = false) {
        return SchemeRational.simplify(BigInt(numerator), BigInt(denominator), force);
    }
    static simplify(numerator, denominator, force = false) {
        const gcd = (a, b) => {
            if (b === 0n) {
                return a;
            }
            return gcd(b, a.valueOf() % b.valueOf());
        };
        const divisor = gcd(numerator, denominator);
        const numeratorSign = numerator < 0n ? -1n : 1n;
        const denominatorSign = denominator < 0n ? -1n : 1n;
        // determine the sign of the result
        const sign = numeratorSign * denominatorSign;
        // remove the sign from the numerator and denominator
        numerator = numerator * numeratorSign;
        denominator = denominator * denominatorSign;
        // if the denominator is 1, we can return an integer
        if (denominator === 1n && !force) {
            return SchemeInteger.build(sign * numerator);
        }
        return new SchemeRational((sign * numerator) / divisor, denominator / divisor);
    }
    getNumerator() {
        return this.numerator;
    }
    getDenominator() {
        return this.denominator;
    }
    promote(nType) {
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
    }
    equals(other) {
        return (other instanceof SchemeRational &&
            this.numerator === other.numerator &&
            this.denominator === other.denominator);
    }
    greaterThan(other) {
        return (this.numerator * other.denominator > other.numerator * this.denominator);
    }
    negate() {
        return SchemeRational.build(-this.numerator, this.denominator);
    }
    multiplicativeInverse() {
        if (this.numerator === 0n) {
            throw new Error("Division by zero");
        }
        return SchemeRational.build(this.denominator, this.numerator);
    }
    add(other) {
        const newNumerator = this.numerator * other.denominator + other.numerator * this.denominator;
        const newDenominator = this.denominator * other.denominator;
        return SchemeRational.build(newNumerator, newDenominator);
    }
    multiply(other) {
        const newNumerator = this.numerator * other.numerator;
        const newDenominator = this.denominator * other.denominator;
        return SchemeRational.build(newNumerator, newDenominator);
    }
    coerce() {
        const workingNumerator = this.numerator < 0n ? -this.numerator : this.numerator;
        let converterDenominator = this.denominator;
        // we can take the whole part directly
        const wholePart = Number(workingNumerator / converterDenominator);
        if (wholePart > Number.MAX_VALUE) {
            return this.numerator < 0n ? -Infinity : Infinity;
        }
        // remainder should be lossily converted below safe levels
        let remainder = workingNumerator % converterDenominator;
        // we lossily convert both values below safe number thresholds
        while (remainder > Number.MAX_SAFE_INTEGER ||
            converterDenominator > Number.MAX_SAFE_INTEGER) {
            remainder = remainder / 2n;
            converterDenominator = converterDenominator / 2n;
        }
        // coerce the now safe parts into a remainder number
        const remainderPart = Number(remainder) / Number(converterDenominator);
        return this.numerator < 0n
            ? -(wholePart + remainderPart)
            : wholePart + remainderPart;
    }
    toString() {
        return `${this.numerator}/${this.denominator}`;
    }
}
exports.SchemeRational = SchemeRational;
// it is allowable to represent the Real number using
// float/double representation, and so we shall do that.
// the current schemeReal implementation is fully based
// on JavaScript numbers.
class SchemeReal {
    static build(value, _force = false) {
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
    }
    constructor(value) {
        this.numberType = NumberType.REAL;
        this.value = value;
    }
    promote(nType) {
        switch (nType) {
            case NumberType.REAL:
                return this;
            case NumberType.COMPLEX:
                return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
            default:
                throw new Error("Unable to demote real");
        }
    }
    equals(other) {
        return other instanceof SchemeReal && this.value === other.value;
    }
    greaterThan(other) {
        return this.value > other.value;
    }
    negate() {
        return SchemeReal.build(-this.value);
    }
    multiplicativeInverse() {
        if (this === SchemeReal.INEXACT_ZERO ||
            this === SchemeReal.INEXACT_NEG_ZERO) {
            throw new Error("Division by zero");
        }
        return SchemeReal.build(1 / this.value);
    }
    add(other) {
        return SchemeReal.build(this.value + other.value);
    }
    multiply(other) {
        return SchemeReal.build(this.value * other.value);
    }
    coerce() {
        return this.value;
    }
    toString() {
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
    }
}
exports.SchemeReal = SchemeReal;
SchemeReal.INEXACT_ZERO = new SchemeReal(0);
SchemeReal.INEXACT_NEG_ZERO = new SchemeReal(-0);
SchemeReal.INFINITY = new SchemeReal(Infinity);
SchemeReal.NEG_INFINITY = new SchemeReal(-Infinity);
SchemeReal.NAN = new SchemeReal(NaN);
class SchemeComplex {
    static build(real, imaginary, force = false) {
        return SchemeComplex.simplify(new SchemeComplex(real, imaginary), force);
    }
    constructor(real, imaginary) {
        this.numberType = NumberType.COMPLEX;
        this.real = real;
        this.imaginary = imaginary;
    }
    static simplify(complex, force) {
        if (!force && atomic_equals(complex.imaginary, SchemeInteger.EXACT_ZERO)) {
            return complex.real;
        }
        return complex;
    }
    promote(nType) {
        switch (nType) {
            case NumberType.COMPLEX:
                return this;
            default:
                throw new Error("Unable to demote complex");
        }
    }
    negate() {
        return SchemeComplex.build(this.real.negate(), this.imaginary.negate());
    }
    equals(other) {
        return (atomic_equals(this.real, other.real) &&
            atomic_equals(this.imaginary, other.imaginary));
    }
    greaterThan(other) {
        return (atomic_greater_than(this.real, other.real) &&
            atomic_greater_than(this.imaginary, other.imaginary));
    }
    multiplicativeInverse() {
        // inverse of a + bi = a - bi / a^2 + b^2
        // in this case, we use a / a^2 + b^2 and -b / a^2 + b^2 as the new values required
        const denominator = atomic_add(atomic_multiply(this.real, this.real), atomic_multiply(this.imaginary, this.imaginary));
        return SchemeComplex.build(atomic_multiply(denominator.multiplicativeInverse(), this.real), atomic_multiply(denominator.multiplicativeInverse(), this.imaginary.negate()));
    }
    add(other) {
        return SchemeComplex.build(atomic_add(this.real, other.real), atomic_add(this.imaginary, other.imaginary));
    }
    multiply(other) {
        // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
        const realPart = atomic_subtract(atomic_multiply(this.real, other.real), atomic_multiply(this.imaginary, other.imaginary));
        const imaginaryPart = atomic_add(atomic_multiply(this.real, other.imaginary), atomic_multiply(this.imaginary, other.real));
        return SchemeComplex.build(realPart, imaginaryPart);
    }
    getReal() {
        return this.real;
    }
    getImaginary() {
        return this.imaginary;
    }
    coerce() {
        throw new Error("Cannot coerce a complex number to a javascript number");
    }
    toPolar() {
        // force both the real and imaginary parts to be inexact
        const real = this.real.promote(NumberType.REAL);
        const imaginary = this.imaginary.promote(NumberType.REAL);
        // schemeReals can be reasoned with using the same logic as javascript numbers
        // r = sqrt(a^2 + b^2)
        const magnitude = SchemeReal.build(Math.sqrt(real.coerce() * real.coerce() + imaginary.coerce() * imaginary.coerce()));
        // theta = atan(b / a)
        const angle = SchemeReal.build(Math.atan2(imaginary.coerce(), real.coerce()));
        return SchemePolar.build(magnitude, angle);
    }
    toString() {
        return `${this.real}+${this.imaginary}i`;
    }
}
exports.SchemeComplex = SchemeComplex;
// an alternative form of the complex number.
// only used in intermediate steps, will be converted back at the end of the operation.
// current scm-slang will force any polar complex numbers to be made
// inexact, hence we opt to limit the use of polar form as much as possible.
class SchemePolar {
    constructor(magnitude, angle) {
        this.magnitude = magnitude;
        this.angle = angle;
    }
    static build(magnitude, angle) {
        return new SchemePolar(magnitude, angle);
    }
    // converts the polar number back to a cartesian complex number
    toCartesian() {
        // a + bi = r * cos(theta) + r * sin(theta)i
        // a = r * cos(theta)
        // b = r * sin(theta)
        const real = SchemeReal.build(this.magnitude.coerce() * Math.cos(this.angle.coerce()));
        const imaginary = SchemeReal.build(this.magnitude.coerce() * Math.sin(this.angle.coerce()));
        return SchemeComplex.build(real, imaginary);
    }
}
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
    const [newA, newB] = equalify(a, b);
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
    const [newA, newB] = equalify(a, b);
    // safe to cast as we are assured they are of the same type
    return newA.greaterThan(newB);
}
function atomic_greater_than_or_equals(a, b) {
    return atomic_greater_than(a, b) || atomic_equals(a, b);
}
function atomic_add(a, b) {
    const [newA, newB] = equalify(a, b);
    // safe to cast as we are assured they are of the same type
    return simplify(newA.add(newB));
}
function atomic_multiply(a, b) {
    const [newA, newB] = equalify(a, b);
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
const numerator = (n) => {
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
        const val = n.coerce();
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
        let multiplier = 1;
        while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
        }
        let numerator = val * multiplier;
        let denominator = multiplier;
        // simplify the fraction
        const gcd = (a, b) => {
            if (b === 0) {
                return a;
            }
            return gcd(b, a % b);
        };
        const divisor = gcd(numerator, denominator);
        numerator = numerator / divisor;
        return SchemeReal.build(numerator);
    }
    return SchemeInteger.build(n.promote(NumberType.RATIONAL).getNumerator());
};
exports.numerator = numerator;
const denominator = (n) => {
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
        const val = n.coerce();
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
        let multiplier = 1;
        while (!Number.isInteger(val * multiplier)) {
            multiplier *= 10;
        }
        let numerator = val * multiplier;
        let denominator = multiplier;
        // simplify the fraction
        const gcd = (a, b) => {
            if (b === 0) {
                return a;
            }
            return gcd(b, a % b);
        };
        const divisor = gcd(numerator, denominator);
        denominator = denominator / divisor;
        return SchemeReal.build(denominator);
    }
    return SchemeInteger.build(n.promote(NumberType.RATIONAL).getDenominator());
};
exports.denominator = denominator;
const exact = (n) => {
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
        let multiplier = 1;
        let val = n.coerce();
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
const inexact = (n) => {
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
const expt = (n, e) => {
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
        const nPolar = n.promote(NumberType.COMPLEX).toPolar();
        const ePolar = e.promote(NumberType.COMPLEX).toPolar();
        const a = nPolar.magnitude.coerce();
        const b = nPolar.angle.coerce();
        const c = ePolar.magnitude.coerce();
        const d = ePolar.angle.coerce();
        // we can construct a new polar form following the formula above
        const mag = SchemeReal.build(a ** c * Math.E ** (-b * d));
        const angle = SchemeReal.build(b * c * Math.log(a) + a * d);
        return SchemePolar.build(mag, angle).toCartesian();
    }
    // coerce both numbers to javascript numbers
    const base = n.coerce();
    const exponent = e.coerce();
    // there are probably cases here i am not considering yet.
    // for now, we will just use the javascript Math library and hope for the best.
    return SchemeReal.build(Math.pow(base, exponent));
};
exports.expt = expt;
const exp = (n) => {
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
const log = (n, base = exports.E) => {
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
        const nPolar = n.promote(NumberType.COMPLEX).toPolar();
        const basePolar = base.promote(NumberType.COMPLEX).toPolar();
        const a = nPolar.magnitude.coerce();
        const b = nPolar.angle.coerce();
        const c = basePolar.magnitude.coerce();
        const d = basePolar.angle.coerce();
        return SchemeComplex.build(SchemeReal.build(Math.log(a) - Math.log(c)), SchemeReal.build(b / d));
    }
    return SchemeReal.build(Math.log(n.coerce()) / Math.log(base.coerce()));
};
exports.log = log;
const sqrt = (n) => {
    if (!is_number(n)) {
        throw new Error("sqrt: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        const polar = n.promote(NumberType.COMPLEX).toPolar();
        const mag = polar.magnitude;
        const angle = polar.angle;
        // the square root of a complex number is given by
        // the square root of the magnitude and half the angle
        const newMag = (0, exports.sqrt)(mag);
        const newAngle = SchemeReal.build(angle.coerce() / 2);
        return SchemePolar.build(newMag, newAngle).toCartesian();
    }
    let value = n.coerce();
    if (value < 0) {
        return SchemeComplex.build(SchemeReal.INEXACT_ZERO, SchemeReal.build(Math.sqrt(-value)));
    }
    return SchemeReal.build(Math.sqrt(n.coerce()));
};
exports.sqrt = sqrt;
const sin = (n) => {
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
        const complex = n.promote(NumberType.COMPLEX);
        const real = complex.getReal();
        const imaginary = complex.getImaginary();
        const a = real.coerce();
        const b = imaginary.coerce();
        return SchemeComplex.build(SchemeReal.build((Math.sin(a) * (Math.exp(-b) + Math.exp(b))) / 2), SchemeReal.build((Math.cos(a) * (Math.exp(-b) - Math.exp(b))) / 2));
    }
    return SchemeReal.build(Math.sin(n.coerce()));
};
exports.sin = sin;
const cos = (n) => {
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
        const complex = n.promote(NumberType.COMPLEX);
        const real = complex.getReal();
        const imaginary = complex.getImaginary();
        const a = real.coerce();
        const b = imaginary.coerce();
        return SchemeComplex.build(SchemeReal.build((Math.cos(a) * (Math.exp(-b) + Math.exp(b))) / 2), SchemeReal.build((-Math.sin(a) * (Math.exp(-b) - Math.exp(b))) / 2));
    }
    return SchemeReal.build(Math.cos(n.coerce()));
};
exports.cos = cos;
const tan = (n) => {
    if (!is_number(n)) {
        throw new Error("tan: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        const sinValue = (0, exports.sin)(n);
        const cosValue = (0, exports.cos)(n);
        return atomic_divide(sinValue, cosValue);
    }
    return SchemeReal.build(Math.tan(n.coerce()));
};
exports.tan = tan;
const asin = (n) => {
    if (!is_number(n)) {
        throw new Error("asin: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // asin(n) = -i * ln(i * n + sqrt(1 - n^2))
        // we already have the building blocks needed to compute this
        const i = SchemeComplex.build(SchemeInteger.EXACT_ZERO, SchemeInteger.build(1));
        return atomic_multiply(atomic_negate(i), (0, exports.log)(atomic_add(atomic_multiply(i, n), (0, exports.sqrt)(atomic_subtract(SchemeInteger.build(1), atomic_multiply(n, n))))));
    }
    return SchemeReal.build(Math.asin(n.coerce()));
};
exports.asin = asin;
const acos = (n) => {
    if (!is_number(n)) {
        throw new Error("acos: expected number");
    }
    if (!is_real(n)) {
        // complex number case
        // acos(n) = -i * ln(n + sqrt(n^2 - 1))
        // again, we have the building blocks needed to compute this
        const i = SchemeComplex.build(SchemeInteger.EXACT_ZERO, SchemeInteger.build(1));
        return atomic_multiply(atomic_negate(i), (0, exports.log)(atomic_add(n, (0, exports.sqrt)(atomic_subtract(atomic_multiply(n, n), SchemeInteger.build(1))))));
    }
    return SchemeReal.build(Math.acos(n.coerce()));
};
exports.acos = acos;
const atan = (n, m) => {
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
        const i = SchemeComplex.build(SchemeInteger.EXACT_ZERO, SchemeInteger.build(1));
        return atomic_multiply(
        // multiply is associative so the order here doesn't matter
        atomic_multiply(SchemeRational.build(1, 2), i), (0, exports.log)(atomic_divide(atomic_subtract(SchemeInteger.build(1), atomic_multiply(i, n)), atomic_add(SchemeInteger.build(1), atomic_multiply(i, n)))));
    }
    return SchemeReal.build(Math.atan(n.coerce()));
};
exports.atan = atan;
const floor = (n) => {
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
        const rational = n;
        const numerator = rational.getNumerator();
        const denominator = rational.getDenominator();
        return SchemeInteger.build(numerator / denominator);
    }
    return SchemeReal.build(Math.floor(n.coerce()));
};
exports.floor = floor;
const ceiling = (n) => {
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
        const rational = n;
        const numerator = rational.getNumerator();
        const denominator = rational.getDenominator();
        return SchemeInteger.build((numerator + denominator - 1n) / denominator);
    }
    return SchemeReal.build(Math.ceil(n.coerce()));
};
exports.ceiling = ceiling;
const truncate = (n) => {
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
        const rational = n;
        const numerator = rational.getNumerator();
        const denominator = rational.getDenominator();
        return SchemeInteger.build(numerator / denominator);
    }
    return SchemeReal.build(Math.trunc(n.coerce()));
};
exports.truncate = truncate;
const round = (n) => {
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
        const rational = n;
        const numerator = rational.getNumerator();
        const denominator = rational.getDenominator();
        return SchemeInteger.build((numerator + denominator / 2n) / denominator);
    }
    return SchemeReal.build(Math.round(n.coerce()));
};
exports.round = round;
const make$45$rectangular = (a, b) => {
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
const make$45$polar = (a, b) => {
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
const real$45$part = (n) => {
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
const imag$45$part = (n) => {
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
const magnitude = (n) => {
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
const angle = (n) => {
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
const odd$63$ = (n) => {
    if (!is_number(n)) {
        throw new Error("odd?: expected integer");
    }
    if (!is_integer(n)) {
        throw new Error("odd?: expected integer");
    }
    return n.getBigInt() % 2n === 1n;
};
exports.odd$63$ = odd$63$;
const even$63$ = (n) => {
    if (!is_number(n)) {
        throw new Error("even?: expected integer");
    }
    if (!is_integer(n)) {
        throw new Error("even?: expected integer");
    }
    return n.getBigInt() % 2n === 0n;
};
exports.even$63$ = even$63$;
//# sourceMappingURL=core-math.js.map