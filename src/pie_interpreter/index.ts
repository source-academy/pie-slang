import {schemeParse, pieDeclarationParser} from './parser/parser'
import { Context } from './utils/context';
import * as util from 'util';
import { initialise } from "../../conductor/src/conductor/runner/util/";
import { PieEvaluator } from './main';


const { runnerPlugin, conduit } = initialise(PieEvaluator);