export const NOTE_LIMITS = {
  name: 40,
  message: 280,
  fontSizeMin: 14,
  fontSizeMax: 24,
  rotationMin: -8,
  rotationMax: 8,
  positionMin: 8,
  positionMax: 92,
} as const;

export const FONT_OPTIONS = [
  { key: 'sans', label: 'Sans serif', family: 'var(--font-sans)' },
  { key: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { key: 'mono', label: 'Monospace', family: 'var(--font-mono)' },
] as const;

export const TEXT_COLORS = [
  { key: 'ink', label: 'Ink', value: '#040f0f' },
  { key: 'slate', label: 'Slate', value: '#2d3a3a' },
] as const;

export const PAPER_COLORS = [
  { key: 'lemon', label: 'Lemon', value: '#fff1a8' },
  { key: 'sky', label: 'Sky', value: '#bce8f3' },
  { key: 'mint', label: 'Mint', value: '#c5edce' },
  { key: 'rose', label: 'Rose', value: '#f4cbd1' },
  { key: 'lilac', label: 'Lilac', value: '#ddd5f5' },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]['key'];
export type TextColorKey = (typeof TEXT_COLORS)[number]['key'];
export type PaperColorKey = (typeof PAPER_COLORS)[number]['key'];

export interface NoteDraft {
  name: string;
  message: string;
  font: FontKey;
  fontSize: number;
  textColor: TextColorKey;
  paperColor: PaperColorKey;
  x: number;
  y: number;
  rotation: number;
}

export interface BoardNote extends NoteDraft {
  id: string;
  createdAt: string;
}

export type DraftValidation = { ok: true; value: NoteDraft } | { ok: false; message: string };

export function buildBridgeUrl(endpoint: string, pageOrigin: string, isDev: boolean): string {
  const url = new URL(endpoint);
  const origin = new URL(pageOrigin);
  const localHost = origin.hostname === 'localhost' || origin.hostname === '127.0.0.1';
  const isExecUrl = url.pathname.endsWith('/exec');
  const isLocalDevUrl = isDev && localHost && url.pathname.endsWith('/dev');

  if (url.protocol !== 'https:' || !(isExecUrl || isLocalDevUrl)) {
    throw new Error('Use a deployed /exec URL, or a local-development /dev URL.');
  }
  if (url.hostname !== 'script.google.com') {
    throw new Error('The Apps Script URL must use script.google.com.');
  }

  url.searchParams.set('mode', 'bridge');
  url.searchParams.set('origin', origin.origin);
  return url.toString();
}

export function parseBoardNotes(value: unknown): BoardNote[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { notes?: unknown }).notes)) {
    throw new Error('The board service returned an unexpected response.');
  }

  return (value as { notes: unknown[] }).notes.filter((item): item is BoardNote => {
    if (!item || typeof item !== 'object') return false;
    const note = item as Partial<BoardNote>;
    return (
      typeof note.id === 'string' &&
      note.id.length <= 100 &&
      typeof note.createdAt === 'string' &&
      typeof note.name === 'string' &&
      note.name.length > 0 &&
      note.name.length <= NOTE_LIMITS.name &&
      typeof note.message === 'string' &&
      note.message.length > 0 &&
      note.message.length <= NOTE_LIMITS.message &&
      FONT_OPTIONS.some((font) => font.key === note.font) &&
      TEXT_COLORS.some((color) => color.key === note.textColor) &&
      PAPER_COLORS.some((color) => color.key === note.paperColor) &&
      typeof note.fontSize === 'number' &&
      Number.isInteger(note.fontSize) &&
      note.fontSize >= NOTE_LIMITS.fontSizeMin &&
      note.fontSize <= NOTE_LIMITS.fontSizeMax &&
      typeof note.x === 'number' &&
      Number.isInteger(note.x) &&
      note.x >= NOTE_LIMITS.positionMin &&
      note.x <= NOTE_LIMITS.positionMax &&
      typeof note.y === 'number' &&
      Number.isInteger(note.y) &&
      note.y >= NOTE_LIMITS.positionMin &&
      note.y <= NOTE_LIMITS.positionMax &&
      typeof note.rotation === 'number' &&
      Number.isInteger(note.rotation) &&
      note.rotation >= NOTE_LIMITS.rotationMin &&
      note.rotation <= NOTE_LIMITS.rotationMax
    );
  });
}

const fontKeys = new Set<string>(FONT_OPTIONS.map((item) => item.key));
const textColorKeys = new Set<string>(TEXT_COLORS.map((item) => item.key));
const paperColorKeys = new Set<string>(PAPER_COLORS.map((item) => item.key));

export function clampPosition(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(NOTE_LIMITS.positionMax, Math.max(NOTE_LIMITS.positionMin, value));
}

export function validateDraft(input: NoteDraft): DraftValidation {
  const name = input.name.trim();
  const message = input.message.trim();

  if (!name) return { ok: false, message: 'Add your name before posting.' };
  if (name.length > NOTE_LIMITS.name) {
    return { ok: false, message: `Name must be ${NOTE_LIMITS.name} characters or fewer.` };
  }
  if (!message) return { ok: false, message: 'Write a message before posting.' };
  if (message.length > NOTE_LIMITS.message) {
    return { ok: false, message: `Message must be ${NOTE_LIMITS.message} characters or fewer.` };
  }
  if (!fontKeys.has(input.font)) return { ok: false, message: 'Choose an available font.' };
  if (!textColorKeys.has(input.textColor))
    return { ok: false, message: 'Choose an available text color.' };
  if (!paperColorKeys.has(input.paperColor))
    return { ok: false, message: 'Choose an available paper color.' };
  if (!Number.isFinite(input.fontSize)) return { ok: false, message: 'Choose a valid font size.' };
  if (!Number.isFinite(input.rotation)) return { ok: false, message: 'Choose a valid rotation.' };
  if (!Number.isFinite(input.x) || !Number.isFinite(input.y)) {
    return { ok: false, message: 'Choose a valid position on the board.' };
  }

  return {
    ok: true,
    value: {
      name,
      message,
      font: input.font,
      fontSize: Math.round(
        Math.min(NOTE_LIMITS.fontSizeMax, Math.max(NOTE_LIMITS.fontSizeMin, input.fontSize)),
      ),
      textColor: input.textColor,
      paperColor: input.paperColor,
      x: clampPosition(input.x),
      y: clampPosition(input.y),
      rotation: Math.round(
        Math.min(NOTE_LIMITS.rotationMax, Math.max(NOTE_LIMITS.rotationMin, input.rotation)),
      ),
    },
  };
}
