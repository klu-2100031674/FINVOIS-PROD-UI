/**
 * Customer department-request UX helpers (Testing).
 */

export function formatRelativeTime(dateLike) {
  if (!dateLike) return { relative: '—', absolute: '' };
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return { relative: '—', absolute: '' };

  const absolute = date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const diffMs = Date.now() - date.getTime();
  const absMs = Math.abs(diffMs);
  const sec = Math.floor(absMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const suffix = diffMs < 0 ? 'from now' : 'ago';

  let relative;
  if (sec < 45) relative = 'just now';
  else if (min < 60) relative = `${min} min ${suffix}`;
  else if (hr < 24) relative = `${hr} hour${hr === 1 ? '' : 's'} ${suffix}`;
  else if (day < 30) relative = `${day} day${day === 1 ? '' : 's'} ${suffix}`;
  else relative = absolute;

  return { relative, absolute };
}

export function submittedLabel(dateLike) {
  const { relative, absolute } = formatRelativeTime(dateLike);
  if (!absolute) return { text: 'Submitted —', title: '' };
  if (relative === 'just now') return { text: 'Submitted just now', title: absolute };
  if (relative === absolute) return { text: `Submitted ${absolute}`, title: absolute };
  return { text: `Submitted ${relative}`, title: absolute };
}

export function canDownloadPdf(req) {
  return (
    req?.reportId?.validation_status === 'approved' &&
    req?.reportId?.payment?.status === 'completed'
  );
}

export function needsPayment(req) {
  const report = req?.reportId;
  if (!report) return false;
  return report?.payment?.status !== 'completed';
}

/** @returns {{ key: string, text: string, badgeClass: string, railClass: string, tip: string | null }} */
export function requestStatusMeta(req) {
  const report = req?.reportId;
  if (!report) {
    const open = req?.status === 'open';
    return {
      key: 'submitted',
      text: open ? 'Submitted' : String(req?.status || 'Open').toUpperCase(),
      badgeClass: 'bg-amber-100 text-amber-800',
      railClass: 'bg-amber-400',
      tip: 'Customer Service will pick up your request shortly. You can still add documents once an agent is assigned.',
    };
  }

  const vs = report.validation_status;
  const unpaid = report.payment?.status && report.payment.status !== 'completed';

  if (vs === 'approved' && !unpaid) {
    return {
      key: 'ready',
      text: 'Validated by CA',
      badgeClass: 'bg-green-100 text-green-800',
      railClass: 'bg-emerald-500',
      tip: null,
    };
  }
  if (vs === 'approved' && unpaid) {
    return {
      key: 'pay',
      text: 'Payment Pending',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      railClass: 'bg-amber-400',
      tip: 'Your report is ready — complete payment to unlock the PDF.',
    };
  }
  if (vs === 'rejected') {
    return {
      key: 'rejected',
      text: 'Rejected',
      badgeClass: 'bg-red-100 text-red-800',
      railClass: 'bg-red-500',
      tip: 'Customer Service will revise and resubmit after reviewing the query.',
    };
  }
  if (vs === 'under_review' || vs === 'pending_validation') {
    if (unpaid) {
      return {
        key: 'pay',
        text: 'Payment Pending',
        badgeClass: 'bg-yellow-100 text-yellow-800',
        railClass: 'bg-amber-400',
        tip: 'Pay now so your report unlocks as soon as CA validation finishes.',
      };
    }
    return {
      key: 'ca',
      text: 'Under CA Review',
      badgeClass: 'bg-blue-100 text-blue-800',
      railClass: 'bg-blue-500',
      tip: 'A CA is validating your DPR. This usually takes a short while — we’ll unlock the PDF when it’s done.',
    };
  }
  if (vs === 'pending_payment' || unpaid) {
    return {
      key: 'pay',
      text: 'Payment Pending',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      railClass: 'bg-amber-400',
      tip: 'Complete payment to unlock your report when it’s ready.',
    };
  }
  return {
    key: 'progress',
    text: 'In Progress',
    badgeClass: 'bg-gray-100 text-gray-800',
    railClass: 'bg-slate-400',
    tip: 'Your request is being prepared. Check back soon for updates.',
  };
}

export function celebrationStorageKey(requestId) {
  return `customer-dept-celebrated:${requestId}`;
}

export function chatReadStorageKey(requestId) {
  return `customer-dept-chat-read:${requestId}`;
}
