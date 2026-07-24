import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Eye, ShieldAlert } from 'lucide-react';
import ClientLayout from '../components/layouts/ClientLayout';
import api, { apiErrorMessage } from '../api/apiClient';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import RequestDocumentsPanel from '../components/department/RequestDocumentsPanel';
import RequestChatPanel from '../components/department/RequestChatPanel';

const CustomerDepartmentRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer/department-requests/${id}`);
        setRequest(res.data?.data || null);
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to load request'));
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      </ClientLayout>
    );
  }

  if (!request) {
    return (
      <ClientLayout>
        <div className="text-center py-16">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Request Not Found</h2>
          <button
            type="button"
            onClick={() => navigate('/customer/department-requests')}
            className="mt-4 text-sm font-semibold text-purple-700 hover:underline"
          >
            Back to my requests
          </button>
        </div>
      </ClientLayout>
    );
  }

  const apiBase = `/customer/department-requests/${id}`;

  return (
    <ClientLayout>
      <div className="py-6 space-y-6 font-['Inter'] max-w-4xl">
        <button
          type="button"
          onClick={() => navigate('/customer/department-requests')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to My Requests
        </button>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 font-['Manrope'] flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-700" />
            {request.formId?.name || 'Department Request'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Department: <strong>{request.departmentId?.name || '—'}</strong>
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
              STATUS: {String(request.status || '').toUpperCase()}
            </span>
            {request.createdAt && (
              <span className="text-xs text-gray-500 px-2 py-1">
                Submitted {new Date(request.createdAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Submitted Form Responses</h2>
          <div className="space-y-4">
            {(request.formId?.fields || []).map((field) => {
              const val = request.submittedData?.[field.id];
              if (field.type === 'file') {
                const fileData = val || {};
                return (
                  <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                    {fileData.base64 ? (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-sm font-medium text-purple-700 truncate max-w-xs">
                          {fileData.fileName}
                        </span>
                        <a
                          href={fileData.base64}
                          download={fileData.fileName}
                          className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                        >
                          <Eye size={12} /> Download
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No document uploaded</span>
                    )}
                  </div>
                );
              }
              return (
                <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">{field.label}:</span>
                  <span className="text-sm text-gray-800 break-all whitespace-pre-wrap">
                    {val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <RequestDocumentsPanel
          requestId={id}
          apiBase={apiBase}
          status={request.status}
          currentUserId={user?._id}
          isCustomer
        />

        <RequestChatPanel
          requestId={id}
          apiBase={apiBase}
          status={request.status}
          currentUserId={user?._id}
        />
      </div>
    </ClientLayout>
  );
};

export default CustomerDepartmentRequestDetailPage;
