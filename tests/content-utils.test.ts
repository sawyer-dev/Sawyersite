import { describe, expect, it } from 'vitest';
import {
  filterPublished,
  formatYearSpan,
  neighbours,
  sortApps,
  sortHobbies,
  sortProjects,
} from '../src/lib/content-utils';
import { isExternalUrl, joinBase } from '../src/lib/urls';

const project = (id: string, year: number, order = 0) => ({
  id,
  data: { title: id, year, order, draft: false },
});

describe('sortProjects', () => {
  it('orders newest year first, then order, then title', () => {
    const sorted = sortProjects([
      project('b', 2022, 1),
      project('c', 2026),
      project('a', 2022, 0),
      project('d', 2022, 1),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('does not mutate its input', () => {
    const input = [project('a', 2020), project('b', 2024)];
    sortProjects(input);
    expect(input.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('sortHobbies', () => {
  it('lists current hobbies before historical ones', () => {
    const mk = (id: string, status: 'current' | 'historical') => ({
      id,
      data: { title: id, status, order: 0 },
    });
    expect(sortHobbies([mk('b', 'historical'), mk('a', 'current')]).map((h) => h.id)).toEqual([
      'a',
      'b',
    ]);
  });
});

describe('sortApps', () => {
  it('orders by most recent update', () => {
    const mk = (id: string, d: string) => ({
      id,
      data: { title: id, updated: new Date(d) },
    });
    expect(sortApps([mk('old', '2025-01-01'), mk('new', '2026-01-01')]).map((a) => a.id)).toEqual([
      'new',
      'old',
    ]);
  });
});

describe('neighbours', () => {
  const list = [project('new', 2026), project('mid', 2024), project('old', 2022)];

  it('returns the newer entry as previous and the older entry as next', () => {
    const { previous, next } = neighbours(list, 'mid');
    expect(previous?.id).toBe('new');
    expect(next?.id).toBe('old');
  });

  it('does not loop at either end', () => {
    expect(neighbours(list, 'new').previous).toBeUndefined();
    expect(neighbours(list, 'old').next).toBeUndefined();
  });

  it('returns nothing for unknown ids', () => {
    expect(neighbours(list, 'missing')).toEqual({ previous: undefined, next: undefined });
  });
});

describe('filterPublished', () => {
  const items = [
    { id: 'a', data: { draft: false } },
    { id: 'b', data: { draft: true } },
  ];

  it('hides drafts by default and shows them on request', () => {
    expect(filterPublished(items, false).map((i) => i.id)).toEqual(['a']);
    expect(filterPublished(items, true)).toHaveLength(2);
  });
});

describe('formatYearSpan', () => {
  it('collapses identical years', () => {
    expect(formatYearSpan(2025, 2026)).toBe('2025–2026');
    expect(formatYearSpan(2022, 2022)).toBe('2022');
    expect(formatYearSpan(undefined, 2022)).toBe('2022');
  });
});

describe('joinBase', () => {
  it('handles project base paths', () => {
    expect(joinBase('/Sawyersite', 'projects/')).toBe('/Sawyersite/projects/');
    expect(joinBase('/Sawyersite/', '/projects/')).toBe('/Sawyersite/projects/');
    expect(joinBase('/Sawyersite', '')).toBe('/Sawyersite/');
  });

  it('handles the root base path', () => {
    expect(joinBase('/', 'projects/')).toBe('/projects/');
    expect(joinBase('', 'projects/')).toBe('/projects/');
  });

  it('leaves absolute URLs untouched', () => {
    expect(joinBase('/Sawyersite', 'https://example.com/x')).toBe('https://example.com/x');
    expect(joinBase('/Sawyersite', 'mailto:a@b.co')).toBe('mailto:a@b.co');
  });
});

describe('isExternalUrl', () => {
  it('detects schemes and protocol-relative URLs', () => {
    expect(isExternalUrl('https://a.b')).toBe(true);
    expect(isExternalUrl('mailto:a@b.co')).toBe(true);
    expect(isExternalUrl('//a.b')).toBe(true);
    expect(isExternalUrl('/projects/')).toBe(false);
  });
});
