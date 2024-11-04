import{BindingSite, Srcloc, Loc, Src} from './basics';
import {Syntax, syntaxToLocation} from './locations';

function syntaxToSrcLoc(syntax: Syntax): Loc {
  return syntaxToLocation(syntax);
}

function bindingSite(id: Syntax) {
    return new BindingSite(syntaxToSrcLoc(id), id.datum);
}

function makeU(loc: Syntax) {
    return new Src(syntaxToSrcLoc(loc), 'U');
}

function makeArrow(loc: Syntax, A, B, Cs) {
    
}