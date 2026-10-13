import { generate, hashString, seedRow, toSvgPath } from './automaton';

const RULES = [30, 110, 90, 45, 54, 22] as const;

/** Small deterministic PRNG so the same seed always yields the same pattern. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Pattern {
  rule: number;
  cols: number;
  rows: number;
  path: string;
}

/** A repeatable cellular-automaton pattern used as a placeholder thumbnail and hero art. */
export function patternFor(seed: string, cols = 40, rows = 20): Pattern {
  const hash = hashString(seed);
  const rule = RULES[hash % RULES.length]!;
  // A single cell at a seed-derived position gives each title a distinct, structured pattern.
  const position = 6 + Math.floor(mulberry32(hash)() * (cols - 12));
  const row = seedRow(cols, 'single', Math.random, position);
  return { rule, cols, rows, path: toSvgPath(generate(rule, cols, rows, row)) };
}
