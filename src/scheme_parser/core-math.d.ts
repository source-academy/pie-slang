export type SchemeNumber = SchemeInteger | SchemeRational | SchemeReal | SchemeComplex;
export declare enum NumberType {
    INTEGER = 1,
    RATIONAL = 2,
    REAL = 3,
    COMPLEX = 4
}
export declare abstract class Match {
    result: boolean;
    constructor(result: boolean);
    abstract build(): SchemeNumber;
}
declare class IntegerMatch extends Match {
    result: boolean;
    value?: string | undefined;
    constructor(result: boolean, value?: string | undefined);
    isSigned(): boolean;
    build(): SchemeInteger;
}
declare class RationalMatch extends Match {
    result: boolean;
    numerator?: string | undefined;
    denominator?: string | undefined;
    constructor(result: boolean, numerator?: string | undefined, denominator?: string | undefined);
    build(): SchemeInteger | SchemeRational;
}
declare class RealMatch extends Match {
    result: boolean;
    integer?: string | undefined;
    decimal?: string | undefined;
    exponent?: Match | undefined;
    constructor(result: boolean, integer?: string | undefined, decimal?: string | undefined, exponent?: Match | undefined);
    build(): SchemeReal;
}
declare class ComplexMatch extends Match {
    result: boolean;
    real?: Match | undefined;
    sign?: string | undefined;
    imaginary?: Match | undefined;
    constructor(result: boolean, real?: Match | undefined, sign?: string | undefined, imaginary?: Match | undefined);
    build(): SchemeNumber;
}
export declare function isInteger(value: string): IntegerMatch;
export declare function isRational(value: string): RationalMatch;
export declare function isReal(value: string): RealMatch;
export declare function isComplex(value: string): ComplexMatch;
export declare function stringIsSchemeNumber(value: string): boolean;
export declare let make_number: (value: string) => SchemeNumber;
export declare class SchemeInteger {
    readonly numberType = NumberType.INTEGER;
    private readonly value;
    static readonly EXACT_ZERO: SchemeInteger;
    private constructor();
    static build(value: number | string | bigint, _force?: boolean): SchemeInteger;
    promote(nType: NumberType): SchemeNumber;
    equals(other: any): boolean;
    greaterThan(other: SchemeInteger): boolean;
    negate(): SchemeInteger;
    multiplicativeInverse(): SchemeInteger | SchemeRational;
    add(other: SchemeInteger): SchemeInteger;
    multiply(other: SchemeInteger): SchemeInteger;
    getBigInt(): bigint;
    coerce(): number;
    toString(): string;
}
export declare class SchemeRational {
    readonly numberType = NumberType.RATIONAL;
    private readonly numerator;
    private readonly denominator;
    private constructor();
    static build(numerator: number | string | bigint, denominator: number | string | bigint, force?: boolean): SchemeRational | SchemeInteger;
    private static simplify;
    getNumerator(): bigint;
    getDenominator(): bigint;
    promote(nType: NumberType): SchemeNumber;
    equals(other: any): boolean;
    greaterThan(other: SchemeRational): boolean;
    negate(): SchemeRational;
    multiplicativeInverse(): SchemeInteger | SchemeRational;
    add(other: SchemeRational): SchemeInteger | SchemeRational;
    multiply(other: SchemeRational): SchemeInteger | SchemeRational;
    coerce(): number;
    toString(): string;
}
export declare class SchemeReal {
    readonly numberType = NumberType.REAL;
    private readonly value;
    static INEXACT_ZERO: SchemeReal;
    static INEXACT_NEG_ZERO: SchemeReal;
    static INFINITY: SchemeReal;
    static NEG_INFINITY: SchemeReal;
    static NAN: SchemeReal;
    static build(value: number, _force?: boolean): SchemeReal;
    private constructor();
    promote(nType: NumberType): SchemeNumber;
    equals(other: any): boolean;
    greaterThan(other: SchemeReal): boolean;
    negate(): SchemeReal;
    multiplicativeInverse(): SchemeReal;
    add(other: SchemeReal): SchemeReal;
    multiply(other: SchemeReal): SchemeReal;
    coerce(): number;
    toString(): string;
}
export declare class SchemeComplex {
    readonly numberType = NumberType.COMPLEX;
    private readonly real;
    private readonly imaginary;
    static build(real: SchemeReal | SchemeRational | SchemeInteger, imaginary: SchemeReal | SchemeRational | SchemeInteger, force?: boolean): SchemeNumber;
    private constructor();
    private static simplify;
    promote(nType: NumberType): SchemeNumber;
    negate(): SchemeNumber;
    equals(other: SchemeComplex): boolean;
    greaterThan(other: SchemeComplex): boolean;
    multiplicativeInverse(): SchemeNumber;
    add(other: SchemeComplex): SchemeNumber;
    multiply(other: SchemeComplex): SchemeNumber;
    getReal(): SchemeInteger | SchemeRational | SchemeReal;
    getImaginary(): SchemeInteger | SchemeRational | SchemeReal;
    coerce(): number;
    toPolar(): SchemePolar;
    toString(): string;
}
declare class SchemePolar {
    readonly magnitude: SchemeReal;
    readonly angle: SchemeReal;
    private constructor();
    static build(magnitude: SchemeReal, angle: SchemeReal): SchemePolar;
    toCartesian(): SchemeNumber;
}
export declare const infinity: SchemeReal;
export declare const nan: SchemeReal;
export declare function coerce_to_number(a: SchemeNumber): number;
export declare function is_number(a: any): boolean;
export declare function is_integer(a: any): boolean;
export declare function is_rational(a: any): boolean;
export declare function is_real(a: any): boolean;
export declare function is_complex(a: any): boolean;
export declare function is_exact(a: any): boolean;
export declare function is_inexact(a: any): boolean;
export declare function atomic_negate(a: SchemeNumber): SchemeNumber;
export declare function atomic_inverse(a: SchemeNumber): SchemeNumber;
export declare function atomic_equals(a: SchemeNumber, b: SchemeNumber): boolean;
export declare function atomic_less_than(a: SchemeNumber, b: SchemeNumber): boolean;
export declare function atomic_less_than_or_equals(a: SchemeNumber, b: SchemeNumber): boolean;
export declare function atomic_greater_than(a: SchemeNumber, b: SchemeNumber): boolean;
export declare function atomic_greater_than_or_equals(a: SchemeNumber, b: SchemeNumber): boolean;
export declare function atomic_add(a: SchemeNumber, b: SchemeNumber): SchemeNumber;
export declare function atomic_multiply(a: SchemeNumber, b: SchemeNumber): SchemeNumber;
export declare function atomic_subtract(a: SchemeNumber, b: SchemeNumber): SchemeNumber;
export declare function atomic_divide(a: SchemeNumber, b: SchemeNumber): SchemeNumber;
/**
 * Important constants
 */
export declare const PI: SchemeReal;
export declare const E: SchemeReal;
export declare const SQRT2: SchemeReal;
export declare const LN2: SchemeReal;
export declare const LN10: SchemeReal;
export declare const LOG2E: SchemeReal;
export declare const LOG10E: SchemeReal;
export declare const SQRT1_2: SchemeReal;
export declare const numerator: (n: SchemeNumber) => SchemeNumber;
export declare const denominator: (n: SchemeNumber) => SchemeNumber;
export declare const exact: (n: SchemeNumber) => SchemeNumber;
export declare const inexact: (n: SchemeNumber) => SchemeNumber;
export declare const expt: (n: SchemeNumber, e: SchemeNumber) => SchemeNumber;
export declare const exp: (n: SchemeNumber) => SchemeNumber;
export declare const log: (n: SchemeNumber, base?: SchemeNumber) => SchemeNumber;
export declare const sqrt: (n: SchemeNumber) => SchemeNumber;
export declare const sin: (n: SchemeNumber) => SchemeNumber;
export declare const cos: (n: SchemeNumber) => SchemeNumber;
export declare const tan: (n: SchemeNumber) => SchemeNumber;
export declare const asin: (n: SchemeNumber) => SchemeNumber;
export declare const acos: (n: SchemeNumber) => SchemeNumber;
export declare const atan: (n: SchemeNumber, m?: SchemeNumber) => SchemeNumber;
export declare const floor: (n: SchemeNumber) => SchemeNumber;
export declare const ceiling: (n: SchemeNumber) => SchemeNumber;
export declare const truncate: (n: SchemeNumber) => SchemeNumber;
export declare const round: (n: SchemeNumber) => SchemeNumber;
export declare const make$45$rectangular: (a: SchemeNumber, b: SchemeNumber) => SchemeNumber;
export declare const make$45$polar: (a: SchemeNumber, b: SchemeNumber) => SchemeNumber;
export declare const real$45$part: (n: SchemeNumber) => SchemeNumber;
export declare const imag$45$part: (n: SchemeNumber) => SchemeNumber;
export declare const magnitude: (n: SchemeNumber) => SchemeNumber;
export declare const angle: (n: SchemeNumber) => SchemeNumber;
export declare const odd$63$: (n: SchemeInteger) => boolean;
export declare const even$63$: (n: SchemeInteger) => boolean;
export {};
//# sourceMappingURL=core-math.d.ts.map