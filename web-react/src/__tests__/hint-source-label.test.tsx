import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HintResponse } from '@pie/protocol';
import { GhostTacticNode } from '../features/proof-editor/components/nodes/GhostTacticNode';

// Handles need a live canvas; they do not affect the model attribution display.
vi.mock('@xyflow/react', async importOriginal => ({
  ...await importOriginal<typeof import('@xyflow/react')>(), Handle: () => null,
}));

function renderHint(source?: HintResponse['source'], explanationSource?: HintResponse['explanationSource']) {
  const element = document.createElement('div');
  element.innerHTML = renderToStaticMarkup(<GhostTacticNode
    id="ghost" type="ghost" dragging={false} zIndex={0} selectable deletable
    selected={false} draggable isConnectable positionAbsoluteX={0} positionAbsoluteY={0}
    data={{
      kind: 'ghost', goalId: 'goal', isLoading: false,
      hint: { level: 'tactic', tacticType: 'intro', explanation: 'Introduce n.', confidence: 0.9, source, explanationSource },
      onAccept: () => {}, onDismiss: () => {}, onMoreDetail: () => {},
    }}
  />);
  return element;
}

describe('hint model attribution', () => {
  it('shows both models and widens the card when General LLM explains a Tactic LLM suggestion', () => {
    const card = renderHint('lora', 'deepseek');
    expect(card.textContent).toContain('Tactic LLM & General LLM');
    expect(card.firstElementChild?.classList.contains('w-[420px]')).toBe(true);
    expect(card.textContent).toContain('90%');
  });

  it.each([undefined, 'template'] as const)('shows only Tactic LLM without a successful General LLM explanation (%s)', source => {
    const card = renderHint('lora', source);
    expect(card.textContent).toContain('Tactic LLM');
    expect(card.textContent).not.toContain('General LLM');
    expect(card.firstElementChild?.classList.contains('w-[340px]')).toBe(true);
  });

  it('shows only General LLM on the no-Tactic-LLM path', () => {
    const card = renderHint('deepseek');
    expect(card.textContent).toContain('General LLM');
    expect(card.textContent).not.toContain('Tactic LLM');
  });

  it.each(['rule-based', undefined] as const)('does not invent AI attribution for a rule or unattributed hint (%s)', source => {
    const card = renderHint(source);
    expect(card.textContent).toContain('Rule');
    expect(card.textContent).not.toContain('LLM');
  });
});
