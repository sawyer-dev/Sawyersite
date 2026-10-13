import { describe, expect, it } from 'vitest';
import {
  generate,
  hashString,
  nextRow,
  parseRule,
  ruleToTable,
  seedRow,
  tableToRule,
  toSvgPath,
} from '../src/lib/automaton';

describe('rule tables', () => {
  it('round-trips every rule number', () => {
    for (let rule = 0; rule <= 255; rule++) {
      expect(tableToRule(ruleToTable(rule))).toBe(rule);
    }
  });

  it('maps rule 30 neighborhoods per Wolfram convention', () => {
    // 111,110,101,100 -> 0 ; 011,010,001,000 -> 1,1,1,0  (0b00011110 = 30)
    const table = ruleToTable(30);
    expect(table[0b111]).toBe(false);
    expect(table[0b100]).toBe(true);
    expect(table[0b011]).toBe(true);
    expect(table[0b001]).toBe(true);
    expect(table[0b000]).toBe(false);
  });
});

describe('generation', () => {
  it('builds the Sierpinski pattern for rule 90 from a single cell', () => {
    const seed = seedRow(9, 'single');
    const rows = generate(90, 9, 3, seed);
    expect(Array.from(rows[0]!)).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    expect(Array.from(rows[1]!)).toEqual([0, 0, 0, 1, 0, 1, 0, 0, 0]);
    expect(Array.from(rows[2]!)).toEqual([0, 0, 1, 0, 0, 0, 1, 0, 0]);
  });

  it('wraps at the edges', () => {
    const row = Uint8Array.from([1, 0, 0, 0]);
    // rule 2 (only 001 -> 1): a cell turns on when its right neighbour is on
    expect(Array.from(nextRow(row, ruleToTable(2)))).toEqual([0, 0, 0, 1]);
  });

  it('never mutates the seed row', () => {
    const seed = seedRow(7, 'single');
    const copy = Array.from(seed);
    generate(30, 7, 4, seed);
    expect(Array.from(seed)).toEqual(copy);
  });

  it('uses the injected random source for random seeds', () => {
    expect(Array.from(seedRow(4, 'random', () => 0.1))).toEqual([1, 1, 1, 1]);
    expect(Array.from(seedRow(4, 'random', () => 0.9))).toEqual([0, 0, 0, 0]);
  });
});

describe('parseRule', () => {
  it('accepts integers 0-255', () => {
    expect(parseRule('30')).toEqual({ ok: true, value: 30 });
    expect(parseRule(' 255 ')).toEqual({ ok: true, value: 255 });
    expect(parseRule('0')).toEqual({ ok: true, value: 0 });
  });

  it.each(['', 'abc', '-1', '256', '3.5', '1e2'])('rejects %j', (input) => {
    const result = parseRule(input);
    expect(result.ok).toBe(false);
  });
});

describe('rendering helpers', () => {
  it('merges horizontal runs into a single path segment', () => {
    const rows = [Uint8Array.from([1, 1, 0, 1])];
    expect(toSvgPath(rows)).toBe('M0 0h2v1h-2zM3 0h1v1h-1z');
  });

  it('hashes deterministically', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});
