// Display hints inline in Monaco Editor using decorations

/**
 * Manages displaying hints inline in the Monaco editor
 */
export class HintDisplay {
  private decorations: string[] = [];
  private editor: any;

  constructor(editor: any) {
    this.editor = editor;
  }

  /**
   * Show a hint inline below a specific line
   */
  showHint(line: number, hint: string): void {
    console.log('[HintDisplay] showHint called with line:', line, 'hint:', hint);
    const monaco = (window as any).monaco;
    if (!this.editor) {
      console.error('[HintDisplay] Editor not available');
      return;
    }

    // Clear previous hints
    this.clearHints();

    console.log('[HintDisplay] Creating hint zone below line', line);

    // Use view zones to add a non-editable hint line below the TODO
    // This ensures the hint is always visible, not just on hover
    this.editor.changeViewZones((changeAccessor: any) => {
      const domNode = document.createElement('div');
      domNode.className = 'hint-zone';
      domNode.style.cssText = `
        background-color: rgba(78, 201, 176, 0.08);
        color: #4ec9b0;
        padding: 6px 12px;
        font-size: 13px;
        font-style: italic;
        border-left: 3px solid #4ec9b0;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      `;
      domNode.innerHTML = `💡 <strong>Hint:</strong> ${hint}`;

      const zoneId = changeAccessor.addZone({
        afterLineNumber: line,
        heightInLines: 2,
        domNode: domNode
      });

      // Store zone ID so we can remove it later
      (this as any).currentZoneId = zoneId;
    });

    console.log('[HintDisplay] Hint zone created');
  }

  /**
   * Show a loading state while hint is being generated
   */
  showLoading(line: number): void {
    console.log('[HintDisplay] showLoading called at line:', line);
    if (!this.editor) {
      console.error('[HintDisplay] Editor not available for loading');
      return;
    }

    // Clear previous hints
    this.clearHints();

    // Show loading indicator using view zone
    console.log('[HintDisplay] Creating loading zone');
    this.editor.changeViewZones((changeAccessor: any) => {
      const domNode = document.createElement('div');
      domNode.className = 'hint-zone-loading';
      domNode.style.cssText = `
        background-color: rgba(206, 145, 120, 0.08);
        color: #ce9178;
        padding: 6px 12px;
        font-size: 13px;
        font-style: italic;
        border-left: 3px solid #ce9178;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      `;
      domNode.innerHTML = '⏳ Generating hint...';

      const zoneId = changeAccessor.addZone({
        afterLineNumber: line,
        heightInLines: 1.5,
        domNode: domNode
      });

      (this as any).currentZoneId = zoneId;
    });
    console.log('[HintDisplay] Loading zone created');
  }

  /**
   * Show an error message
   */
  showError(line: number, error: string): void {
    console.log('[HintDisplay] showError called at line:', line, 'error:', error);
    if (!this.editor) {
      console.error('[HintDisplay] Editor not available for error');
      return;
    }

    // Clear previous hints
    this.clearHints();

    // Show error using view zone
    console.log('[HintDisplay] Creating error zone');
    this.editor.changeViewZones((changeAccessor: any) => {
      const domNode = document.createElement('div');
      domNode.className = 'hint-zone-error';
      domNode.style.cssText = `
        background-color: rgba(244, 135, 113, 0.08);
        color: #f48771;
        padding: 6px 12px;
        font-size: 13px;
        font-style: italic;
        border-left: 3px solid #f48771;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      `;
      domNode.innerHTML = `❌ ${error}`;

      const zoneId = changeAccessor.addZone({
        afterLineNumber: line,
        heightInLines: 1.5,
        domNode: domNode
      });

      (this as any).currentZoneId = zoneId;
    });
    console.log('[HintDisplay] Error zone created');
  }

  /**
   * Clear all hint decorations and view zones
   */
  clearHints(): void {
    if (!this.editor) {
      return;
    }

    // Clear decorations
    if (this.decorations.length > 0) {
      this.decorations = this.editor.deltaDecorations(this.decorations, []);
    }

    // Clear view zones
    const zoneId = (this as any).currentZoneId;
    if (zoneId !== undefined) {
      this.editor.changeViewZones((changeAccessor: any) => {
        changeAccessor.removeZone(zoneId);
      });
      (this as any).currentZoneId = undefined;
    }
  }

  /**
   * Check if there are active hints displayed
   */
  hasActiveHints(): boolean {
    return this.decorations.length > 0;
  }
}
