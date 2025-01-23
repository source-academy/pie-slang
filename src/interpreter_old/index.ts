import {syntaxParse, parsePieDecl, Element} from './parser';
import {addClaim, addDef} from './typechecker';
import {Location} from './locations';
import {match, P} from 'ts-pattern'
import {initCtx, Src, go, stop, Loc} from './basics';

export function interpretPieDecl(pieDecl: string): void {

  const ast = parsePieDecl(syntaxParse(pieDecl)[0]);

  match(ast)
  .with(['claim', P._, P._, P._ ], ([_, f, floc, ty]) => {
    const temp = addClaim(initCtx, f as Symbol, floc as Loc, ty as Src);
    if (temp instanceof go) {
        return [new loop(), ]
    }
    
  })
  .with(['define', P._, P._, P._ ], ([_, f, floc, e]) => {
    const temp = addDef(initCtx, f as Symbol, floc as Loc, e as Src );
    if (temp instanceof go) {
        return [new loop(), temp.result]
    } else if (temp instanceof stop) {
      console.log(temp);
  })
  
}
