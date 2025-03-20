import {schemeParse, pieDeclarationParser} from './parser/parser'
import { Context } from './utils/context';
import * as util from 'util';


export function evaluatePie(str) {
  const astList = schemeParse(str);
  for (const ast of astList) {
    console.log(util.inspect(ast, false, null, true));
    console.log(util.inspect(pieDeclarationParser.parseDeclaration(ast), 
    false, null, true));
  }
}