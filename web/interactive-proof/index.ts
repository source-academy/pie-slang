/**
 * Interactive Proof Mode - Public exports
 *
 * This module provides components for building proofs interactively
 * by dragging tactics onto goal nodes in a proof tree visualization.
 */

// Types
export * from './types';

// Main controller
export { InteractiveProofController } from './InteractiveProofController';

// Components
export { InteractiveProofVisualizer } from './InteractiveProofVisualizer';
export { TacticPalette } from './TacticPalette';
export { TacticDragManager } from './TacticDragManager';
export { TacticValidationService } from './TacticValidationService';

// Utilities
export { parseType, typeMatches, describeKind } from './utils/typeParser';
export * from './utils/animations';
