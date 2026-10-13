import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  generate,
  parseRule,
  ruleToTable,
  seedRow,
  tableToRule,
  toSvgPath,
} from '../../lib/automaton';
import './rule-explorer.css';

const COLS = 81;
const ROWS = 48;
const DEFAULT_RULE = 30;
const PRESETS = [
  { rule: 30, note: 'Chaotic' },
  { rule: 90, note: 'Sierpinski triangle' },
  { rule: 110, note: 'Turing complete' },
  { rule: 184, note: 'Traffic flow' },
] as const;

type SeedKind = 'single' | 'random';

const NEIGHBOURHOODS = [7, 6, 5, 4, 3, 2, 1, 0] as const;

function bits(n: number): [boolean, boolean, boolean] {
  return [Boolean(n & 4), Boolean(n & 2), Boolean(n & 1)];
}

function Cell({ on }: { on: boolean }) {
  return <span className={on ? 'cell cell--on' : 'cell'} aria-hidden="true" />;
}

export default function RuleExplorer() {
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();

  const [rule, setRule] = useState(DEFAULT_RULE);
  const [draft, setDraft] = useState(String(DEFAULT_RULE));
  const [error, setError] = useState<string | null>(null);
  const [seedKind, setSeedKind] = useState<SeedKind>('single');
  const [seed, setSeed] = useState(() => seedRow(COLS, 'single'));
  const [visibleRows, setVisibleRows] = useState(ROWS);
  const [announcement, setAnnouncement] = useState('');
  const frame = useRef<number | null>(null);

  const table = useMemo(() => ruleToTable(rule), [rule]);
  const rows = useMemo(() => generate(rule, COLS, ROWS, seed), [rule, seed]);
  const path = useMemo(() => toSvgPath(rows.slice(0, visibleRows)), [rows, visibleRows]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function applyRule(next: number) {
    setRule(next);
    setDraft(String(next));
    setError(null);
    setVisibleRows(ROWS);
    setAnnouncement(`Rule ${next} applied. ${ROWS} generations shown.`);
  }

  function commitDraft(value: string) {
    setDraft(value);
    const parsed = parseRule(value);
    if (parsed.ok) {
      setError(null);
      setRule(parsed.value);
      setVisibleRows(ROWS);
      setAnnouncement(`Rule ${parsed.value} applied.`);
    } else {
      setError(parsed.message);
      setAnnouncement(`Invalid rule. ${parsed.message}`);
    }
  }

  function toggleBit(index: number) {
    const next = table.slice();
    next[index] = !next[index];
    applyRule(tableToRule(next));
  }

  function changeSeed(kind: SeedKind) {
    setSeedKind(kind);
    setSeed(seedRow(COLS, kind));
    setVisibleRows(ROWS);
    setAnnouncement(
      kind === 'single' ? 'Seed set to a single cell.' : 'New random seed generated.',
    );
  }

  function reset() {
    setSeedKind('single');
    setSeed(seedRow(COLS, 'single'));
    applyRule(DEFAULT_RULE);
    setAnnouncement(`Reset to rule ${DEFAULT_RULE} with a single-cell seed.`);
  }

  function replay() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleRows(ROWS);
      return;
    }
    let shown = 1;
    setVisibleRows(shown);
    let last = 0;
    const tick = (time: number) => {
      if (time - last > 40) {
        shown += 1;
        last = time;
        setVisibleRows(shown);
      }
      frame.current = shown < ROWS ? requestAnimationFrame(tick) : null;
    };
    frame.current = requestAnimationFrame(tick);
  }

  const invalid = error !== null;

  return (
    <div className="rule-explorer">
      <div className="re-controls">
        <div className="re-field">
          <label htmlFor={inputId}>Rule number (0–255)</label>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={draft}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${helpId} ${errorId}` : helpId}
            onChange={(e) => commitDraft(e.target.value)}
          />
          <p id={helpId} className="re-help">
            Each rule decides a cell&apos;s next state from itself and its two neighbours.
          </p>
          {invalid && (
            <p id={errorId} className="re-error" role="alert">
              <span aria-hidden="true">✕ </span>
              {error}
            </p>
          )}
        </div>

        <fieldset className="re-presets">
          <legend>Presets</legend>
          <div className="re-btn-row">
            {PRESETS.map((p) => (
              <button
                key={p.rule}
                type="button"
                className="btn btn--ghost"
                aria-pressed={!invalid && rule === p.rule}
                onClick={() => applyRule(p.rule)}
              >
                {p.rule}
                <span className="re-preset-note">{p.note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="re-presets">
          <legend>Starting row</legend>
          <div className="re-btn-row">
            <button
              type="button"
              className="btn btn--ghost"
              aria-pressed={seedKind === 'single'}
              onClick={() => changeSeed('single')}
            >
              Single cell
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              aria-pressed={seedKind === 'random'}
              onClick={() => changeSeed('random')}
            >
              {seedKind === 'random' ? 'Re-roll random' : 'Random'}
            </button>
          </div>
        </fieldset>
      </div>

      <fieldset className="re-table">
        <legend>Rule table — activate a pattern to change what it produces</legend>
        <ul>
          {NEIGHBOURHOODS.map((n) => {
            const output = Boolean(table[n]);
            const [l, c, r] = bits(n);
            return (
              <li key={n}>
                <button
                  type="button"
                  className="re-pattern"
                  aria-pressed={output}
                  aria-label={`Pattern ${Number(l)}${Number(c)}${Number(r)} produces ${output ? 'a filled cell' : 'an empty cell'}`}
                  onClick={() => toggleBit(n)}
                >
                  <span className="re-pattern__in">
                    <Cell on={l} />
                    <Cell on={c} />
                    <Cell on={r} />
                  </span>
                  <span className="re-pattern__arrow" aria-hidden="true">
                    ↓
                  </span>
                  <Cell on={output} />
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="re-output">
        <div className="re-output__bar">
          <p className="re-title">
            Rule {rule}
            {invalid && <span className="re-stale"> (last valid rule shown)</span>}
          </p>
          <div className="re-btn-row">
            <button type="button" className="btn btn--ghost" onClick={replay}>
              Replay
            </button>
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
        <svg
          className="re-canvas"
          viewBox={`0 0 ${COLS} ${ROWS}`}
          role="img"
          aria-label={`Rule ${rule} cellular automaton, ${ROWS} generations from a ${seedKind === 'single' ? 'single-cell' : 'random'} start`}
          shapeRendering="crispEdges"
          preserveAspectRatio="xMidYMin meet"
        >
          <rect width={COLS} height={ROWS} className="re-canvas__bg" />
          <path d={path} className="re-canvas__cells" />
        </svg>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
