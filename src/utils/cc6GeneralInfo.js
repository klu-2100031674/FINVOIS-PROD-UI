/**
 * CC6 Assumptions cells (v3.18.1 workbook): i7 sector, i8 nature, i9 contact.
 * Do not rotate these before they are written into the report.
 */
export function normalizeCc6GiCells(cells) {
  if (!cells || typeof cells !== 'object' || Array.isArray(cells)) return cells;
  return cells;
}
