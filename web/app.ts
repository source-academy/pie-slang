import { PieLanguageClient, registerPieLanguage } from './lsp/lsp-client-simple';
import { ProofTreeVisualizer } from './proof-tree/ProofTreeVisualizer';
import { ContextPanel } from './proof-tree/ContextPanel';
import { GoalPanel } from './proof-tree/GoalPanel';
import type { ProofTreeData } from './proof-tree/types';
import type * as Monaco from 'monaco-editor';
import { BlocklyEditor } from './blockly';
import { InteractiveProofController } from './interactive-proof';

// Extend Window interface to include Monaco globals
declare global {
  interface Window {
    monaco: typeof Monaco;
    require: {
      (modules: string[], callback: (...args: any[]) => void): void;
      config(config: { paths: Record<string, string> }): void;
    };
  }
}

const examples = {
  'Hello World': `(claim zero Nat)
(define zero zero)

(claim add1zero Nat)
(define add1zero (add1 zero))`,

  'Tactics: Simple Identity': `;; A simple proof using tactics
;; Goal: prove that for any Nat n, we can produce a Nat (identity function)

(claim identity
  (Π ((n Nat))
    Nat))

;; Complete this proof by dragging tactics:
;; 1. Use "intro" to introduce the variable n
;; 2. Use "exact n" to provide n as the result
(define-tactically identity
  ( (intro n)
    ;; Add (exact n) here to complete the proof
  ))`,

  'Tactics: Simple Pair': `;; Prove we can construct a pair of Nats
;; Goal type: (Pair Nat Nat)

(claim my-pair (Pair Nat Nat))

;; Complete this proof:
;; 1. Use "split" to split the pair goal into two subgoals
;; 2. Use "exact 1" for the first Nat
;; 3. Use "exact 2" for the second Nat
(define-tactically my-pair
  ( (split)
    ;; Add (exact 1) and (exact 2) here to complete
  ))`,

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
(define incremented-vec (vec-map Nat Nat 3 add1-fn nat-vec))`,
'Tactics: Even or Odd' : `
(claim +
  (→ Nat Nat
    Nat))

(claim step-plus
  (→ Nat
    Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1 ) ))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus )))

(claim double
  (→ Nat
    Nat))

(define double
  (λ (n)
    (iter-Nat n
      0
      (+ 2))))

(claim Even
  (→ Nat
    U ))

(define Even
  (λ (n)
    (Σ ((half Nat))
      (= Nat n (double half )))))

(claim Odd
  (→ Nat
    U ))

(define Odd
  (λ (n)
    (Σ ((haf Nat))
      (= Nat n (add1 (double haf )))))) 

(claim zero-is-even
  (Even 0))

(define zero-is-even
  (cons 0
    (same 0)))

(claim add1-even->odd
  (Π ((n Nat))
    (→ (Even n)
    (Odd (add1 n)))))

(define add1-even->odd
  (λ (n en)
    (cons (car en)
    (cong (cdr en) (+ 1)))))

(claim add1-odd->even
  (Π ((n Nat))
    (→ (Odd n)
      (Even (add1 n)))))

(define add1-odd->even
  (λ (n on)
    (cons (add1 (car on))
      (cong (cdr on) (+ 1)))))

(claim even-or-odd
  (Π ((n Nat))
    (Either (Even n) (Odd n))))

;; This is the proof in The Little Typer
;; (claim mot-even-or-odd
;;   (→ Nat U )) 

;; (define mot-even-or-odd
;;   (λ (k) (Either (Even k) (Odd k))))

;; (claim step-even-or-odd
;;   (Π ((n-1 Nat))
;;      (→ (mot-even-or-odd n-1)
;;      (mot-even-or-odd (add1 n-1)))))

;; (define step-even-or-odd
;;   (λ (n-1)
;;     (λ (e-or-on-1)
;;        (ind-Either e-or-on-1
;;     (λ (e-or-on-1)
;;        (mot-even-or-odd (add1 n-1)))
;;        (λ (en-1)
;;          (right
;;            (add1-even->odd
;;              n-1 en-1)))
;;        (λ (on-1)
;;          (left
;;            (add1-odd->even
;;              n-1 on-1)))))))

;; (define even-or-odd
;;   (λ (n)
;;     (ind-Nat n
;;        mot-even-or-odd
;;        (left zero-is-even)
;;        step-even-or-odd)))


;; This is the proof using our new tactic system
(define-tactically even-or-odd
  ( (intro n)
    (elimNat n)
    (left)
    (exact zero-is-even)
    (intro n-1)
    (intro e-or-on-1)
    (elimEither e-or-on-1)
    (intro xr)
    (right)
    (exact ((add1-even->odd n-1) xr))
    (intro x1)
    (left)
    ;; finish the proof with "(exact ((add1-odd->even n-1) x1))"
   ))`,
   'Inductive Type: Less Than': `;; Define Less Than relation using our new inductive type definiton
    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (claim proof-0<1 (Less-Than () (zero (add1 zero))))
    (define proof-0<1 (zero-smallest zero))

    (claim proof-1<2 (Less-Than () ((add1 zero) (add1 (add1 zero)))))
    (define proof-1<2 (add1-smaller zero (add1 zero) proof-0<1))

    (claim extract-smaller
      (Pi ((j Nat) (k Nat))
        (-> (Less-Than () (j k)) Nat)))
    (define extract-smaller
      (lambda (j k proof)
        (ind-Less-Than proof
          (lambda (j-idx k-idx p) Nat)
          (lambda (n) zero)
          (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

    (claim result Nat)
    (define result (extract-smaller zero (add1 zero) proof-0<1))
    `,
    'Inductive Type: Subtype':`
(data Subtype () ((T1 U) (T2 U))
  (refl ((T U))
    (Subtype () (T T)))
  (trans ((T1 U) (T2 U) (T3 U)
          (p1 (Subtype () (T1 T2)))
          (p2 (Subtype () (T2 T3))))
    (Subtype () (T1 T3)))
  ;; Generic injection: if there exists a function A -> B, then A <: B
  (inject ((A U) (B U) (f (-> A B)))
    (Subtype () (A B)))
  ind-Subtype)

(claim coerce
  (Pi ((A U) (B U))
    (-> (Subtype () (A B)) A B)))
(define coerce
  (lambda (A B proof val)
    ((ind-Subtype proof
      (lambda (t1 t2 sub) (-> t1 t2))
      (lambda (TT x) x)
      (lambda (T11 T22 T33 p1 p2 ih1 ih2 x)
        (ih2 (ih1 x)))
      (lambda (AA BB ff x) (ff x))
      )
      val)))

(data Even () ((n Nat))
  (zero-even ()
    (Even () (zero)))
  (add2-even ((k Nat) (k-even (Even () (k))))
    (Even () ((add1 (add1 k)))))
  ind-Even)

(claim even-to-nat
  (Pi ((n Nat))
    (-> (Even () (n)) Nat)))
(define even-to-nat
  (lambda (n proof)
    (ind-Even proof
      (lambda (m ev) Nat)
      zero
      (lambda (k prev ih) (add1 (add1 ih))))))

(claim even-subtype-nat
  (Pi ((n Nat))
    (Subtype () ((Even () (n)) Nat))))
(define even-subtype-nat
  (lambda (n)
    (inject (Even () (n)) Nat (even-to-nat n))))

(claim + (-> Nat Nat Nat))
(define +
  (lambda (a b)
    (rec-Nat a
      b
      (lambda (pred ih) (add1 ih)))))

(claim double (-> Nat Nat))
(define double
  (lambda (n)
    (+ n n)))

;; Use Even with double
(claim double-even
  (Pi ((n Nat))
    (-> (Even () (n)) Nat)))
(define double-even
  (lambda (n ev)
    (double (coerce (Even () (n)) Nat
                    (even-subtype-nat n)
                    ev))))


(claim even-four (Even () ((add1 (add1 (add1 (add1 zero)))))))
(define even-four
  (add2-even (add1 (add1 zero))
    (add2-even zero
      (zero-even))))

(claim result2 Nat)
(define result2 (double-even (add1 (add1 (add1 (add1 zero)))) even-four))
        `
};

const defaultSource = examples['Hello World'];

const previewSummary = document.getElementById('preview-summary') as HTMLElement;
const previewOutput = document.getElementById('preview-output') as HTMLElement;

let diagnosticsWorker: Worker | null = null;
let lspClient: PieLanguageClient | null = null;
let monacoApi: typeof Monaco | null = null;
let proofTreeVisualizer: ProofTreeVisualizer | null = null;
let contextPanel: ContextPanel | null = null;
let goalPanel: GoalPanel | null = null;
let blocklyEditor: BlocklyEditor | null = null;
let interactiveProofController: InteractiveProofController | null = null;
let currentMode: 'text' | 'blocks' | 'interactive' = 'text';
let currentProofTree: ProofTreeData | undefined = undefined;

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

function updateProofTree(proofTree: ProofTreeData | undefined) {
  const container = document.getElementById('proof-tree-container');
  if (!container) return;

  if (!proofTree) {
    // Hide the proof tree panel
    container.style.display = 'none';
    if (proofTreeVisualizer) {
      proofTreeVisualizer.clear();
    }
    if (contextPanel) {
      contextPanel.clear();
    }
    if (goalPanel) {
      goalPanel.clear();
    }
    return;
  }

  // Show the proof tree panel
  container.style.display = 'flex';

  // Render the tree
  if (proofTreeVisualizer) {
    proofTreeVisualizer.render(proofTree);
  }

  // Clear panels (user needs to click a goal)
  if (contextPanel) {
    contextPanel.clear();
  }
  if (goalPanel) {
    goalPanel.clear();
  }
}

function initializeProofTreeVisualizer() {
  const canvasContainer = document.getElementById('proof-tree-canvas');
  const contextContainer = document.getElementById('proof-context-panel');
  const goalContainer = document.getElementById('proof-goal-panel');
  const toggleBtn = document.getElementById('proof-tree-toggle');
  const container = document.getElementById('proof-tree-container');

  if (!canvasContainer || !contextContainer || !goalContainer) {
    console.warn('Proof tree containers not found');
    return;
  }

  proofTreeVisualizer = new ProofTreeVisualizer(canvasContainer);
  contextPanel = new ContextPanel(contextContainer);
  goalPanel = new GoalPanel(goalContainer);

  // Connect goal selection to both panels
  proofTreeVisualizer.setOnGoalSelect((goal) => {
    if (contextPanel) {
      contextPanel.display(goal);
    }
    if (goalPanel) {
      goalPanel.display(goal);
    }
    if (proofTreeVisualizer) {
      proofTreeVisualizer.highlightGoal(goal.id);
    }
  });

  // Toggle button functionality
  if (toggleBtn && container) {
    toggleBtn.addEventListener('click', () => {
      const content = container.querySelector('.proof-tree-content') as HTMLElement;
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'flex';
          toggleBtn.textContent = 'Hide';
        } else {
          content.style.display = 'none';
          toggleBtn.textContent = 'Show';
        }
      }
    });
  }
}

function applyDiagnostics(monaco: typeof Monaco, editor: Monaco.editor.IStandaloneCodeEditor, payload: any) {
  const { diagnostics, pretty, proofTree } = payload;
  const model = editor.getModel();

  // Store proof tree for use when switching to interactive mode
  currentProofTree = proofTree;

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

  // Update proof tree visualization (for text/blocks modes)
  if (currentMode !== 'interactive') {
    updateProofTree(proofTree);
  }

  // Update interactive proof controller if active
  if (currentMode === 'interactive' && interactiveProofController && proofTree) {
    interactiveProofController.setProofTree(proofTree);
  }

  if (diagnostics.length === 0) {
    if (currentMode !== 'interactive') {
      setSummary('SUCCESS', 'success');
      renderPreviewText(pretty?.trim() ?? undefined, 'success');
    }
    return;
  }

  const primary = diagnostics[0];
  const tone = primary.severity === 'warning' ? 'warning' : 'error';
  const label = tone === 'warning' ? 'WARNING' : 'ERROR';

  if (currentMode !== 'interactive') {
    setSummary(label, tone);
    const location = `Line ${primary.startLineNumber}, Col ${primary.startColumn}`;
    renderPreviewText(`${location}\n${primary.message}`, tone);
  }
}

function initializeDiagnostics(editor: Monaco.editor.IStandaloneCodeEditor) {
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

async function initializeLSP(monacoLib: typeof Monaco, editor: Monaco.editor.IStandaloneCodeEditor) {
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

function initializeEditor(monaco: typeof Monaco) {
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

function initializeCopyButton(editor: Monaco.editor.IStandaloneCodeEditor) {
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    const code = editor.getValue();
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = 'Copied!';
      copyBtn.dataset.copied = 'true';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        delete copyBtn.dataset.copied;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
      copyBtn.textContent = 'Failed';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    }
  });
}

function initializeExamplePicker(editor: Monaco.editor.IStandaloneCodeEditor) {
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

function initializeBlocklyEditor() {
  const container = document.getElementById('blockly-workspace');
  const codePreview = document.getElementById('blockly-code-preview');

  if (!container || !codePreview) {
    console.error('Blockly container elements not found');
    return null;
  }

  const editor = new BlocklyEditor({
    container,
    codePreview,
    onCodeChange: (code: string) => {
      // Only run diagnostics if we're in blocks mode
      if (currentMode === 'blocks' && diagnosticsWorker) {
        if (code.trim().length === 0) {
          setSummary('Waiting for blocks…', 'neutral');
          renderPreviewText('; (empty workspace)');
        } else {
          setSummary('Running checks…', 'warning');
          diagnosticsWorker.postMessage({
            type: 'analyze',
            payload: { source: code }
          });
        }
      }
    }
  });

  // Load starter example
  editor.loadStarterExample();

  return editor;
}

function initializeModeToggle(monacoEditor: Monaco.editor.IStandaloneCodeEditor) {
  const textBtn = document.getElementById('mode-text') as HTMLButtonElement;
  const blocksBtn = document.getElementById('mode-blocks') as HTMLButtonElement;
  const interactiveBtn = document.getElementById('mode-interactive') as HTMLButtonElement;
  const monacoContainer = document.getElementById('editor') as HTMLElement;
  const blocklyContainer = document.getElementById('blockly-container') as HTMLElement;
  const interactiveContainer = document.getElementById('interactive-container') as HTMLElement;
  const examplePicker = document.getElementById('example-picker') as HTMLSelectElement;

  if (!textBtn || !blocksBtn || !monacoContainer || !blocklyContainer) {
    console.error('Mode toggle elements not found');
    return;
  }

  function updateModeButtons(activeMode: 'text' | 'blocks' | 'interactive') {
    textBtn.classList.toggle('mode-btn--active', activeMode === 'text');
    blocksBtn.classList.toggle('mode-btn--active', activeMode === 'blocks');
    if (interactiveBtn) {
      interactiveBtn.classList.toggle('mode-btn--active', activeMode === 'interactive');
    }
  }

  function switchToTextMode() {
    if (currentMode === 'text') return;
    currentMode = 'text';

    // Update button states
    updateModeButtons('text');

    // Show/hide editors
    monacoContainer.style.display = '';
    blocklyContainer.style.display = 'none';
    if (interactiveContainer) {
      interactiveContainer.style.display = 'none';
    }

    // Show example picker in text mode
    if (examplePicker) {
      examplePicker.style.display = '';
    }

    // Re-run diagnostics for Monaco editor content
    if (diagnosticsWorker) {
      const content = monacoEditor.getValue();
      if (content.trim().length === 0) {
        setSummary('Waiting for input…', 'neutral');
        renderPreviewText(undefined);
      } else {
        setSummary('Running checks…', 'warning');
        diagnosticsWorker.postMessage({
          type: 'analyze',
          payload: { source: content }
        });
      }
    }
  }

  function switchToBlocksMode() {
    if (currentMode === 'blocks') return;
    currentMode = 'blocks';

    // Update button states
    updateModeButtons('blocks');

    // Show/hide editors
    monacoContainer.style.display = 'none';
    blocklyContainer.style.display = '';
    if (interactiveContainer) {
      interactiveContainer.style.display = 'none';
    }

    // Hide example picker in blocks mode (not applicable)
    if (examplePicker) {
      examplePicker.style.display = 'none';
    }

    // Initialize Blockly editor if not already done
    if (!blocklyEditor) {
      blocklyEditor = initializeBlocklyEditor();
    }

    // Resize Blockly workspace to fit container
    if (blocklyEditor) {
      blocklyEditor.resize();

      // Run diagnostics for Blockly generated code
      const code = blocklyEditor.getCode();
      if (diagnosticsWorker) {
        if (code.trim().length === 0) {
          setSummary('Waiting for blocks…', 'neutral');
          renderPreviewText('; (empty workspace)');
        } else {
          setSummary('Running checks…', 'warning');
          diagnosticsWorker.postMessage({
            type: 'analyze',
            payload: { source: code }
          });
        }
      }
    }
  }

  function switchToInteractiveMode() {
    if (currentMode === 'interactive') return;
    currentMode = 'interactive';

    // Update button states
    updateModeButtons('interactive');

    // Show/hide editors
    monacoContainer.style.display = 'none';
    blocklyContainer.style.display = 'none';
    if (interactiveContainer) {
      interactiveContainer.style.display = '';
    }

    // Hide example picker in interactive mode
    if (examplePicker) {
      examplePicker.style.display = 'none';
    }

    // Initialize interactive proof controller if not already done
    if (!interactiveProofController && interactiveContainer) {
      initializeInteractiveProof(monacoEditor);
    }

    // Pass current proof tree to interactive controller
    if (interactiveProofController && currentProofTree) {
      interactiveProofController.setProofTree(currentProofTree);
    }

    // Update summary
    setSummary('Interactive Proof Mode', 'neutral');
    renderPreviewText('Select a claim to prove interactively.\n\nDrag tactics from the palette onto goal nodes to build your proof.');
  }

  textBtn.addEventListener('click', switchToTextMode);
  blocksBtn.addEventListener('click', switchToBlocksMode);
  if (interactiveBtn) {
    interactiveBtn.addEventListener('click', switchToInteractiveMode);
  }
}

function initializeInteractiveProof(monacoEditor: Monaco.editor.IStandaloneCodeEditor) {
  const treeContainer = document.getElementById('interactive-tree') as HTMLElement;
  const paletteContainer = document.getElementById('interactive-palette') as HTMLElement;
  const detailsContainer = document.getElementById('interactive-details') as HTMLElement;

  if (!treeContainer || !paletteContainer || !detailsContainer) {
    console.error('Interactive proof containers not found');
    return;
  }

  interactiveProofController = new InteractiveProofController({
    treeContainer,
    paletteContainer,
    detailsContainer,
    onStateChange: (state) => {
      // Update UI based on state changes
      if (state.isComplete) {
        setSummary('PROOF COMPLETE', 'success');
      } else if (state.selectedGoalId) {
        setSummary(`Goal: ${state.selectedGoalId}`, 'neutral');
      }
    },
    onProofComplete: (code) => {
      // Show generated code
      renderPreviewText(code, 'success');
    },
    onError: (message) => {
      // Show error
      setSummary('ERROR', 'error');
      renderPreviewText(message, 'error');
    },
    onModifySource: (modifiedSource) => {
      // Update the editor with the modified source
      monacoEditor.setValue(modifiedSource);
      // The editor change will trigger re-analysis automatically
    }
  });

  // Initialize with the diagnostics worker
  if (diagnosticsWorker) {
    interactiveProofController.initialize(diagnosticsWorker);
  }

  // Set up source context from Monaco editor
  interactiveProofController.updateSourceContext(monacoEditor.getValue());

  // Update source context when editor changes
  monacoEditor.onDidChangeModelContent(() => {
    if (interactiveProofController) {
      interactiveProofController.updateSourceContext(monacoEditor.getValue());
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
    initializeCopyButton(editor);
    initializeProofTreeVisualizer();
    initializeModeToggle(editor);

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
