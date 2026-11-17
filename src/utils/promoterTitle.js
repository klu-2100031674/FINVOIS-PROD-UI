/**
 * Constitution → role, and designation → heading.
 * Designation wins when the user chose one. Constitution is the fallback
 * when designation is empty. A leftover "Proprietor" default does not
 * override a non-proprietorship constitution.
 */

export const CONSTITUTION_OPTIONS = [
  'Sole Proprietorship',
  'Partnership',
  'LLP',
  'Private Limited Company',
  'Public Limited Company',
  'Other',
];

export const DESIGNATION_OPTIONS = [
  'Proprietor',
  'Partner',
  'Director',
  'Managing Director',
  'Member',
];

export function normalizeConstitution(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const s = text.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();

  if (/\bllp\b/.test(s) || s.includes('limited liability')) return 'LLP';
  if (s.includes('public')) return 'Public Limited Company';
  if (s.includes('private') || /\bpvt\b/.test(s) || s.includes('pvt ltd') || s.includes('pvt limited')) {
    return 'Private Limited Company';
  }
  if (s.includes('partner')) return 'Partnership';
  if (s.includes('sole') || s.includes('proprietor')) return 'Sole Proprietorship';
  if (s.includes('company') || s.includes('limited') || /\bltd\b/.test(s)) return 'Private Limited Company';
  if (
    s.includes('society')
    || s.includes('trust')
    || s.includes('federation')
    || s.includes('other')
    || s.includes('huf')
    || s.includes('shg')
    || s.includes('member')
  ) {
    return 'Other';
  }

  const exact = CONSTITUTION_OPTIONS.find((option) => option.toLowerCase() === s);
  return exact || 'Other';
}

export function roleFromConstitution(raw) {
  switch (normalizeConstitution(raw)) {
    case 'Sole Proprietorship':
      return 'Proprietor';
    case 'Partnership':
    case 'LLP':
      return 'Partner';
    case 'Private Limited Company':
    case 'Public Limited Company':
      return 'Director';
    case 'Other':
      return 'Member';
    default:
      return '';
  }
}

export function normalizeDesignation(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const s = text.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  if (s === 'md' || s.includes('managing director')) return 'Managing Director';
  if (s.includes('director')) return 'Director';
  if (s.includes('partner')) return 'Partner';
  if (s.includes('proprietor')) return 'Proprietor';
  if (s.includes('member')) return 'Member';
  const exact = DESIGNATION_OPTIONS.find((option) => option.toLowerCase() === s);
  return exact || text;
}

export function promoterRole({ designation, constitution } = {}) {
  const chosen = normalizeDesignation(designation);
  const fallback = roleFromConstitution(constitution);
  if (!chosen) return fallback;
  if (chosen === 'Proprietor' && fallback && fallback !== 'Proprietor') return fallback;
  return chosen;
}

export function promoterHeading({ designation, constitution } = {}) {
  const role = promoterRole({ designation, constitution });
  return role ? `${role}'s Background` : 'Background';
}

export function backgroundSectionTitle(promoters, constitution) {
  const roles = (Array.isArray(promoters) ? promoters : [])
    .map((person) => promoterRole({
      designation: person && person.designation,
      constitution,
    }))
    .filter(Boolean);
  const unique = [...new Set(roles)];
  if (unique.length === 1) return `${unique[0]}'s Background & Education`;
  if (unique.length > 1) return "Promoters' Background & Education";
  const fallback = roleFromConstitution(constitution);
  return fallback ? `${fallback}'s Background & Education` : 'Background & Education';
}
