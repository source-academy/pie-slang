import { PieLanguageClient, registerPieLanguage } from './lsp/lsp-client-simple';
import * as monaco from 'monaco-editor';

const examples = {
  'Hello World': `(claim zero Nat)
(define zero zero)

(claim add1zero Nat)
(define add1zero (add1 zero))`,

  'Natural Number Addition': `(claim +
  (→ Nat Nat Nat))

(claim step-plus
  (→ Nat Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1)))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus)))

(claim result Nat)
(define result (+ 2 3))`,

  'List Length': `(claim length
  (Π ((E U))
    (→ (List E) Nat)))

(claim step-length
  (Π ((E U))
    (→ E (List E) Nat Nat)))

(define step-length
  (λ (E)
    (λ (e es length-es)
      (add1 length-es))))

(define length
  (λ (E)
    (λ (es)
      (rec-List es
        0
        (step-length E)))))

(claim my-list (List Nat))
(define my-list (:: 1 (:: 2 (:: 3 nil))))

(claim list-len Nat)
(define list-len (length Nat my-list))`,

  'Either Type': `(claim either-swap
  (Pi ((A U) (B U))
    (-> (Either A B)
        (Either B A))))

(define either-swap
  (lambda (A B)
    (lambda (e)
      (ind-Either e
        (lambda (x) (Either B A))
        (lambda (a) (right a))
        (lambda (b) (left b))))))

(claim test-either (Either Nat Nat))
(define test-either (left zero))

(claim swapped (Either Nat Nat))
(define swapped (either-swap Nat Nat test-either))`,

  'Vector Map': `(claim vec-map
  (Π ((A U) (B U) (n Nat))
     (-> (-> A B) (Vec A n)
         (Vec B n))))

(define vec-map
  (λ (A B n)
    (λ (f vs)
      (ind-Vec n vs
        (λ (k xs) (Vec B k))
        vecnil
        (λ (k x xs ih) (vec:: (f x) ih))))))

(claim nat-vec (Vec Nat 3))
(define nat-vec (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))

(claim add1-fn (-> Nat Nat))
(define add1-fn (λ (n) (add1 n)))

(claim incremented-vec (Vec Nat 3))
(define incremented-vec (vec-map Nat Nat 3 add1-fn nat-vec))`
};

const defaultSource = examples['Hello World'];

const previewSummary = document.getElementById('preview-summary') as HTMLElement;
const previewOutput = document.getElementById('preview-output') as HTMLElement;

let diagnosticsWorker: Worker | null = null;
let lspClient: PieLanguageClient | null = null;
let monacoApi: typeof monaco | null = null;

function setSummary(message: string, tone: 'neutral' | 'success' | 'warning' | 'error' = 'neutral') {
  if (previewSummary) {
    previewSummary.textContent = message;
    previewSummary.dataset.tone = tone;
  }
}

function renderPreviewText(text: string | undefined, tone?: 'neutral' | 'success' | 'warning' | 'error') {
  if (tone) {
    previewOutput.dataset.tone = tone;
  } else {
    delete previewOutput.dataset.tone;
  }

  if (text === undefined) {
    previewOutput.textContent = 'Program is empty.';
  } else {
    previewOutput.textContent = text;
  }
}

function applyDiagnostics(monaco: typeof import('monaco-editor'), editor: monaco.editor.IStandaloneCodeEditor, payload: any) {
  const { diagnostics, pretty } = payload;
  const model = editor.getModel();

  if (!model) return;

  const markers = diagnostics.map((d: any) => ({
    startLineNumber: d.startLineNumber,
    startColumn: d.startColumn,
    endLineNumber: d.endLineNumber,
    endColumn: d.endColumn,
    message: d.message,
    severity: d.severity === 'warning'
      ? monaco.MarkerSeverity.Warning
      : monaco.MarkerSeverity.Error
  }));

  monaco.editor.setModelMarkers(model, 'pie-playground', markers);

  if (diagnostics.length === 0) {
    setSummary('SUCCESS', 'success');
    renderPreviewText(pretty?.trim() ?? undefined, 'success');
    return;
  }

  const primary = diagnostics[0];
  const tone = primary.severity === 'warning' ? 'warning' : 'error';
  const label = tone === 'warning' ? 'WARNING' : 'ERROR';

  setSummary(label, tone);
  const location = `Line ${primary.startLineNumber}, Col ${primary.startColumn}`;
  renderPreviewText(`${location}\n${primary.message}`, tone);
}

function initializeDiagnostics(editor: monaco.editor.IStandaloneCodeEditor) {
  if (!('Worker' in window)) {
    setSummary('Diagnostics unavailable in this browser.', 'warning');
    return null;
  }

  const worker = new Worker('diagnostics-worker.js', { type: 'module' });
  worker.onmessage = event => {
    const { type, payload } = event.data;
    if (type === 'diagnostics' && monacoApi) {
      applyDiagnostics(monacoApi, editor, payload);
    }
  };

  worker.onerror = (error) => {
    console.error('Worker error event:', error);
    console.error('Error details:', {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno
    });
    setSummary('Diagnostics worker crashed.', 'error');
    renderPreviewText(
      `Worker failed to load. Check browser console for details.\nError: ${error.message || 'Unknown error'}`,
      'error'
    );
  };

  return worker;
}

async function initializeLSP(monacoLib: typeof monaco, editor: monaco.editor.IStandaloneCodeEditor) {
  try {
    if (lspClient && lspClient.isRunning()) {
      await lspClient.stop();
    }

    lspClient = new PieLanguageClient(monacoLib, editor);
    await lspClient.start();
    console.log('LSP client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize LSP client:', error);
    setSummary('LSP features unavailable', 'warning');
  }
}

function initializeEditor(monaco: typeof import('monaco-editor')) {
  // Register Pie language
  registerPieLanguage(monaco);

  const editor = monaco.editor.create(document.getElementById('editor')!, {
    value: defaultSource,
    language: 'pie',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 6,
      verticalSliderSize: 4
    },
    padding: { top: 16 },
    fontSize: 14,
    fontFamily: "Menlo, 'Fira Code', 'JetBrains Mono', monospace",
    smoothScrolling: true
  });

  renderPreviewText(defaultSource.trim());
  setSummary('Ready for analysis.', 'neutral');

  const debounced = debounce((text: string) => {
    if (text.trim().length === 0) {
      setSummary('Waiting for input…', 'neutral');
      renderPreviewText(undefined);
    } else {
      setSummary('Running checks…', 'warning');
      renderPreviewText('Analyzing…');
    }
  }, 120);

  const queueDiagnostics = debounce((text: string) => {
    setSummary('Running checks…', 'warning');
    if (diagnosticsWorker) {
      diagnosticsWorker.postMessage({
        type: 'analyze',
        payload: { source: text }
      });
    }
  }, 220);

  editor.onDidChangeModelContent(() => {
    const content = editor.getValue();
    debounced(content);
    queueDiagnostics(content);
  });

  return editor;
}

function initializeExamplePicker(editor: monaco.editor.IStandaloneCodeEditor) {
  const picker = document.getElementById('example-picker') as HTMLSelectElement;

  if (!picker) return;

  // Populate the dropdown
  Object.keys(examples).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    picker.appendChild(option);
  });

  // Set initial value
  picker.value = 'Hello World';

  // Handle selection
  picker.addEventListener('change', (e) => {
    const exampleName = (e.target as HTMLSelectElement).value;
    if (exampleName && examples[exampleName as keyof typeof examples]) {
      editor.setValue(examples[exampleName as keyof typeof examples]);
    }
  });
}

async function boot() {
  if (!window.require) {
    console.error('Monaco loader not available');
    return;
  }

  window.require.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
    }
  });

  window.require(['vs/editor/editor.main'], async () => {
    monacoApi = window.monaco;
    const editor = initializeEditor(monacoApi);
    diagnosticsWorker = initializeDiagnostics(editor);
    initializeExamplePicker(editor);

    // Initialize LSP
    if (monacoApi) {
      await initializeLSP(monacoApi, editor);
    }

    if (diagnosticsWorker) {
      diagnosticsWorker.postMessage({
        type: 'analyze',
        payload: { source: editor.getValue() }
      });
    }

    (window as any).__pieEditor = editor;
  });
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let handle: number;
  return function debounced(this: any, ...args: Parameters<T>) {
    window.clearTimeout(handle);
    handle = window.setTimeout(() => fn.apply(this, args), delay);
  };
}

boot();
