import 'jest';

import { Parser} from '../parser/parser';
import * as util from 'util';
import { go } from '../types/utils';
import { initCtx } from '../utils/context';
import { normType, represent } from '../typechecker/represent';
import * as C from '../types/core';
import { prettyPrint } from '../unparser/pretty';

import {schemeParse} from '../parser/parser'
import {evaluatePie} from '../index'

describe("demo", () => {
  it("Pie demo", () => {
    const src = `(claim flip
(Π ((A U)
(D U))
(→ (Pair A D)
(Pair D A))))
(define flip
(λ (A D)
(λ (p)
(cons (cdr p) (car p)))))`

    
    console.log(util.inspect(evaluatePie(src), false, null, true));
  });
});