import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AssignedRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=assigned');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load assigned requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assigned & Claimed Requests</h1>
        <p className="text-gray-500 mt-1">Form requests assigned directly to you or claimed by you</p>
      </div>

      <RequestsQueueTable
        requests={requests}
        loading={loading}
        emptyMessage="No assigned or claimed requests found for you."
      />
    </ClientLayout>
  );
};

export default AssignedRequestsPage;
