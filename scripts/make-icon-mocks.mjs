import { chromium } from 'playwright';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const font = pathToFileURL(
  join(
    root,
    'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  ),
).href;

const pixel = (rows, x, y, unit, color) =>
  `<g fill="${color}">${rows
    .flatMap((row, rowIndex) =>
      [...row].flatMap((cell, colIndex) =>
        cell === '1'
          ? [
              `<rect x="${x + colIndex * unit}" y="${y + rowIndex * unit}" width="${unit}" height="${unit}"/>`,
            ]
          : [],
      ),
    )
    .join('')}</g>`;

const sPixels = ['01111', '11000', '11000', '01110', '00011', '00011', '11110'];
const kPixels = ['10001', '10010', '10100', '11000', '10100', '10010', '10001'];

const mocks = [
  {
    group: 'S',
    name: 'Pixel S',
    note: 'A compact, unmistakable block letter',
    art: pixel(sPixels, 59, 41, 18, '#2ba84a'),
  },
  {
    group: 'S',
    name: 'Stepped S',
    note: 'Built from the favicon’s offset-square motif',
    art: `${pixel(sPixels, 67, 49, 18, '#248232')}${pixel(sPixels, 51, 33, 18, '#2ba84a')}`,
  },
  {
    group: 'S',
    name: 'Carved S',
    note: 'A bold tile with the letter cut through',
    art: `<rect x="45" y="40" width="118" height="128" rx="3" fill="#2ba84a"/>${pixel(sPixels, 72, 48, 13, '#040f0f')}`,
  },
  {
    group: 'SK',
    name: 'Pixel SK',
    note: 'Two readable letters in a shared grid',
    art: `${pixel(sPixels, 27, 50, 15, '#2ba84a')}${pixel(kPixels, 108, 50, 15, '#2ba84a')}`,
  },
  {
    group: 'SK',
    name: 'Shared-spine SK',
    note: 'The S and K meet at one upright stroke',
    art: `${pixel(sPixels, 27, 50, 15, '#248232')}<path fill="#2ba84a" d="M102 50h15v41l27-41h19l-29 44 31 62h-19l-23-44-6 9v35h-15z"/>`,
  },
  {
    group: 'SK',
    name: 'Overlapped SK',
    note: 'Offset colors keep both letters legible',
    art: `${pixel(sPixels, 40, 50, 15, '#2ba84a')}<path fill="#248232" d="M112 50h16v43l27-43h18l-29 45 30 60h-19l-23-45-4 8v37h-16z"/>`,
  },
];

const cards = mocks
  .map(
    (mock) => `<article class="card">
      <p class="group">${mock.group}</p>
      <svg class="mark" viewBox="0 0 208 208" role="img" aria-label="${mock.name} monogram">
        <rect width="208" height="208" rx="26" fill="#040f0f" stroke="#2d3a3a" stroke-width="2"/>
        ${mock.art}
      </svg>
      <h2>${mock.name}</h2>
      <p class="note">${mock.note}</p>
    </article>`,
  )
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:SG;src:url('${font}');font-weight:300 700}
*{box-sizing:border-box;margin:0}
body{width:1500px;height:1120px;padding:56px 64px;background:#040f0f;color:#fcfffc;font-family:SG,system-ui,sans-serif}
header{display:flex;align-items:end;justify-content:space-between;margin-bottom:40px;border-bottom:1px solid #2d3a3a;padding-bottom:24px}
.eyebrow{font:14px ui-monospace,Consolas,monospace;letter-spacing:2px;text-transform:uppercase;color:#4cc066}
h1{margin-top:8px;font-size:42px;line-height:1.1}
.intro{max-width:430px;font-size:17px;line-height:1.5;color:#a9bcb7}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:30px 24px;background:#0d1e1e;border:1px solid #2d3a3a;border-radius:8px;text-align:center}
.group{position:absolute;top:22px;left:24px;color:#4cc066;font:13px ui-monospace,Consolas,monospace;letter-spacing:2px}
.mark{width:208px;height:208px;flex:none}
h2{margin-top:26px;font-size:24px;line-height:1.2}
.note{margin-top:8px;font-size:15px;color:#a9bcb7}
footer{margin-top:26px;color:#a9bcb7;font-size:14px}
</style></head><body>
<header><div><p class="eyebrow">Identity explorations</p><h1>Monogram studies</h1></div><p class="intro">Six compact marks in the existing favicon palette. The current favicon and site artwork have not been changed.</p></header>
<main class="grid">${cards}</main>
<footer>Palette: #040F0F · #248232 · #2BA84A · #2D3A3A · #FCFFFC</footer>
</body></html>`;

const dir = await mkdtemp(join(tmpdir(), 'icon-mocks-'));
let browser;
for (const options of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
  try {
    browser = await chromium.launch(options);
    break;
  } catch {
    // try the next browser
  }
}
if (!browser)
  throw new Error('No Chromium-based browser found. Run: npx playwright install chromium');

try {
  const file = join(dir, 'icon-mocks.html');
  await writeFile(file, html);
  const page = await browser.newPage({ viewport: { width: 1500, height: 1120 } });
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'public', 'icon-mocks.png') });
  await page.close();
  console.log('wrote public/icon-mocks.png');
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}
