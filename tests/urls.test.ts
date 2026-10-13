import { describe, expect, it } from 'vitest';
import { isExternalUrl, joinBase, sectionOf } from '../src/lib/urls';
import { getStatus } from '../src/lib/status';

describe('joinBase', () => {
  it('joins a project-page base with a relative path', () => {
    expect(joinBase('/Sawyersite', 'projects/')).toBe('/Sawyersite/projects/');
    expect(joinBase('/Sawyersite/', '/projects/')).toBe('/Sawyersite/projects/');
  });

  it('works at the domain root', () => {
    expect(joinBase('/', 'apps/')).toBe('/apps/');
    expect(joinBase('/', '')).toBe('/');
  });

  it('leaves absolute URLs untouched', () => {
    expect(joinBase('/Sawyersite', 'https://example.com/x')).toBe('https://example.com/x');
    expect(joinBase('/Sawyersite', 'mailto:a@b.co')).toBe('mailto:a@b.co');
  });
});

describe('sectionOf', () => {
  it('returns the first segment after the base', () => {
    expect(sectionOf('/Sawyersite/projects/x/', '/Sawyersite')).toBe('projects');
    expect(sectionOf('/Sawyersite/', '/Sawyersite/')).toBe('');
    expect(sectionOf('/apps/', '/')).toBe('apps');
  });
});

describe('isExternalUrl', () => {
  it('detects schemes and protocol-relative URLs', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
    expect(isExternalUrl('//cdn.example.com/a.js')).toBe(true);
    expect(isExternalUrl('mailto:a@b.co')).toBe(true);
    expect(isExternalUrl('/projects/')).toBe(false);
    expect(isExternalUrl('projects/')).toBe(false);
  });
});

describe('getStatus', () => {
  it('maps known statuses and falls back for unknown ones', () => {
    expect(getStatus('in-progress').label).toBe('In progress');
    expect(getStatus('mystery')).toEqual({ label: 'mystery', tone: 'muted' });
  });
});
