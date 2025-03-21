import { BasicEvaluator } from "../../conductor/src/conductor/runner";
import { IRunnerPlugin } from "../../conductor/src/conductor/runner/types";
import { Parser } from "./parser/parser";
import { represent } from "./typechecker/represent";
import { go } from "./types/utils";
import { initCtx } from "./utils/context";
import * as C from './types/core';

export function parsePie(src: string) {
  return Parser.parsePie(src);
}

export class PieEvaluator extends BasicEvaluator {

  constructor(conductor: IRunnerPlugin) {
    super(conductor);
  }

  async evaluateChunk(chunk: string): Promise<void> {
    try {
      const src = parsePie(chunk);
      const res = (represent(initCtx, src) as go<C.Core>).result.prettyPrint();
      this.conductor.sendOutput(`FUCK ${res}`);
    } catch (error) {
      // Handle errors and send them to the REPL
      if (error instanceof Error) {
        this.conductor.sendOutput(`Error: ${error.message}`);
      } else {
        this.conductor.sendOutput(`Error: ${String(error)}`);
      }
    }
  }
}