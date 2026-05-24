/** Logged-in AP IDP form flow (mirror of PMEGP `/generate/pmegp` flow). */
export const AP_IDP_GENERATE_PATH = '/generate/ap-idp';

/** Post–AP IDP form follow-up mail flow. */
export const AP_IDP_SCHEME_MAIL_PATH = '/generate/ap-idp/scheme-mail';

/** AI-powered AP IDP assistance chat. */
export const AP_IDP_AI_CHAT_PATH = '/generate/ap-idp/ai-chat';

/** Public AP IDP form (`/schemes/ap-idp` — no login, no app sidebar). */
export const PUBLIC_AP_IDP_FORM_PATH = '/schemes/ap-idp';
export const PUBLIC_AP_IDP_SCHEME_MAIL_PATH = '/schemes/ap-idp/support';
export const PUBLIC_AP_IDP_AI_CHAT_PATH = '/schemes/ap-idp/ai-chat';

export const CHALLENGE_OPTIONS = [
  { id: 'project-report', label: 'Project report Requirement ' },
  { id: 'ap-idp-portal', label: 'Need support for AP Single Desk application' },
  { id: 'bank-loan', label: 'Difficulty in getting bank loan ' },
  { id: 'online-marketing', label: 'Need Online Marketing support ' },
  { id: 'packaging', label: 'Need Packaging support ' },
  { id: 'branding', label: 'Need Branding support ' },
  { id: 'udyam', label: 'Need Udyam Registration ' },
  { id: 'itr', label: 'Need to File Income tax returns/GST returns.' },
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
