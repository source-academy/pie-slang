import {
  PieLanguageClient,
  registerPieLanguage,
} from "./lsp/lsp-client-simple";
import type * as Monaco from "monaco-editor";

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
  "Hello World": `(claim zero Nat)
(define zero zero)

(claim add1zero Nat)
(define add1zero (add1 zero))`,

  "Natural Number Addition": `(claim +
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

  "List Length": `(claim length
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

  "Either Type": `(claim either-swap
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

  "Vector Map": `(claim vec-map
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
  "Tactics: Even or Odd": `
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
  "Inductive Type: Less Than": `;; Define Less Than relation using our new inductive type definiton
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
  "Inductive Type: Subtype": `
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
        `,
};

const defaultSource = examples["Hello World"];

const previewSummary = document.getElementById(
  "preview-summary",
) as HTMLElement;
const previewOutput = document.getElementById("preview-output") as HTMLElement;

let diagnosticsWorker: Worker | null = null;
let lspClient: PieLanguageClient | null = null;
let monacoApi: typeof Monaco | null = null;

function setSummary(
  message: string,
  tone: "neutral" | "success" | "warning" | "error" = "neutral",
) {
  if (previewSummary) {
    previewSummary.textContent = message;
    previewSummary.dataset.tone = tone;
  }
}

function renderPreviewText(
  text: string | undefined,
  tone?: "neutral" | "success" | "warning" | "error",
) {
  if (tone) {
    previewOutput.dataset.tone = tone;
  } else {
    delete previewOutput.dataset.tone;
  }

  if (text === undefined) {
    previewOutput.textContent = "Program is empty.";
  } else {
    previewOutput.textContent = text;
  }
}

function applyDiagnostics(
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  payload: any,
) {
  const { diagnostics, pretty } = payload;
  const model = editor.getModel();

  if (!model) return;

  const markers = diagnostics.map((d: any) => ({
    startLineNumber: d.startLineNumber,
    startColumn: d.startColumn,
    endLineNumber: d.endLineNumber,
    endColumn: d.endColumn,
    message: d.message,
    severity:
      d.severity === "warning"
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Error,
  }));

  monaco.editor.setModelMarkers(model, "pie-playground", markers);

  if (diagnostics.length === 0) {
    setSummary("SUCCESS", "success");
    renderPreviewText(pretty?.trim() ?? undefined, "success");
    return;
  }

  const primary = diagnostics[0];
  const tone = primary.severity === "warning" ? "warning" : "error";
  const label = tone === "warning" ? "WARNING" : "ERROR";

  setSummary(label, tone);
  const location = `Line ${primary.startLineNumber}, Col ${primary.startColumn}`;
  renderPreviewText(`${location}\n${primary.message}`, tone);
}

function initializeDiagnostics(editor: Monaco.editor.IStandaloneCodeEditor) {
  if (!("Worker" in window)) {
    setSummary("Diagnostics unavailable in this browser.", "warning");
    return null;
  }

  const worker = new Worker("diagnostics-worker.js", { type: "module" });
  worker.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === "diagnostics" && monacoApi) {
      applyDiagnostics(monacoApi, editor, payload);
    }
  };

  worker.onerror = (error) => {
    console.error("Worker error event:", error);
    console.error("Error details:", {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
    });
    setSummary("Diagnostics worker crashed.", "error");
    renderPreviewText(
      `Worker failed to load. Check browser console for details.\nError: ${error.message || "Unknown error"}`,
      "error",
    );
  };

  return worker;
}

async function initializeLSP(
  monacoLib: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
) {
  try {
    if (lspClient && lspClient.isRunning()) {
      await lspClient.stop();
    }

    lspClient = new PieLanguageClient(monacoLib, editor);
    await lspClient.start();
    console.log("LSP client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize LSP client:", error);
    setSummary("LSP features unavailable", "warning");
  }
}

function initializeEditor(monaco: typeof Monaco) {
  // Register Pie language
  registerPieLanguage(monaco);

  const editor = monaco.editor.create(document.getElementById("editor")!, {
    value: defaultSource,
    language: "pie",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    scrollbar: {
      vertical: "auto",
      horizontal: "auto",
      useShadows: false,
      verticalScrollbarSize: 6,
      verticalSliderSize: 4,
    },
    padding: { top: 16 },
    fontSize: 14,
    fontFamily: "Menlo, 'Fira Code', 'JetBrains Mono', monospace",
    smoothScrolling: true,
  });

  renderPreviewText(defaultSource.trim());
  setSummary("Ready for analysis.", "neutral");

  const debounced = debounce((text: string) => {
    if (text.trim().length === 0) {
      setSummary("Waiting for input…", "neutral");
      renderPreviewText(undefined);
    } else {
      setSummary("Running checks…", "warning");
      renderPreviewText("Analyzing…");
    }
  }, 120);

  const queueDiagnostics = debounce((text: string) => {
    setSummary("Running checks…", "warning");
    if (diagnosticsWorker) {
      diagnosticsWorker.postMessage({
        type: "analyze",
        payload: { source: text },
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

function initializeExamplePicker(editor: Monaco.editor.IStandaloneCodeEditor) {
  const picker = document.getElementById("example-picker") as HTMLSelectElement;

  if (!picker) return;

  // Populate the dropdown
  Object.keys(examples).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    picker.appendChild(option);
  });

  // Set initial value
  picker.value = "Hello World";

  // Handle selection
  picker.addEventListener("change", (e) => {
    const exampleName = (e.target as HTMLSelectElement).value;
    if (exampleName && examples[exampleName as keyof typeof examples]) {
      editor.setValue(examples[exampleName as keyof typeof examples]);
    }
  });
}

async function boot() {
  if (!window.require) {
    console.error("Monaco loader not available");
    return;
  }

  window.require.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs",
    },
  });

  window.require(["vs/editor/editor.main"], async () => {
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
        type: "analyze",
        payload: { source: editor.getValue() },
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
