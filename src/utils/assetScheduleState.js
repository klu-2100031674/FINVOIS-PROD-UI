/** Keep asset rows on screen when a step or tenure window changes. */

export function rowItemIsVisible(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const desc = item.description;
  const hasDesc = desc != null && String(desc).trim() !== '';
  const amount = item.amount;
  const hasAmount = amount !== '' && amount != null && String(amount).trim() !== '' && Number(amount) !== 0;
  return item.isActive === true || hasDesc || hasAmount;
}

/** Occupied rows inside the tenure window the form is showing. Missing and blank placeholders are free. */
export function countOccupiedCategoryRows(categoryItems, section) {
  if (!section || !Number.isFinite(section.start) || !Number.isFinite(section.end)) return 0;
  const items = categoryItems && typeof categoryItems === 'object' && !Array.isArray(categoryItems)
    ? categoryItems
    : {};
  let count = 0;
  for (let row = section.start; row <= section.end; row += 1) {
    if (rowItemIsVisible(items[row] ?? items[String(row)])) count += 1;
  }
  return count;
}

/**
 * Drop category row keys that are outside the active tenure window.
 * Returns the same object when every kept key is already inside that window.
 */
export function keepRowsInActiveWindows(assetItems, activeSections) {
  if (!assetItems || typeof assetItems !== 'object' || Array.isArray(assetItems) || !activeSections) {
    return assetItems;
  }
  let changed = false;
  const next = { ...assetItems };
  Object.entries(activeSections).forEach(([category, section]) => {
    const source = assetItems[category];
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    if (!section || !Number.isFinite(section.start) || !Number.isFinite(section.end)) return;
    const bucket = {};
    let dropped = false;
    Object.entries(source).forEach(([key, item]) => {
      const row = Number(key);
      if (!Number.isFinite(row) || (row >= section.start && row <= section.end)) {
        bucket[key] = item;
      } else {
        dropped = true;
      }
    });
    if (dropped) {
      next[category] = bucket;
      changed = true;
    }
  });
  return changed ? next : assetItems;
}

function cellFilled(schedule, row) {
  const desc = schedule?.[`d${row}`];
  const amount = schedule?.[`e${row}`];
  const hasDesc = desc != null && String(desc).trim() !== '';
  const hasAmount = amount !== '' && amount != null && String(amount).trim() !== '' && Number(amount) !== 0;
  return hasDesc || hasAmount;
}

function readOpenRows(schedule) {
  const raw = schedule?._openRows;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.map((row) => Number(row)).filter((row) => Number.isFinite(row)));
}

/**
 * Keep rows the user already filled when a later load sends an empty or older grid.
 * An incoming row with its own content still wins.
 */
export function preserveFilledAssetRows(current, incoming) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return current && typeof current === 'object' ? current : {};
  }
  if (!current || typeof current !== 'object' || Array.isArray(current)) return incoming;
  const out = { ...incoming };
  Object.entries(current).forEach(([category, rows]) => {
    if (!rows || typeof rows !== 'object' || Array.isArray(rows)) return;
    const inc = out[category] && typeof out[category] === 'object' && !Array.isArray(out[category])
      ? { ...out[category] }
      : {};
    Object.entries(rows).forEach(([row, item]) => {
      if (!rowItemIsVisible(item)) return;
      if (!rowItemIsVisible(inc[row])) inc[row] = item;
    });
    out[category] = inc;
  });
  return out;
}

/**
 * Move filled category rows into the tenure window the form is showing.
 * Does nothing when that window already has a visible row (no double shift).
 */
export function alignCategoryRowSchedule(assetItems, activeSections, previousSections) {
  if (!assetItems || !activeSections || !previousSections) return assetItems;
  let changed = false;
  const next = { ...assetItems };
  Object.entries(activeSections).forEach(([category, section]) => {
    const prev = previousSections[category];
    if (!prev || prev.start === section.start) return;
    const source = assetItems[category] || {};
    const read = (row) => source[row] ?? source[String(row)];
    let activeHas = false;
    for (let row = section.start; row <= section.end; row += 1) {
      if (rowItemIsVisible(read(row))) {
        activeHas = true;
        break;
      }
    }
    if (activeHas) return;
    const bucket = {};
    for (let row = section.start; row <= section.end; row += 1) {
      const item = read(row);
      bucket[row] = item && typeof item === 'object' && !Array.isArray(item)
        ? { ...item }
        : { description: '', amount: '' };
    }
    const offset = section.start - prev.start;
    let moved = false;
    for (let row = prev.start; row <= prev.end; row += 1) {
      const item = read(row);
      if (!rowItemIsVisible(item)) continue;
      const dest = row + offset;
      if (dest < section.start || dest > section.end) continue;
      bucket[dest] = { ...item };
      moved = true;
    }
    if (moved) {
      next[category] = bucket;
      changed = true;
    }
  });
  return changed ? next : assetItems;
}

/**
 * Same window move for schedules stored as dNNN/eNNN cells.
 * Returns the same object when nothing moved.
 */
export function alignNamedCellSchedule(schedule, activeSections, previousSections) {
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return schedule;
  if (!activeSections || !previousSections) return schedule;
  const next = { ...schedule };
  const open = readOpenRows(schedule);
  let changed = false;
  Object.entries(activeSections).forEach(([category, section]) => {
    const prev = previousSections[category];
    if (!prev || prev.start === section.start) return;
    let activeHas = false;
    for (let row = section.start; row <= section.end; row += 1) {
      if (cellFilled(next, row) || open.has(row)) {
        activeHas = true;
        break;
      }
    }
    if (activeHas) return;
    const offset = section.start - prev.start;
    for (let row = prev.start; row <= prev.end; row += 1) {
      const dest = row + offset;
      if (dest < section.start || dest > section.end) continue;
      const filled = cellFilled(next, row) || open.has(row);
      if (!filled) continue;
      next[`d${dest}`] = next[`d${row}`] ?? '';
      next[`e${dest}`] = next[`e${row}`] ?? '';
      next[`d${row}`] = '';
      next[`e${row}`] = '';
      if (open.has(row)) {
        open.delete(row);
        open.add(dest);
      }
      changed = true;
    }
  });
  if (!changed) return schedule;
  next._openRows = [...open].sort((a, b) => a - b);
  return next;
}
