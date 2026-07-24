import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../components/layouts/ClientLayout';
import api, { apiErrorMessage } from '../api/apiClient';
import toast from 'react-hot-toast';
import { ChevronRight, ClipboardList, FileText } from 'lucide-react';

function statusLabel(req) {
  const report = req.reportId;
  if (!report) {
    return { text: req.status === 'open' ? 'Submitted' : String(req.status || 'Open').toUpperCase(), className: 'bg-amber-100 text-amber-800' };
  }
  const vs = report.validation_status;
  if (vs === 'approved') return { text: 'Approved', className: 'bg-green-100 text-green-800' };
  if (vs === 'rejected') return { text: 'Rejected', className: 'bg-red-100 text-red-800' };
  if (vs === 'under_review' || vs === 'pending_validation') {
    return { text: 'Under CA Review', className: 'bg-blue-100 text-blue-800' };
  }
  if (vs === 'pending_payment') return { text: 'Payment Pending', className: 'bg-yellow-100 text-yellow-800' };
  return { text: 'In Progress', className: 'bg-gray-100 text-gray-800' };
}

const CustomerDepartmentRequestsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/customer/department-requests');
        setRequests(res.data?.data || []);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to load your requests'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <ClientLayout>
      <div className="py-6 space-y-6 font-['Inter']">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-['Manrope'] flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-purple-700" />
              My Department Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track status, documents, and chat for forms you submitted to government departments.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-gray-500">
            No department form requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const meta = statusLabel(req);
              return (
                <button
                  key={req._id}
                  type="button"
                  onClick={() => navigate(`/customer/department-requests/${req._id}`)}
                  className="w-full text-left bg-white border rounded-xl p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{req.formId?.name || 'Form'}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Department: {req.departmentId?.name || '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${meta.className}`}>
                        {meta.text}
                      </span>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  </div>
                  {req.reportId?.validation_status === 'approved' && (
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/customer/reports');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          navigate('/customer/reports');
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900"
                    >
                      <FileText size={16} />
                      Open My Reports
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default CustomerDepartmentRequestsPage;
