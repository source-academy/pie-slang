/**
 * SVG-based proof tree visualizer component.
 * Renders goals as blocks with tactic labels on edges.
 */

import { ProofTreeData, SerializableGoalNode, SerializableGoal } from './types';

export interface VisualizerConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  colors: {
    current: string;
    completed: string;
    pending: string;
    edge: string;
    tacticLabel: string;
    background: string;
  };
}

const DEFAULT_CONFIG: VisualizerConfig = {
  nodeWidth: 180,
  nodeHeight: 60,
  horizontalSpacing: 40,
  verticalSpacing: 80,
  colors: {
    current: '#f59e0b',   // amber/orange for ongoing goal
    completed: '#34d399', // green for completed
    pending: '#64748b',   // gray for pending
    edge: '#475569',
    tacticLabel: '#94a3b8',
    background: '#0f172a'
  }
};

interface NodePosition {
  x: number;
  y: number;
  width: number;
}

export class ProofTreeVisualizer {
  private svg: SVGSVGElement | null = null;
  private config: VisualizerConfig;
  private container: HTMLElement;
  private onGoalSelect: ((goal: SerializableGoal) => void) | null = null;
  private currentData: ProofTreeData | null = null;

  constructor(container: HTMLElement, config?: Partial<VisualizerConfig>) {
    this.container = container;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setOnGoalSelect(callback: (goal: SerializableGoal) => void): void {
    this.onGoalSelect = callback;
  }

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
      maxY = Math.max(maxY, pos.y + this.config.nodeHeight);
    });

    const padding = 20;
    const svgWidth = maxX - minX + padding * 2;
    const svgHeight = maxY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = padding;

    // Create SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', String(svgWidth));
    this.svg.setAttribute('height', String(svgHeight));
    this.svg.style.display = 'block';

    // Create groups for layering (edges below nodes)
    const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(edgesGroup);
    this.svg.appendChild(nodesGroup);

    // Render tree recursively
    this.renderNodeRecursive(data.root, positions, offsetX, offsetY, edgesGroup, nodesGroup);

    this.container.appendChild(this.svg);
  }

  private renderNodeRecursive(
    node: SerializableGoalNode,
    positions: Map<string, NodePosition>,
    offsetX: number,
    offsetY: number,
    edgesGroup: SVGGElement,
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

    // Render this node
    this.renderNode(nodesGroup, node.goal, x, y);

    // Render children
    for (const child of node.children) {
      this.renderNodeRecursive(child, positions, offsetX, offsetY, edgesGroup, nodesGroup);
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
    rect.setAttribute('rx', '8');
    rect.setAttribute('ry', '8');
    rect.setAttribute('fill', strokeColor);
    rect.setAttribute('fill-opacity', fillOpacity);
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('stroke-width', goal.isCurrent ? '3' : '2');
    group.appendChild(rect);

    // Goal ID label
    const idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idText.setAttribute('x', String(x + 10));
    idText.setAttribute('y', String(y + 18));
    idText.setAttribute('fill', strokeColor);
    idText.setAttribute('font-size', '11');
    idText.setAttribute('font-family', 'monospace');
    idText.textContent = goal.id;
    group.appendChild(idText);

    // Status indicator
    const statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statusText.setAttribute('x', String(x + nodeWidth - 10));
    statusText.setAttribute('y', String(y + 18));
    statusText.setAttribute('text-anchor', 'end');
    statusText.setAttribute('fill', strokeColor);
    statusText.setAttribute('font-size', '12');
    console.log(`Goal ${goal.id}: isComplete=${goal.isComplete}, isCurrent=${goal.isCurrent}`);
    if (goal.isComplete) {
      statusText.textContent = '\u2713'; // checkmark
    } else if (goal.isCurrent) {
      statusText.textContent = '\u2192'; // arrow for current/ongoing goal
    } else {
      statusText.textContent = '\u25CB'; // empty circle for pending
    }
    group.appendChild(statusText);

    // Goal type (truncated)
    const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    typeText.setAttribute('x', String(x + 10));
    typeText.setAttribute('y', String(y + 40));
    typeText.setAttribute('fill', '#e2e8f0');
    typeText.setAttribute('font-size', '12');
    typeText.setAttribute('font-family', 'monospace');
    const truncatedType = this.truncateText(goal.type, nodeWidth - 20);
    typeText.textContent = truncatedType;
    group.appendChild(typeText);

    // Click handler
    group.addEventListener('click', () => {
      if (this.onGoalSelect) {
        this.onGoalSelect(goal);
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
  }

  private renderEdge(
    parent: SVGGElement,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    tactic?: string
  ): void {
    const { nodeWidth, nodeHeight, colors } = this.config;

    // Calculate connection points (bottom of parent, top of child)
    const startX = fromX + nodeWidth / 2;
    const startY = fromY + nodeHeight;
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

      // Background for label
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const labelText = this.truncateText(tactic, 100);
      const labelWidth = Math.min(labelText.length * 7 + 10, 110);
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

  private renderSelfLoop(
    parent: SVGGElement,
    x: number,
    y: number,
    tactic: string
  ): void {
    const { nodeWidth, nodeHeight, colors } = this.config;

    // Draw a curved arrow that loops back to the same node (below the node)
    const centerX = x + nodeWidth / 2;
    const bottomY = y + nodeHeight;
    const loopHeight = 35;
    const loopWidth = 50;

    // Create curved path for self-loop
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

    // Add arrowhead
    const arrowSize = 6;
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const arrowX = centerX + 15;
    const arrowY = bottomY;
    arrow.setAttribute('points',
      `${arrowX},${arrowY} ${arrowX + arrowSize},${arrowY + arrowSize} ${arrowX - arrowSize},${arrowY + arrowSize}`
    );
    arrow.setAttribute('fill', colors.completed);
    parent.appendChild(arrow);

    // Add tactic label below the loop
    const labelY = bottomY + loopHeight + 5;
    const labelText = this.truncateText(tactic, 120);
    const labelWidth = Math.min(labelText.length * 6.5 + 12, 130);

    // Background for label
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

    // First pass: calculate subtree widths
    const widths = new Map<string, number>();
    this.calculateSubtreeWidths(root, widths);

    // Second pass: assign positions
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
    const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing } = this.config;
    const subtreeWidth = widths.get(node.goal.id) || nodeWidth;

    // Center this node in its subtree
    const nodeX = x + (subtreeWidth - nodeWidth) / 2;
    positions.set(node.goal.id, { x: nodeX, y, width: nodeWidth });

    // Position children
    if (node.children.length > 0) {
      const childY = y + nodeHeight + verticalSpacing;
      let childX = x;

      for (const child of node.children) {
        const childWidth = widths.get(child.goal.id) || nodeWidth;
        this.assignPositions(child, childX, childY, widths, positions);
        childX += childWidth + horizontalSpacing;
      }
    }
  }

  private truncateText(text: string, maxWidth: number): string {
    // Rough estimate: 7px per character
    const maxChars = Math.floor(maxWidth / 7);
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3) + '...';
  }

  clear(): void {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
    this.svg = null;
  }

  highlightGoal(goalId: string): void {
    if (!this.svg) return;

    // Remove previous highlights
    const nodes = this.svg.querySelectorAll('.goal-node');
    nodes.forEach(node => {
      node.classList.remove('highlighted');
    });

    // Add highlight to target
    const target = this.svg.querySelector(`[data-goal-id="${goalId}"]`);
    if (target) {
      target.classList.add('highlighted');
    }
  }
}
