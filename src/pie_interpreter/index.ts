import { initialise } from "conductor/src/conductor/runner/util/";
import { PieEvaluator } from './PieEvaluator';

const { runnerPlugin, conduit } = initialise(PieEvaluator);