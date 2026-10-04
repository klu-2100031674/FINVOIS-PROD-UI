import { useState } from 'react';
import { X } from 'lucide-react';

const MsmeDecisionReasonModal = ({
  mode,
  submitting = false,
  onCancel,
  onConfirm,
}) => {
  const isReject = mode === 'reject';
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const title = isReject ? 'Reject request' : 'Approve request';
  const helper = isReject
    ? 'A reason is required so the team knows why this lead was rejected.'
    : 'You can add an optional note, or leave this blank.';

  const submit = (event) => {
    event.preventDefault();
    const text = String(reason || '').trim();
    if (isReject && !text) {
      setError('A reject reason is required');
      return;
    }
    onConfirm(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="msme-decision-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 id="msme-decision-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{helper}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              {isReject ? 'Reason' : 'Note'} {isReject ? '' : '(optional)'}
            </span>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              autoFocus
              placeholder={isReject ? 'Why is this request being rejected?' : 'Optional note for approval'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                isReject ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {submitting ? 'Saving…' : isReject ? 'Reject' : 'Approve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MsmeDecisionReasonModal;
