import React, { useEffect, useState } from 'react';
import ClientLayout from '../../components/layouts/ClientLayout';
import RequestsQueueTable from '../../components/govtForms/RequestsQueueTable';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import CsQueueFiltersBar from './CsQueueFiltersBar';

const DepartmentRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/govt-forms/requests?queue=department-requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load department requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Department Requests</h1>
        <p className="text-gray-500 mt-1">Unified view of all dynamic form submissions across all departments</p>
      </div>

      {!loading && (
        <CsQueueFiltersBar
          requests={requests}
          onFilteredChange={setFiltered}
          showQueueStatus
        />
      )}

      <RequestsQueueTable
        requests={loading ? [] : filtered}
        loading={loading}
        emptyMessage="No department submissions match your filters."
      />
    </ClientLayout>
  );
};

export default DepartmentRequestsPage;
