import { describe, expect, it } from 'vitest';
import {
  buildBridgeUrl,
  clampPosition,
  NOTE_LIMITS,
  parseBoardNotes,
  validateDraft,
  type NoteDraft,
} from '../src/app-registry/bulletin-board/model';

const validDraft: NoteDraft = {
  name: 'Sawyer',
  message: 'Hello from the board!',
  font: 'sans',
  fontSize: 18,
  textColor: 'ink',
  paperColor: 'lemon',
  x: 50,
  y: 50,
  rotation: 0,
};

describe('buildBridgeUrl', () => {
  const devUrl = 'https://script.google.com/macros/s/test-deployment/dev';
  const execUrl = 'https://script.google.com/macros/s/live-deployment/exec';

  it('accepts the Apps Script /dev URL only in local development', () => {
    const result = new URL(buildBridgeUrl(devUrl, 'http://localhost:4321', true));
    expect(result.pathname.endsWith('/dev')).toBe(true);
    expect(result.searchParams.get('mode')).toBe('bridge');
    expect(result.searchParams.get('origin')).toBe('http://localhost:4321');
    expect(() => buildBridgeUrl(devUrl, 'https://sawyer-dev.github.io', false)).toThrow();
    expect(() => buildBridgeUrl(devUrl, 'https://sawyer-dev.github.io', true)).toThrow();
  });

  it('accepts deployed /exec URLs and rejects non-Google or insecure endpoints', () => {
    expect(buildBridgeUrl(execUrl, 'https://sawyer-dev.github.io', false)).toContain('/exec?');
    expect(() =>
      buildBridgeUrl('http://script.google.com/macros/s/id/exec', 'http://localhost:4321', true),
    ).toThrow();
    expect(() =>
      buildBridgeUrl('https://example.com/macros/s/id/exec', 'http://localhost:4321', true),
    ).toThrow();
  });
});

describe('validateDraft', () => {
  it('trims valid name and message', () => {
    const result = validateDraft({ ...validDraft, name: ' Sawyer ', message: ' Hello ' });
    expect(result).toEqual({
      ok: true,
      value: { ...validDraft, name: 'Sawyer', message: 'Hello' },
    });
  });

  it('requires a non-empty name and message', () => {
    expect(validateDraft({ ...validDraft, name: '  ' })).toMatchObject({ ok: false });
    expect(validateDraft({ ...validDraft, message: '  ' })).toMatchObject({ ok: false });
  });

  it('enforces content length limits', () => {
    expect(validateDraft({ ...validDraft, name: 'n'.repeat(NOTE_LIMITS.name + 1) })).toMatchObject({
      ok: false,
    });
    expect(
      validateDraft({ ...validDraft, message: 'm'.repeat(NOTE_LIMITS.message + 1) }),
    ).toMatchObject({ ok: false });
  });

  it('clamps size, position, and rotation to the supported ranges', () => {
    const result = validateDraft({
      ...validDraft,
      fontSize: 99,
      x: -20,
      y: 150,
      rotation: 20,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        fontSize: NOTE_LIMITS.fontSizeMax,
        x: NOTE_LIMITS.positionMin,
        y: NOTE_LIMITS.positionMax,
        rotation: NOTE_LIMITS.rotationMax,
      },
    });
  });

  it('rejects unsupported customization keys and non-finite geometry', () => {
    expect(validateDraft({ ...validDraft, font: 'comic-sans' as NoteDraft['font'] })).toMatchObject(
      {
        ok: false,
      },
    );
    expect(validateDraft({ ...validDraft, x: Number.NaN })).toMatchObject({ ok: false });
    expect(validateDraft({ ...validDraft, rotation: Number.POSITIVE_INFINITY })).toMatchObject({
      ok: false,
    });
  });
});

describe('clampPosition', () => {
  it('keeps notes away from edges and handles invalid values', () => {
    expect(clampPosition(0)).toBe(NOTE_LIMITS.positionMin);
    expect(clampPosition(100)).toBe(NOTE_LIMITS.positionMax);
    expect(clampPosition(42.375)).toBe(42.375);
    expect(clampPosition(Number.NaN)).toBe(50);
  });
});

describe('parseBoardNotes', () => {
  const safeNote = {
    id: 'note-1',
    createdAt: '2026-10-12T12:00:00.000Z',
    name: 'Sawyer',
    message: 'Hello!',
    font: 'sans',
    fontSize: 18,
    textColor: 'ink',
    paperColor: 'lemon',
    x: 50,
    y: 50,
    rotation: 0,
  };

  it('keeps valid notes and ignores rows with unsupported style values', () => {
    expect(
      parseBoardNotes({ notes: [safeNote, { ...safeNote, paperColor: 'url(javascript:...)' }] }),
    ).toEqual([safeNote]);
  });

  it('rejects an unexpected response shape', () => {
    expect(() => parseBoardNotes({ data: [] })).toThrow(/unexpected response/i);
  });
});
