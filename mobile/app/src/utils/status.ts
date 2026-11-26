// Two vocabularies, kept separate on purpose (docs/01): reports have validation statuses,
// department requests have workflow keys. Never map one onto the other.
export type Tone = 'gray' | 'amber' | 'blue' | 'purple' | 'green' | 'red';

export const REPORT_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending_validation: { label: 'Pending', tone: 'amber' },
  under_review: { label: 'Under review', tone: 'blue' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  draft: { label: 'Draft', tone: 'gray' },
  pending_payment: { label: 'Pending payment', tone: 'gray' },
};

/** The pill for a report. A report sent back for another look reads "Re-review" until it is decided, as on the web. */
export function reportPill(status: string, isReReview?: boolean): { label: string; tone: Tone } {
  if (isReReview && (status === 'under_review' || status === 'pending_validation')) return { label: 'Re-review', tone: 'purple' };
  return REPORT_STATUS[status] ?? { label: status, tone: 'gray' };
}

export const WORKFLOW_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'gray' },
  initiated: { label: 'Request initiated', tone: 'amber' },
  preparation: { label: 'DPR under preparation', tone: 'blue' },
  ca_validation: { label: 'Sent for CA validation', tone: 'purple' },
  generated: { label: 'DPR generated', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
};

export const TONE_CLASSES: Record<Tone, { box: string; text: string }> = {
  gray: { box: 'bg-gray-100', text: 'text-gray-800' },
  amber: { box: 'bg-amber-100', text: 'text-amber-800' },
  blue: { box: 'bg-blue-100', text: 'text-blue-800' },
  purple: { box: 'bg-purple-100', text: 'text-purple-800' },
  green: { box: 'bg-green-100', text: 'text-green-800' },
  red: { box: 'bg-red-100', text: 'text-red-800' },
};
