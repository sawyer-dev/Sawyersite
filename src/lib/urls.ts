/** Joins a deployment base path with a site-relative path, always producing a single leading slash. */
export function joinBase(base: string, path: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path;
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}

/** Resolves a site-relative path (e.g. "projects/") against the configured base path. */
export function url(path = ''): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

export function absoluteUrl(path: string, site: URL | string): string {
  return new URL(joinBase(import.meta.env.BASE_URL, path), site).toString();
}

/** First path segment after the base path, e.g. "/Sawyersite/projects/x/" -> "projects". */
export function sectionOf(pathname: string, base: string): string {
  const relative = pathname.slice(base.replace(/\/+$/, '').length).replace(/^\/+/, '');
  return relative.split('/')[0] ?? '';
}

export function isExternalUrl(href: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}
