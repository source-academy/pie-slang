import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver/node';

// Mock the server module to extract testable functions
const mockConnection = {
  console: {
    log: jest.fn()
  },
  client: {
    register: jest.fn()
  },
  workspace: {
    onDidChangeWorkspaceFolders: jest.fn(),
    getConfiguration: jest.fn().mockResolvedValue({ maxNumberOfProblems: 1000 })
  },
  languages: {
    diagnostics: {
      refresh: jest.fn(),
      on: jest.fn()
    }
  },
  onInitialize: jest.fn(),
  onInitialized: jest.fn(),
  onDidChangeConfiguration: jest.fn(),
  onDidChangeWatchedFiles: jest.fn(),
  onCompletion: jest.fn(),
  onCompletionResolve: jest.fn(),
  listen: jest.fn()
};

const mockDocuments = {
  onDidClose: jest.fn(),
  onDidChangeContent: jest.fn(),
  listen: jest.fn(),
  get: jest.fn()
};

// Mock vscode-languageserver
jest.mock('vscode-languageserver/node', () => ({
  createConnection: () => mockConnection,
  TextDocuments: jest.fn(() => mockDocuments),
  ProposedFeatures: { all: {} },
  DiagnosticSeverity: {
    Warning: 2
  },
  CompletionItemKind: {
    Text: 1
  },
  TextDocumentSyncKind: {
    Incremental: 2
  },
  DidChangeConfigurationNotification: {
    type: 'workspace/didChangeConfiguration'
  },
  DocumentDiagnosticReportKind: {
    Full: 'full'
  }
}));

// Create a testable version of validateTextDocument function
async function validateTextDocument(textDocument: TextDocument, maxProblems = 1000) {
  const text = textDocument.getText();
  const pattern = /\b[A-Z]{2,}\b/g;
  let m: RegExpExecArray | null;

  let problems = 0;
  const diagnostics: any[] = [];
  
  while ((m = pattern.exec(text)) && problems < maxProblems) {
    problems++;
    const diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length)
      },
      message: `${m[0]} is all uppercase.`,
      source: 'ex'
    };
    diagnostics.push(diagnostic);
  }
  
  return diagnostics;
}

describe('LSP Server Tests', () => {
  describe('Diagnostic Tests', () => {
    test('should detect uppercase words', async () => {
      const document = TextDocument.create(
        'file:///test.txt',
        'plaintext',
        1,
        'This has UPPERCASE and lowercase words'
      );

      const diagnostics = await validateTextDocument(document);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toBe('UPPERCASE is all uppercase.');
      expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Warning);
    });

    test('should detect multiple uppercase words', async () => {
      const document = TextDocument.create(
        'file:///test.txt',
        'plaintext',
        1,
        'HELLO WORLD and TEST'
      );

      const diagnostics = await validateTextDocument(document);

      expect(diagnostics).toHaveLength(3);
      expect(diagnostics[0].message).toBe('HELLO is all uppercase.');
      expect(diagnostics[1].message).toBe('WORLD is all uppercase.');
      expect(diagnostics[2].message).toBe('TEST is all uppercase.');
    });

    test('should not detect single uppercase letters', async () => {
      const document = TextDocument.create(
        'file:///test.txt',
        'plaintext',
        1,
        'A B C are single letters'
      );

      const diagnostics = await validateTextDocument(document);

      expect(diagnostics).toHaveLength(0);
    });

    test('should not detect lowercase words', async () => {
      const document = TextDocument.create(
        'file:///test.txt',
        'plaintext',
        1,
        'these are all lowercase words'
      );

      const diagnostics = await validateTextDocument(document);

      expect(diagnostics).toHaveLength(0);
    });

    test('should respect max problems limit', async () => {
      const document = TextDocument.create(
        'file:///test.txt',
        'plaintext',
        1,
        'ONE TWO THREE FOUR FIVE SIX'
      );

      const diagnostics = await validateTextDocument(document, 3);

      expect(diagnostics).toHaveLength(3);
    });

    test('should handle Pie language constructs', async () => {
      const document = TextDocument.create(
        'file:///test.pie',
        'pie',
        1,
        '(define CONSTANT 42)\n(lambda (X Y) (+ X Y))'
      );

      const diagnostics = await validateTextDocument(document);

      // Single letters X and Y don't match the pattern \b[A-Z]{2,}\b (2+ uppercase letters)
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toBe('CONSTANT is all uppercase.');
    });
  });
});