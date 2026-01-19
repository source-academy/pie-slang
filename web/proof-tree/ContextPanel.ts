/**
 * Context panel component that displays hypothesis entries.
 * Shows the context (variables in scope) for the selected goal.
 */

import { SerializableGoal } from './types';

export class ContextPanel {
  private container: HTMLElement;
  private currentGoal: SerializableGoal | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clear();
  }

  display(goal: SerializableGoal): void {
    this.currentGoal = goal;
    this.container.innerHTML = '';

    // Header with label
    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('div');
    title.className = 'panel-label';
    title.textContent = 'Context';
    header.appendChild(title);

    this.container.appendChild(header);

    // Context entries list
    const contentDiv = document.createElement('div');
    contentDiv.className = 'panel-content';

    if (goal.contextEntries.length > 0) {
      const contextList = document.createElement('div');
      contextList.className = 'context-list';

      for (const entry of goal.contextEntries) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'context-entry';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'context-entry-name';
        nameSpan.textContent = entry.name;
        entryDiv.appendChild(nameSpan);

        const colonSpan = document.createElement('span');
        colonSpan.className = 'context-entry-colon';
        colonSpan.textContent = ' : ';
        entryDiv.appendChild(colonSpan);

        const typeSpan = document.createElement('span');
        typeSpan.className = 'context-entry-type';
        typeSpan.textContent = entry.type;
        entryDiv.appendChild(typeSpan);

        contextList.appendChild(entryDiv);
      }

      contentDiv.appendChild(contextList);
    } else {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'panel-empty';
      emptyMsg.textContent = '(empty)';
      contentDiv.appendChild(emptyMsg);
    }

    this.container.appendChild(contentDiv);
  }

  clear(): void {
    this.currentGoal = null;
    this.container.innerHTML = `
      <div class="panel-placeholder">
        Select a goal
      </div>
    `;
  }

  getCurrentGoal(): SerializableGoal | null {
    return this.currentGoal;
  }
}
