import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const RequestHistoryPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=completed');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load request history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Request History</h1>
        <p className="text-gray-500 mt-1">Processed requests that have successfully generated reports</p>
      </div>

      <RequestsQueueTable
        requests={requests}
        loading={loading}
        emptyMessage="No completed requests found in history."
      />
    </ClientLayout>
  );
};

export default RequestHistoryPage;
