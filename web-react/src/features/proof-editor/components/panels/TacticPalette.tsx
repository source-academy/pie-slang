import { useUIStore } from '../../store';
import {
  getTacticsByCategory,
  CATEGORY_NAMES,
  type TacticInfo,
  type TacticCategory,
} from '../../data/tactics';

// Single-char glyph for each tactic (or first letter fallback)
const TACTIC_GLYPH: Partial<Record<string, string>> = {
  intro: 'i',
  exact: 'e',
  exists: '∃',
  split: 's',
  left: 'l',
  right: 'r',
  elimNat: 'N',
  elimList: 'L',
  elimVec: 'V',
  elimEither: 'E',
  elimEqual: '=',
  elimAbsurd: '⊥',
  apply: 'a',
  then: '↪',
  'go-Left': '←',
  'go-Right': '→',
};

function getGlyph(tactic: TacticInfo): string {
  return TACTIC_GLYPH[tactic.type] ?? tactic.displayName.charAt(0).toUpperCase();
}

function getTag(tactic: TacticInfo): string {
  if (tactic.requiresContextVar) return 'ctx';
  return '—';
}

export function TacticPalette() {
  const tacticsByCategory = getTacticsByCategory();

  return (
    <>
      <div className="pe-panel-head">
        <h3>Tactics</h3>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--pe-mono-font)', fontSize: 10.5, color: 'var(--pe-faint)' }}>
          drag →
        </span>
      </div>

      <div className="pe-tactics-body">
        {(Object.keys(tacticsByCategory) as TacticCategory[])
          .filter((cat) => tacticsByCategory[cat]?.length > 0)
          .map((category) => (
            <div key={category} className="pe-t-cat">
              <div className="pe-t-cat-head">
                <span className="label">{CATEGORY_NAMES[category]}</span>
                <span className="count">{tacticsByCategory[category].length}</span>
              </div>
              {tacticsByCategory[category].map((tactic) => (
                <DraggableTactic key={tactic.type} tactic={tactic} />
              ))}
            </div>
          ))}
      </div>
    </>
  );
}

function DraggableTactic({ tactic }: { tactic: TacticInfo }) {
  const setDraggingTactic = useUIStore((s) => s.setDraggingTactic);
  const clearDragState = useUIStore((s) => s.clearDragState);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/tactic-type', tactic.type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingTactic(tactic.type);
  };

  const handleDragEnd = () => {
    clearDragState();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={tactic.description}
      className={`pe-t-item${tactic.requiresContextVar ? ' ctx' : ''}`}
    >
      <span className="pe-t-glyph">{getGlyph(tactic)}</span>
      <span className="pe-t-nm">{tactic.displayName}</span>
      <span className="pe-t-tag">{getTag(tactic)}</span>
    </div>
  );
}
