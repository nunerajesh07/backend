/**
 * Trim, collapse internal spaces, title-case each word (e.g. "pune" → "Pune", "new delhi" → "New Delhi").
 */
export function normalizeCampusName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .filter(Boolean)
    .join(' ');
}
