export const CMEP_GENERATE_PATH = '/generate/cmep';

/** Post–CMEP form follow-up mail flow. */
export const CMEP_SCHEME_MAIL_PATH = '/generate/cmep/scheme-mail';

/** AI-powered CMEP assistance chat. */
export const CMEP_AI_CHAT_PATH = '/generate/cmep/ai-chat';

/** Public CMEP form (`/schemes/cmep` — no login, no app sidebar). */
export const PUBLIC_CMEP_FORM_PATH = '/schemes/cmep';
export const PUBLIC_CMEP_SCHEME_MAIL_PATH = '/schemes/cmep/support';
export const PUBLIC_CMEP_AI_CHAT_PATH = '/schemes/cmep/ai-chat';

export const CHALLENGE_OPTIONS = [
  { id: 'project-report', label: 'Project report Requirement' },
  { id: 'cmep-portal', label: 'Applying in CMEP Portal' },
  { id: 'bank-loan', label: 'Difficulty in getting bank loan' },
  { id: 'edp', label: 'EDP training' },
  { id: 'online-marketing', label: 'Need Online Marketing support' },
  { id: 'packaging', label: 'Need Packaging support' },
  { id: 'branding', label: 'Need Branding support' },
  { id: 'udyam', label: 'Need Udyam Registration' },
  { id: 'itr', label: 'Need to file Income tax returns' },
  { id: 'company-llp', label: 'Need Company/ LLP Registration' },
  { id: 'gst', label: 'Need GST Registration' },
  { id: 'fssai', label: 'Need FSSAI Licence' },
  { id: 'rental', label: 'Need Rental Agreement drafting' },
  {
    id: 'other',
    label:
      'Any Other requirement / hand Holding support, please specify: (License Requirements etc)',
  },
];

export const optionNameForMail = (opt, otherDetail) => {
  const base = opt.label.split(' (Send')[0].trim();
  if (opt.id === 'other' && otherDetail?.trim()) {
    return `${base}: ${otherDetail.trim()}`;
  }
  return base;
};
