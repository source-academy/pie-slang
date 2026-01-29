import * as Comlink from 'comlink';

/**
 * Diagnostics Worker API
 *
 * This worker handles code analysis and provides diagnostics for the code editor.
 * It runs syntax checking, type checking, and provides hover information.
 */

export interface DiagnosticsWorkerAPI {
  /**
   * Check source code for errors and warnings
   */
  checkSource(sourceCode: string): Promise<DiagnosticsResult>;

  /**
   * Get hover information at a specific position
   */
  getHoverInfo(
    sourceCode: string,
    line: number,
    column: number
  ): Promise<HoverInfo | null>;

  /**
   * Get completions at a specific position
   */
  getCompletions(
    sourceCode: string,
    line: number,
    column: number
  ): Promise<CompletionItem[]>;
}

export interface DiagnosticsResult {
  diagnostics: Diagnostic[];
  parseSuccessful: boolean;
  typeCheckSuccessful: boolean;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: Range;
  source: 'parser' | 'typechecker';
}

export interface Range {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface HoverInfo {
  type: string;
  documentation?: string;
}

export interface CompletionItem {
  label: string;
  kind: 'keyword' | 'function' | 'variable' | 'type';
  detail?: string;
  insertText?: string;
}

// Stub implementation - to be replaced with actual Pie integration
const diagnosticsWorkerAPI: DiagnosticsWorkerAPI = {
  async checkSource(_sourceCode) {
    // TODO: Integrate with Pie interpreter
    return {
      diagnostics: [],
      parseSuccessful: true,
      typeCheckSuccessful: true,
    };
  },

  async getHoverInfo(_sourceCode, _line, _column) {
    // TODO: Integrate with Pie interpreter
    return null;
  },

  async getCompletions(_sourceCode, _line, _column) {
    // TODO: Integrate with Pie interpreter
    return [];
  },
};

Comlink.expose(diagnosticsWorkerAPI);
