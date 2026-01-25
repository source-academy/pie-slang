import * as C from '../types/core';
import { Context } from '../utils/context';
import { Source } from '../types/source';
import { Perhaps } from '../types/utils';
import { Location } from '../utils/locations';
/**
 * Represent the expression in the context.
 */
export declare function represent(ctx: Context, expr: Source): Perhaps<C.Core>;
export declare function normType(ctx: Context, src: Source): Perhaps<C.Core>;
export declare function checkSame(ctx: Context, where: Location, t: Source, a: Source, b: Source): Perhaps<undefined>;
//# sourceMappingURL=represent.d.ts.map