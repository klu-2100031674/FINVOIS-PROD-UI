import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const ClaimedRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=claimed');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load claimed requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Claimed Requests</h1>
        <p className="text-gray-500 mt-1">Form requests you have claimed to generate reports on</p>
      </div>

      <RequestsQueueTable
        requests={requests}
        loading={loading}
        emptyMessage="You haven't claimed any requests yet."
      />
    </ClientLayout>
  );
};

export default ClaimedRequestsPage;
