export type RuleTable = readonly boolean[];

export type ParsedRule = { ok: true; value: number } | { ok: false; message: string };

/** Index is the neighbourhood value (left << 2 | centre << 1 | right); value is the next cell state. */
export function ruleToTable(rule: number): boolean[] {
  return Array.from({ length: 8 }, (_, i) => ((rule >> i) & 1) === 1);
}

export function tableToRule(table: RuleTable): number {
  return table.reduce((sum, on, i) => sum + (on ? 1 << i : 0), 0);
}

export function parseRule(input: string): ParsedRule {
  const text = input.trim();
  if (text === '') return { ok: false, message: 'Enter a rule number from 0 to 255.' };
  if (!/^\d+$/.test(text)) return { ok: false, message: 'Rule must be a whole number.' };
  const value = Number(text);
  if (value > 255) return { ok: false, message: 'Rule must be between 0 and 255.' };
  return { ok: true, value };
}

export function nextRow(row: Uint8Array, table: RuleTable): Uint8Array {
  const n = row.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const left = row[(i - 1 + n) % n]!;
    const centre = row[i]!;
    const right = row[(i + 1) % n]!;
    out[i] = table[(left << 2) | (centre << 1) | right] ? 1 : 0;
  }
  return out;
}

export function seedRow(
  cols: number,
  kind: 'single' | 'random',
  random: () => number = Math.random,
  position = Math.floor(cols / 2),
): Uint8Array {
  const row = new Uint8Array(cols);
  if (kind === 'single') {
    row[position % cols] = 1;
  } else {
    for (let i = 0; i < cols; i++) row[i] = random() < 0.5 ? 1 : 0;
  }
  return row;
}

export function generate(rule: number, cols: number, rows: number, seed: Uint8Array): Uint8Array[] {
  const table = ruleToTable(rule);
  const result: Uint8Array[] = [];
  let current: Uint8Array = Uint8Array.from(seed.subarray(0, cols));
  for (let r = 0; r < rows; r++) {
    result.push(current);
    current = nextRow(current, table);
  }
  return result;
}

/** One SVG path for all live cells, with horizontal runs merged. Cells are 1x1 units. */
export function toSvgPath(rows: readonly Uint8Array[]): string {
  const parts: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x]) {
        let end = x;
        while (end < row.length && row[end]) end++;
        const w = end - x;
        parts.push(`M${x} ${y}h${w}v1h-${w}z`);
        x = end;
      } else {
        x++;
      }
    }
  });
  return parts.join('');
}

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
