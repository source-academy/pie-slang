import { SourceSyntaxVisitor } from "./basics_visitors";
import * as Src from "../types/source"
import * as Core from "../types/core" 
import {Ctx, Renaming, Perhaps, go, stop} from "../types/utils"


class isType implements SourceSyntaxVisitor {
  constructor(
    Γ: Ctx, r: Renaming, input: Src.Source
  ) {
  }


}