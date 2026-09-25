import * as Comlink from 'comlink';
import { PieFrontend } from '@pie/frontend';
import type { Diagnostic, DiagnosticRange } from '@pie/protocol';
export type { Diagnostic } from '@pie/protocol';
export type Range = DiagnosticRange;

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

export const diagnosticsWorkerAPI: DiagnosticsWorkerAPI = {
  async checkSource(sourceCode) {
    const result = new PieFrontend().analyze(sourceCode);
    return {
      diagnostics: result.diagnostics,
      parseSuccessful: !result.diagnostics.some(diagnostic => diagnostic.source === 'parser'),
      typeCheckSuccessful: result.success,
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
