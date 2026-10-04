import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/apiClient';
import MsmeServiceLayout from '@/components/layouts/MsmeServiceLayout';
import MsmeDecisionReasonModal from '@/pages/msmeService/MsmeDecisionReasonModal';

const MsmeServiceRequestDetailPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [lead, setLead] = useState(null);
  const [decision, setDecision] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/msme-service/leads/${id}`);
      setLead(res?.data?.data || null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to load lead');
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const act = async (action, reason) => {
    setActing(true);
    try {
      const res = await api.post(
        `/msme-service/leads/${id}/${action}`,
        reason ? { reason } : {}
      );
      setLead(res?.data?.data || null);
      setDecision(null);
      toast.success(
        action === 'accept' ? 'Lead accepted — phone is now visible' : `Lead ${action}ed`
      );
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || `Failed to ${action}`);
    } finally {
      setActing(false);
    }
  };

  return (
    <MsmeServiceLayout>
      <div className="max-w-2xl space-y-5">
        <Link
          to="/msme-service/requests"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to requests
        </Link>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : !lead ? (
          <p className="text-gray-500">Lead not found.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                {lead.optionLabel || 'Client screening'}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{lead.fullName}</h1>
              <p className="mt-1 text-sm text-gray-500 capitalize">Status: {lead.myStatus}</p>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Nature of business</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {lead.natureOfBusiness || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900 mt-0.5 tracking-wide">
                  {lead.phoneVisible ? lead.phone : lead.phone}
                  {!lead.phoneVisible && (
                    <span className="block text-xs text-amber-700 mt-1 font-normal">
                      Accept this lead to reveal the full number.
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {['pending', 'opened'].includes(lead.myStatus) && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => act('accept')}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50"
                >
                  Accept
                </button>
              )}
              {lead.myStatus === 'accepted' && (
                <>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => setDecision('complete')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => setDecision('reject')}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Rejected
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {decision ? (
        <MsmeDecisionReasonModal
          mode={decision === 'reject' ? 'reject' : 'complete'}
          submitting={acting}
          onCancel={() => setDecision(null)}
          onConfirm={(reason) => act(decision, reason)}
        />
      ) : null}
    </MsmeServiceLayout>
  );
};

export default MsmeServiceRequestDetailPage;
