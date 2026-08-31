/**
 * Client-side note generation for BOI verification (fallback when no AI API).
 */

function pruneEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function yesNo(val) {
  if (val === 'yes') return 'yes';
  if (val === 'no') return 'no';
  return val || 'not specified';
}

export function buildResidenceNotes({ applicantLabel, borrowerName, residence }) {
  const r = pruneEmpty(residence);
  const name = borrowerName || applicantLabel;
  const parts = [];

  if (r.addressTallied === 'yes') {
    parts.push(`The present residence address of ${name} was found to tally with the address provided in the loan application.`);
  } else if (r.addressTallied === 'no') {
    parts.push(`The present residence address of ${name} did not tally with the address provided in the application.`);
  }

  if (r.stayConfirmed === 'yes') {
    const since = r.stayingSinceYears ? ` for approximately ${r.stayingSinceYears} year(s)` : '';
    parts.push(`Stay at the given address was confirmed${since}.`);
  }

  if (r.natureOfResidence) {
    parts.push(`The nature of residence was observed as ${r.natureOfResidence.toLowerCase()} (${r.typeOfResidence || 'type not specified'}).`);
  }

  if (r.city) {
    parts.push(`The property is located in ${r.city}${r.pincode ? ` (${r.pincode})` : ''} with ${r.livingStandard ? r.livingStandard.toLowerCase() : 'observed'} living standards.`);
  }

  if (r.visitDateTime) {
    const visitDate = new Date(r.visitDateTime).toLocaleString('en-IN');
    parts.push(`A physical verification visit was conducted on ${visitDate}.`);
  }

  if (r.verifierRemarks) {
    parts.push(r.verifierRemarks);
  }

  return parts.length
    ? parts.join(' ')
    : `Residence verification for ${name} has been completed based on the field observations recorded.`;
}

export function buildEmploymentNotes({ applicantLabel, borrowerName, employment }) {
  const e = pruneEmpty(employment);
  const name = borrowerName || applicantLabel;
  const parts = [];

  if (e.employmentCategory) {
    parts.push(`Employment verification was conducted for ${name} under the category of ${e.employmentCategory.replace(/_/g, ' ')}.`);
  }

  if (e.businessName) {
    parts.push(`The employer/business firm was identified as ${e.businessName}${e.designation ? `, with designation ${e.designation}` : ''}.`);
  }

  if (e.businessAddress) {
    parts.push(`The business premises were visited at ${e.businessAddress}.`);
  }

  if (e.nameBoardSighted) {
    parts.push(`Name board of the firm/office was ${yesNo(e.nameBoardSighted) === 'yes' ? 'sighted' : 'not sighted'} at the premises.`);
  }

  if (e.sinceWhen) {
    parts.push(`Employment/business tenure was reported since ${e.sinceWhen}.`);
  }

  if (e.verifierRemarks) {
    parts.push(e.verifierRemarks);
  }

  return parts.length
    ? parts.join(' ')
    : `Employment verification for ${name} has been completed based on the field observations recorded.`;
}
