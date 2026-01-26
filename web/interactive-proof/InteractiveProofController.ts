/**
 * Main controller for Interactive Proof Mode.
 * Coordinates between the proof tree visualizer, tactic palette,
 * drag manager, and worker communication.
 */

import {
  InteractiveProofState,
  InteractiveProofConfig,
  TacticBlockData,
  TacticHistoryEntry,
  SerializableGoal,
  SerializableGoalNode,
  ProofTreeData
} from './types';
import { TacticValidationService } from './TacticValidationService';
import { TacticDragManager } from './TacticDragManager';
import { TacticPalette } from './TacticPalette';
import { InteractiveProofVisualizer } from './InteractiveProofVisualizer';
import { animateSuccess, animateError, animateProofComplete } from './utils/animations';

export class InteractiveProofController {
  private state: InteractiveProofState;
  private config: InteractiveProofConfig;

  // Components
  private validationService: TacticValidationService;
  private dragManager: TacticDragManager;
  private tacticPalette: TacticPalette | null = null;
  private proofVisualizer: InteractiveProofVisualizer | null = null;

  // Worker communication
  private worker: Worker | null = null;
  private pendingCallbacks: Map<string, (result: any) => void> = new Map();
  private callbackId = 0;

  // Source context for proof
  private sourceContext: string = '';

  constructor(config: InteractiveProofConfig) {
    this.config = config;

    // Initialize state
    this.state = {
      proofTree: null,
      selectedGoalId: null,
      history: [],
      historyPosition: 0,
      isComplete: false,
      claimName: null
    };

    // Initialize validation service
    this.validationService = new TacticValidationService();

    // Initialize drag manager
    this.dragManager = new TacticDragManager({
      validationService: this.validationService,
      onDragStart: (tactic) => this.handleDragStart(tactic),
      onDragEnd: () => this.handleDragEnd(),
      onDrop: (goalId, tactic) => this.handleDrop(goalId, tactic),
      onDragOver: (event) => this.handleDragOver(event)
    });
  }

  /**
   * Initialize the interactive proof mode components.
   */
  initialize(worker: Worker): void {
    this.worker = worker;

    // Set up worker message handler
    worker.addEventListener('message', (event) => this.handleWorkerMessage(event));

    // Initialize tactic palette
    this.tacticPalette = new TacticPalette({
      container: this.config.paletteContainer,
      validationService: this.validationService,
      dragManager: this.dragManager,
      onTacticSelect: (tactic, goalId) => this.handleTacticSelect(tactic, goalId)
    });

    // Initialize proof visualizer
    this.proofVisualizer = new InteractiveProofVisualizer({
      container: this.config.treeContainer,
      dragManager: this.dragManager,
      onGoalSelect: (goal) => this.handleGoalSelect(goal),
      onGoalDoubleClick: (goal) => this.handleGoalDoubleClick(goal)
    });
  }

  /**
   * Start a new interactive proof session.
   */
  startProof(claimName: string, sourceContext: string): void {
    this.sourceContext = sourceContext;
    this.state.claimName = claimName;

    // Request proof tree from worker
    this.sendWorkerMessage('startInteractiveProof', {
      claimName,
      sourceContext
    });
  }

  /**
   * Apply a tactic to the currently selected goal.
   */
  applyTacticToSelectedGoal(tactic: TacticBlockData): void {
    if (!this.state.selectedGoalId) {
      this.config.onError?.('No goal selected');
      return;
    }

    this.applyTacticToGoal(this.state.selectedGoalId, tactic);
  }

  /**
   * Apply a tactic to a specific goal.
   */
  applyTacticToGoal(goalId: string, tactic: TacticBlockData): void {
    console.log('[Controller] applyTacticToGoal', { goalId, tactic });
    const goal = this.findGoal(goalId);
    if (!goal) {
      console.log('[Controller] Goal not found:', goalId);
      this.config.onError?.(`Goal ${goalId} not found`);
      return;
    }

    // Client-side validation
    const validation = this.validationService.validateTactic(tactic, goal);
    if (!validation.valid) {
      console.log('[Controller] Validation failed:', validation.reason);
      this.config.onError?.(validation.reason || 'Invalid tactic');
      this.showErrorFeedback(goalId);
      return;
    }

    // Save state for undo
    if (this.state.proofTree) {
      this.state.history = this.state.history.slice(0, this.state.historyPosition);
      this.state.history.push({
        goalId,
        tactic,
        previousState: JSON.parse(JSON.stringify(this.state.proofTree))
      });
      this.state.historyPosition = this.state.history.length;
    }

    // Generate the tactic string and insert into source code
    const tacticStr = this.formatTactic(tactic);
    console.log('[Controller] Formatted tactic:', tacticStr);
    console.log('[Controller] Source context length:', this.sourceContext.length);
    const modifiedSource = this.insertTacticIntoSource(tacticStr);
    console.log('[Controller] Modified source:', modifiedSource ? `${modifiedSource.length} chars` : 'null');

    if (modifiedSource && this.config.onModifySource) {
      console.log('[Controller] Calling onModifySource');
      // Update the source code - this will trigger re-analysis
      this.config.onModifySource(modifiedSource);
      this.sourceContext = modifiedSource;

      // Show success feedback
      this.showSuccessFeedback(goalId);
    } else {
      console.log('[Controller] Failed to insert tactic', { modifiedSource: !!modifiedSource, hasCallback: !!this.config.onModifySource });
      this.config.onError?.('Failed to insert tactic into source');
      this.showErrorFeedback(goalId);
    }
  }

  /**
   * Format a tactic block data into a Pie tactic string.
   */
  private formatTactic(tactic: TacticBlockData): string {
    if (tactic.name) {
      return `(${tactic.type} ${tactic.name})`;
    } else if (tactic.expression) {
      return `(${tactic.type} ${tactic.expression})`;
    } else {
      return `(${tactic.type})`;
    }
  }

  /**
   * Insert a tactic string into the source code's define-tactically block.
   * Inserts just before the closing )) of the define-tactically block.
   */
  private insertTacticIntoSource(tacticStr: string): string | null {
    const source = this.sourceContext;

    // Find the define-tactically block
    const dtMatch = source.match(/\(define-tactically\s+(\w+)/);
    if (!dtMatch || dtMatch.index === undefined) {
      return null;
    }

    // Parse through the source to find the end of the define-tactically block
    // We need to track parentheses depth, but skip comments and strings
    let depth = 0;
    let i = dtMatch.index;
    let tacticListEndPos = -1;
    let inComment = false;

    while (i < source.length) {
      const char = source[i];

      // Check for comment start
      if (char === ';' && !inComment) {
        inComment = true;
        i++;
        continue;
      }

      // Check for comment end (newline)
      if (char === '\n' && inComment) {
        inComment = false;
        i++;
        continue;
      }

      // Skip if in comment
      if (inComment) {
        i++;
        continue;
      }

      // Track parentheses
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 1) {
          // This is the ) that closes the tactic list (one level inside define-tactically)
          tacticListEndPos = i;
        }
        if (depth === 0) {
          // This is the ) that closes define-tactically
          break;
        }
      }
      i++;
    }

    if (tacticListEndPos === -1) {
      console.log('[Controller] Could not find tactic list end');
      return null;
    }

    // Find indentation by looking at existing tactics
    // Look for the last line that has content before tacticListEndPos
    let lineStart = source.lastIndexOf('\n', tacticListEndPos - 1);
    if (lineStart === -1) lineStart = 0;
    else lineStart++;

    // Get indent from the line containing the closing )
    const closingLine = source.substring(lineStart, tacticListEndPos);
    const indentMatch = closingLine.match(/^(\s*)/);
    // Use the same indent as existing tactics (4 spaces typically)
    const indent = indentMatch && indentMatch[1].length > 0 ? indentMatch[1] : '    ';

    // Insert the tactic just before the closing ) of the tactic list
    const insertion = `${tacticStr}\n${indent}`;

    const before = source.substring(0, tacticListEndPos);
    const after = source.substring(tacticListEndPos);

    return before + insertion + after;
  }

  /**
   * Undo the last tactic application.
   */
  undo(): void {
    if (this.state.historyPosition <= 0) return;

    this.state.historyPosition--;
    const entry = this.state.history[this.state.historyPosition];

    // Restore previous state
    this.updateProofTree(entry.previousState);
    this.config.onStateChange?.(this.state);
  }

  /**
   * Redo the last undone tactic.
   */
  redo(): void {
    if (this.state.historyPosition >= this.state.history.length) return;

    const entry = this.state.history[this.state.historyPosition];
    this.state.historyPosition++;

    // Re-apply the tactic
    this.sendWorkerMessage('applyTactic', {
      goalId: entry.goalId,
      tactic: entry.tactic,
      sourceContext: this.sourceContext
    });
  }

  /**
   * Get the current proof state.
   */
  getState(): Readonly<InteractiveProofState> {
    return this.state;
  }

  /**
   * Generate Pie code for the current proof.
   */
  generateCode(): string {
    if (!this.state.proofTree || !this.state.claimName) return '';

    const tactics = this.collectTacticsFromTree(this.state.proofTree.root);
    const tacticCode = tactics.map(t => `  ${this.tacticToCode(t)}`).join('\n');

    return `(define-tactically ${this.state.claimName}\n  (\n${tacticCode}\n  ))`;
  }

  /**
   * Update the source context (e.g., when editor content changes).
   */
  updateSourceContext(source: string): void {
    this.sourceContext = source;
  }

  /**
   * Set proof tree data directly (e.g., from diagnostics worker).
   */
  setProofTree(proofTree: ProofTreeData | null): void {
    this.updateProofTree(proofTree);
  }

  /**
   * Cleanup resources.
   */
  dispose(): void {
    this.tacticPalette?.dispose();
    this.proofVisualizer?.dispose();
    this.dragManager.dispose();
    this.pendingCallbacks.clear();
    this.worker = null;
  }

  // === Private methods ===

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, payload, callbackId } = event.data;

    // Handle callback responses
    if (callbackId && this.pendingCallbacks.has(callbackId)) {
      const callback = this.pendingCallbacks.get(callbackId)!;
      this.pendingCallbacks.delete(callbackId);
      callback(payload);
      return;
    }

    // Handle broadcast messages
    switch (type) {
      case 'proofStarted':
        this.handleProofStarted(payload);
        break;
      case 'tacticResult':
        this.handleTacticResult(payload);
        break;
      case 'proofComplete':
        this.handleProofComplete(payload);
        break;
      case 'error':
        this.handleError(payload);
        break;
    }
  }

  private handleProofStarted(payload: any): void {
    this.updateProofTree(payload.proofTree);

    // Select the current goal
    if (payload.proofTree?.currentGoalId) {
      this.selectGoal(payload.proofTree.currentGoalId);
    }

    this.config.onStateChange?.(this.state);
  }

  private handleTacticResult(payload: any): void {
    if (payload.success) {
      this.updateProofTree(payload.proofTree);

      // Show success feedback
      if (this.state.selectedGoalId) {
        this.showSuccessFeedback(this.state.selectedGoalId);
      }

      // Select the new current goal
      if (payload.proofTree?.currentGoalId) {
        this.selectGoal(payload.proofTree.currentGoalId);
      } else if (payload.proofTree?.isComplete) {
        // Proof complete!
        this.handleProofComplete(payload);
      }
    } else {
      // Revert history
      if (this.state.historyPosition > 0) {
        this.state.historyPosition--;
        this.state.history.pop();
      }

      this.config.onError?.(payload.message || 'Tactic failed');
      if (this.state.selectedGoalId) {
        this.showErrorFeedback(this.state.selectedGoalId);
      }
    }

    this.config.onStateChange?.(this.state);
  }

  private handleProofComplete(payload: any): void {
    this.state.isComplete = true;

    // Generate code
    const code = payload.generatedCode || this.generateCode();

    // Show celebration
    if (this.config.treeContainer) {
      animateProofComplete(this.config.treeContainer);
    }

    this.config.onProofComplete?.(code);
    this.config.onStateChange?.(this.state);
  }

  private handleError(payload: any): void {
    this.config.onError?.(payload.message || 'An error occurred');
  }

  private handleGoalSelect(goal: SerializableGoal): void {
    this.selectGoal(goal.id);
  }

  private handleGoalDoubleClick(goal: SerializableGoal): void {
    // Show tactic suggestions in a tooltip or modal
    const suggestions = this.validationService.getSuggestedTactics(goal);
    console.log('Suggested tactics for', goal.id, ':', suggestions);
  }

  private handleTacticSelect(tactic: TacticBlockData, goalId?: string): void {
    console.log('[Controller] handleTacticSelect called', { tactic, goalId, selectedGoalId: this.state.selectedGoalId });
    // If goalId is provided (from modal), use it; otherwise use currently selected goal
    const targetGoalId = goalId || this.state.selectedGoalId;
    if (!targetGoalId) {
      console.log('[Controller] No target goal ID');
      this.config.onError?.('No goal selected');
      return;
    }
    console.log('[Controller] Applying tactic to goal:', targetGoalId);
    this.applyTacticToGoal(targetGoalId, tactic);
  }

  private handleDragStart(tactic: TacticBlockData): void {
    // Update goal map for validation
    if (this.state.proofTree) {
      const goals = new Map<string, SerializableGoal>();
      this.collectGoals(this.state.proofTree.root, goals);
      this.dragManager.setGoals(goals);
    }
  }

  private handleDragEnd(): void {
    // Cleanup
  }

  private handleDrop(goalId: string, tactic: TacticBlockData): void {
    this.applyTacticToGoal(goalId, tactic);
  }

  private handleDragOver(event: any): void {
    // Could show tooltip with validation result
  }

  private selectGoal(goalId: string): void {
    this.state.selectedGoalId = goalId;

    const goal = this.findGoal(goalId);
    if (goal) {
      // Update palette with suggestions
      this.tacticPalette?.setSelectedGoal(goal);

      // Highlight in visualizer
      this.proofVisualizer?.highlightGoal(goalId);

      // Update details panel
      this.updateDetailsPanel(goal);
    }

    this.config.onStateChange?.(this.state);
  }

  private updateProofTree(proofTree: ProofTreeData | null): void {
    this.state.proofTree = proofTree;

    if (proofTree) {
      this.state.isComplete = proofTree.isComplete;

      // Render the tree
      this.proofVisualizer?.render(proofTree);

      // Update drag manager goals
      const goals = new Map<string, SerializableGoal>();
      this.collectGoals(proofTree.root, goals);
      this.dragManager.setGoals(goals);

      // Clear selection if goal no longer exists
      if (this.state.selectedGoalId && !goals.has(this.state.selectedGoalId)) {
        this.state.selectedGoalId = null;
        this.tacticPalette?.setSelectedGoal(null);
      }
    } else {
      this.proofVisualizer?.clear();
      this.state.selectedGoalId = null;
      this.state.isComplete = false;
      this.tacticPalette?.setSelectedGoal(null);
    }
  }

  private updateDetailsPanel(goal: SerializableGoal): void {
    const panel = this.config.detailsContainer;
    if (!panel) return;

    panel.innerHTML = `
      <div class="goal-details">
        <div class="goal-details__header">
          <span class="goal-details__id">${goal.id}</span>
          <span class="goal-details__status ${goal.isComplete ? 'status-completed' : goal.isCurrent ? 'status-current' : 'status-pending'}">
            ${goal.isComplete ? 'Completed' : goal.isCurrent ? 'Current' : 'Pending'}
          </span>
        </div>
        <div class="goal-details__type">
          <div class="goal-details__label">Goal Type</div>
          <pre class="goal-details__type-content">${goal.type}</pre>
        </div>
        ${goal.contextEntries.length > 0 ? `
          <div class="goal-details__context">
            <div class="goal-details__label">Context</div>
            <div class="goal-details__context-list">
              ${goal.contextEntries.map(e => `
                <div class="context-entry">
                  <span class="context-entry__name">${e.name}</span>
                  <span class="context-entry__colon">:</span>
                  <span class="context-entry__type">${e.type}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private findGoal(goalId: string): SerializableGoal | null {
    if (!this.state.proofTree) return null;

    const search = (node: SerializableGoalNode): SerializableGoal | null => {
      if (node.goal.id === goalId) return node.goal;
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };

    return search(this.state.proofTree.root);
  }

  private collectGoals(node: SerializableGoalNode, goals: Map<string, SerializableGoal>): void {
    goals.set(node.goal.id, node.goal);
    for (const child of node.children) {
      this.collectGoals(child, goals);
    }
  }

  private collectTacticsFromTree(node: SerializableGoalNode): string[] {
    const tactics: string[] = [];

    if (node.appliedTactic) {
      tactics.push(node.appliedTactic);
    }
    if (node.completedBy) {
      tactics.push(node.completedBy);
    }

    for (const child of node.children) {
      tactics.push(...this.collectTacticsFromTree(child));
    }

    return tactics;
  }

  private tacticToCode(tacticStr: string): string {
    // Tactic strings are already in Pie format from the proof tree
    return `(${tacticStr})`;
  }

  private showSuccessFeedback(goalId: string): void {
    const element = this.proofVisualizer?.getGoalElement(goalId);
    if (element) {
      animateSuccess(element);
    }
  }

  private showErrorFeedback(goalId: string): void {
    const element = this.proofVisualizer?.getGoalElement(goalId);
    if (element) {
      animateError(element);
    }
  }

  private sendWorkerMessage(type: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(null);
        return;
      }

      const id = `callback-${this.callbackId++}`;
      this.pendingCallbacks.set(id, resolve);

      this.worker.postMessage({
        type,
        payload,
        callbackId: id
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingCallbacks.has(id)) {
          this.pendingCallbacks.delete(id);
          resolve(null);
        }
      }, 10000);
    });
  }
}
