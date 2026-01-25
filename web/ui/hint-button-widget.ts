// Monaco Content Widget for displaying hint buttons

/**
 * Content widget that displays a hint button in the Monaco editor
 */
export class HintButtonWidget {
  private domNode: HTMLButtonElement;
  private position: any; // monaco.Position
  private monaco: any;
  private onClick: () => void;
  private widgetId: string;

  constructor(monaco: any, position: any, onClick: () => void) {
    this.monaco = monaco;
    this.position = position;
    this.onClick = onClick;
    this.widgetId = `hint-button-${position.lineNumber}-${position.column}`;
    this.domNode = this.createDomNode();
  }

  /**
   * Create the DOM node for the hint button
   */
  private createDomNode(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'hint-button';
    button.innerHTML = '💡';
    button.title = 'Get AI hint';
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onClick();
    };
    return button;
  }

  /**
   * Get unique ID for this widget
   */
  getId(): string {
    return this.widgetId;
  }

  /**
   * Get the DOM node to display
   */
  getDomNode(): HTMLElement {
    return this.domNode;
  }

  /**
   * Get the position where the widget should appear
   */
  getPosition(): any {
    return {
      position: this.position,
      preference: [
        this.monaco.editor.ContentWidgetPositionPreference.EXACT
      ]
    };
  }

  /**
   * Update the button to show loading state
   */
  setLoading(): void {
    this.domNode.innerHTML = '⏳';
    this.domNode.disabled = true;
    this.domNode.title = 'Generating hint...';
  }

  /**
   * Reset the button to normal state
   */
  reset(): void {
    this.domNode.innerHTML = '💡';
    this.domNode.disabled = false;
    this.domNode.title = 'Get AI hint';
  }
}
