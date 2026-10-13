// Validates the production build in dist/: metadata, headings, internal links, anchors, and assets.
// Usage: npm run build && npm run validate
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { basePath, siteUrl } from '../site.config.mjs';

const dist = resolve(import.meta.dirname, '..', 'dist');
const base = basePath === '/' ? '' : basePath;
const errors = [];
const fail = (page, message) => errors.push(`${page}: ${message}`);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const exists = async (p) =>
  stat(p).then(
    (s) => s.isFile(),
    () => false,
  );

/** Maps a site URL path (already stripped of base, query and hash) to a file in dist/. */
async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath).replace(/^\/+/, '');
  const candidates =
    urlPath.endsWith('/') || clean === ''
      ? [join(dist, clean, 'index.html')]
      : [join(dist, clean), join(dist, clean, 'index.html'), join(dist, `${clean}.html`)];
  for (const c of candidates) if (await exists(c)) return c;
  return null;
}

const files = await walk(dist);
const pages = files.filter((f) => f.endsWith('.html'));
if (pages.length === 0) {
  console.error('No HTML found in dist/. Run "npm run build" first.');
  process.exit(1);
}

const idsByFile = new Map();
const htmlByFile = new Map();
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  htmlByFile.set(file, html);
  idsByFile.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

for (const file of pages) {
  const html = htmlByFile.get(file);
  const page = relative(dist, file).split(sep).join('/');
  const isNotFound = page === '404.html';

  if (!/<html[^>]*\slang="/.test(html)) fail(page, 'missing <html lang>');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  if (!title) fail(page, 'missing <title>');
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
  if (!description) fail(page, 'missing meta description');
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  if (!noindex && !/<link rel="canonical" href="[^"]+"/.test(html))
    fail(page, 'missing canonical link');
  if (isNotFound && !noindex) fail(page, '404 page should be noindex');
  if (!isNotFound && noindex) fail(page, 'page is unexpectedly noindex');
  if (!/<meta property="og:image" content="[^"]+"/.test(html)) fail(page, 'missing og:image');

  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1Count !== 1) fail(page, `expected exactly one <h1>, found ${h1Count}`);
  if (!/<main[\s>]/.test(html)) fail(page, 'missing <main> landmark');
  if (!/class="skip-link"/.test(html)) fail(page, 'missing skip link');

  for (const img of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(img[0])) fail(page, `image without alt: ${img[0].slice(0, 80)}`);
  }
  for (const a of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(a[0]))
      fail(page, `target=_blank without noopener: ${a[0].slice(0, 80)}`);
  }

  const refs = [...html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|data:)/i.test(ref)) {
      if (ref.startsWith('http://')) fail(page, `insecure link: ${ref}`);
      continue;
    }
    const [beforeHash, hash] = ref.split('#');
    const pathOnly = beforeHash.split('?')[0];

    let targetFile = file;
    if (pathOnly !== '') {
      let sitePath;
      if (pathOnly.startsWith('/')) {
        if (base && !(pathOnly === base || pathOnly.startsWith(`${base}/`))) {
          fail(page, `root-relative URL ignores base path "${base}": ${ref}`);
          continue;
        }
        sitePath = pathOnly.slice(base.length) || '/';
      } else {
        sitePath = new URL(pathOnly, `http://x/${page.replace(/index\.html$/, '')}`).pathname;
      }
      targetFile = await resolveFile(sitePath);
      if (!targetFile) {
        fail(page, `broken internal link: ${ref}`);
        continue;
      }
    }
    if (
      hash &&
      targetFile.endsWith('.html') &&
      !idsByFile.get(targetFile)?.has(decodeURIComponent(hash))
    ) {
      fail(page, `missing anchor target: ${ref}`);
    }
  }
}

for (const required of [
  'robots.txt',
  'favicon.svg',
  'og-default.png',
  'apple-touch-icon.png',
  'sitemap-index.xml',
]) {
  if (!(await exists(join(dist, required)))) errors.push(`dist/${required}: missing`);
}
const robots = await readFile(join(dist, 'robots.txt'), 'utf8').catch(() => '');
if (/Disallow:\s*\/\s*$/m.test(robots)) errors.push('robots.txt blocks the whole site');
if (!robots.includes(siteUrl))
  errors.push('robots.txt sitemap URL does not use the configured site URL');

if (errors.length > 0) {
  console.error(
    `Validation failed with ${errors.length} problem(s):\n${errors.map((e) => ` - ${e}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `Validated ${pages.length} pages: metadata, headings, links, anchors, and assets are consistent.`,
);
