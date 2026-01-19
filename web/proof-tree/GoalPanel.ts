/**
 * Goal panel component that displays the goal type.
 * Shows the goal type with collapsible tree visualization.
 */

import { SerializableGoal } from './types';
import { CollapsibleTypeTree } from './CollapsibleTypeTree';

export class GoalPanel {
  private container: HTMLElement;
  private currentGoal: SerializableGoal | null = null;
  private goalTypeTree: CollapsibleTypeTree | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clear();
  }

  display(goal: SerializableGoal): void {
    this.currentGoal = goal;
    this.container.innerHTML = '';

    // Header with goal ID and status
    const header = document.createElement('div');
    header.className = 'panel-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'panel-title-row';

    const title = document.createElement('div');
    title.className = 'panel-label';
    title.textContent = 'Goal';
    titleRow.appendChild(title);

    const goalId = document.createElement('span');
    goalId.className = 'panel-goal-id';
    goalId.textContent = goal.id;
    titleRow.appendChild(goalId);

    header.appendChild(titleRow);

    // Status badge
    const status = document.createElement('span');
    status.className = 'panel-status';
    if (goal.isComplete) {
      status.textContent = 'Completed';
      status.classList.add('status-completed');
    } else if (goal.isCurrent) {
      status.textContent = 'Ongoing';
      status.classList.add('status-ongoing');
    } else {
      status.textContent = 'Pending';
      status.classList.add('status-pending');
    }
    header.appendChild(status);

    this.container.appendChild(header);

    // Goal type with collapsible tree
    const contentDiv = document.createElement('div');
    contentDiv.className = 'panel-content';

    const goalTypeContainer = document.createElement('div');
    goalTypeContainer.className = 'goal-type-tree';
    this.goalTypeTree = new CollapsibleTypeTree(goalTypeContainer);
    this.goalTypeTree.render(goal.type);
    contentDiv.appendChild(goalTypeContainer);

    this.container.appendChild(contentDiv);
  }

  clear(): void {
    this.currentGoal = null;
    this.goalTypeTree = null;
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
