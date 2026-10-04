import React, { useState } from 'react';
import { Search, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api, { apiErrorMessage } from '../../api/apiClient';
import toast from 'react-hot-toast';

function field(label, value) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900 break-all">{value || '—'}</dd>
    </div>
  );
}

const AdminGlobalSearchPage = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runSearch = async (event) => {
    event?.preventDefault?.();
    const q = query.trim();
    if (q.length < 4) {
      toast.error('Enter at least 4 characters of the request ID');
      return;
    }
    try {
      setLoading(true);
      setResults(null);
      const res = await api.get(`/govt-forms/requests/lookup?q=${encodeURIComponent(q)}`);
      setResults(res.data?.data || []);
      if (!(res.data?.data || []).length) {
        toast.error('No request found for that ID');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Search failed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast.success('Request ID copied');
    } catch {
      toast.error('Could not copy ID');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Search className="text-purple-700" size={24} />
            Global Search
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Look up a department request by full MongoDB ID or the last 4+ characters.
          </p>
        </div>

        <form
          onSubmit={runSearch}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste request ID…"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {results && (
          <div className="mt-6 space-y-4">
            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
                No matching department requests.
              </div>
            ) : (
              results.map((req) => {
                const applicant =
                  req.customerId?.name ||
                  req.submittedData?.govt_builtin_name ||
                  req.submittedData?.applicantName ||
                  req.submittedData?.name ||
                  '—';
                const payment = req.reportId?.payment?.status || 'n/a';
                const ca = req.reportId?.validation_status || 'no report';
                const reportId = req.reportId?._id || req.reportId;

                return (
                  <div
                    key={req._id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Request ID
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-900">{req._id}</code>
                          <button
                            type="button"
                            onClick={() => copyId(req._id)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
                            title="Copy ID"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800">
                        <CheckCircle2 size={12} />
                        {String(req.status || '').toUpperCase()}
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {field('Form', req.formId?.name)}
                      {field('Department', req.departmentId?.name)}
                      {field('Applicant', applicant)}
                      {field('Phone', req.customerId?.phone || req.submittedData?.govt_builtin_phone)}
                      {field('Workflow', req.workflow?.label)}
                      {field('Payment', payment)}
                      {field('CA status', ca)}
                      {field(
                        'Staff',
                        req.assignedTo?.name || req.claimedBy?.name || '—'
                      )}
                      {field(
                        'Submitted',
                        req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'
                      )}
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {reportId && (
                        <a
                          href={`/admin/reports?highlight=${reportId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100"
                        >
                          Open report <ExternalLink size={12} />
                        </a>
                      )}
                      <a
                        href={`/admin/govt-forms`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Govt Forms
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGlobalSearchPage;
