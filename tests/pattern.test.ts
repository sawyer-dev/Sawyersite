import { describe, expect, it } from 'vitest';
import { mulberry32, patternFor } from '../src/lib/pattern';

describe('mulberry32', () => {
  it('is deterministic for a seed and stays within [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('patternFor', () => {
  it('returns the same pattern for the same seed', () => {
    expect(patternFor('Wedding Website')).toEqual(patternFor('Wedding Website'));
  });

  it('varies with the seed', () => {
    expect(patternFor('one').path).not.toBe(patternFor('two').path);
  });

  it('spreads real project titles across several rules', () => {
    const titles = [
      'Wedding Website',
      'This website',
      'D&D Character Android App',
      'Game Performance Optimization',
      'C-minus Parser',
      'Energy Utility Polling App',
    ];
    expect(new Set(titles.map((t) => patternFor(t).rule)).size).toBeGreaterThanOrEqual(3);
  });

  it('reports the requested grid size and emits drawable path data', () => {
    const p = patternFor('x', 24, 12);
    expect(p).toMatchObject({ cols: 24, rows: 12 });
    expect(p.path).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
  });
});
