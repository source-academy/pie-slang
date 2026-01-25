// Manages the lifecycle of hint buttons and hint requests

import { HintButtonWidget } from './hint-button-widget.js';
import { HintDisplay } from './hint-display.js';
import { HintService } from '../services/hint-service.js';
import { TodoPosition, TacticHintPosition } from '../types/hint-types.js';

/**
 * Manages hint buttons, requests, and display
 */
export class HintManager {
  private editor: any;
  private monaco: any;
  private hintService: HintService;
  private hintDisplay: HintDisplay;
  private currentWidget: HintButtonWidget | null = null;
  private todoPositions: TodoPosition[] = [];
  private tacticPositions: TacticHintPosition[] = [];

  constructor(editor: any, monaco: any, hintService: HintService) {
    this.editor = editor;
    this.monaco = monaco;
    this.hintService = hintService;
    this.hintDisplay = new HintDisplay(editor);

    // Listen to cursor position changes
    this.editor.onDidChangeCursorPosition((e: any) => {
      this.onCursorPositionChange(e.position);
    });

    // Clear hints when content changes
    this.editor.onDidChangeModelContent(() => {
      this.hideHintButton();
      this.hintDisplay.clearHints();
    });
  }

  /**
   * Update TODO positions from worker
   */
  updateTodoPositions(todos: TodoPosition[]): void {
    console.log('[HintManager] Received TODO positions:', todos);
    this.todoPositions = todos;
    // Re-check current cursor position
    const position = this.editor.getPosition();
    if (position) {
      this.onCursorPositionChange(position);
    }
  }

  /**
   * Update tactic hint positions from worker
   */
  updateTacticPositions(tactics: TacticHintPosition[]): void {
    this.tacticPositions = tactics;
    // Re-check current cursor position
    const position = this.editor.getPosition();
    if (position) {
      this.onCursorPositionChange(position);
    }
  }

  /**
   * Handle cursor position changes
   */
  private onCursorPositionChange(position: any): void {
    // Don't clear hints when cursor moves - let them persist until code changes
    // Only clear the hint button if we move away from a hint position

    // Get word at position
    const model = this.editor.getModel();
    if (!model) return;

    const word = model.getWordAtPosition(position);

    // Check if cursor is on TODO
    // Both Monaco and Pie parser use 1-based line numbers, no conversion needed
    if (word && word.word === 'TODO') {
      console.log('[HintManager] Cursor on TODO at line:', position.lineNumber);
      const todo = this.findTodoAt(position.lineNumber);
      console.log('[HintManager] Found TODO position:', todo);
      if (todo) {
        this.showHintButton(position, 'todo', todo);
        return;
      }
    }

    // Check if cursor is in incomplete tactical proof
    // Both Monaco and Pie parser use 1-based line numbers, no conversion needed
    const tactic = this.findTacticAt(position.lineNumber);
    if (tactic && !tactic.isComplete) {
      this.showHintButton(position, 'tactic', tactic);
      return;
    }

    // No hint opportunity at this position - hide button but keep hints visible
    this.hideHintButton();
  }

  /**
   * Find TODO position at line (1-based line number)
   */
  private findTodoAt(line: number): TodoPosition | null {
    return this.todoPositions.find(t => t.startLine === line) || null;
  }

  /**
   * Find tactic hint position at line (1-based line number)
   * Returns the MOST SPECIFIC (last/deepest) tactic that contains this line
   */
  private findTacticAt(line: number): TacticHintPosition | null {
    // Find all tactics that contain this line
    const matchingTactics = this.tacticPositions.filter(t =>
      line >= t.startLine && line <= t.endLine
    );

    if (matchingTactics.length === 0) {
      return null;
    }

    // Return the last one (most specific/deepest in the proof tree)
    // Later tactics in the array are deeper in the proof structure
    return matchingTactics[matchingTactics.length - 1];
  }

  /**
   * Show hint button at position
   */
  private showHintButton(
    position: any,
    type: 'todo' | 'tactic',
    data: TodoPosition | TacticHintPosition
  ): void {
    // Remove existing widget if any
    this.hideHintButton();

    // Create new widget
    this.currentWidget = new HintButtonWidget(
      this.monaco,
      position,
      () => this.requestHint(type, position, data)
    );

    // Add widget to editor
    this.editor.addContentWidget(this.currentWidget);
  }

  /**
   * Hide hint button
   */
  private hideHintButton(): void {
    if (this.currentWidget) {
      this.editor.removeContentWidget(this.currentWidget);
      this.currentWidget = null;
    }
  }

  /**
   * Request a hint from the AI
   */
  private async requestHint(
    type: 'todo' | 'tactic',
    position: any,
    data: TodoPosition | TacticHintPosition
  ): Promise<void> {
    const line = position.lineNumber;
    console.log('[HintManager] Requesting hint at line:', line, 'type:', type);

    try {
      // Show loading state
      console.log('[HintManager] Setting loading state');
      if (this.currentWidget) {
        this.currentWidget.setLoading();
      }
      this.hintDisplay.showLoading(line);

      // Request hint based on type
      let hint: string;
      if (type === 'todo') {
        const todoData = data as TodoPosition;
        console.log('[HintManager] Requesting TODO hint with data:', {
          expectedType: todoData.expectedType,
          availableDefinitions: todoData.availableDefinitions
        });
        hint = await this.hintService.requestTodoHint(
          todoData.expectedType,
          [], // Context will be added by worker in future
          todoData.availableDefinitions
        );
      } else {
        const tacticData = data as TacticHintPosition;
        console.log('[HintManager] Requesting tactic hint with data:', {
          goalType: tacticData.goalType,
          hypotheses: tacticData.hypotheses,
          availableDefinitions: tacticData.availableDefinitions
        });
        hint = await this.hintService.requestTacticHint(
          tacticData.goalType,
          tacticData.hypotheses,
          tacticData.availableDefinitions
        );
      }

      console.log('[HintManager] Received hint:', hint);

      // Display hint
      console.log('[HintManager] Displaying hint at line:', line);
      this.hintDisplay.showHint(line, hint);

      // Reset button
      console.log('[HintManager] Resetting button');
      if (this.currentWidget) {
        this.currentWidget.reset();
      }
      console.log('[HintManager] Hint request completed successfully');
    } catch (error: any) {
      console.error('[HintManager] Hint request failed with error:', error);

      // Show error
      this.hintDisplay.showError(line, error.message || 'Failed to generate hint');

      // Reset button
      if (this.currentWidget) {
        this.currentWidget.reset();
      }

      console.error('[HintManager] Full error details:', error);
    }
  }

  /**
   * Clear all hints and buttons
   */
  clear(): void {
    this.hideHintButton();
    this.hintDisplay.clearHints();
    this.todoPositions = [];
    this.tacticPositions = [];
  }
}
