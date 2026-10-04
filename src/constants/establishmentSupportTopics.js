export const ESTABLISHMENT_STAGES = [
  {
    id: 'pre-establishment',
    title: 'Pre-Establishment',
    description: 'You are starting or setting up the unit',
  },
  {
    id: 'post-establishment',
    title: 'Post-Establishment',
    description: 'The unit is already running',
  },
];

export const PRE_ESTABLISHMENT_TOPICS = [
  { id: 'dpr-preparation', label: 'Project report (DPR) preparation' },
  {
    id: 'website-software-ai',
    label: 'Need Website, Custom Software, AI & Business Automation Solutions',
  },
  { id: 'incentive-subsidy', label: 'Business Incentive or subsidy enquiry' },
  { id: 'company-formation-mca', label: 'Need Company formation Service (MCA)' },
  { id: 'loan-difficulty', label: 'Difficulty in getting loan' },
  { id: 'udyam', label: 'Need Udyam registration' },
  { id: 'gst-registration', label: 'Need GST registration' },
  { id: 'fssai', label: 'Need FSSAI licence' },
  { id: 'rental', label: 'Need Rental Agreement drafting' },
  { id: 'machinery-suppliers', label: 'Machinery or Equipment suppliers data' },
  { id: 'import-export', label: 'All Import Export Registrations service' },
  { id: 'dsc', label: 'Digital Signature (DSC) registration' },
  { id: 'factory-layout', label: 'Factory Layout design' },
  { id: 'industrial-land', label: 'Industrial Land Availability data' },
  { id: 'ap-crda', label: 'AP CRDA Approval (Layout)' },
  { id: 'ap-single-desk', label: 'AP Single desk Application' },
  { id: 'pollution-noc', label: 'Pollution approval or NOC' },
  { id: 'factories-licence', label: 'Factories running licence' },
  { id: 'fire-noc', label: 'Fire approval or NOC' },
  {
    id: 'other',
    label: 'Any other requirement / Hand Holding support, please specify',
  },
];

export const POST_ESTABLISHMENT_TOPICS = [
  { id: 'online-marketing', label: 'Need Online Marketing Service' },
  { id: 'newspaper-ad', label: 'Newspaper Ad' },
  { id: 'packaging', label: 'Need Packaging service' },
  { id: 'branding', label: 'Need Branding service' },
  { id: 'itr', label: 'Need to file IT returns' },
  { id: 'gst-returns', label: 'Need to file GST returns' },
  { id: 'raw-material-bulk', label: 'Bulk Raw Material procurement support' },
  { id: 'trademark', label: 'Trademark Registration' },
  { id: 'tally-accountant', label: 'Accountant for Tally data entry' },
  {
    id: 'other',
    label: 'Any other requirement / Hand Holding support, please specify',
  },
];

const OTHER_TOPIC_MAIL_LABEL = 'Other requirement';

export function uniqueTopicOptions() {
  const seen = new Set();
  const out = [];
  for (const opt of [...PRE_ESTABLISHMENT_TOPICS, ...POST_ESTABLISHMENT_TOPICS]) {
    if (seen.has(opt.id)) continue;
    seen.add(opt.id);
    out.push(opt);
  }
  return out;
}

/** Flat list for mail-routing admin (unique ids). */
export const TOPIC_OPTIONS = uniqueTopicOptions();

export function topicsForStage(stage) {
  if (stage === 'pre-establishment') return PRE_ESTABLISHMENT_TOPICS;
  if (stage === 'post-establishment') return POST_ESTABLISHMENT_TOPICS;
  return [];
}

export function establishmentStageLabel(stage) {
  return ESTABLISHMENT_STAGES.find((s) => s.id === stage)?.title || '';
}

export const optionNameForMail = (opt, otherDetail) => {
  if (opt.id === 'other') {
    if (otherDetail?.trim()) {
      return `${OTHER_TOPIC_MAIL_LABEL}: ${otherDetail.trim()}`;
    }
    return OTHER_TOPIC_MAIL_LABEL;
  }
  return opt.label;
};
