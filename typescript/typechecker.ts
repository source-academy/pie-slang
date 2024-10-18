import {
    Loc,
    Core,
    SerializableCtx,
} from './basics'

type What = 'definition'
| ['binding-site', Core]
| ['is-type', Core]
| ['has-type', Core]
| ['TODO', SerializableCtx, Core];

type PieInfoHook = (where: Loc, what: What) => void;

function SendPieInfo(where: Loc, what: What) {
    
}