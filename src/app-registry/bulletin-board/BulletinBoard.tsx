import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  FONT_OPTIONS,
  NOTE_LIMITS,
  PAPER_COLORS,
  TEXT_COLORS,
  buildBridgeUrl,
  clampPosition,
  parseBoardNotes,
  validateDraft,
  type BoardNote,
  type NoteDraft,
} from './model';
import './bulletin-board.css';

const CHANNEL = 'sawyer-bulletin-board';
const RETRY_MS = 5000;
const MAX_RELOADS = 3;

const isGoogleOrigin = (origin: string) => {
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol === 'https:' &&
      (hostname === 'script.google.com' || hostname.endsWith('.googleusercontent.com'))
    );
  } catch {
    return false;
  }
};
const EMPTY_DRAFT: NoteDraft = {
  name: '',
  message: '',
  font: 'sans',
  fontSize: 18,
  textColor: 'ink',
  paperColor: 'lemon',
  x: 50,
  y: 50,
  rotation: 0,
};

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: number;
}

interface PreviewDrag {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

const fontFamily = (key: BoardNote['font'] | NoteDraft['font']) =>
  FONT_OPTIONS.find((font) => font.key === key)?.family ?? 'var(--font-sans)';
const textColor = (key: BoardNote['textColor'] | NoteDraft['textColor']) =>
  TEXT_COLORS.find((color) => color.key === key)?.value ?? '#040f0f';
const paperColor = (key: BoardNote['paperColor'] | NoteDraft['paperColor']) =>
  PAPER_COLORS.find((color) => color.key === key)?.value ?? '#fff1a8';

function BulletinBoard() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeWindowRef = useRef<Window | null>(null);
  const pendingRef = useRef(new Map<string, PendingCall>());
  const apiReadyRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const previewDragRef = useRef<PreviewDrag | null>(null);
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [bridgeAttempt, setBridgeAttempt] = useState(0);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [bridgeError, setBridgeError] = useState('');
  const [notes, setNotes] = useState<BoardNote[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [honeypot, setHoneypot] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewDragging, setPreviewDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const messageId = useId();
  const nameId = useId();
  const sizeId = useId();
  const rotationId = useId();
  const positionId = useId();

  const endpoint = import.meta.env.PUBLIC_BULLETIN_SCRIPT_URL?.trim() ?? '';

  // Apps Script nests the page in sandbox frames that appear late, so ping every frame in the tree.
  const connectBridge = useCallback(() => {
    const ping = (target: Window, depth: number) => {
      target.postMessage({ channel: CHANNEL, type: 'connect' }, '*');
      if (depth >= 4) return;
      for (let i = 0; i < target.frames.length; i += 1) {
        const child = target.frames[i];
        if (child) ping(child, depth + 1);
      }
    };
    const root = iframeRef.current?.contentWindow;
    if (root) ping(root, 0);
  }, []);

  useEffect(() => {
    if (!endpoint) {
      setBridgeError('The Bulletin Board service has not been configured yet.');
      setLoadState('error');
      return;
    }

    let bridgeUrl: string;
    try {
      bridgeUrl = buildBridgeUrl(endpoint, window.location.origin, import.meta.env.DEV);
    } catch {
      setBridgeError('The Bulletin Board service URL is invalid.');
      setLoadState('error');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as {
        channel?: string;
        type?: string;
        requestId?: string;
        ok?: boolean;
        result?: unknown;
        error?: string;
      } | null;
      if (!data || data.channel !== CHANNEL) return;

      if (data.type === 'ready') {
        if (!event.source || !isGoogleOrigin(event.origin)) return;
        bridgeWindowRef.current = event.source as Window;
        apiReadyRef.current = true;
        window.clearInterval(connectInterval);
        window.clearInterval(retryInterval);
        setBridgeReady(true);
        setBridgeError('');
        return;
      }
      if (event.source !== bridgeWindowRef.current || !data.requestId) return;
      const pending = pendingRef.current.get(data.requestId);
      if (!pending) return;
      window.clearTimeout(pending.timeout);
      pendingRef.current.delete(data.requestId);
      if (data.ok) pending.resolve(data.result);
      else pending.reject(new Error(data.error || 'The Bulletin Board request failed.'));
    };

    window.addEventListener('message', handleMessage);
    let connectInterval = 0;
    let reloads = 0;
    // A fresh iframe load is what a manual refresh does, so retry it if the bridge stays silent.
    const retryInterval = window.setInterval(() => {
      if (apiReadyRef.current || reloads >= MAX_RELOADS) return;
      reloads += 1;
      setBridgeAttempt(reloads);
    }, RETRY_MS);
    const readyTimeout = window.setTimeout(() => {
      if (apiReadyRef.current) return;
      window.clearInterval(connectInterval);
      window.clearInterval(retryInterval);
      setBridgeError(
        'The Apps Script bridge did not load. For a /dev URL, sign into Google in this browser with an account that can edit the script. Also check its deployment URL and allowed origins.',
      );
      setLoadState('error');
    }, RETRY_MS * (MAX_RELOADS + 1));
    connectInterval = window.setInterval(() => {
      if (!apiReadyRef.current) connectBridge();
    }, 250);
    setBridgeUrl(bridgeUrl);
    return () => {
      window.clearTimeout(readyTimeout);
      window.clearInterval(connectInterval);
      window.clearInterval(retryInterval);
      window.removeEventListener('message', handleMessage);
      apiReadyRef.current = false;
      bridgeWindowRef.current = null;
      pendingRef.current.forEach((pending) => {
        window.clearTimeout(pending.timeout);
        pending.reject(new Error('The Bulletin Board connection was closed.'));
      });
      pendingRef.current.clear();
    };
  }, [connectBridge, endpoint]);

  const callApi = useCallback(
    (action: 'list' | 'submit', payload: Record<string, unknown> = {}) => {
      const frame = bridgeWindowRef.current;
      if (!frame || !apiReadyRef.current) {
        return Promise.reject(new Error('The board connection is not ready yet.'));
      }

      const requestId = window.crypto.randomUUID();
      return new Promise<unknown>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          pendingRef.current.delete(requestId);
          reject(new Error('The board service did not respond. Please try again.'));
        }, 15000);
        pendingRef.current.set(requestId, { resolve, reject, timeout });
        frame.postMessage({ channel: CHANNEL, requestId, action, payload }, '*');
      });
    },
    [],
  );

  const refreshNotes = useCallback(async () => {
    setLoadState('loading');
    setLoadError('');
    try {
      const response = await callApi('list');
      setNotes(parseBoardNotes(response));
      setLoadState('ready');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load the board.');
      setLoadState('error');
    }
  }, [callApi]);

  useEffect(() => {
    if (bridgeReady) void refreshNotes();
  }, [bridgeReady, refreshNotes]);

  function updateDraft<K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldError('');
    setSubmissionMessage('');
  }

  function placeNote(event: React.MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    updateDraft('x', clampPosition(x));
    updateDraft('y', clampPosition(y));
    setAnnouncement(
      `Preview position set to ${clampPosition(x)} percent from the left and ${clampPosition(y)} percent from the top.`,
    );
  }

  function moveNote(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 5 : 1;
    const changes: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const change = changes[event.key];
    if (!change) return;
    event.preventDefault();
    const x = clampPosition(draft.x + change[0]);
    const y = clampPosition(draft.y + change[1]);
    updateDraft('x', x);
    updateDraft('y', y);
    setAnnouncement(`Preview position: ${x} percent from the left and ${y} percent from the top.`);
  }

  function startPreviewDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0 || !boardRef.current) return;
    const noteRect = event.currentTarget.getBoundingClientRect();
    previewDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - (noteRect.left + noteRect.width / 2),
      offsetY: event.clientY - (noteRect.top + noteRect.height / 2),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPreviewDragging(true);
    event.preventDefault();
  }

  function movePreviewDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = previewDragRef.current;
    const board = boardRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !board) return;
    const rect = board.getBoundingClientRect();
    const x = clampPosition(((event.clientX - drag.offsetX - rect.left) / rect.width) * 100);
    const y = clampPosition(((event.clientY - drag.offsetY - rect.top) / rect.height) * 100);
    setDraft((current) => ({ ...current, x, y }));
    event.preventDefault();
  }

  function endPreviewDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = previewDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    previewDragRef.current = null;
    setPreviewDragging(false);
    setAnnouncement(
      `Preview position: ${draft.x} percent from the left and ${draft.y} percent from the top.`,
    );
  }

  async function submitNote(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setFieldError('');
    setSubmissionMessage('');
    if (honeypot) {
      setSubmissionMessage('Your note was submitted for review.');
      setAnnouncement('Your note was submitted for review.');
      return;
    }
    const validation = validateDraft(draft);
    if (!validation.ok) {
      setFieldError(validation.message);
      return;
    }

    setSubmitting(true);
    try {
      const result = (await callApi('submit', { ...validation.value, website: honeypot })) as {
        accepted?: boolean;
      };
      if (!result?.accepted)
        throw new Error('The board did not accept your note. Please try again.');
      const message = 'Your note was submitted and is waiting for approval.';
      setSubmissionMessage(message);
      setAnnouncement(message);
      setDraft(EMPTY_DRAFT);
      setLoadError('');
    } catch (error) {
      setFieldError(
        error instanceof Error ? error.message : 'Could not submit your note. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const apiUnavailable = Boolean(bridgeError);
  const preview = {
    ...draft,
    id: 'preview',
    name: draft.name || 'Your name',
    message: draft.message || 'Your note preview',
    createdAt: '',
  } satisfies BoardNote;

  return (
    <div className="bulletin-board">
      {bridgeUrl && (
        <iframe
          key={bridgeAttempt}
          ref={iframeRef}
          className="bb-bridge"
          src={bridgeUrl}
          title="Bulletin Board service connection"
          aria-hidden="true"
          tabIndex={-1}
          onLoad={connectBridge}
        />
      )}

      <div className="bb-board-wrap">
        <div className="bb-board-heading">
          <div>
            <p className="eyebrow">COMMUNITY BOARD</p>
            <h2>Leave a little note</h2>
          </div>
          <p className="bb-board-caption">
            Approved notes appear publicly. Your name and message stay private until then.
          </p>
        </div>

        <div ref={boardRef} className="bb-board" aria-label="Public bulletin board">
          {loadState === 'loading' && (
            <p className="bb-board-state" role="status">
              Loading approved notes…
            </p>
          )}
          {loadState === 'error' && (
            <div className="bb-board-state" role="alert">
              <p>{bridgeError || loadError}</p>
              {!apiUnavailable && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => void refreshNotes()}
                >
                  Try again
                </button>
              )}
            </div>
          )}
          {loadState === 'ready' && notes.length === 0 && (
            <p className="bb-board-state">No notes yet. You can start the board.</p>
          )}
          {loadState === 'ready' && notes.map((note) => <StickyNote key={note.id} note={note} />)}
          <StickyNote
            note={preview}
            preview
            dragging={previewDragging}
            onPointerDown={startPreviewDrag}
            onPointerMove={movePreviewDrag}
            onPointerUp={endPreviewDrag}
            onPointerCancel={endPreviewDrag}
          />
          <button
            type="button"
            className="bb-board__place"
            aria-label="Choose your note's position on the board. Use arrow keys to move it, or click or tap a location. Hold Shift with an arrow key to move farther."
            aria-describedby={positionId}
            disabled={loadState !== 'ready'}
            onClick={placeNote}
            onKeyDown={moveNote}
          />
        </div>
        <p className="bb-position-help" id={positionId}>
          Drag your note preview to move it, click or tap a board position to place it, or focus the
          board and use the arrow keys.
        </p>
      </div>

      <form className="bb-composer" onSubmit={submitNote} noValidate>
        <div className="bb-composer__heading">
          <div>
            <p className="eyebrow">NOTE COMPOSER</p>
            <h2>Make it yours</h2>
          </div>
          <p>Keep it kind. Every note is reviewed before it appears.</p>
        </div>

        <div className="bb-fields">
          <div className="bb-field">
            <label htmlFor={nameId}>
              Name <span>(required)</span>
            </label>
            <input
              id={nameId}
              name="name"
              autoComplete="name"
              maxLength={NOTE_LIMITS.name}
              value={draft.name}
              onChange={(event) => updateDraft('name', event.target.value)}
              aria-describedby={fieldError ? 'bb-error' : undefined}
              required
            />
            <p className="bb-counter">
              {draft.name.length}/{NOTE_LIMITS.name}
            </p>
          </div>

          <div className="bb-field bb-field--message">
            <label htmlFor={messageId}>
              Message <span>(required)</span>
            </label>
            <textarea
              id={messageId}
              name="message"
              rows={3}
              maxLength={NOTE_LIMITS.message}
              value={draft.message}
              onChange={(event) => updateDraft('message', event.target.value)}
              aria-describedby={fieldError ? 'bb-error' : undefined}
              required
            />
            <p className="bb-counter">
              {draft.message.length}/{NOTE_LIMITS.message}
            </p>
          </div>
        </div>

        <div className="bb-controls">
          <fieldset className="bb-control">
            <legend>Font</legend>
            <div className="bb-segments">
              {FONT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="bb-segment"
                  aria-pressed={draft.font === option.key}
                  style={{ fontFamily: option.family }}
                  onClick={() => updateDraft('font', option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="bb-control">
            <label htmlFor={sizeId}>
              Text size <output htmlFor={sizeId}>{draft.fontSize}px</output>
            </label>
            <input
              id={sizeId}
              type="range"
              min={NOTE_LIMITS.fontSizeMin}
              max={NOTE_LIMITS.fontSizeMax}
              value={draft.fontSize}
              onChange={(event) => updateDraft('fontSize', Number(event.target.value))}
            />
          </div>

          <fieldset className="bb-control">
            <legend>Text color</legend>
            <div className="bb-swatches">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  className="bb-swatch"
                  aria-label={color.label}
                  aria-pressed={draft.textColor === color.key}
                  style={{ backgroundColor: color.value }}
                  onClick={() => updateDraft('textColor', color.key)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="bb-control">
            <legend>Paper color</legend>
            <div className="bb-swatches">
              {PAPER_COLORS.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  className="bb-swatch"
                  aria-label={color.label}
                  aria-pressed={draft.paperColor === color.key}
                  style={{ backgroundColor: color.value }}
                  onClick={() => updateDraft('paperColor', color.key)}
                />
              ))}
            </div>
          </fieldset>

          <div className="bb-control">
            <label htmlFor={rotationId}>
              Rotation <output htmlFor={rotationId}>{draft.rotation}°</output>
            </label>
            <input
              id={rotationId}
              type="range"
              min={NOTE_LIMITS.rotationMin}
              max={NOTE_LIMITS.rotationMax}
              step="1"
              value={draft.rotation}
              onChange={(event) => updateDraft('rotation', Number(event.target.value))}
            />
          </div>
        </div>

        <div className="bb-honeypot" aria-hidden="true">
          <label htmlFor="bb-website">Leave this field blank</label>
          <input
            id="bb-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        {fieldError && (
          <p className="bb-error" id="bb-error" role="alert">
            {fieldError}
          </p>
        )}
        {submissionMessage && <p className="bb-success">{submissionMessage}</p>}
        {apiUnavailable && (
          <p className="bb-config-note">
            The board is not connected yet. Its Apps Script deployment URL must be configured before
            notes can be loaded or posted.
          </p>
        )}

        <div className="bb-submit-row">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || apiUnavailable || !bridgeReady || loadState === 'loading'}
          >
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
          <p>Your note is public only if it is approved.</p>
        </div>
      </form>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

interface StickyNoteProps {
  note: BoardNote;
  preview?: boolean;
  dragging?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLElement>) => void;
}

function StickyNote({
  note,
  preview = false,
  dragging = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: StickyNoteProps) {
  return (
    <article
      className={`bb-note${preview ? ' bb-note--preview' : ''}${dragging ? ' bb-note--dragging' : ''}`}
      aria-label={preview ? 'Your note preview. Drag to reposition.' : `Note from ${note.name}`}
      onPointerDown={preview ? onPointerDown : undefined}
      onPointerMove={preview ? onPointerMove : undefined}
      onPointerUp={preview ? onPointerUp : undefined}
      onPointerCancel={preview ? onPointerCancel : undefined}
      style={{
        left: `${note.x}%`,
        top: `${note.y}%`,
        color: textColor(note.textColor),
        backgroundColor: paperColor(note.paperColor),
        fontFamily: fontFamily(note.font),
        fontSize: `${note.fontSize}px`,
        transform: `translate(-50%, -50%) rotate(${note.rotation}deg)`,
      }}
    >
      <p className="bb-note__message">{note.message}</p>
      <p className="bb-note__name">{note.name}</p>
    </article>
  );
}

export default BulletinBoard;
