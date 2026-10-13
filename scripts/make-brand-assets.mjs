// Regenerates public/og-default.png and public/apple-touch-icon.png from the brand palette.
// Usage: node scripts/make-brand-assets.mjs   (uses installed Microsoft Edge/Chrome, or Playwright's Chromium)
import { chromium } from 'playwright';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { generate, seedRow, toSvgPath } from '../src/lib/automaton.ts';

const root = resolve(import.meta.dirname, '..');
const font = pathToFileURL(
  join(
    root,
    'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  ),
).href;

const cols = 60;
const rows = 32;
const pattern = toSvgPath(
  generate(110, cols, rows, seedRow(cols, 'single', Math.random, cols - 2)),
);

const ogHtml = `<!doctype html><html><head><style>
@font-face{font-family:SG;src:url('${font}');font-weight:300 700}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#040f0f;color:#fcfffc;font-family:SG,system-ui,sans-serif;position:relative;overflow:hidden}
svg{position:absolute;right:0;top:0;width:660px;height:630px;opacity:.9}
path{fill:#2ba84a}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,#040f0f 38%,rgba(4,15,15,.2) 70%,rgba(4,15,15,0))}
.copy{position:absolute;left:80px;bottom:90px;width:640px}
.mark{display:inline-block;width:28px;height:28px;background:#2ba84a;box-shadow:14px 14px 0 -2px #248232;margin-bottom:44px}
h1{font-size:104px;line-height:1;letter-spacing:-3px;font-weight:700}
p{margin-top:28px;font-size:38px;color:#a9bcb7}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:#2ba84a}
</style></head><body>
<svg viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges"><path d="${pattern}"/></svg>
<div class="shade"></div>
<div class="copy"><span class="mark"></span><h1>Sawyer Knowles</h1><p>Full-stack software engineer</p></div>
<div class="bar"></div></body></html>`;

const iconHtml = `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:#040f0f;position:relative">
<div style="position:absolute;left:40px;top:40px;width:62px;height:62px;background:#2ba84a"></div>
<div style="position:absolute;left:76px;top:76px;width:66px;height:66px;background:#248232;border:8px solid #040f0f;box-sizing:content-box;margin:-8px 0 0 -8px"></div>
</body></html>`;

const dir = await mkdtemp(join(tmpdir(), 'brand-'));
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
  for (const [name, html, width, height] of [
    ['og-default.png', ogHtml, 1200, 630],
    ['apple-touch-icon.png', iconHtml, 180, 180],
  ]) {
    const file = join(dir, `${name}.html`);
    await writeFile(file, html);
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(root, 'public', name) });
    await page.close();
    console.log(`wrote public/${name}`);
  }
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}
