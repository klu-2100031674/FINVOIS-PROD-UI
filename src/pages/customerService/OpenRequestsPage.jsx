import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const OpenRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=open');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load open requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Open Requests Queue</h1>
        <p className="text-gray-500 mt-1">Incoming public form submissions that are ready to be claimed or processed</p>
      </div>

      <RequestsQueueTable
        requests={requests}
        loading={loading}
        emptyMessage="No open requests available at the moment."
      />
    </ClientLayout>
  );
};

export default OpenRequestsPage;
