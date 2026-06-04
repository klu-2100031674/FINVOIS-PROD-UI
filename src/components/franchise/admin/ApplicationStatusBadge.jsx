import { APPLICATION_STATUSES } from '@/constants/franchiseConstants';

const STATUS_STYLES = {
  new: 'bg-amber-100 text-amber-800 border-amber-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-purple-100 text-purple-800 border-purple-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function ApplicationStatusBadge({ status }) {
  const label = APPLICATION_STATUSES.find((s) => s.value === status)?.label || status;
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${style}`}>
      {label}
    </span>
  );
}
