/**
 * Main Blockly editor integration for the Pie playground.
 *
 * Manages the Blockly workspace, code generation, and change listeners.
 */

// Use global Blockly from CDN
declare const Blockly: any;

import { defineAllBlocks } from './BlockDefinitions';
import { pieGenerator } from './CodeGenerator';
import { toolbox } from './Toolbox';

export interface BlocklyEditorOptions {
  container: HTMLElement;
  codePreview: HTMLElement;
  onCodeChange?: (code: string) => void;
}

export class BlocklyEditor {
  private workspace: Blockly.WorkspaceSvg | null = null;
  private codePreview: HTMLElement;
  private onCodeChange?: (code: string) => void;
  private lastGeneratedCode: string = '';
  private changeListener: (() => void) | null = null;
  private initialized: boolean = false;

  constructor(options: BlocklyEditorOptions) {
    this.codePreview = options.codePreview;
    this.onCodeChange = options.onCodeChange;

    // Define all blocks
    defineAllBlocks();

    // Create workspace
    this.workspace = Blockly.inject(options.container, {
      toolbox: toolbox,
      theme: this.createDarkTheme(),
      grid: {
        spacing: 20,
        length: 3,
        colour: '#1a2520',
        snap: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true
      },
      renderer: 'zelos'
    });

    // Set up change listener
    this.setupChangeListener();
    this.initialized = true;
  }

  private createDarkTheme(): Blockly.Theme {
    return Blockly.Theme.defineTheme('pie-dark', {
      name: 'pie-dark',
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: '#1a2520',
        toolboxBackgroundColour: '#0f1a14',
        toolboxForegroundColour: '#e8f4ed',
        flyoutBackgroundColour: '#152119',
        flyoutForegroundColour: '#e8f4ed',
        flyoutOpacity: 0.95,
        scrollbarColour: '#3d8b5f',
        scrollbarOpacity: 0.5,
        insertionMarkerColour: '#4ade80',
        insertionMarkerOpacity: 0.5,
        markerColour: '#4ade80',
        cursorColour: '#4ade80'
      },
      fontStyle: {
        family: "Menlo, 'Fira Code', 'JetBrains Mono', monospace",
        weight: '500',
        size: 12
      },
      startHats: false
    });
  }

  private setupChangeListener(): void {
    if (!this.workspace) return;

    this.changeListener = () => {
      this.generateCode();
    };

    this.workspace.addChangeListener(this.changeListener);
  }

  private generateCode(): void {
    if (!this.workspace) return;

    try {
      const code = pieGenerator.instance.workspaceToCode(this.workspace);
      this.lastGeneratedCode = code;

      // Update code preview
      this.updateCodePreview(code);

      // Notify listeners
      if (this.onCodeChange) {
        this.onCodeChange(code);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      this.updateCodePreview(`; Error generating code: ${error}`);
    }
  }

  private updateCodePreview(code: string): void {
    if (this.codePreview) {
      this.codePreview.textContent = code || '; (empty workspace)';
    }
  }

  /**
   * Get the currently generated Pie code.
   */
  public getCode(): string {
    return this.lastGeneratedCode;
  }

  /**
   * Clear the workspace.
   */
  public clear(): void {
    if (this.workspace) {
      this.workspace.clear();
    }
  }

  /**
   * Resize the workspace to fit its container.
   */
  public resize(): void {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  }

  /**
   * Check if the editor has been initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Load a starter example into the workspace.
   */
  public loadStarterExample(): void {
    if (!this.workspace) return;

    this.clear();

    // Create a simple "Hello World" example:
    // (claim myZero Nat)
    // (define myZero zero)

    const claimBlock = this.workspace.newBlock('pie_claim');
    claimBlock.setFieldValue('myZero', 'NAME');
    claimBlock.initSvg();
    claimBlock.render();
    claimBlock.moveBy(50, 50);

    const natTypeBlock = this.workspace.newBlock('pie_nat');
    natTypeBlock.initSvg();
    natTypeBlock.render();

    // Connect Nat type to claim
    const claimTypeInput = claimBlock.getInput('TYPE');
    if (claimTypeInput && claimTypeInput.connection && natTypeBlock.outputConnection) {
      claimTypeInput.connection.connect(natTypeBlock.outputConnection);
    }

    const defineBlock = this.workspace.newBlock('pie_define');
    defineBlock.setFieldValue('myZero', 'NAME');
    defineBlock.initSvg();
    defineBlock.render();

    // Connect define after claim
    if (claimBlock.nextConnection && defineBlock.previousConnection) {
      claimBlock.nextConnection.connect(defineBlock.previousConnection);
    }

    const zeroBlock = this.workspace.newBlock('pie_zero');
    zeroBlock.initSvg();
    zeroBlock.render();

    // Connect zero value to define
    const defineValueInput = defineBlock.getInput('VALUE');
    if (defineValueInput && defineValueInput.connection && zeroBlock.outputConnection) {
      defineValueInput.connection.connect(zeroBlock.outputConnection);
    }

    // Generate code for the example
    this.generateCode();
  }

  /**
   * Dispose of the editor and clean up resources.
   */
  public dispose(): void {
    if (this.workspace) {
      if (this.changeListener) {
        this.workspace.removeChangeListener(this.changeListener);
      }
      this.workspace.dispose();
      this.workspace = null;
    }
    this.initialized = false;
  }

  /**
   * Get the underlying Blockly workspace.
   */
  public getWorkspace(): Blockly.WorkspaceSvg | null {
    return this.workspace;
  }

  /**
   * Serialize the current workspace state to XML.
   */
  public serializeToXml(): string {
    if (!this.workspace) return '';
    const dom = Blockly.Xml.workspaceToDom(this.workspace);
    return Blockly.Xml.domToText(dom);
  }

  /**
   * Load workspace state from XML.
   */
  public loadFromXml(xml: string): void {
    if (!this.workspace) return;
    this.clear();
    const dom = Blockly.utils.xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, this.workspace);
  }

  /**
   * Serialize the current workspace state to JSON.
   */
  public serializeToJson(): object {
    if (!this.workspace) return {};
    return Blockly.serialization.workspaces.save(this.workspace);
  }

  /**
   * Load workspace state from JSON.
   */
  public loadFromJson(state: object): void {
    if (!this.workspace) return;
    Blockly.serialization.workspaces.load(state, this.workspace);
  }
}
