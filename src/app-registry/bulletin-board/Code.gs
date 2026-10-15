const BB = {
  notesSheet: 'Bulletin Notes',
  noteHeaders: [
    'Note ID',
    'Submitted At',
    'Name',
    'Message',
    'Font',
    'Font Size',
    'Text Color',
    'Paper Color',
    'X',
    'Y',
    'Rotation',
    'Status',
    'Moderation Token Hash',
    'Token Expires At',
    'Moderated At',
  ],
  email: 'sawyer.k.dev@gmail.com',
  originProperty: 'BULLETIN_ALLOWED_ORIGINS',
  maxApproved: 100,
  maxDailySubmissions: 25,
  tokenLifetimeHours: 72,
  nameMax: 40,
  messageMax: 280,
  fontSizes: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  fonts: ['sans', 'serif', 'mono'],
  textColors: ['ink', 'slate'],
  paperColors: ['lemon', 'sky', 'mint', 'rose', 'lilac'],
};

const BB_ORIGIN_DEFAULTS = [
  'https://sawyer-dev.github.io',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Bulletin Board')
    .addItem('Initialize or verify setup', 'setupBulletinBoard')
    .addToUi();
}

/** Run this once from the bound Apps Script editor after pasting this file. */
function setupBulletinBoard() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open this Apps Script project from the Google Sheet you created.');
  }

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('BULLETIN_SPREADSHEET_ID', spreadsheet.getId());
  properties.setProperty('BULLETIN_MODERATION_EMAIL', BB.email);
  if (!properties.getProperty(BB.originProperty)) {
    properties.setProperty(BB.originProperty, BB_ORIGIN_DEFAULTS.join(','));
  }

  let sheet = spreadsheet.getSheetByName(BB.notesSheet);
  if (!sheet) sheet = spreadsheet.insertSheet(BB.notesSheet);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, BB.noteHeaders.length).setValues([BB.noteHeaders]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, BB.noteHeaders.length).setFontWeight('bold');
    sheet.autoResizeColumns(1, BB.noteHeaders.length);
  } else {
    const current = sheet.getRange(1, 1, 1, BB.noteHeaders.length).getDisplayValues()[0];
    if (current.join('|') !== BB.noteHeaders.join('|')) {
      throw new Error(
        `The first row in "${BB.notesSheet}" does not match the expected headers. Do not overwrite existing data.`,
      );
    }
  }

  return `Ready: ${spreadsheet.getName()} / ${BB.notesSheet}`;
}

function doGet(event) {
  const parameters = (event && event.parameter) || {};
  if (parameters.mode === 'bridge') {
    const parentOrigin = allowedParentOrigin_(parameters.origin);
    if (!parentOrigin) {
      return HtmlService.createHtmlOutput(
        '<!doctype html><p>Bulletin Board origin is not allowed. Update BULLETIN_ALLOWED_ORIGINS in Script Properties.</p>',
      );
    }
    return HtmlService.createHtmlOutput(bridgeHtml_(parentOrigin))
      .setTitle('Bulletin Board connection')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (parameters.mode === 'moderate') {
    return HtmlService.createHtmlOutput(moderationHtml_(String(parameters.token || ''))).setTitle(
      'Review bulletin note',
    );
  }
  return HtmlService.createHtmlOutput(
    '<!doctype html><title>Bulletin Board service</title><p>Bulletin Board service is running.</p>',
  );
}

function bridgeHtml_(parentOrigin) {
  const target = JSON.stringify(parentOrigin);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Board connection</title></head>
<body><script>
  const parentOrigin = ${target};
  const channel = 'sawyer-bulletin-board';
  window.addEventListener('message', function (event) {
    if (event.source !== window.top || event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || data.channel !== channel) return;
    if (data.type === 'connect') {
      window.top.postMessage({ channel: channel, type: 'ready' }, parentOrigin);
      return;
    }
    if (typeof data.requestId !== 'string') return;
    if (data.action !== 'list' && data.action !== 'submit') return;
    google.script.run
      .withSuccessHandler(function (result) {
        window.top.postMessage({ channel: channel, requestId: data.requestId, ok: true, result: result }, parentOrigin);
      })
      .withFailureHandler(function (error) {
        window.top.postMessage({ channel: channel, requestId: data.requestId, ok: false, error: String(error && error.message || 'Request failed') }, parentOrigin);
      })
      .bulletinApi(data.action, data.payload || {});
  });
</script></body></html>`;
}

function allowedParentOrigin_(origin) {
  const candidate = String(origin || '').replace(/\/$/, '');
  const properties = PropertiesService.getScriptProperties();
  const configured = properties.getProperty(BB.originProperty) || BB_ORIGIN_DEFAULTS.join(',');
  const allowed = configured.split(',').map((value) => value.trim().replace(/\/$/, ''));
  return allowed.indexOf(candidate) >= 0 ? candidate : '';
}

/** Called only by the origin-checked HTML-service bridge. */
function bulletinApi(action, payload) {
  if (action === 'list') return listApprovedNotes_();
  if (action === 'submit') return submitNote_(payload || {});
  throw new Error('Unsupported Bulletin Board action.');
}

function listApprovedNotes_() {
  const sheet = notesSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { notes: [] };

  const values = sheet.getRange(2, 1, lastRow - 1, BB.noteHeaders.length).getValues();
  const notes = values
    .filter((row) => row[11] === 'approved')
    .slice(-BB.maxApproved)
    .map((row) => ({
      id: String(row[0]),
      createdAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1]),
      name: String(row[2]),
      message: String(row[3]),
      font: String(row[4]),
      fontSize: Number(row[5]),
      textColor: String(row[6]),
      paperColor: String(row[7]),
      x: Number(row[8]),
      y: Number(row[9]),
      rotation: Number(row[10]),
    }));
  return { notes: notes };
}

function submitNote_(payload) {
  if (payload.website) {
    return { accepted: true, noteId: '' };
  }
  const note = validateSubmission_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let rowNumber = 0;
  try {
    enforceSubmissionLimit_();
    if (MailApp.getRemainingDailyQuota() < 1) {
      throw new Error(
        'The board has reached its email limit for today. Please try again tomorrow.',
      );
    }

    const now = new Date();
    const token = `${Utilities.getUuid()}${Utilities.getUuid()}`;
    const tokenHash = tokenHash_(token);
    const expires = new Date(now.getTime() + BB.tokenLifetimeHours * 60 * 60 * 1000);
    const noteId = Utilities.getUuid();
    const sheet = notesSheet_();
    rowNumber = sheet.getLastRow() + 1;
    sheet
      .getRange(rowNumber, 1, 1, BB.noteHeaders.length)
      .setValues([
        [
          noteId,
          now,
          note.name,
          note.message,
          note.font,
          note.fontSize,
          note.textColor,
          note.paperColor,
          note.x,
          note.y,
          note.rotation,
          'pending',
          tokenHash,
          expires,
          '',
        ],
      ]);

    try {
      sendModerationEmail_(note, token, expires);
    } catch (error) {
      sheet.deleteRow(rowNumber);
      rowNumber = 0;
      throw new Error(
        'The notification email could not be sent, so the note was not submitted. Please try again later.',
      );
    }

    incrementDailySubmissionCount_();
    return { accepted: true, noteId: noteId };
  } finally {
    lock.releaseLock();
  }
}

function validateSubmission_(payload) {
  const name = String(payload.name || '').trim();
  const message = String(payload.message || '').trim();
  if (!name || name.length > BB.nameMax)
    throw new Error(`Name must be between 1 and ${BB.nameMax} characters.`);
  if (/[\u0000-\u001f\u007f]/.test(name))
    throw new Error('Name contains unsupported control characters.');
  if (!message || message.length > BB.messageMax)
    throw new Error(`Message must be between 1 and ${BB.messageMax} characters.`);

  const font = String(payload.font || '');
  const fontSize = Number(payload.fontSize);
  const textColor = String(payload.textColor || '');
  const paperColor = String(payload.paperColor || '');
  const x = Number(payload.x);
  const y = Number(payload.y);
  const rotation = Number(payload.rotation);
  if (BB.fonts.indexOf(font) < 0) throw new Error('Unsupported font.');
  if (BB.fontSizes.indexOf(fontSize) < 0) throw new Error('Unsupported font size.');
  if (BB.textColors.indexOf(textColor) < 0) throw new Error('Unsupported text color.');
  if (BB.paperColors.indexOf(paperColor) < 0) throw new Error('Unsupported paper color.');
  if (!Number.isFinite(x) || x < 8 || x > 92 || !Number.isFinite(y) || y < 8 || y > 92) {
    throw new Error('Note position is outside the board.');
  }
  if (!Number.isFinite(rotation) || rotation < -8 || rotation > 8)
    throw new Error('Unsupported note rotation.');

  return {
    name: name,
    message: message,
    font: font,
    fontSize: fontSize,
    textColor: textColor,
    paperColor: paperColor,
    x: Math.round(x),
    y: Math.round(y),
    rotation: Math.round(rotation),
  };
}

function sendModerationEmail_(note, token, expires) {
  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) throw new Error('Deploy this project as a web app before accepting notes.');
  const reviewUrl = `${serviceUrl}?mode=moderate&token=${encodeURIComponent(token)}`;
  const expiryText = Utilities.formatDate(
    expires,
    Session.getScriptTimeZone(),
    'MMM d, yyyy h:mm a z',
  );
  const recipient =
    PropertiesService.getScriptProperties().getProperty('BULLETIN_MODERATION_EMAIL') || BB.email;
  const subject = `Bulletin Board note awaiting review from ${note.name}`;
  const body = `A visitor submitted a note for your Bulletin Board.\n\nName: ${note.name}\n\nMessage:\n${note.message}\n\nReview (expires ${expiryText}): ${reviewUrl}`;
  const htmlBody = `<p>A visitor submitted a note for your Bulletin Board.</p><p><strong>Name:</strong> ${escapeHtml_(note.name)}</p><p><strong>Message:</strong><br>${escapeHtml_(note.message).replace(/\n/g, '<br>')}</p><p><a href="${escapeHtml_(reviewUrl)}">Review this note</a></p><p>This one-time link expires ${escapeHtml_(expiryText)}. Opening it does not approve or reject the note.</p>`;
  MailApp.sendEmail({ to: recipient, subject: subject, body: body, htmlBody: htmlBody });
}

function moderationHtml_(token) {
  if (!/^[A-Za-z0-9-]{60,100}$/.test(token)) {
    return HtmlService.createHtmlOutput(
      moderationPageShell_('<p class="error">This review link is invalid.</p>'),
    );
  }
  const safeToken = JSON.stringify(token);
  const content = `<main><p class="eyebrow">BULLETIN BOARD</p><h1>Review note</h1><p id="state" role="status">Loading the pending note…</p><section id="note" hidden><p class="name" id="name"></p><blockquote id="message"></blockquote><div class="actions"><button class="approve" onclick="moderate('approve')">Approve note</button><button class="reject" onclick="moderate('reject')">Reject and delete</button></div></section></main>
<script>
  const token = ${safeToken};
  const state = document.getElementById('state');
  google.script.run.withSuccessHandler(function (note) {
    if (!note) { state.textContent = 'This note is expired, already reviewed, or no longer available.'; return; }
    document.getElementById('name').textContent = note.name;
    document.getElementById('message').textContent = note.message;
    document.getElementById('note').hidden = false;
    state.textContent = 'Choose whether to publish this note. Nothing changes until you press a button.';
  }).withFailureHandler(function () { state.textContent = 'Could not load the note. Try opening this link again.'; }).getModerationPreview(token);
  function moderate(action) {
    document.querySelectorAll('button').forEach(function (button) { button.disabled = true; });
    state.textContent = action === 'approve' ? 'Approving…' : 'Deleting…';
    google.script.run.withSuccessHandler(function (result) {
      state.textContent = result.message;
      document.getElementById('note').hidden = true;
    }).withFailureHandler(function () {
      state.textContent = 'The action failed. The note has not been changed. Try again.';
      document.querySelectorAll('button').forEach(function (button) { button.disabled = false; });
    }).finishModeration(token, action);
  }
</script>`;
  return HtmlService.createHtmlOutput(moderationPageShell_(content)).setTitle(
    'Review Bulletin Board note',
  );
}

function moderationPageShell_(content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bulletin Board moderation</title><style>
    :root{font-family:Arial,sans-serif;color:#040f0f;background:#fcfffc}body{margin:0;padding:32px}main{max-width:620px;margin:0 auto}.eyebrow{color:#248232;font:bold 12px monospace;letter-spacing:1.5px}h1{font-size:30px}#state{line-height:1.5}.name{font-weight:bold}blockquote{margin:16px 0;padding:16px 20px;background:#f1f7f2;border-left:4px solid #2ba84a;white-space:pre-wrap;overflow-wrap:anywhere}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}button{min-height:44px;padding:10px 18px;border:1px solid #6f857a;border-radius:6px;background:#fcfffc;color:#040f0f;font:600 15px Arial,sans-serif;cursor:pointer}button.approve{background:#248232;color:#fcfffc;border-color:#248232}button:disabled{opacity:.6;cursor:wait}button:focus-visible{outline:3px solid #248232;outline-offset:3px}.error{padding:14px;border:1px solid #6f857a;border-radius:6px}
  </style></head><body>${content}</body></html>`;
}

/** Read-only preview invoked by the email confirmation page. */
function getModerationPreview(token) {
  const row = findPendingNote_(token);
  if (!row) return null;
  return { name: String(row.values[2]), message: String(row.values[3]) };
}

/** Called only after the owner confirms in the email review page. */
function finishModeration(token, action) {
  if (action !== 'approve' && action !== 'reject')
    throw new Error('Unsupported moderation action.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const found = findPendingNote_(token);
    if (!found) throw new Error('This note is expired, already reviewed, or no longer available.');
    const sheet = found.sheet;
    if (action === 'approve') {
      sheet.getRange(found.rowNumber, 12).setValue('approved');
      sheet.getRange(found.rowNumber, 13, 1, 3).setValues([['', '', new Date()]]);
      return { message: 'Approved. The note will appear on the public board.' };
    }
    sheet.deleteRow(found.rowNumber);
    return { message: 'Rejected. The note has been deleted.' };
  } finally {
    lock.releaseLock();
  }
}

function findPendingNote_(token) {
  if (!/^[A-Za-z0-9-]{60,100}$/.test(String(token || ''))) return null;
  const sheet = notesSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const hash = tokenHash_(token);
  const values = sheet.getRange(2, 1, lastRow - 1, BB.noteHeaders.length).getValues();
  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    if (row[11] !== 'pending' || row[12] !== hash) continue;
    const expiry = row[13] instanceof Date ? row[13] : new Date(row[13]);
    if (!Number.isFinite(expiry.getTime()) || expiry.getTime() < Date.now()) return null;
    return { sheet: sheet, rowNumber: index + 2, values: row };
  }
  return null;
}

function enforceSubmissionLimit_() {
  const properties = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  const key = `BULLETIN_SUBMISSIONS_${today}`;
  const current = Number(properties.getProperty(key) || '0');
  if (current >= BB.maxDailySubmissions) {
    throw new Error('The board has reached its daily submission limit. Please try again tomorrow.');
  }
}

function incrementDailySubmissionCount_() {
  const properties = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  const key = `BULLETIN_SUBMISSIONS_${today}`;
  properties.setProperty(key, String(Number(properties.getProperty(key) || '0') + 1));
}

function notesSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('BULLETIN_SPREADSHEET_ID');
  if (!id)
    throw new Error('Run setupBulletinBoard from the bound Sheet Apps Script project first.');
  const spreadsheet = SpreadsheetApp.openById(id);
  const sheet = spreadsheet.getSheetByName(BB.notesSheet);
  if (!sheet)
    throw new Error(`The "${BB.notesSheet}" tab is missing. Run setupBulletinBoard again.`);
  return sheet;
}

function tokenHash_(token) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    token,
    Utilities.Charset.UTF_8,
  );
  return Utilities.base64EncodeWebSafe(digest);
}

function escapeHtml_(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}
