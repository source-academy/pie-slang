/**
 * Interactive proof tree visualizer with drop zones.
 * Extends the basic SVG visualization with drag-drop support.
 */

import { ProofTreeData, SerializableGoalNode, SerializableGoal } from './types';
import { TacticDragManager } from './TacticDragManager';

export interface InteractiveVisualizerConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  dropZoneHeight: number;
  colors: {
    current: string;
    completed: string;
    pending: string;
    edge: string;
    tacticLabel: string;
    background: string;
    dropZone: string;
    dropZoneValid: string;
    dropZoneInvalid: string;
  };
}

const DEFAULT_CONFIG: InteractiveVisualizerConfig = {
  nodeWidth: 200,
  nodeHeight: 70,
  horizontalSpacing: 40,
  verticalSpacing: 100,
  dropZoneHeight: 24,
  colors: {
    current: '#f59e0b',
    completed: '#34d399',
    pending: '#64748b',
    edge: '#475569',
    tacticLabel: '#94a3b8',
    background: '#0f172a',
    dropZone: 'rgba(245, 158, 11, 0.1)',
    dropZoneValid: 'rgba(52, 211, 153, 0.3)',
    dropZoneInvalid: 'rgba(239, 68, 68, 0.3)'
  }
};

interface NodePosition {
  x: number;
  y: number;
  width: number;
}

export interface InteractiveProofVisualizerOptions {
  container: HTMLElement;
  dragManager: TacticDragManager;
  onGoalSelect?: (goal: SerializableGoal) => void;
  onGoalDoubleClick?: (goal: SerializableGoal) => void;
  config?: Partial<InteractiveVisualizerConfig>;
}

export class InteractiveProofVisualizer {
  private svg: SVGSVGElement | null = null;
  private config: InteractiveVisualizerConfig;
  private container: HTMLElement;
  private dragManager: TacticDragManager;
  private onGoalSelect: ((goal: SerializableGoal) => void) | null = null;
  private onGoalDoubleClick: ((goal: SerializableGoal) => void) | null = null;
  private currentData: ProofTreeData | null = null;
  private goalElements: Map<string, SVGGElement> = new Map();
  private dropZoneElements: Map<string, SVGGElement> = new Map();

  constructor(options: InteractiveProofVisualizerOptions) {
    this.container = options.container;
    this.dragManager = options.dragManager;
    this.onGoalSelect = options.onGoalSelect || null;
    this.onGoalDoubleClick = options.onGoalDoubleClick || null;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
  }

  /**
   * Render the proof tree with drop zones.
   */
  render(data: ProofTreeData): void {
    this.currentData = data;
    this.clear();

    // Calculate layout
    const positions = this.calculateLayout(data.root);

    // Find bounds
    let minX = Infinity, maxX = -Infinity, maxY = 0;
    positions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + this.config.nodeHeight + this.config.dropZoneHeight);
    });

    const padding = 30;
    const svgWidth = maxX - minX + padding * 2;
    const svgHeight = maxY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = padding;

    // Create SVG with viewBox for proper scaling
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', String(svgHeight));
    this.svg.style.display = 'block';
    this.svg.style.maxWidth = '100%';
    this.svg.classList.add('interactive-proof-tree');

    // Create groups for layering
    const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    edgesGroup.classList.add('edges-layer');
    const dropZonesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dropZonesGroup.classList.add('drop-zones-layer');
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.classList.add('nodes-layer');

    this.svg.appendChild(edgesGroup);
    this.svg.appendChild(dropZonesGroup);
    this.svg.appendChild(nodesGroup);

    // Render tree recursively
    this.renderNodeRecursive(data.root, positions, offsetX, offsetY, edgesGroup, dropZonesGroup, nodesGroup);

    this.container.appendChild(this.svg);

    // Register drop zones with drag manager
    this.registerDropZones();

    // Update bounds on scroll
    this.container.addEventListener('scroll', () => {
      this.dragManager.updateDropZoneBounds();
    });
  }

  /**
   * Clear the visualization.
   */
  clear(): void {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
    this.svg = null;
    this.goalElements.clear();
    this.dropZoneElements.clear();
    this.dragManager.clearDropZones();
  }

  /**
   * Highlight a specific goal.
   */
  highlightGoal(goalId: string): void {
    // Remove previous highlights
    for (const [, element] of this.goalElements) {
      element.classList.remove('goal-node--selected');
    }

    // Add highlight to target
    const element = this.goalElements.get(goalId);
    if (element) {
      element.classList.add('goal-node--selected');
    }
  }

  /**
   * Get the SVG element for a goal.
   */
  getGoalElement(goalId: string): SVGElement | null {
    return this.goalElements.get(goalId) || null;
  }

  /**
   * Cleanup resources.
   */
  dispose(): void {
    this.clear();
  }

  // === Private methods ===

  private renderNodeRecursive(
    node: SerializableGoalNode,
    positions: Map<string, NodePosition>,
    offsetX: number,
    offsetY: number,
    edgesGroup: SVGGElement,
    dropZonesGroup: SVGGElement,
    nodesGroup: SVGGElement
  ): void {
    const pos = positions.get(node.goal.id);
    if (!pos) return;

    const x = pos.x + offsetX;
    const y = pos.y + offsetY;

    // Render edges to children first
    for (const child of node.children) {
      const childPos = positions.get(child.goal.id);
      if (childPos) {
        const childX = childPos.x + offsetX;
        const childY = childPos.y + offsetY;
        this.renderEdge(edgesGroup, x, y, childX, childY, node.appliedTactic);
      }
    }

    // Render self-loop for completed leaf nodes
    if (node.completedBy && node.children.length === 0) {
      this.renderSelfLoop(edgesGroup, x, y, node.completedBy);
    }

    // Render drop zone (only for incomplete goals)
    if (!node.goal.isComplete) {
      this.renderDropZone(dropZonesGroup, node.goal, x, y);
    }

    // Render this node
    this.renderNode(nodesGroup, node.goal, x, y);

    // Render children
    for (const child of node.children) {
      this.renderNodeRecursive(child, positions, offsetX, offsetY, edgesGroup, dropZonesGroup, nodesGroup);
    }
  }

  private renderNode(parent: SVGGElement, goal: SerializableGoal, x: number, y: number): void {
    const { nodeWidth, nodeHeight, colors } = this.config;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'goal-node');
    group.setAttribute('data-goal-id', goal.id);
    group.style.cursor = 'pointer';

    // Determine color based on state
    let strokeColor = colors.pending;
    let fillOpacity = '0.1';
    if (goal.isCurrent) {
      strokeColor = colors.current;
      fillOpacity = '0.2';
    } else if (goal.isComplete) {
      strokeColor = colors.completed;
      fillOpacity = '0.15';
    }

    // Background rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(nodeWidth));
    rect.setAttribute('height', String(nodeHeight));
    rect.setAttribute('rx', '10');
    rect.setAttribute('ry', '10');
    rect.setAttribute('fill', strokeColor);
    rect.setAttribute('fill-opacity', fillOpacity);
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('stroke-width', goal.isCurrent ? '3' : '2');
    group.appendChild(rect);

    // Goal ID label
    const idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idText.setAttribute('x', String(x + 12));
    idText.setAttribute('y', String(y + 20));
    idText.setAttribute('fill', strokeColor);
    idText.setAttribute('font-size', '12');
    idText.setAttribute('font-family', 'monospace');
    idText.setAttribute('font-weight', '600');
    idText.textContent = goal.id;
    group.appendChild(idText);

    // Status indicator
    const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statusText.setAttribute('x', String(x + nodeWidth - 12));
    statusText.setAttribute('y', String(y + 20));
    statusText.setAttribute('text-anchor', 'end');
    statusText.setAttribute('fill', strokeColor);
    statusText.setAttribute('font-size', '14');
    if (goal.isComplete) {
      statusText.textContent = '✓';
    } else if (goal.isCurrent) {
      statusText.textContent = '→';
    } else {
      statusText.textContent = '○';
    }
    group.appendChild(statusText);

    // Goal type (truncated)
    const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    typeText.setAttribute('x', String(x + 12));
    typeText.setAttribute('y', String(y + 45));
    typeText.setAttribute('fill', '#e2e8f0');
    typeText.setAttribute('font-size', '11');
    typeText.setAttribute('font-family', 'monospace');
    const truncatedType = this.truncateText(goal.type, nodeWidth - 24);
    typeText.textContent = truncatedType;
    group.appendChild(typeText);

    // Context count
    if (goal.contextEntries.length > 0) {
      const ctxText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ctxText.setAttribute('x', String(x + 12));
      ctxText.setAttribute('y', String(y + nodeHeight - 8));
      ctxText.setAttribute('fill', colors.tacticLabel);
      ctxText.setAttribute('font-size', '10');
      ctxText.setAttribute('font-family', 'monospace');
      ctxText.textContent = `${goal.contextEntries.length} var${goal.contextEntries.length !== 1 ? 's' : ''} in context`;
      group.appendChild(ctxText);
    }

    // Click handler
    group.addEventListener('click', () => {
      if (this.onGoalSelect) {
        this.onGoalSelect(goal);
      }
    });

    // Double-click handler
    group.addEventListener('dblclick', () => {
      if (this.onGoalDoubleClick) {
        this.onGoalDoubleClick(goal);
      }
    });

    // Hover effect
    group.addEventListener('mouseenter', () => {
      rect.setAttribute('fill-opacity', String(parseFloat(fillOpacity) + 0.1));
    });
    group.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', fillOpacity);
    });

    parent.appendChild(group);
    this.goalElements.set(goal.id, group);
  }

  private renderDropZone(parent: SVGGElement, goal: SerializableGoal, x: number, y: number): void {
    const { nodeWidth, nodeHeight, dropZoneHeight, colors } = this.config;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'drop-zone');
    group.setAttribute('data-goal-id', goal.id);

    const dropY = y + nodeHeight + 4;

    // Drop zone background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(dropY));
    rect.setAttribute('width', String(nodeWidth));
    rect.setAttribute('height', String(dropZoneHeight));
    rect.setAttribute('rx', '6');
    rect.setAttribute('ry', '6');
    rect.setAttribute('fill', colors.dropZone);
    rect.setAttribute('stroke', colors.current);
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('stroke-dasharray', '4,4');
    group.appendChild(rect);

    // Drop zone text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x + nodeWidth / 2));
    text.setAttribute('y', String(dropY + dropZoneHeight / 2 + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', colors.tacticLabel);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', 'monospace');
    text.textContent = 'Drop tactic here';
    group.appendChild(text);

    parent.appendChild(group);
    this.dropZoneElements.set(goal.id, group);
  }

  private renderEdge(
    parent: SVGGElement,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    tactic?: string
  ): void {
    const { nodeWidth, nodeHeight, dropZoneHeight, colors } = this.config;

    // Calculate connection points (bottom of drop zone to top of child)
    const startX = fromX + nodeWidth / 2;
    const startY = fromY + nodeHeight + dropZoneHeight + 8;
    const endX = toX + nodeWidth / 2;
    const endY = toY;

    // Draw edge line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const midY = (startY + endY) / 2;
    const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    line.setAttribute('d', d);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', colors.edge);
    line.setAttribute('stroke-width', '2');
    parent.appendChild(line);

    // Add tactic label if present
    if (tactic) {
      const labelX = (startX + endX) / 2;
      const labelY = midY;

      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const labelText = this.truncateText(tactic, 100);
      const labelWidth = Math.min(labelText.length * 7 + 12, 120);
      labelBg.setAttribute('x', String(labelX - labelWidth / 2));
      labelBg.setAttribute('y', String(labelY - 10));
      labelBg.setAttribute('width', String(labelWidth));
      labelBg.setAttribute('height', '20');
      labelBg.setAttribute('rx', '4');
      labelBg.setAttribute('fill', colors.background);
      labelBg.setAttribute('fill-opacity', '0.9');
      parent.appendChild(labelBg);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(labelX));
      text.setAttribute('y', String(labelY + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', colors.tacticLabel);
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'monospace');
      text.textContent = labelText;
      parent.appendChild(text);
    }
  }

  private renderSelfLoop(parent: SVGGElement, x: number, y: number, tactic: string): void {
    const { nodeWidth, nodeHeight, dropZoneHeight, colors } = this.config;

    const centerX = x + nodeWidth / 2;
    const bottomY = y + nodeHeight + dropZoneHeight + 8;
    const loopHeight = 30;
    const loopWidth = 45;

    // Self-loop path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${centerX - 15} ${bottomY}
               C ${centerX - loopWidth} ${bottomY + loopHeight},
                 ${centerX + loopWidth} ${bottomY + loopHeight},
                 ${centerX + 15} ${bottomY}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colors.completed);
    path.setAttribute('stroke-width', '2');
    parent.appendChild(path);

    // Arrowhead
    const arrowSize = 6;
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const arrowX = centerX + 15;
    const arrowY = bottomY;
    arrow.setAttribute('points',
      `${arrowX},${arrowY} ${arrowX + arrowSize},${arrowY + arrowSize} ${arrowX - arrowSize},${arrowY + arrowSize}`
    );
    arrow.setAttribute('fill', colors.completed);
    parent.appendChild(arrow);

    // Tactic label
    const labelY = bottomY + loopHeight + 5;
    const labelText = this.truncateText(tactic, 120);
    const labelWidth = Math.min(labelText.length * 6.5 + 12, 130);

    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelBg.setAttribute('x', String(centerX - labelWidth / 2));
    labelBg.setAttribute('y', String(labelY - 10));
    labelBg.setAttribute('width', String(labelWidth));
    labelBg.setAttribute('height', '18');
    labelBg.setAttribute('rx', '4');
    labelBg.setAttribute('fill', colors.background);
    labelBg.setAttribute('fill-opacity', '0.9');
    parent.appendChild(labelBg);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(centerX));
    text.setAttribute('y', String(labelY + 3));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', colors.completed);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', 'monospace');
    text.textContent = labelText;
    parent.appendChild(text);
  }

  private calculateLayout(root: SerializableGoalNode): Map<string, NodePosition> {
    const positions = new Map<string, NodePosition>();
    const widths = new Map<string, number>();

    this.calculateSubtreeWidths(root, widths);
    this.assignPositions(root, 0, 0, widths, positions);

    return positions;
  }

  private calculateSubtreeWidths(node: SerializableGoalNode, widths: Map<string, number>): number {
    const { nodeWidth, horizontalSpacing } = this.config;

    if (node.children.length === 0) {
      widths.set(node.goal.id, nodeWidth);
      return nodeWidth;
    }

    let totalChildWidth = 0;
    for (const child of node.children) {
      totalChildWidth += this.calculateSubtreeWidths(child, widths);
    }
    totalChildWidth += (node.children.length - 1) * horizontalSpacing;

    const width = Math.max(nodeWidth, totalChildWidth);
    widths.set(node.goal.id, width);
    return width;
  }

  private assignPositions(
    node: SerializableGoalNode,
    x: number,
    y: number,
    widths: Map<string, number>,
    positions: Map<string, NodePosition>
  ): void {
    const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, dropZoneHeight } = this.config;
    const subtreeWidth = widths.get(node.goal.id) || nodeWidth;

    // Center this node in its subtree
    const nodeX = x + (subtreeWidth - nodeWidth) / 2;
    positions.set(node.goal.id, { x: nodeX, y, width: nodeWidth });

    // Position children
    if (node.children.length > 0) {
      const childY = y + nodeHeight + dropZoneHeight + verticalSpacing;
      let childX = x;

      for (const child of node.children) {
        const childWidth = widths.get(child.goal.id) || nodeWidth;
        this.assignPositions(child, childX, childY, widths, positions);
        childX += childWidth + horizontalSpacing;
      }
    }
  }

  private truncateText(text: string, maxWidth: number): string {
    const maxChars = Math.floor(maxWidth / 7);
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3) + '...';
  }

  private registerDropZones(): void {
    // Register both drop zone boxes and goal nodes as drop targets
    for (const [goalId, element] of this.dropZoneElements) {
      this.dragManager.registerDropZone(goalId, element as unknown as SVGElement);
    }
    // Also allow dropping directly on goal nodes
    for (const [goalId, element] of this.goalElements) {
      const goal = this.findGoalById(goalId);
      if (goal && !goal.isComplete) {
        this.dragManager.registerDropZone(goalId, element as unknown as SVGElement);
      }
    }
  }

  private findGoalById(goalId: string): SerializableGoal | null {
    if (!this.currentData) return null;
    const search = (node: SerializableGoalNode): SerializableGoal | null => {
      if (node.goal.id === goalId) return node.goal;
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };
    return search(this.currentData.root);
  }
}
