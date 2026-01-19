/**
 * Collapsible tree renderer for type visualization.
 * Renders parsed S-expressions as interactive expandable/collapsible nodes.
 */

import { TypeNode } from './types';
import { parseSExpression, getTypeCategory } from './SExpressionParser';

/**
 * Interactive collapsible tree component for displaying complex types.
 */
export class CollapsibleTypeTree {
  private container: HTMLElement;
  private rootNode: TypeNode | null = null;
  private nodeStates: Map<string, boolean> = new Map(); // true = expanded
  private nodeIdCounter: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.classList.add('type-tree');
  }

  /**
   * Render a type string as an interactive tree.
   */
  render(typeString: string): void {
    this.clear();
    this.nodeIdCounter = 0;

    const trimmed = typeString.trim();
    if (!trimmed) {
      this.showPlaceholder('No type to display');
      return;
    }

    try {
      this.rootNode = parseSExpression(trimmed);

      if (this.rootNode.kind === 'error') {
        // Fallback to plain text display on parse error
        this.showPlainText(trimmed);
        return;
      }

      const treeElement = this.renderNode(this.rootNode, 0);
      this.container.appendChild(treeElement);
    } catch (e) {
      // Fallback to plain text display
      this.showPlainText(trimmed);
    }
  }

  /**
   * Clear the tree display.
   */
  clear(): void {
    this.container.innerHTML = '';
    this.rootNode = null;
    this.nodeStates.clear();
    this.nodeIdCounter = 0;
  }

  /**
   * Expand all nodes.
   */
  expandAll(): void {
    this.nodeStates.forEach((_, key) => this.nodeStates.set(key, true));
    if (this.rootNode) {
      this.container.innerHTML = '';
      const treeElement = this.renderNode(this.rootNode, 0);
      this.container.appendChild(treeElement);
    }
  }

  /**
   * Collapse all nodes.
   */
  collapseAll(): void {
    this.nodeStates.forEach((_, key) => this.nodeStates.set(key, false));
    if (this.rootNode) {
      this.container.innerHTML = '';
      const treeElement = this.renderNode(this.rootNode, 0);
      this.container.appendChild(treeElement);
    }
  }

  private showPlaceholder(message: string): void {
    const placeholder = document.createElement('div');
    placeholder.className = 'type-tree__placeholder';
    placeholder.textContent = message;
    this.container.appendChild(placeholder);
  }

  private showPlainText(text: string): void {
    const pre = document.createElement('pre');
    pre.className = 'type-tree__fallback';
    pre.textContent = text;
    this.container.appendChild(pre);
  }

  private renderNode(node: TypeNode, depth: number): HTMLElement {
    const nodeId = `n${this.nodeIdCounter++}`;

    // Initialize state: deep nodes start collapsed
    if (!this.nodeStates.has(nodeId)) {
      this.nodeStates.set(nodeId, depth < 3);
    }

    const isExpanded = this.nodeStates.get(nodeId) ?? true;

    if (node.isAtom) {
      return this.renderAtom(node);
    }

    return this.renderListNode(node, nodeId, depth, isExpanded);
  }

  private renderAtom(node: TypeNode): HTMLElement {
    const span = document.createElement('span');
    span.className = 'type-node type-node--atom';

    const kindSpan = document.createElement('span');
    const category = getTypeCategory(node.kind);
    kindSpan.className = `type-node__kind type-kind--${category}`;
    kindSpan.textContent = node.value || node.kind;
    span.appendChild(kindSpan);

    return span;
  }

  private renderListNode(node: TypeNode, nodeId: string, depth: number, isExpanded: boolean): HTMLElement {
    const div = document.createElement('div');
    div.className = 'type-node type-node--list';
    div.dataset.nodeId = nodeId;

    // Skip the first child if it's the kind identifier
    const children = node.children;
    const hasKindChild = children.length > 0 && children[0].isAtom && children[0].kind === node.kind;
    const displayChildren = hasKindChild ? children.slice(1) : children;

    const hasChildren = displayChildren.length > 0;

    // Header row with toggle, kind, and binding/abbreviation
    const header = document.createElement('div');
    header.className = 'type-node__header';

    // Toggle button (only if there are children)
    if (hasChildren) {
      const toggle = document.createElement('span');
      toggle.className = 'type-node__toggle';
      toggle.textContent = isExpanded ? '▼' : '▶';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNode(nodeId);
      });
      header.appendChild(toggle);
    } else {
      // Spacer for alignment
      const spacer = document.createElement('span');
      spacer.className = 'type-node__toggle-spacer';
      header.appendChild(spacer);
    }

    // Kind label
    const kindSpan = document.createElement('span');
    const category = getTypeCategory(node.kind);
    kindSpan.className = `type-node__kind type-kind--${category}`;
    kindSpan.textContent = node.kind;
    header.appendChild(kindSpan);

    // Render based on type and expansion state
    if (this.isBindingType(node.kind) && displayChildren.length >= 2) {
      // Handle Π, Σ, λ with bindings
      const binding = displayChildren[0];
      if (!binding.isAtom && binding.children.length >= 2) {
        const bindingSpan = document.createElement('span');
        bindingSpan.className = 'type-node__binding';
        const varName = binding.children[0].value || binding.children[0].kind;
        const varType = binding.children[1].abbreviation;
        bindingSpan.textContent = ` (${varName} : ${varType})`;
        header.appendChild(bindingSpan);
      } else if (!binding.isAtom && binding.children.length === 1) {
        // Lambda with just variable name
        const bindingSpan = document.createElement('span');
        bindingSpan.className = 'type-node__binding';
        const varName = binding.children[0].value || binding.children[0].kind;
        bindingSpan.textContent = ` (${varName})`;
        header.appendChild(bindingSpan);
      }
    }

    // Show abbreviation when collapsed
    if (!isExpanded && hasChildren) {
      const abbrev = document.createElement('span');
      abbrev.className = 'type-node__abbrev';
      abbrev.textContent = ' ' + this.getCollapsedHint(node, displayChildren);
      header.appendChild(abbrev);
    }

    div.appendChild(header);

    // Children container
    if (hasChildren && isExpanded) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'type-node__children';

      // Determine which children to render based on type
      const childrenToRender = this.getChildrenToRender(node, displayChildren);

      for (const child of childrenToRender) {
        const childElement = this.renderNode(child, depth + 1);
        childrenDiv.appendChild(childElement);
      }

      div.appendChild(childrenDiv);
    }

    return div;
  }

  private isBindingType(kind: string): boolean {
    return kind === 'Π' || kind === 'Pi' || kind === 'Σ' || kind === 'Sigma' || kind === 'λ' || kind === 'lambda';
  }

  private getChildrenToRender(node: TypeNode, displayChildren: TypeNode[]): TypeNode[] {
    // For binding types, skip the binding and render the body
    if (this.isBindingType(node.kind) && displayChildren.length >= 2) {
      return displayChildren.slice(1);
    }
    return displayChildren;
  }

  private getCollapsedHint(node: TypeNode, displayChildren: TypeNode[]): string {
    if (displayChildren.length === 0) {
      return '';
    }

    // For binding types, hint at the body
    if (this.isBindingType(node.kind) && displayChildren.length >= 2) {
      const body = displayChildren[1];
      if (body.isAtom) {
        return body.kind;
      }
      return `→ ${body.kind} ...`;
    }

    // Generic hint
    return '...';
  }

  private toggleNode(nodeId: string): void {
    const currentState = this.nodeStates.get(nodeId) ?? true;
    this.nodeStates.set(nodeId, !currentState);

    // Re-render
    if (this.rootNode) {
      this.nodeIdCounter = 0;
      this.container.innerHTML = '';
      const treeElement = this.renderNode(this.rootNode, 0);
      this.container.appendChild(treeElement);
    }
  }
}
