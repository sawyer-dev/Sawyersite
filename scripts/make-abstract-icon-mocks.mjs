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

const options = [
  {
    group: 'S-like',
    name: 'Offset pair',
    note: 'Two squares, closest to the current favicon',
    art: `<rect x="48" y="48" width="82" height="82" fill="#2ba84a"/>
      <rect x="86" y="86" width="82" height="82" fill="#248232" stroke="#040f0f" stroke-width="8"/>`,
  },
  {
    group: 'S-like',
    name: 'Diagonal path',
    note: 'Three blocks hint at an S without drawing one',
    art: `<rect x="76" y="48" width="58" height="58" fill="#2ba84a"/>
      <rect x="48" y="76" width="58" height="58" fill="#248232" stroke="#040f0f" stroke-width="6"/>
      <rect x="76" y="104" width="58" height="58" fill="#2ba84a" stroke="#040f0f" stroke-width="6"/>`,
  },
  {
    group: 'S-like',
    name: 'S channel',
    note: 'One compact shape with a stepped negative-space cut',
    art: `<path fill="#2ba84a" d="M48 48h112v112H48z"/>
      <path fill="#040f0f" d="M136 64v20H88Q76 84 76 96v4h40q28 0 28 26t-28 26H68v-20h48q8 0 8-6t-8-6H84q-28 0-28-28t28-28z"/>`,
  },
  {
    group: 'SK-like',
    name: 'Corner pair',
    note: 'Offset blocks with a shared center',
    art: `<path fill="#2ba84a" d="M48 48h84v28H76v28H48zM76 104h84v56H76v-28h56v-28H76z"/>
      <path fill="#248232" d="M132 48h28v56h-28zM48 132h28v28H48z"/>`,
  },
  {
    group: 'SK-like',
    name: 'Shared spine',
    note: 'An S-like path meets a simple K-shaped branch',
    art: `<path fill="#248232" d="M48 48h72v20H68v18h52v20H68v18h52v20H48v-20h52v-18H48V86h52V68H48z"/>
      <path fill="#2ba84a" d="M112 48h20v44l30-44h22l-34 50 36 62h-23l-27-46-4 6v40h-20z"/>`,
  },
  {
    group: 'SK-like',
    name: 'Shared square',
    note: 'A square tile split into two interlocking initials',
    art: `<path fill="#2ba84a" d="M48 48h112v112H48z"/>
      <path fill="#040f0f" d="M140 64v18h-44q-10 0-10 8t10 8h24q24 0 24 22t-24 22H68v-18h52q8 0 8-8t-8-8H96q-28 0-28-20t28-24z"/>
      <path fill="#248232" d="M112 70h18v33l23-33h18l-26 39 28 43h-20l-18-28-5 7v21h-18z"/>`,
  },
];

const cards = options
  .map(
    (option) => `<article class="card">
      <p class="group">${option.group}</p>
      <svg class="mark" viewBox="0 0 208 208" role="img" aria-label="${option.name} abstract monogram">
        <rect width="208" height="208" rx="26" fill="#040f0f" stroke="#2d3a3a" stroke-width="2"/>
        ${option.art}
      </svg>
      <h2>${option.name}</h2>
      <p class="note">${option.note}</p>
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
.intro{max-width:440px;font-size:17px;line-height:1.5;color:#a9bcb7}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.card{height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:30px 24px;background:#0d1e1e;border:1px solid #2d3a3a;border-radius:8px;text-align:center}
.group{position:absolute;top:22px;left:24px;color:#4cc066;font:13px ui-monospace,Consolas,monospace;letter-spacing:2px}
.mark{width:208px;height:208px;flex:none}
h2{margin-top:26px;font-size:24px;line-height:1.2}
.note{margin-top:8px;font-size:15px;color:#a9bcb7}
footer{margin-top:26px;color:#a9bcb7;font-size:14px}
</style></head><body>
<header><div><p class="eyebrow">Identity explorations · Round 2</p><h1>Abstract mark studies</h1></div><p class="intro">Simpler block forms inspired by the current favicon. No site icons or artwork have been changed.</p></header>
<main class="grid">${cards}</main>
<footer>Palette: #040F0F · #248232 · #2BA84A · #2D3A3A · #FCFFFC</footer>
</body></html>`;

const dir = await mkdtemp(join(tmpdir(), 'abstract-icons-'));
let browser;
for (const settings of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
  try {
    browser = await chromium.launch(settings);
    break;
  } catch {
    // try the next browser
  }
}
if (!browser)
  throw new Error('No Chromium-based browser found. Run: npx playwright install chromium');

try {
  const file = join(dir, 'abstract-icon-mocks.html');
  await writeFile(file, html);
  const page = await browser.newPage({ viewport: { width: 1500, height: 1120 } });
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'public', 'icon-mocks-abstract.png') });
  await page.close();
  console.log('wrote public/icon-mocks-abstract.png');
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}
