/**
 * Normalize legacy report-type aliases (frcc2 / Format CC2 / CC2) to one key.
 * Does not match TERM_LOAN_CC.
 */
export function canonicalizeReportTypeKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  const ccMatch =
    upper.match(/^FRCC(\d+)$/) ||
    upper.match(/^CC(\d+)$/) ||
    upper.match(/^FORMAT\s*CC(\d+)$/) ||
    upper.match(/(?:^|[^A-Z0-9])(?:FR)?CC(\d+)\b/);
  if (ccMatch) return `frcc${ccMatch[1]}`;
  return raw;
}

export function getReportTypeFilterLabel(value) {
  const key = canonicalizeReportTypeKey(value);
  const ccMatch = String(key).match(/^frcc(\d+)$/i);
  if (ccMatch) return `Format CC${ccMatch[1]}`;
  return key || String(value || '');
}

/** Deduplicate raw API lists into { value, label } options. */
export function buildDedupedReportTypeOptions(reportTypes = [], templateIds = []) {
  const byKey = new Map();
  for (const raw of [...(reportTypes || []), ...(templateIds || [])]) {
    const key = canonicalizeReportTypeKey(raw);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, { value: key, label: getReportTypeFilterLabel(key) });
  }
  return Array.from(byKey.values()).sort((a, b) =>
    String(a.label).localeCompare(String(b.label), undefined, { sensitivity: 'base' })
  );
}
