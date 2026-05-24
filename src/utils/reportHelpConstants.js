export const REPORT_TYPE_OPTIONS = [
  { value: 'dpr', label: 'DPR (Detailed Project Report)' },
  { value: 'cma', label: 'CMA Data Projections' },
  { value: 'term_loan', label: 'Term Loan Report' },
  { value: 'working_capital', label: 'Working Capital / CC' },
  { value: 'other', label: 'Other' },
];

export const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low — flexible timeline' },
  { value: 'normal', label: 'Normal — standard turnaround' },
  { value: 'high', label: 'High — priority' },
  { value: 'urgent', label: 'Urgent — within a few days' },
];

export const DOCUMENT_CHECKLIST_LABELS = {
  bank_statement: 'Bank Statement',
  gst_certificate: 'GST Certificate',
  aadhaar: 'Aadhaar',
  it_returns: 'IT Returns',
  business_registration: 'Business Registration',
  financial_statements: 'Financial Statements',
  other: 'Other',
};

export const STATUS_LABELS = {
  pending: { label: 'Pending review', color: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  needs_documents: { label: 'Documents requested', color: 'bg-orange-100 text-orange-800' },
  documents_submitted: { label: 'Documents submitted', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Report in progress', color: 'bg-indigo-100 text-indigo-800' },
  submitted_for_validation: { label: 'Submitted for CA validation', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
};

export const ACCEPTED_FILE_HINT =
  'PDF, images (JPG/PNG), Excel (.xlsx/.xls), CSV — bank statements, GST docs, etc.';
