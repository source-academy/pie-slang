import { useEffect, useCallback, useRef } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_KEY = 'pie.tourCompleted';
const SOURCE_COLLAPSED_KEY = 'pie.sourceCollapsed';

function hasCompletedTour(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

function markTourCompleted() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
}

const STEPS: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to Pie 🥧',
      description:
        'Pie is a tiny dependently-typed proof assistant. This short tour (~30s) shows you where everything lives. You can skip anytime.',
      showButtons: ['next', 'close'],
      nextBtnText: 'Start tour →',
    },
  },
  {
    element: '[data-tour="example-select"]',
    popover: {
      title: 'Load an example',
      description: 'Pick a worked proof here to follow along — or write your own below.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="source-editor"]',
    popover: {
      title: 'Source editor',
      description: 'Write Pie claims and definitions in this Monaco editor. Syntax-highlighted and auto-completed.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="start-proof"]',
    popover: {
      title: 'Start a proof',
      description: 'When your claim parses cleanly, click here to begin proving it on the canvas.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="canvas"]',
    popover: {
      title: 'Proof canvas',
      description: 'Your proof tree grows here. Each open goal is a node; tactics close goals as you apply them.',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tactic-palette"]',
    popover: {
      title: 'Tactic palette',
      description: 'Drag a tactic onto an open goal to apply it. Tactics are grouped by category.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="detail-panel"]',
    popover: {
      title: 'Goal details',
      description: "The selected goal's hypotheses, context, and history live here.",
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="phase-chip"]',
    popover: {
      title: 'Phase indicator',
      description: 'Authoring → Proving → Complete. Watch this chip to know where you are in the workflow.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    popover: {
      title: "You're set! 🎉",
      description:
        'Try the example dropdown to see a worked proof. Replay this tour anytime via the ? button in the topbar.',
      showButtons: ['next'],
      nextBtnText: 'Done',
    },
  },
];

export interface OnboardingTour {
  start: () => void;
  isFirstVisit: boolean;
}

export function useOnboardingTour(opts: { autoStart?: boolean } = {}): OnboardingTour {
  const { autoStart = true } = opts;
  const driverRef = useRef<Driver | null>(null);
  const restoreCollapsedRef = useRef<boolean>(false);

  const start = useCallback(() => {
    // If source panel is collapsed, expand it temporarily so steps 3/4 anchors are visible.
    let wasCollapsed = false;
    try { wasCollapsed = localStorage.getItem(SOURCE_COLLAPSED_KEY) === '1'; } catch {}
    if (wasCollapsed) {
      try { localStorage.setItem(SOURCE_COLLAPSED_KEY, '0'); } catch {}
      restoreCollapsedRef.current = true;
      // Notify the app to re-read the flag — simplest is a full reload, but we can dispatch a storage event for same-tab.
      // App reads localStorage only on mount, so we just leave it expanded; user can re-collapse manually.
    }

    if (driverRef.current) {
      driverRef.current.destroy();
    }
    const d = driver({
      showProgress: true,
      progressText: 'Step {{current}} of {{total}}',
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 8,
      smoothScroll: true,
      onDestroyed: () => {
        markTourCompleted();
      },
      steps: STEPS,
    });
    driverRef.current = d;
    d.drive();
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    if (hasCompletedTour()) return;
    // Wait one paint tick so React Flow + Monaco have mounted with non-zero size.
    const t = window.setTimeout(() => start(), 350);
    return () => window.clearTimeout(t);
  }, [autoStart, start]);

  useEffect(() => {
    return () => {
      if (driverRef.current) driverRef.current.destroy();
    };
  }, []);

  return { start, isFirstVisit: !hasCompletedTour() };
}
