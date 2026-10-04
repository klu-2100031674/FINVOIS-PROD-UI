import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import CsQueueFiltersBar from './CsQueueFiltersBar';

const ReadyToSendPage = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=cs-completed');
      setRequests(res.data?.data || []);
    } catch {
      toast.error('Failed to load completed requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout wideContent>
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Completed</h1>
          <p className="text-gray-500 mt-1">
            CA-approved and paid reports ready to send to the applicant
          </p>
        </div>

        {!loading && (
          <CsQueueFiltersBar
            requests={requests}
            onFilteredChange={setFiltered}
            showQueueStatus={false}
            showPaymentFilter={false}
            showCaStatusFilter={false}
          />
        )}

        <RequestsQueueTable
          requests={loading ? [] : filtered}
          loading={loading}
          wideTable
          hideStaffOwner
          emptyMessage="No completed reports yet."
          statusMode="workflow"
        />
      </div>
    </ClientLayout>
  );
};

export default ReadyToSendPage;
