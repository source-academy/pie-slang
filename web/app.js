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

const status = document.getElementById('status-pill');
const previewSummary = document.getElementById('preview-summary');
const previewOutput = document.getElementById('preview-output');

let diagnosticsWorker = null;
let monacoApi = null;

function setStatus(message) {
  if (status) {
    status.textContent = message;
  }
}

function setSummary(message, tone = 'neutral') {
  previewSummary.textContent = message;
  previewSummary.dataset.tone = tone;
}

function renderPreviewText(text, tone) {
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

function applyDiagnostics(monaco, editor, payload) {
  const { diagnostics, pretty } = payload;
  const model = editor.getModel();

  const markers = diagnostics.map(d => ({
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
    setStatus('All clear');
    renderPreviewText(pretty?.trim() ?? undefined, 'success');
    return;
  }

  const primary = diagnostics[0];
  const tone = primary.severity === 'warning' ? 'warning' : 'error';
  const label = tone === 'warning' ? 'WARNING' : 'ERROR';
  const statusLabel = diagnostics.length > 1
    ? `${diagnostics.length} issues`
    : tone === 'warning' ? 'Warning found' : 'Issue found';

  setSummary(label, tone);
  setStatus(statusLabel);
  const location = `Line ${primary.startLineNumber}, Col ${primary.startColumn}`;
  renderPreviewText(`${location}\n${primary.message}`, tone);
}

function initializeDiagnostics(editor) {
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
    setStatus('Diagnostics error');
    renderPreviewText(
      `Worker failed to load. Check browser console for details.\nError: ${error.message || 'Unknown error'}`,
      'error'
    );
  };

  return worker;
}

function initializeEditor(monaco) {
  const editor = monaco.editor.create(document.getElementById('editor'), {
    value: defaultSource,
    language: 'scheme',
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
  setStatus('Editor loaded');

  const debounced = debounce((text) => {
    if (text.trim().length === 0) {
      setSummary('Waiting for input…', 'neutral');
      renderPreviewText(undefined);
    } else {
      setSummary('Running checks…', 'warning');
      renderPreviewText('Analyzing…');
    }
    setStatus('Typing…');
  }, 120);

  const queueDiagnostics = debounce((text) => {
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

  editor.onDidBlurEditorWidget(() => {
    setStatus('Idle');
  });

  return editor;
}

function initializeExamplePicker(editor) {
  const picker = document.getElementById('example-picker');

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
    const exampleName = e.target.value;
    if (exampleName && examples[exampleName]) {
      editor.setValue(examples[exampleName]);
    }
  });
}

function boot() {
  if (!window.require) {
    setStatus('Failed to load editor runtime');
    return;
  }

  window.require.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
    }
  });

  window.require(['vs/editor/editor.main'], () => {
    monacoApi = window.monaco;
    const editor = initializeEditor(monacoApi);
    diagnosticsWorker = initializeDiagnostics(editor);
    initializeExamplePicker(editor);
    if (diagnosticsWorker) {
      diagnosticsWorker.postMessage({
        type: 'analyze',
        payload: { source: editor.getValue() }
      });
    }
    window.__pieEditor = editor;
  });
}

function debounce(fn, delay) {
  let handle;
  return function debounced(...args) {
    window.clearTimeout(handle);
    handle = window.setTimeout(() => fn.apply(this, args), delay);
  };
}

boot();
