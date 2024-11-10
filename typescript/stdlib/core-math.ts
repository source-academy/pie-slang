// The core library of scm-slang,
// different from the base library,
// this library contains all methods required
// for the language to function properly.

// This file contains the minimum subset
// required for arithmetic to work.
// which includes the numeric tower,
// as well as the regex forms used to detect numbers.

export type SchemeNumber =
  | SchemeInteger
  | SchemeRational
  | SchemeReal
  | SchemeComplex;

// define here the functions used to check and split the number into its parts

export enum NumberType {
  INTEGER = 1,
  RATIONAL = 2,
  REAL = 3,
  COMPLEX = 4,
}

export abstract class Match {
  constructor(public result: boolean) {}
  abstract build(): SchemeNumber;
}

class IntegerMatch extends Match {
  constructor(
    public result: boolean,
    public value?: string
  ) {
    super(result);
  }

  isSigned(): boolean {
    return this.result
      ? this.value![0] === "+" || this.value![0] === "-"
      : false;
  }

  build(): SchemeInteger {
    return SchemeInteger.build(this.value!);
  }
}

class RationalMatch extends Match {
  constructor(
    public result: boolean,
    public numerator?: string,
    public denominator?: string
  ) {
    super(result);
  }

  build(): SchemeInteger | SchemeRational {
    return SchemeRational.build(this.numerator!, this.denominator!);
  }
}

class RealMatch extends Match {
  constructor(
    public result: boolean,
    public integer?: string,
    public decimal?: string,
    public exponent?: Match
  ) {
    super(result);
  }

  build(): SchemeReal {
    if (this.integer?.includes("inf")) {
      return this.integer!.includes("-")
        ? SchemeReal.NEG_INFINITY
        : SchemeReal.INFINITY;
    }

    if (this.integer?.includes("nan")) {
      return SchemeReal.NAN;
    }

    // recursively build the exponent
    let exponent = (
      this.exponent ? this.exponent.build() : SchemeReal.INEXACT_ZERO
    ).coerce();

    // we are assured that either part exists
    let value = Number(
      (this.integer ? this.integer : "0") +
        "." +
        (this.decimal ? this.decimal : "0")
    );

    // apply the exponent
    value *= Math.pow(10, exponent);

    return SchemeReal.build(value);
  }
}

class ComplexMatch extends Match {
  constructor(
    public result: boolean,
    public real?: Match,
    public sign?: string,
    public imaginary?: Match
  ) {
    super(result);
  }
  build(): SchemeNumber {
    const real = this.real
      ? (this.real.build() as SchemeInteger | SchemeRational | SchemeReal)
      : SchemeInteger.EXACT_ZERO;
    const imaginary = this.imaginary!.build() as
      | SchemeInteger
      | SchemeRational
      | SchemeReal;

    if (this.sign && this.sign === "-") {
      return SchemeComplex.build(real, imaginary.negate());
    }

    return SchemeComplex.build(real, imaginary);
  }
}

// these are used to determine the type of the number and to separate it into its parts as well
export function isInteger(value: string): IntegerMatch {
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

export function isRational(value: string): RationalMatch {
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

export function isReal(value: string): RealMatch {
  // <real> = <basic> | <extended>
  // <basic>: [+-]?a.b | [+-]?a | [+-]?.b | [+-]?a.
  // <extended>: <basic>[eE]<integer | rational | real>
  // where a = <digit>+ | inf | nan
  //       b = <digit>+
  //
  // keep in mind that the value matches an integer too! but
  // by the point of time this is called, we have already checked for an integer
  function checkBasicReal(value: string): RealMatch {
    // checks if the value is one of the 4 forms of special numbers
    function isSpecialNumber(value: string): boolean {
      return (
        value === "+inf.0" ||
        value === "-inf.0" ||
        value === "+nan.0" ||
        value === "-nan.0"
      );
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
    if (
      !(
        (integerMatch.result && properDecimal) ||
        (properInteger && decimalMatch.result)
      )
    ) {
      return new RealMatch(false);
    }

    // if there is a decimal match, there should have no sign
    if (decimalMatch.result && decimalMatch.isSigned()) {
      return new RealMatch(false);
    }

    return new RealMatch(true, integerMatch.value, decimalMatch.value);
  }

  function checkExtendedReal(value: string): RealMatch {
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

    return new RealMatch(
      true,
      basicRealMatch.integer,
      basicRealMatch.decimal,
      exponentMatch
    );
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

export function isComplex(value: string): ComplexMatch {
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
function universalMatch(value: string, finalWillingType: NumberType): Match {
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
  return new IntegerMatch(false) as Match;
}

// for the lexer.
export function stringIsSchemeNumber(value: string): boolean {
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
export let make_number = (value: string): SchemeNumber => {
  const match = universalMatch(value, NumberType.COMPLEX);
  if (!match.result) {
    throw new Error("Invalid number");
  }
  return match.build();
};

export class SchemeInteger {
  readonly numberType = NumberType.INTEGER;
  private readonly value: bigint;
  static readonly EXACT_ZERO = new SchemeInteger(0n);

  private constructor(value: bigint) {
    this.value = value;
  }

  // Factory method for creating a new SchemeInteger instance.
  // Force prevents automatic downcasting to a lower type.
  static build(
    value: number | string | bigint,
    _force: boolean = false
  ): SchemeInteger {
    const val = BigInt(value);
    if (val === 0n) {
      return SchemeInteger.EXACT_ZERO;
    }
    return new SchemeInteger(val);
  }

  promote(nType: NumberType): SchemeNumber {
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

  equals(other: any): boolean {
    return other instanceof SchemeInteger && this.value === other.value;
  }

  greaterThan(other: SchemeInteger): boolean {
    return this.value > other.value;
  }

  negate(): SchemeInteger {
    if (this === SchemeInteger.EXACT_ZERO) {
      return this;
    }
    return SchemeInteger.build(-this.value);
  }

  multiplicativeInverse(): SchemeInteger | SchemeRational {
    if (this === SchemeInteger.EXACT_ZERO) {
      throw new Error("Division by zero");
    }
    return SchemeRational.build(1n, this.value, false);
  }

  add(other: SchemeInteger): SchemeInteger {
    return SchemeInteger.build(this.value + other.value);
  }

  multiply(other: SchemeInteger): SchemeInteger {
    return SchemeInteger.build(this.value * other.value);
  }

  getBigInt(): bigint {
    return this.value;
  }

  coerce(): number {
    if (this.value > Number.MAX_SAFE_INTEGER) {
      return Infinity;
    }

    if (this.value < Number.MIN_SAFE_INTEGER) {
      return -Infinity;
    }

    return Number(this.value);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class SchemeRational {
  readonly numberType = NumberType.RATIONAL;
  private readonly numerator: bigint;
  private readonly denominator: bigint;

  private constructor(numerator: bigint, denominator: bigint) {
    this.numerator = numerator;
    this.denominator = denominator;
  }

  // Builds a rational number.
  // Force prevents automatic downcasting to a lower type.
  static build(
    numerator: number | string | bigint,
    denominator: number | string | bigint,
    force: boolean = false
  ): SchemeRational | SchemeInteger {
    return SchemeRational.simplify(
      BigInt(numerator),
      BigInt(denominator),
      force
    );
  }

  private static simplify(
    numerator: bigint,
    denominator: bigint,
    force: boolean = false
  ): SchemeRational | SchemeInteger {
    const gcd = (a: bigint, b: bigint): bigint => {
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
    return new SchemeRational(
      (sign * numerator) / divisor,
      denominator / divisor
    );
  }

  getNumerator(): bigint {
    return this.numerator;
  }

  getDenominator(): bigint {
    return this.denominator;
  }

  promote(nType: NumberType): SchemeNumber {
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

  equals(other: any): boolean {
    return (
      other instanceof SchemeRational &&
      this.numerator === other.numerator &&
      this.denominator === other.denominator
    );
  }

  greaterThan(other: SchemeRational): boolean {
    return (
      this.numerator * other.denominator > other.numerator * this.denominator
    );
  }

  negate(): SchemeRational {
    return SchemeRational.build(
      -this.numerator,
      this.denominator
    ) as SchemeRational;
  }

  multiplicativeInverse(): SchemeInteger | SchemeRational {
    if (this.numerator === 0n) {
      throw new Error("Division by zero");
    }
    return SchemeRational.build(this.denominator, this.numerator);
  }

  add(other: SchemeRational): SchemeInteger | SchemeRational {
    const newNumerator =
      this.numerator * other.denominator + other.numerator * this.denominator;
    const newDenominator = this.denominator * other.denominator;
    return SchemeRational.build(newNumerator, newDenominator);
  }

  multiply(other: SchemeRational): SchemeInteger | SchemeRational {
    const newNumerator = this.numerator * other.numerator;
    const newDenominator = this.denominator * other.denominator;
    return SchemeRational.build(newNumerator, newDenominator);
  }

  coerce(): number {
    const workingNumerator =
      this.numerator < 0n ? -this.numerator : this.numerator;
    let converterDenominator = this.denominator;

    // we can take the whole part directly
    const wholePart = Number(workingNumerator / converterDenominator);

    if (wholePart > Number.MAX_VALUE) {
      return this.numerator < 0n ? -Infinity : Infinity;
    }
    // remainder should be lossily converted below safe levels
    let remainder = workingNumerator % converterDenominator;

    // we lossily convert both values below safe number thresholds
    while (
      remainder > Number.MAX_SAFE_INTEGER ||
      converterDenominator > Number.MAX_SAFE_INTEGER
    ) {
      remainder = remainder / 2n;
      converterDenominator = converterDenominator / 2n;
    }

    // coerce the now safe parts into a remainder number
    const remainderPart = Number(remainder) / Number(converterDenominator);

    return this.numerator < 0n
      ? -(wholePart + remainderPart)
      : wholePart + remainderPart;
  }

  toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
}

// it is allowable to represent the Real number using
// float/double representation, and so we shall do that.
// the current schemeReal implementation is fully based
// on JavaScript numbers.
export class SchemeReal {
  readonly numberType = NumberType.REAL;
  private readonly value: number;

  public static INEXACT_ZERO = new SchemeReal(0);
  public static INEXACT_NEG_ZERO = new SchemeReal(-0);
  public static INFINITY = new SchemeReal(Infinity);
  public static NEG_INFINITY = new SchemeReal(-Infinity);
  public static NAN = new SchemeReal(NaN);

  static build(value: number, _force: boolean = false): SchemeReal {
    if (value === Infinity) {
      return SchemeReal.INFINITY;
    } else if (value === -Infinity) {
      return SchemeReal.NEG_INFINITY;
    } else if (isNaN(value)) {
      return SchemeReal.NAN;
    } else if (value === 0) {
      return SchemeReal.INEXACT_ZERO;
    } else if (value === -0) {
      return SchemeReal.INEXACT_NEG_ZERO;
    }
    return new SchemeReal(value);
  }

  private constructor(value: number) {
    this.value = value;
  }

  promote(nType: NumberType): SchemeNumber {
    switch (nType) {
      case NumberType.REAL:
        return this;
      case NumberType.COMPLEX:
        return SchemeComplex.build(this, SchemeInteger.EXACT_ZERO, true);
      default:
        throw new Error("Unable to demote real");
    }
  }

  equals(other: any): boolean {
    return other instanceof SchemeReal && this.value === other.value;
  }

  greaterThan(other: SchemeReal): boolean {
    return this.value > other.value;
  }

  negate(): SchemeReal {
    return SchemeReal.build(-this.value);
  }

  multiplicativeInverse(): SchemeReal {
    if (
      this === SchemeReal.INEXACT_ZERO ||
      this === SchemeReal.INEXACT_NEG_ZERO
    ) {
      throw new Error("Division by zero");
    }
    return SchemeReal.build(1 / this.value);
  }

  add(other: SchemeReal): SchemeReal {
    return SchemeReal.build(this.value + other.value);
  }

  multiply(other: SchemeReal): SchemeReal {
    return SchemeReal.build(this.value * other.value);
  }

  coerce(): number {
    return this.value;
  }

  toString(): string {
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

export class SchemeComplex {
  readonly numberType = NumberType.COMPLEX;
  private readonly real: SchemeInteger | SchemeRational | SchemeReal;
  private readonly imaginary: SchemeInteger | SchemeRational | SchemeReal;

  static build(
    real: SchemeReal | SchemeRational | SchemeInteger,
    imaginary: SchemeReal | SchemeRational | SchemeInteger,
    force: boolean = false
  ): SchemeNumber {
    return SchemeComplex.simplify(new SchemeComplex(real, imaginary), force);
  }

  private constructor(
    real: SchemeReal | SchemeRational | SchemeInteger,
    imaginary: SchemeReal | SchemeRational | SchemeInteger
  ) {
    this.real = real;
    this.imaginary = imaginary;
  }

  private static simplify(
    complex: SchemeComplex,
    force: boolean
  ): SchemeNumber {
    if (!force && atomic_equals(complex.imaginary, SchemeInteger.EXACT_ZERO)) {
      return complex.real;
    }
    return complex;
  }

  promote(nType: NumberType): SchemeNumber {
    switch (nType) {
      case NumberType.COMPLEX:
        return this;
      default:
        throw new Error("Unable to demote complex");
    }
  }

  negate(): SchemeNumber {
    return SchemeComplex.build(this.real.negate(), this.imaginary.negate());
  }

  equals(other: SchemeComplex): boolean {
    return (
      atomic_equals(this.real, other.real) &&
      atomic_equals(this.imaginary, other.imaginary)
    );
  }

  greaterThan(other: SchemeComplex): boolean {
    return (
      atomic_greater_than(this.real, other.real) &&
      atomic_greater_than(this.imaginary, other.imaginary)
    );
  }

  multiplicativeInverse(): SchemeNumber {
    // inverse of a + bi = a - bi / a^2 + b^2
    // in this case, we use a / a^2 + b^2 and -b / a^2 + b^2 as the new values required
    const denominator = atomic_add(
      atomic_multiply(this.real, this.real),
      atomic_multiply(this.imaginary, this.imaginary)
    ) as SchemeInteger | SchemeRational | SchemeReal;
    return SchemeComplex.build(
      atomic_multiply(denominator.multiplicativeInverse(), this.real) as
        | SchemeInteger
        | SchemeRational
        | SchemeReal,
      atomic_multiply(
        denominator.multiplicativeInverse(),
        this.imaginary.negate()
      ) as SchemeInteger | SchemeRational | SchemeReal
    );
  }

  add(other: SchemeComplex): SchemeNumber {
    return SchemeComplex.build(
      atomic_add(this.real, other.real) as
        | SchemeInteger
        | SchemeRational
        | SchemeReal,
      atomic_add(this.imaginary, other.imaginary) as
        | SchemeInteger
        | SchemeRational
        | SchemeReal
    );
  }

  multiply(other: SchemeComplex): SchemeNumber {
    // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
    const realPart = atomic_subtract(
      atomic_multiply(this.real, other.real),
      atomic_multiply(this.imaginary, other.imaginary)
    ) as SchemeInteger | SchemeRational | SchemeReal;
    const imaginaryPart = atomic_add(
      atomic_multiply(this.real, other.imaginary),
      atomic_multiply(this.imaginary, other.real)
    ) as SchemeInteger | SchemeRational | SchemeReal;
    return SchemeComplex.build(realPart, imaginaryPart);
  }

  getReal(): SchemeInteger | SchemeRational | SchemeReal {
    return this.real;
  }

  getImaginary(): SchemeInteger | SchemeRational | SchemeReal {
    return this.imaginary;
  }

  coerce(): number {
    throw new Error("Cannot coerce a complex number to a javascript number");
  }

  toPolar(): SchemePolar {
    // force both the real and imaginary parts to be inexact
    const real = this.real.promote(NumberType.REAL) as SchemeReal;
    const imaginary = this.imaginary.promote(NumberType.REAL) as SchemeReal;

    // schemeReals can be reasoned with using the same logic as javascript numbers
    // r = sqrt(a^2 + b^2)
    const magnitude = SchemeReal.build(
      Math.sqrt(
        real.coerce() * real.coerce() + imaginary.coerce() * imaginary.coerce()
      )
    );
    // theta = atan(b / a)
    const angle = SchemeReal.build(
      Math.atan2(imaginary.coerce(), real.coerce())
    );
    return SchemePolar.build(magnitude, angle);
  }

  toString(): string {
    return `${this.real}+${this.imaginary}i`;
  }
}

// an alternative form of the complex number.
// only used in intermediate steps, will be converted back at the end of the operation.
// current scm-slang will force any polar complex numbers to be made
// inexact, hence we opt to limit the use of polar form as much as possible.
class SchemePolar {
  readonly magnitude: SchemeReal;
  readonly angle: SchemeReal;

  private constructor(magnitude: SchemeReal, angle: SchemeReal) {
    this.magnitude = magnitude;
    this.angle = angle;
  }

  static build(magnitude: SchemeReal, angle: SchemeReal): SchemePolar {
    return new SchemePolar(magnitude, angle);
  }

  // converts the polar number back to a cartesian complex number
  toCartesian(): SchemeNumber {
    // a + bi = r * cos(theta) + r * sin(theta)i
    // a = r * cos(theta)
    // b = r * sin(theta)
    const real = SchemeReal.build(
      this.magnitude.coerce() * Math.cos(this.angle.coerce())
    );
    const imaginary = SchemeReal.build(
      this.magnitude.coerce() * Math.sin(this.angle.coerce())
    );
    return SchemeComplex.build(real, imaginary);
  }
}

export const infinity = SchemeReal.INFINITY;
export const nan = SchemeReal.NAN;

// this function is used to convert a number to a javascript number.
// it should only be limited to numbers used for indexing, integers.
export function coerce_to_number(a: SchemeNumber): number {
  return a.coerce();
}

// these functions deal with checking the type of a number.
export function is_number(a: any): boolean {
  return (
    a.numberType !== undefined &&
    Object.values(NumberType).includes(a.numberType)
  );
}

export function is_integer(a: any): boolean {
  return is_number(a) && a.numberType <= 1;
}

export function is_rational(a: any): boolean {
  return is_number(a) && a.numberType <= 2;
}

export function is_real(a: any): boolean {
  return is_number(a) && a.numberType <= 3;
}

export function is_complex(a: any): boolean {
  return is_number(a) && a.numberType <= 4;
}

export function is_exact(a: any): boolean {
  // if the number is a complex number, we need to check both the real and imaginary parts
  return is_number(a)
    ? a.numberType === 4
      ? is_exact(a.real) && is_exact(a.imaginary)
      : a.numberType <= 2
    : false;
}

export function is_inexact(a: any): boolean {
  // defined in terms of is_exact
  return is_number(a) && !is_exact(a);
}

// the functions below are used to perform operations on numbers

function simplify(a: SchemeNumber): SchemeNumber {
  switch (a.numberType) {
    case NumberType.INTEGER:
      return a;
    case NumberType.RATIONAL:
      return (a as SchemeRational).getDenominator() === 1n
        ? SchemeInteger.build(a.getNumerator())
        : a;
    case NumberType.REAL:
      return a;
    case NumberType.COMPLEX:
      // safe to cast as simplify never promotes a number
      return SchemeComplex.build(
        simplify((a as SchemeComplex).getReal()) as
          | SchemeInteger
          | SchemeRational
          | SchemeReal,
        simplify((a as SchemeComplex).getImaginary()) as
          | SchemeInteger
          | SchemeRational
          | SchemeReal
      );
  }
}

/**
 * This function takes two numbers and brings them to the same level.
 */
function equalify(
  a: SchemeNumber,
  b: SchemeNumber
): [SchemeNumber, SchemeNumber] {
  if (a.numberType > b.numberType) {
    return [a, b.promote(a.numberType)];
  } else if (a.numberType < b.numberType) {
    return [a.promote(b.numberType), b];
  }
  return [a, b];
}

export function atomic_negate(a: SchemeNumber): SchemeNumber {
  return a.negate();
}

export function atomic_inverse(a: SchemeNumber): SchemeNumber {
  return a.multiplicativeInverse();
}

export function atomic_equals(a: SchemeNumber, b: SchemeNumber): boolean {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return newA.equals(newB as any);
}

export function atomic_less_than(a: SchemeNumber, b: SchemeNumber): boolean {
  return !atomic_greater_than(a, b) && !atomic_equals(a, b);
}

export function atomic_less_than_or_equals(
  a: SchemeNumber,
  b: SchemeNumber
): boolean {
  return !atomic_greater_than(a, b);
}

export function atomic_greater_than(a: SchemeNumber, b: SchemeNumber): boolean {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return newA.greaterThan(newB as any);
}

export function atomic_greater_than_or_equals(
  a: SchemeNumber,
  b: SchemeNumber
): boolean {
  return atomic_greater_than(a, b) || atomic_equals(a, b);
}

export function atomic_add(a: SchemeNumber, b: SchemeNumber): SchemeNumber {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return simplify(newA.add(newB as any));
}

export function atomic_multiply(
  a: SchemeNumber,
  b: SchemeNumber
): SchemeNumber {
  const [newA, newB] = equalify(a, b);
  // safe to cast as we are assured they are of the same type
  return simplify(newA.multiply(newB as any));
}

export function atomic_subtract(
  a: SchemeNumber,
  b: SchemeNumber
): SchemeNumber {
  return atomic_add(a, atomic_negate(b));
}

export function atomic_divide(a: SchemeNumber, b: SchemeNumber): SchemeNumber {
  return atomic_multiply(a, atomic_inverse(b));
}

/**
 * Important constants
 */
export const PI = SchemeReal.build(Math.PI);
export const E = SchemeReal.build(Math.E);
export const SQRT2 = SchemeReal.build(Math.SQRT2);
export const LN2 = SchemeReal.build(Math.LN2);
export const LN10 = SchemeReal.build(Math.LN10);
export const LOG2E = SchemeReal.build(Math.LOG2E);
export const LOG10E = SchemeReal.build(Math.LOG10E);
export const SQRT1_2 = SchemeReal.build(Math.SQRT1_2);

// other important functions

export const numerator = (n: SchemeNumber): SchemeNumber => {
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
    const gcd = (a: number, b: number): number => {
      if (b === 0) {
        return a;
      }
      return gcd(b, a % b);
    };
    const divisor = gcd(numerator, denominator);
    numerator = numerator / divisor;
    return SchemeReal.build(numerator);
  }
  return SchemeInteger.build(
    (n.promote(NumberType.RATIONAL) as SchemeRational).getNumerator()
  );
};

export const denominator = (n: SchemeNumber): SchemeNumber => {
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
    const gcd = (a: number, b: number): number => {
      if (b === 0) {
        return a;
      }
      return gcd(b, a % b);
    };
    const divisor = gcd(numerator, denominator);
    denominator = denominator / divisor;
    return SchemeReal.build(denominator);
  }
  return SchemeInteger.build(
    (n.promote(NumberType.RATIONAL) as SchemeRational).getDenominator()
  );
};

export const exact = (n: SchemeNumber): SchemeNumber => {
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
  return SchemeComplex.build(
    exact((n as SchemeComplex).getReal()) as SchemeInteger | SchemeRational,
    exact((n as SchemeComplex).getImaginary()) as SchemeInteger | SchemeRational
  );
};

export const inexact = (n: SchemeNumber): SchemeNumber => {
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
  return SchemeComplex.build(
    inexact((n as SchemeComplex).getReal()) as SchemeReal,
    inexact((n as SchemeComplex).getImaginary()) as SchemeReal
  );
};

// for now, exponentials, square roots and the like will be treated as
// inexact functions, and will return inexact results. this allows us to
// leverage on the inbuilt javascript Math library.
// additional logic is required to handle complex numbers, which we can do with
// our polar form representation.

export const expt = (n: SchemeNumber, e: SchemeNumber): SchemeNumber => {
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
    const nPolar = (n.promote(NumberType.COMPLEX) as SchemeComplex).toPolar();
    const ePolar = (e.promote(NumberType.COMPLEX) as SchemeComplex).toPolar();

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

export const exp = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("exp: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    throw new Error("exp: expected real number");
  }
  return SchemeReal.build(Math.exp(n.coerce()));
};

export const log = (n: SchemeNumber, base: SchemeNumber = E): SchemeNumber => {
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
    const nPolar = (n.promote(NumberType.COMPLEX) as SchemeComplex).toPolar();
    const basePolar = (
      base.promote(NumberType.COMPLEX) as SchemeComplex
    ).toPolar();
    const a = nPolar.magnitude.coerce();
    const b = nPolar.angle.coerce();
    const c = basePolar.magnitude.coerce();
    const d = basePolar.angle.coerce();

    return SchemeComplex.build(
      SchemeReal.build(Math.log(a) - Math.log(c)),
      SchemeReal.build(b / d)
    );
  }
  return SchemeReal.build(Math.log(n.coerce()) / Math.log(base.coerce()));
};

export const sqrt = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("sqrt: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    const polar = (n.promote(NumberType.COMPLEX) as SchemeComplex).toPolar();
    const mag = polar.magnitude;
    const angle = polar.angle;

    // the square root of a complex number is given by
    // the square root of the magnitude and half the angle
    const newMag = sqrt(mag) as SchemeReal;
    const newAngle = SchemeReal.build(angle.coerce() / 2);

    return SchemePolar.build(newMag, newAngle).toCartesian();
  }
  let value = n.coerce();

  if (value < 0) {
    return SchemeComplex.build(
      SchemeReal.INEXACT_ZERO,
      SchemeReal.build(Math.sqrt(-value))
    );
  }

  return SchemeReal.build(Math.sqrt(n.coerce()));
};

export const sin = (n: SchemeNumber): SchemeNumber => {
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
    const complex = n.promote(NumberType.COMPLEX) as SchemeComplex;
    const real = complex.getReal();
    const imaginary = complex.getImaginary();
    const a = real.coerce();
    const b = imaginary.coerce();
    return SchemeComplex.build(
      SchemeReal.build((Math.sin(a) * (Math.exp(-b) + Math.exp(b))) / 2),
      SchemeReal.build((Math.cos(a) * (Math.exp(-b) - Math.exp(b))) / 2)
    );
  }
  return SchemeReal.build(Math.sin(n.coerce()));
};

export const cos = (n: SchemeNumber): SchemeNumber => {
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
    const complex = n.promote(NumberType.COMPLEX) as SchemeComplex;
    const real = complex.getReal();
    const imaginary = complex.getImaginary();
    const a = real.coerce();
    const b = imaginary.coerce();
    return SchemeComplex.build(
      SchemeReal.build((Math.cos(a) * (Math.exp(-b) + Math.exp(b))) / 2),
      SchemeReal.build((-Math.sin(a) * (Math.exp(-b) - Math.exp(b))) / 2)
    );
  }
  return SchemeReal.build(Math.cos(n.coerce()));
};

export const tan = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("tan: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    const sinValue = sin(n);
    const cosValue = cos(n);
    return atomic_divide(sinValue, cosValue);
  }
  return SchemeReal.build(Math.tan(n.coerce()));
};

export const asin = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("asin: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    // asin(n) = -i * ln(i * n + sqrt(1 - n^2))
    // we already have the building blocks needed to compute this
    const i = SchemeComplex.build(
      SchemeInteger.EXACT_ZERO,
      SchemeInteger.build(1)
    );
    return atomic_multiply(
      atomic_negate(i),
      log(
        atomic_add(
          atomic_multiply(i, n),
          sqrt(atomic_subtract(SchemeInteger.build(1), atomic_multiply(n, n)))
        )
      )
    );
  }
  return SchemeReal.build(Math.asin(n.coerce()));
};

export const acos = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("acos: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    // acos(n) = -i * ln(n + sqrt(n^2 - 1))
    // again, we have the building blocks needed to compute this
    const i = SchemeComplex.build(
      SchemeInteger.EXACT_ZERO,
      SchemeInteger.build(1)
    );
    return atomic_multiply(
      atomic_negate(i),
      log(
        atomic_add(
          n,
          sqrt(atomic_subtract(atomic_multiply(n, n), SchemeInteger.build(1)))
        )
      )
    );
  }
  return SchemeReal.build(Math.acos(n.coerce()));
};

export const atan = (n: SchemeNumber, m?: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("atan: expected number");
  }

  if (m !== undefined) {
    // two argument case, we construct a complex number with n + mi
    // if neither n nor m are real, it's an error
    if (!is_real(n) || !is_real(m)) {
      throw new Error("atan: expected real numbers");
    }
    return atan(
      SchemeComplex.build(
        n as SchemeInteger | SchemeRational | SchemeReal,
        m as SchemeInteger | SchemeRational | SchemeReal
      )
    );
  }

  if (!is_real(n)) {
    // complex number case
    // atan(n) = 1/2 * i * ln((1 - i * n) / (1 + i * n))
    const i = SchemeComplex.build(
      SchemeInteger.EXACT_ZERO,
      SchemeInteger.build(1)
    );
    return atomic_multiply(
      // multiply is associative so the order here doesn't matter
      atomic_multiply(SchemeRational.build(1, 2), i),
      log(
        atomic_divide(
          atomic_subtract(SchemeInteger.build(1), atomic_multiply(i, n)),
          atomic_add(SchemeInteger.build(1), atomic_multiply(i, n))
        )
      )
    );
  }
  return SchemeReal.build(Math.atan(n.coerce()));
};

export const floor = (n: SchemeNumber): SchemeNumber => {
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
    const rational = n as SchemeRational;
    const numerator = rational.getNumerator();
    const denominator = rational.getDenominator();
    return SchemeInteger.build(numerator / denominator);
  }
  return SchemeReal.build(Math.floor(n.coerce()));
};

export const ceiling = (n: SchemeNumber): SchemeNumber => {
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
    const rational = n as SchemeRational;
    const numerator = rational.getNumerator();
    const denominator = rational.getDenominator();
    return SchemeInteger.build((numerator + denominator - 1n) / denominator);
  }
  return SchemeReal.build(Math.ceil(n.coerce()));
};

export const truncate = (n: SchemeNumber): SchemeNumber => {
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
    const rational = n as SchemeRational;
    const numerator = rational.getNumerator();
    const denominator = rational.getDenominator();
    return SchemeInteger.build(numerator / denominator);
  }
  return SchemeReal.build(Math.trunc(n.coerce()));
};

export const round = (n: SchemeNumber): SchemeNumber => {
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
    const rational = n as SchemeRational;
    const numerator = rational.getNumerator();
    const denominator = rational.getDenominator();
    return SchemeInteger.build((numerator + denominator / 2n) / denominator);
  }
  return SchemeReal.build(Math.round(n.coerce()));
};

export const make$45$rectangular = (
  a: SchemeNumber,
  b: SchemeNumber
): SchemeNumber => {
  if (!is_number(a) || !is_number(b)) {
    throw new Error("make-rectangular: expected numbers");
  }
  if (!is_real(a) || !is_real(b)) {
    // complex number case
    throw new Error("make-rectangular: expected real numbers");
  }
  return SchemeComplex.build(
    a as SchemeReal | SchemeRational | SchemeInteger,
    b as SchemeReal | SchemeRational | SchemeInteger
  );
};

export const make$45$polar = (
  a: SchemeNumber,
  b: SchemeNumber
): SchemeNumber => {
  if (!is_number(a) || !is_number(b)) {
    throw new Error("make-polar: expected numbers");
  }
  if (!is_real(a) || !is_real(b)) {
    // complex number case
    throw new Error("make-polar: expected real numbers");
  }
  return SchemePolar.build(
    a.promote(NumberType.REAL) as SchemeReal,
    b.promote(NumberType.REAL) as SchemeReal
  ).toCartesian();
};

export const real$45$part = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("real-part: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    return (n as SchemeComplex).getReal();
  }
  return n;
};

export const imag$45$part = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("imag-part: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    return (n as SchemeComplex).getImaginary();
  }
  return SchemeInteger.EXACT_ZERO;
};

export const magnitude = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("magnitude: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    return (n as SchemeComplex).toPolar().magnitude;
  }
  // abs is not defined here so we should just use direct comparison
  if (atomic_less_than(n, SchemeInteger.EXACT_ZERO)) {
    return atomic_negate(n);
  }
  return n;
};

export const angle = (n: SchemeNumber): SchemeNumber => {
  if (!is_number(n)) {
    throw new Error("angle: expected number");
  }
  if (!is_real(n)) {
    // complex number case
    return (n as SchemeComplex).toPolar().angle;
  }
  if (atomic_less_than(n, SchemeInteger.EXACT_ZERO)) {
    return PI;
  }
  return SchemeInteger.EXACT_ZERO;
};

export const odd$63$ = (n: SchemeInteger): boolean => {
  if (!is_number(n)) {
    throw new Error("odd?: expected integer");
  }

  if (!is_integer(n)) {
    throw new Error("odd?: expected integer");
  }

  return n.getBigInt() % 2n === 1n;
};

export const even$63$ = (n: SchemeInteger): boolean => {
  if (!is_number(n)) {
    throw new Error("even?: expected integer");
  }

  if (!is_integer(n)) {
    throw new Error("even?: expected integer");
  }

  return n.getBigInt() % 2n === 0n;
};
