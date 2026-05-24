export const PUBLIC_CLIENT_SCREENING_PATH = '/client-screening';

export const CLIENT_SCREENING_ROUTING_OPTIONS = [
  {
    id: 'inbox',
    label: 'All client screening messages (one inbox for every topic selected on the page)',
  },
];

export const TOPIC_OPTIONS = [
  { id: 'project-report', label: 'Project report Requirement' },
  { id: 'ap-single-desk', label: 'Applying for AP single desk Portal' },
  { id: 'bank-loan', label: 'Difficulty in getting bank loan' },
  { id: 'edp', label: 'EDP training' },
  { id: 'online-marketing', label: 'Need Online Marketing support' },
  { id: 'packaging', label: 'Need Packaging support' },
  { id: 'branding', label: 'Need Branding support' },
  { id: 'udyam', label: 'Need Udyam Registration' },
  { id: 'itr', label: 'Need to file Income tax returns' },
  { id: 'gst', label: 'Need GST Registration' },
  { id: 'fssai', label: 'Need FSSAI Licence' },
  { id: 'rental', label: 'Need Rental Agreement drafting' },
  {
    id: 'other',
    label:
      'Any Other requirement / hand Holding support, please specify: License Requirements etc',
  },
];

const OTHER_TOPIC_MAIL_LABEL = 'Other requirement';

export const optionNameForMail = (opt, otherDetail) => {
  if (opt.id === 'other') {
    if (otherDetail?.trim()) {
      return `${OTHER_TOPIC_MAIL_LABEL}: ${otherDetail.trim()}`;
    }
    return OTHER_TOPIC_MAIL_LABEL;
  }
  return opt.label;
};
