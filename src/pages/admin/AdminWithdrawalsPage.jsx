import React, { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, DollarSign, Eye, RefreshCw, IndianRupee } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [withdrawals, searchTerm, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/withdrawals');
      setWithdrawals(response.data?.data?.withdrawals || response.data?.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = [...withdrawals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.agent_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.agent_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    setFilteredWithdrawals(filtered);
  };

  const handleStatusChange = async (withdrawalId, newStatus) => {
    try {
      setProcessingId(withdrawalId);
      await api.patch(`/withdrawals/${withdrawalId}/status`, { status: newStatus });
      toast.success(`Withdrawal ${newStatus} successfully`);
      fetchWithdrawals();
      setShowModal(false);
    } catch (error) {
      toast.error(`Failed to ${newStatus} withdrawal`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', icon: RefreshCw },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    return badges[status] || badges.pending;
  };

  const getStats = () => {
    const pending = withdrawals.filter(w => w.status === 'pending').length;
    const approved = withdrawals.filter(w => w.status === 'approved').length;
    const processing = withdrawals.filter(w => w.status === 'processing').length;
    const completed = withdrawals.filter(w => w.status === 'completed').length;
    const totalAmount = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
    
    return { pending, approved, processing, completed, totalAmount };
  };

  const stats = getStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Withdrawal Management</h1>
        <p className="text-gray-500 mt-1">Review and process agent withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
            </div>
            <CheckCircle className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
            </div>
            <RefreshCw className="text-purple-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="text-gray-400" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by agent name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-gray-500 text-sm">
              Showing {filteredWithdrawals.length} of {withdrawals.length} requests
            </span>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested On
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => {
                const statusBadge = getStatusBadge(withdrawal.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                            {withdrawal.agent_id?.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.agent_id?.name || 'Agent'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {withdrawal.agent_id?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-gray-800">
                        ₹{withdrawal.amount?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        <StatusIcon size={14} className="mr-1" />
                        {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(withdrawal._id, 'approved')}
                              disabled={processingId === withdrawal._id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(withdrawal._id, 'rejected')}
                              disabled={processingId === withdrawal._id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(withdrawal._id, 'completed')}
                            disabled={processingId === withdrawal._id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 mt-4">No withdrawal requests found</p>
          </div>
        )}
      </div>

      {/* Withdrawal Details Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-800">Withdrawal Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Agent Info */}
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                  <div className="h-14 w-14 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-medium">
                    {selectedWithdrawal.agent_id?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedWithdrawal.agent_id?.name || 'Agent'}
                    </h3>
                    <p className="text-gray-500">{selectedWithdrawal.agent_id?.email}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Withdrawal Amount</p>
                  <p className="text-3xl font-bold text-gray-800">
                    ₹{selectedWithdrawal.amount?.toLocaleString()}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedWithdrawal.status).bg} ${getStatusBadge(selectedWithdrawal.status).text}`}>
                      {selectedWithdrawal.status?.charAt(0).toUpperCase() + selectedWithdrawal.status?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">
                      {selectedWithdrawal.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Requested On</p>
                    <p className="font-medium">
                      {selectedWithdrawal.createdAt 
                        ? new Date(selectedWithdrawal.createdAt).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {selectedWithdrawal.updatedAt 
                        ? new Date(selectedWithdrawal.updatedAt).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                {selectedWithdrawal.payment_method === 'bank_transfer' && selectedWithdrawal.payment_details && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Bank Details</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      <p><span className="text-gray-500">Account Name:</span> {selectedWithdrawal.payment_details.account_holder_name || 'N/A'}</p>
                      <p><span className="text-gray-500">Account Number:</span> {selectedWithdrawal.payment_details.account_number || 'N/A'}</p>
                      <p><span className="text-gray-500">Bank Name:</span> {selectedWithdrawal.payment_details.bank_name || 'N/A'}</p>
                      <p><span className="text-gray-500">IFSC Code:</span> {selectedWithdrawal.payment_details.ifsc_code || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {selectedWithdrawal.payment_method === 'upi' && selectedWithdrawal.payment_details && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">UPI Details</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p><span className="text-gray-500">UPI ID:</span> {selectedWithdrawal.payment_details.upi_id || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Razorpay Payout Details */}
                {(selectedWithdrawal.razorpay_payout_id || selectedWithdrawal.payment_link_url) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Razorpay Payment Details</h4>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                      {selectedWithdrawal.razorpay_payout_id && (
                        <p><span className="text-gray-600">Payout ID:</span> {selectedWithdrawal.razorpay_payout_id}</p>
                      )}
                      {selectedWithdrawal.payment_link_id && (
                        <p><span className="text-gray-600">Payment Link ID:</span> {selectedWithdrawal.payment_link_id}</p>
                      )}
                      {selectedWithdrawal.payout_status && (
                        <p><span className="text-gray-600">Status:</span> 
                          <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                            selectedWithdrawal.payout_status === 'processed' ? 'bg-green-100 text-green-800' :
                            selectedWithdrawal.payout_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedWithdrawal.payout_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedWithdrawal.payout_status}
                          </span>
                        </p>
                      )}
                      {selectedWithdrawal.payment_link_url && (
                        <p><span className="text-gray-600">Payment Link:</span> 
                          <a 
                            href={selectedWithdrawal.payment_link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 text-blue-600 hover:text-blue-800 underline"
                          >
                            Open Payment Link
                          </a>
                        </p>
                      )}
                      {selectedWithdrawal.transaction_id && (
                        <p><span className="text-gray-600">Transaction ID:</span> {selectedWithdrawal.transaction_id}</p>
                      )}
                      {selectedWithdrawal.payout_failure_reason && (
                        <p><span className="text-red-600">Failure Reason:</span> {selectedWithdrawal.payout_failure_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Invoice */}
                {selectedWithdrawal.invoice_number && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Invoice</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Invoice: {selectedWithdrawal.invoice_number}</span>
                      <button
                        onClick={() => {/* TODO: Generate PDF on frontend */}}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Download Invoice
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Remarks */}
                {selectedWithdrawal.admin_remarks && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Admin Remarks</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedWithdrawal.admin_remarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedWithdrawal._id, 'approved')}
                      disabled={processingId === selectedWithdrawal._id}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedWithdrawal._id, 'rejected')}
                      disabled={processingId === selectedWithdrawal._id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(selectedWithdrawal.status === 'pending' || selectedWithdrawal.status === 'approved' || selectedWithdrawal.status === 'processing') && (
                  <button
                    onClick={() => handleStatusChange(selectedWithdrawal._id, 'completed')}
                    disabled={processingId === selectedWithdrawal._id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminWithdrawalsPage;
