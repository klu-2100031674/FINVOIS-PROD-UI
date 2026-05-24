export const PMEGP_GENERATE_PATH = '/generate/pmegp';

/** Post–PMEGP form follow-up mail flow. */
export const PMEGP_SCHEME_MAIL_PATH = '/generate/pmegp/scheme-mail';

/** AI-powered PMEGP assistance chat. */
export const PMEGP_AI_CHAT_PATH = '/generate/pmegp/ai-chat';

/** Public PMEGP form (`/schemes/pmegp` — no login, no app sidebar). */
export const PUBLIC_PMEGP_FORM_PATH = '/schemes/pmegp';
export const PUBLIC_PMEGP_SCHEME_MAIL_PATH = '/schemes/pmegp/support';
export const PUBLIC_PMEGP_AI_CHAT_PATH = '/schemes/pmegp/ai-chat';

export const CHALLENGE_OPTIONS = [
  { id: 'project-report', label: 'Project report Requirement' },
  { id: 'pmegp-portal', label: 'Applying in PMEGP Portal ' },
  { id: 'bank-loan', label: 'Difficulty in getting bank loan ' },
  { id: 'edp', label: 'EDP training ' },
  { id: 'online-marketing', label: 'Need Online Marketing support ' },
  { id: 'packaging', label: 'Need Packaging support ' },
  { id: 'branding', label: 'Need Branding support ' },
  { id: 'udyam', label: 'Need Udyam Registration ' },
  { id: 'itr', label: 'Need to file Income tax returns ' },
  { id: 'gst', label: 'Need GST Registration ' },
  { id: 'fssai', label: 'Need FSSAI Licence ' },
  { id: 'rental', label: 'Need Rental Agreement drafting ' },
  {
    id: 'other',
    label:
      'Any Other requirement / hand Holding support, please specify: (License Requirements etc) ',
  },
];

export const optionNameForMail = (opt, otherDetail) => {
  const base = opt.label.split(' (Send')[0].trim();
  if (opt.id === 'other' && otherDetail?.trim()) {
    return `${base}: ${otherDetail.trim()}`;
  }
  return base;
};
