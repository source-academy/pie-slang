/**
 * Manages drag-and-drop interactions for tactics.
 * Coordinates between the tactic palette and proof tree drop zones.
 */

import { DragState, TacticBlockData, SerializableGoal, GoalDragEvent, TACTIC_METADATA } from './types';
import { TacticValidationService } from './TacticValidationService';
import { createDragGhost, highlightDropZone, clearDropZoneHighlight } from './utils/animations';

export interface DropZoneInfo {
  goalId: string;
  element: SVGElement;
  bounds: DOMRect;
}

export interface TacticDragManagerConfig {
  validationService: TacticValidationService;
  onDragStart?: (tactic: TacticBlockData) => void;
  onDragEnd?: () => void;
  onDrop?: (goalId: string, tactic: TacticBlockData) => void;
  onDragOver?: (event: GoalDragEvent) => void;
}

export class TacticDragManager {
  private state: DragState = {
    isDragging: false,
    tacticData: null,
    sourceElement: null,
    ghostElement: null,
    validDropTargets: []
  };

  private dropZones: Map<string, DropZoneInfo> = new Map();
  private validationService: TacticValidationService;
  private goals: Map<string, SerializableGoal> = new Map();
  private config: TacticDragManagerConfig;

  // Bound event handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(config: TacticDragManagerConfig) {
    this.config = config;
    this.validationService = config.validationService;

    // Bind event handlers
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Register a drop zone for a goal node.
   */
  registerDropZone(goalId: string, element: SVGElement): void {
    const bounds = element.getBoundingClientRect();
    this.dropZones.set(goalId, { goalId, element, bounds });

    // Add event listeners
    element.addEventListener('mouseenter', () => this.handleDropZoneEnter(goalId));
    element.addEventListener('mouseleave', () => this.handleDropZoneLeave(goalId));
  }

  /**
   * Unregister all drop zones.
   */
  clearDropZones(): void {
    this.dropZones.clear();
  }

  /**
   * Update goal data for validation.
   */
  setGoals(goals: Map<string, SerializableGoal>): void {
    this.goals = goals;
  }

  /**
   * Start dragging a tactic.
   */
  startDrag(tactic: TacticBlockData, sourceElement: HTMLElement, event: MouseEvent): void {
    if (this.state.isDragging) return;

    // Create ghost element
    const metadata = TACTIC_METADATA[tactic.type];
    const ghost = createDragGhost(metadata.displayName, metadata.color);
    document.body.appendChild(ghost);

    // Position ghost at cursor
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;

    // Calculate valid drop targets
    const validTargets: string[] = [];
    for (const [goalId, goal] of this.goals) {
      // For now, mark all incomplete goals as potentially valid
      // Full validation happens on drop
      if (!goal.isComplete) {
        validTargets.push(goalId);
      }
    }

    this.state = {
      isDragging: true,
      tacticData: tactic,
      sourceElement,
      ghostElement: ghost,
      validDropTargets: validTargets
    };

    // Add global listeners
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('keydown', this.boundKeyDown);

    // Highlight valid drop zones
    this.updateDropZoneHighlights();

    // Notify listener
    this.config.onDragStart?.(tactic);
  }

  /**
   * Cancel the current drag operation.
   */
  cancelDrag(): void {
    if (!this.state.isDragging) return;

    this.cleanup();
    this.config.onDragEnd?.();
  }

  /**
   * Check if currently dragging.
   */
  isDragging(): boolean {
    return this.state.isDragging;
  }

  /**
   * Get the current drag state.
   */
  getDragState(): Readonly<DragState> {
    return this.state;
  }

  /**
   * Update drop zone bounds (call after layout changes).
   */
  updateDropZoneBounds(): void {
    for (const [goalId, info] of this.dropZones) {
      info.bounds = info.element.getBoundingClientRect();
    }
  }

  // === Private methods ===

  private handleMouseMove(event: MouseEvent): void {
    if (!this.state.isDragging || !this.state.ghostElement) return;

    // Update ghost position
    this.state.ghostElement.style.left = `${event.clientX}px`;
    this.state.ghostElement.style.top = `${event.clientY}px`;

    // Check which drop zone we're over
    const dropZone = this.findDropZoneAt(event.clientX, event.clientY);
    if (dropZone) {
      this.handleDropZoneEnter(dropZone.goalId);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.state.isDragging || !this.state.tacticData) return;

    // Find drop zone at cursor position
    const dropZone = this.findDropZoneAt(event.clientX, event.clientY);

    if (dropZone && this.state.validDropTargets.includes(dropZone.goalId)) {
      // Validate and trigger drop
      const goal = this.goals.get(dropZone.goalId);
      if (goal) {
        const validation = this.validationService.validateTactic(
          this.state.tacticData,
          goal
        );

        if (validation.valid) {
          this.config.onDrop?.(dropZone.goalId, this.state.tacticData);
        } else {
          // Show error feedback
          console.warn('Invalid tactic drop:', validation.reason);
        }
      }
    }

    this.cleanup();
    this.config.onDragEnd?.();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancelDrag();
    }
  }

  private handleDropZoneEnter(goalId: string): void {
    if (!this.state.isDragging || !this.state.tacticData) return;

    const goal = this.goals.get(goalId);
    if (!goal) return;

    // Validate
    const validation = this.validationService.validateTactic(
      this.state.tacticData,
      goal
    );

    // Update highlighting
    const dropZone = this.dropZones.get(goalId);
    if (dropZone) {
      highlightDropZone(dropZone.element, validation.valid);
    }

    // Notify listener
    this.config.onDragOver?.({
      goalId,
      isValid: validation.valid,
      tacticData: this.state.tacticData
    });
  }

  private handleDropZoneLeave(goalId: string): void {
    if (!this.state.isDragging) return;

    const dropZone = this.dropZones.get(goalId);
    if (dropZone) {
      clearDropZoneHighlight(dropZone.element);
    }
  }

  private findDropZoneAt(x: number, y: number): DropZoneInfo | null {
    for (const [, info] of this.dropZones) {
      const { bounds } = info;
      if (
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      ) {
        return info;
      }
    }
    return null;
  }

  private updateDropZoneHighlights(): void {
    for (const [goalId, info] of this.dropZones) {
      if (this.state.validDropTargets.includes(goalId)) {
        info.element.classList.add('drop-zone--active');
      } else {
        info.element.classList.remove('drop-zone--active');
      }
    }
  }

  private cleanup(): void {
    // Remove ghost
    if (this.state.ghostElement) {
      this.state.ghostElement.remove();
    }

    // Clear drop zone highlights
    for (const [, info] of this.dropZones) {
      clearDropZoneHighlight(info.element);
      info.element.classList.remove('drop-zone--active');
    }

    // Remove global listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('keydown', this.boundKeyDown);

    // Reset state
    this.state = {
      isDragging: false,
      tacticData: null,
      sourceElement: null,
      ghostElement: null,
      validDropTargets: []
    };
  }

  /**
   * Cleanup resources.
   */
  dispose(): void {
    this.cancelDrag();
    this.clearDropZones();
    this.goals.clear();
  }
}
