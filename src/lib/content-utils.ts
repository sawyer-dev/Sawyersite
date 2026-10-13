export interface Neighbours<T> {
  /** The entry listed immediately before this one (newer, in index order). */
  previous: T | undefined;
  /** The entry listed immediately after this one (older, in index order). */
  next: T | undefined;
}

type WithData<D> = { id: string; data: D };

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title);

/** Newest `year` first; ties by ascending `order`, then title. */
export function sortProjects<T extends WithData<{ year: number; order: number; title: string }>>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) => b.data.year - a.data.year || a.data.order - b.data.order || byTitle(a.data, b.data),
  );
}

/** Current hobbies first, then ascending `order`, then title. */
export function sortHobbies<
  T extends WithData<{ status: 'current' | 'historical'; order: number; title: string }>,
>(items: readonly T[]): T[] {
  const rank = (s: 'current' | 'historical') => (s === 'current' ? 0 : 1);
  return [...items].sort(
    (a, b) =>
      rank(a.data.status) - rank(b.data.status) ||
      a.data.order - b.data.order ||
      byTitle(a.data, b.data),
  );
}

/** Most recently updated first, then title. */
export function sortApps<T extends WithData<{ updated: Date; title: string }>>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) => b.data.updated.getTime() - a.data.updated.getTime() || byTitle(a.data, b.data),
  );
}

export function neighbours<T extends { id: string }>(
  list: readonly T[],
  id: string,
): Neighbours<T> {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return { previous: undefined, next: undefined };
  return { previous: list[index - 1], next: list[index + 1] };
}

export function filterPublished<T extends { data: { draft: boolean } }>(
  items: readonly T[],
  showDrafts: boolean,
): T[] {
  return items.filter((item) => showDrafts || !item.data.draft);
}

export function formatYearSpan(start: number | undefined, end: number): string {
  return start && start !== end ? `${start}–${end}` : String(end);
}
