/** Rows the user added on an asset schedule, including ones with no name or amount yet. */

export function readOpenAssetRows(schedule) {
  const raw = schedule?._openRows;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.map((row) => Number(row)).filter((row) => Number.isFinite(row)));
}

export function withOpenAssetRow(schedule, row) {
  const open = readOpenAssetRows(schedule);
  open.add(Number(row));
  return {
    ...(schedule || {}),
    _openRows: [...open].sort((a, b) => a - b),
  };
}

export function withoutOpenAssetRow(schedule, row) {
  const open = readOpenAssetRows(schedule);
  open.delete(Number(row));
  return {
    ...(schedule || {}),
    _openRows: [...open].sort((a, b) => a - b),
  };
}

export function assetRowIsOpen(schedule, row, desc, amount) {
  const hasAmount = amount !== '' && amount !== null && amount !== undefined && Number(amount) !== 0;
  const hasName = String(desc || '').trim() !== '';
  return readOpenAssetRows(schedule).has(Number(row)) || hasName || hasAmount;
}
