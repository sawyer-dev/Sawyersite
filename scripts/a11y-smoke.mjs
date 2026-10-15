// Serves dist/ under the configured base path and runs browser smoke checks on every built page:
// axe accessibility scan (light + dark), horizontal overflow at several widths, and console/network errors.
// Usage: npm run build && npm run test:a11y
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { basePath } from '../site.config.mjs';

const dist = resolve(import.meta.dirname, '..', 'dist');
const base = basePath === '/' ? '' : basePath;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    out.push(...(e.isDirectory() ? await walk(full) : [full]));
  }
  return out;
}

async function pick(urlPath) {
  const rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
  for (const c of [join(dist, rel), join(dist, rel, 'index.html')]) {
    const s = await stat(c).catch(() => null);
    if (s?.isFile()) return c;
  }
  return null;
}

// Mirrors GitHub Pages: files under the base path, 404.html for anything else.
const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  let file = null;
  if (pathname === base || pathname.startsWith(`${base}/`))
    file = await pick(pathname.slice(base.length) || '/');
  const status = file ? 200 : 404;
  file ??= join(dist, '404.html');
  res.writeHead(status, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;

const htmlFiles = (await walk(dist)).filter((f) => f.endsWith('.html'));
const routes = htmlFiles
  .map((f) => relative(dist, f).split(sep).join('/'))
  .map((p) => (p === '404.html' ? '404.html' : p.replace(/index\.html$/, '')))
  .map((p) => `${base}/${p}`);

let browser;
for (const options of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
  try {
    browser = await chromium.launch(options);
    break;
  } catch {
    // try the next browser
  }
}
if (!browser) {
  server.close();
  throw new Error('No Chromium-based browser found. Run: npx playwright install chromium');
}

const problems = [];
const widths = [320, 768, 1280, 1920];

for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({
    colorScheme: theme,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const runtime = [];
  page.on('console', (m) => m.type() === 'error' && runtime.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => runtime.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => runtime.push(`request failed: ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().endsWith('/404.html') && !r.url().endsWith('favicon.ico')) {
      if (!routes.includes(new URL(r.url()).pathname) || r.status() !== 404)
        runtime.push(`HTTP ${r.status()}: ${r.url()}`);
    }
  });

  for (const route of routes) {
    runtime.length = 0;
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    if (route.includes('/apps/') && route.split('/').filter(Boolean).length > 2) {
      await page
        .waitForSelector('.rule-explorer, .bulletin-board', { timeout: 10_000 })
        .catch(() => runtime.push('app did not render'));
    }
    const label = `[${theme}] ${route}`;

    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    for (const v of result.violations) {
      problems.push(
        `${label} axe ${v.id} (${v.impact}): ${v.nodes
          .slice(0, 2)
          .map((n) => n.target.join(' '))
          .join(' | ')}`,
      );
    }

    if (theme === 'light') {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 800 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (overflow > 0)
          problems.push(`${label} horizontal overflow of ${overflow}px at ${width}px`);
      }
    }
    for (const r of runtime) problems.push(`${label} ${r}`);
  }
  await context.close();
}

await browser.close();
server.close();

if (problems.length > 0) {
  console.error(
    `Smoke checks found ${problems.length} problem(s):\n${problems.map((p) => ` - ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `Smoke checks passed for ${routes.length} pages (light + dark axe scans, overflow at ${widths.join('/')}px).`,
);
