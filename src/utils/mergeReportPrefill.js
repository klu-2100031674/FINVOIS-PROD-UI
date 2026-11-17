/**
 * Merge customer/lead prefill onto a report form's defaults.
 * Empty objects, empty arrays, and blank strings do not erase predefined rows,
 * dropdowns, labels, or other values that are already present.
 * A real prefill value, including 0, still wins.
 */

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isBlank(value) {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

export function mergeReportPrefill(base, prefill, options = {}) {
  const preferSaved = options.preferSaved === true;

  if (prefill == null || (isPlainObject(prefill) && Object.keys(prefill).length === 0)) {
    if (isPlainObject(base)) return { ...base };
    if (Array.isArray(base)) return base.slice();
    return base;
  }

  if (Array.isArray(prefill)) {
    if (!preferSaved && prefill.length === 0 && Array.isArray(base)) return base;
    return prefill.map((item) => (isPlainObject(item) ? mergeReportPrefill({}, item, options) : item));
  }

  if (!isPlainObject(prefill)) {
    if (!preferSaved && isBlank(prefill) && !isBlank(base)) return base;
    return prefill;
  }

  if (!isPlainObject(base)) {
    return mergeReportPrefill({}, prefill, options);
  }

  const out = { ...base };
  for (const key of Object.keys(prefill)) {
    const next = mergeReportPrefill(base[key], prefill[key], options);
    if (next === undefined && !Object.prototype.hasOwnProperty.call(base, key)) continue;
    out[key] = next;
  }
  return out;
}

/** True when a rebuilt expense grid has the same cells as the schedule already on the form. */
export function indirectScheduleMatches(existing, next) {
  const shape = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '';
    return Object.keys(obj)
      .sort()
      .map((key) => {
        const child = obj[key];
        if (depth < 1 && child && typeof child === 'object' && !Array.isArray(child)) {
          return `${key}{${shape(child, depth + 1)}}`;
        }
        return key;
      })
      .join('|');
  };
  const existingShape = shape(existing);
  const nextShape = shape(next);
  return existingShape !== '' && existingShape === nextShape;
}

/** Drop prefill locks for fields the saved profile already owns, including blanks. */
export function unlockFieldsPresentInSavedDraft(hiddenBySection, promptsData) {
  const next = {};
  Object.entries(hiddenBySection || {}).forEach(([sectionId, names]) => {
    const saved = promptsData?.[sectionId];
    const owned = saved && typeof saved === 'object' ? new Set(Object.keys(saved)) : new Set();
    next[sectionId] = (names || []).filter((name) => !owned.has(name));
  });
  return next;
}

/** Apply template defaults only where the saved means-of-finance value is blank. */
export function withSavedMeansDefaults(means, defaults) {
  const current = means && typeof means === 'object' ? means : {};
  const next = { ...current };
  Object.entries(defaults || {}).forEach(([key, fallback]) => {
    next[key] = savedOrFallback(current[key], fallback);
  });
  return next;
}

/** Keep an explicit saved choice. Blank means the field was never set, so the fallback stays. */
export function savedOrFallback(saved, fallback) {
  if (saved === undefined || saved === null) return fallback;
  if (typeof saved === 'string' && saved.trim() === '') return fallback;
  return saved;
}

/** True when Cash Credit Yes/No values came from the customer's type-chart. */
export function meansFromCustomerChart(initialData) {
  return initialData?.meansFromCustomerChart === true;
}

/**
 * Keep customer Yes/No answers. Otherwise fill only the blank template defaults.
 * `force` writes the template value even when a draft already stored something else
 * (Cash Credit 1–3 lock a single answer when there is no customer chart).
 */
export function finishMeansOfFinance(merged, initialData, defaults, { force = false } = {}) {
  if (meansFromCustomerChart(initialData)) {
    return {
      ...(merged || {}),
      ...(initialData?.['Means of Finance'] || {}),
    };
  }
  if (force) return { ...(merged || {}), ...(defaults || {}) };
  return withSavedMeansDefaults(merged, defaults);
}

/** A chart answer stays locked. A question the customer never answered stays editable. */
export function meansFieldDisabled(fieldDisabled, value, initialData) {
  if (!fieldDisabled) return false;
  if (!meansFromCustomerChart(initialData)) return true;
  return value === 'Yes' || value === 'No';
}

export function savedDraftOwnsField(section, fieldName) {
  return Boolean(
    section &&
    typeof section === 'object' &&
    Object.prototype.hasOwnProperty.call(section, fieldName)
  );
}
