/**
 * Tactic palette component for interactive proof mode.
 * Displays available tactics that can be dragged onto goal nodes.
 */

import {
  TacticType,
  TacticBlockData,
  TacticMetadata,
  SerializableGoal,
  TACTIC_METADATA
} from './types';
import { TacticValidationService } from './TacticValidationService';
import { TacticDragManager } from './TacticDragManager';

export interface TacticPaletteConfig {
  container: HTMLElement;
  validationService: TacticValidationService;
  dragManager: TacticDragManager;
  onTacticSelect?: (tactic: TacticBlockData, goalId?: string) => void;
}

/**
 * Categories for organizing tactics in the palette.
 */
const TACTIC_CATEGORIES = [
  {
    name: 'Introduction',
    description: 'Introduce variables and structure',
    tactics: ['intro', 'exists', 'split'] as TacticType[]
  },
  {
    name: 'Direct Proof',
    description: 'Provide proof terms directly',
    tactics: ['exact'] as TacticType[]
  },
  {
    name: 'Case Analysis',
    description: 'Choose branches',
    tactics: ['left', 'right'] as TacticType[]
  },
  {
    name: 'Elimination',
    description: 'Induction and case analysis',
    tactics: ['elimNat', 'elimList', 'elimVec', 'elimEqual', 'elimEither', 'elimAbsurd'] as TacticType[]
  }
];

export class TacticPalette {
  private container: HTMLElement;
  private validationService: TacticValidationService;
  private dragManager: TacticDragManager;
  private config: TacticPaletteConfig;
  private selectedGoal: SerializableGoal | null = null;
  private tacticElements: Map<TacticType, HTMLElement> = new Map();
  private inputModal: HTMLElement | null = null;

  constructor(config: TacticPaletteConfig) {
    this.config = config;
    this.container = config.container;
    this.validationService = config.validationService;
    this.dragManager = config.dragManager;

    this.render();
  }

  /**
   * Update the palette based on selected goal.
   */
  setSelectedGoal(goal: SerializableGoal | null): void {
    this.selectedGoal = goal;
    this.updateTacticStates();
  }

  /**
   * Get the current selected goal.
   */
  getSelectedGoal(): SerializableGoal | null {
    return this.selectedGoal;
  }

  /**
   * Refresh the palette display.
   */
  refresh(): void {
    this.updateTacticStates();
  }

  // === Private methods ===

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'tactic-palette';

    // Header
    const header = document.createElement('div');
    header.className = 'tactic-palette__header';
    header.innerHTML = `
      <h3 class="tactic-palette__title">Tactics</h3>
      <p class="tactic-palette__hint">Drag a tactic onto a goal</p>
    `;
    this.container.appendChild(header);

    // Categories
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'tactic-palette__categories';

    for (const category of TACTIC_CATEGORIES) {
      const categoryEl = this.renderCategory(category);
      categoriesContainer.appendChild(categoryEl);
    }

    this.container.appendChild(categoriesContainer);

    // Suggestions section
    const suggestionsSection = document.createElement('div');
    suggestionsSection.className = 'tactic-palette__suggestions';
    suggestionsSection.id = 'tactic-suggestions';
    suggestionsSection.innerHTML = `
      <div class="tactic-palette__suggestions-header">
        <span class="suggestions-icon">💡</span>
        <span>Suggested tactics will appear here</span>
      </div>
    `;
    this.container.appendChild(suggestionsSection);
  }

  private renderCategory(category: { name: string; description: string; tactics: TacticType[] }): HTMLElement {
    const categoryEl = document.createElement('div');
    categoryEl.className = 'tactic-palette__category';

    const headerEl = document.createElement('div');
    headerEl.className = 'tactic-palette__category-header';
    headerEl.innerHTML = `
      <span class="category-name">${category.name}</span>
      <span class="category-description">${category.description}</span>
    `;
    categoryEl.appendChild(headerEl);

    const tacticsEl = document.createElement('div');
    tacticsEl.className = 'tactic-palette__category-tactics';

    for (const tacticType of category.tactics) {
      const metadata = TACTIC_METADATA[tacticType];
      const tacticEl = this.renderTacticBlock(tacticType, metadata);
      tacticsEl.appendChild(tacticEl);
      this.tacticElements.set(tacticType, tacticEl);
    }

    categoryEl.appendChild(tacticsEl);
    return categoryEl;
  }

  private renderTacticBlock(type: TacticType, metadata: TacticMetadata): HTMLElement {
    const block = document.createElement('div');
    block.className = 'tactic-block';
    block.dataset.tacticType = type;
    block.draggable = true;

    block.innerHTML = `
      <div class="tactic-block__header" style="background: ${metadata.color}">
        <span class="tactic-block__name">${metadata.displayName}</span>
        ${metadata.requiresInput !== 'none' ? '<span class="tactic-block__input-indicator">...</span>' : ''}
      </div>
      <div class="tactic-block__description">${metadata.description}</div>
    `;

    // Drag events
    block.addEventListener('mousedown', (e) => this.handleTacticMouseDown(e, type, metadata));

    // Click to select (for tactics that need input)
    block.addEventListener('click', () => this.handleTacticClick(type, metadata));

    return block;
  }

  private handleTacticMouseDown(event: MouseEvent, type: TacticType, metadata: TacticMetadata): void {
    // Prevent text selection
    event.preventDefault();

    // If tactic needs input, show modal first
    if (metadata.requiresInput !== 'none') {
      return; // Let click handler deal with it
    }

    // Start drag for tactics without input
    const tacticData: TacticBlockData = { type };
    this.dragManager.startDrag(tacticData, event.target as HTMLElement, event);
  }

  private handleTacticClick(type: TacticType, metadata: TacticMetadata): void {
    if (metadata.requiresInput === 'none') return;

    // Show input modal
    this.showInputModal(type, metadata);
  }

  private showInputModal(type: TacticType, metadata: TacticMetadata): void {
    // Remove existing modal
    if (this.inputModal) {
      this.inputModal.remove();
    }

    // Capture the selected goal at modal open time (in case it gets cleared later)
    const capturedGoal = this.selectedGoal;

    const modal = document.createElement('div');
    modal.className = 'tactic-input-modal';

    const label = metadata.requiresInput === 'name' ? 'Variable name:' : 'Expression:';
    const placeholder = metadata.requiresInput === 'name' ? 'e.g., x' : 'e.g., (cons 0 (same 0))';

    modal.innerHTML = `
      <div class="tactic-input-modal__content">
        <div class="tactic-input-modal__header">
          <span class="tactic-name" style="color: ${metadata.color}">${metadata.displayName}</span>
          <button class="tactic-input-modal__close">&times;</button>
        </div>
        <div class="tactic-input-modal__body">
          <label class="tactic-input-modal__label">${label}</label>
          <input type="text" class="tactic-input-modal__input" placeholder="${placeholder}" autofocus>
        </div>
        <div class="tactic-input-modal__footer">
          <button class="tactic-input-modal__cancel">Cancel</button>
          <button class="tactic-input-modal__apply" style="background: ${metadata.color}">Apply</button>
        </div>
      </div>
    `;

    // Event handlers
    const closeBtn = modal.querySelector('.tactic-input-modal__close') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('.tactic-input-modal__cancel') as HTMLButtonElement;
    const applyBtn = modal.querySelector('.tactic-input-modal__apply') as HTMLButtonElement;
    const input = modal.querySelector('.tactic-input-modal__input') as HTMLInputElement;

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());

    applyBtn.addEventListener('click', () => {
      const value = input.value.trim();
      if (!value) {
        input.classList.add('error');
        return;
      }

      const tacticData: TacticBlockData = {
        type,
        [metadata.requiresInput === 'name' ? 'name' : 'expression']: value
      };

      console.log('[TacticPalette] Apply clicked', { tacticData, capturedGoal: capturedGoal?.id, currentSelectedGoal: this.selectedGoal?.id });
      modal.remove();
      // Use the captured goal from when modal was opened
      this.config.onTacticSelect?.(tacticData, capturedGoal?.id);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyBtn.click();
      } else if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    this.container.appendChild(modal);
    this.inputModal = modal;

    // Focus input
    setTimeout(() => input.focus(), 0);
  }

  private updateTacticStates(): void {
    const suggestionsEl = document.getElementById('tactic-suggestions');

    if (!this.selectedGoal) {
      // No goal selected - disable all tactics
      for (const [, element] of this.tacticElements) {
        element.classList.add('tactic-block--disabled');
        element.classList.remove('tactic-block--suggested');
      }

      if (suggestionsEl) {
        suggestionsEl.innerHTML = `
          <div class="tactic-palette__suggestions-header">
            <span class="suggestions-icon">💡</span>
            <span>Select a goal to see suggestions</span>
          </div>
        `;
      }
      return;
    }

    // Get suggestions for the selected goal
    const suggestions = this.validationService.getSuggestedTactics(this.selectedGoal);

    // Update tactic states
    for (const [type, element] of this.tacticElements) {
      const isSuggested = suggestions.includes(type);
      element.classList.remove('tactic-block--disabled', 'tactic-block--suggested');

      if (this.selectedGoal.isComplete) {
        element.classList.add('tactic-block--disabled');
      } else if (isSuggested) {
        element.classList.add('tactic-block--suggested');
      }
    }

    // Update suggestions section
    if (suggestionsEl && suggestions.length > 0) {
      const topSuggestions = suggestions.slice(0, 3);
      suggestionsEl.innerHTML = `
        <div class="tactic-palette__suggestions-header">
          <span class="suggestions-icon">💡</span>
          <span>Try these tactics:</span>
        </div>
        <div class="tactic-palette__suggestions-list">
          ${topSuggestions.map(type => {
            const metadata = TACTIC_METADATA[type];
            return `
              <div class="suggestion-chip" style="border-color: ${metadata.color}">
                ${metadata.displayName}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  /**
   * Cleanup resources.
   */
  dispose(): void {
    if (this.inputModal) {
      this.inputModal.remove();
    }
    this.tacticElements.clear();
    this.container.innerHTML = '';
  }
}
