import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  RefreshCw,
  FileText
} from 'lucide-react';
import { AgentLayout } from '../../components/layouts';
import useAuth from '../../hooks/useAuth';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AgentWithdrawalsPage = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'bank_transfer'
  });

  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode (development)
    if (dataFetched) return;
    
    fetchData();
    setDataFetched(true);
    
    // Refresh data every 30 seconds to show updated commission balances
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [dataFetched]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch withdrawals
      const withdrawalsResponse = await api.get('/withdrawals');
      const withdrawalsList = withdrawalsResponse.data?.data?.withdrawals || [];
      setWithdrawals(withdrawalsList);

      // Fetch agent stats for real balance
      try {
        const statsResponse = await api.get('/users/agent-stats');
        const agentStats = statsResponse.data?.data || {};
        setAvailableBalance(agentStats.available_balance || 0);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
        setAvailableBalance(0);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare payment details based on payment method
      let payment_details = null;
      
      if (formData.payment_method === 'bank_transfer') {
        if (!user?.bank_details?.account_number) {
          toast.error('Please update your bank details in profile');
          return;
        }
        payment_details = {
          account_holder_name: user.bank_details.account_holder_name || user.name,
          account_number: user.bank_details.account_number,
          ifsc_code: user.bank_details.ifsc_code,
          bank_name: user.bank_details.bank_name,
          upi_id: user.bank_details.upi_id,
          phone_pe_number: user.bank_details.phone_pe_number
        };
      } else if (formData.payment_method === 'upi') {
        if (!user?.bank_details?.upi_id) {
          toast.error('Please update your UPI ID in profile');
          return;
        }
        payment_details = {
          account_holder_name: user.name,
          upi_id: user.bank_details.upi_id,
          phone_pe_number: user.bank_details.phone_pe_number
        };
      }
      
      await api.post('/withdrawals', {
        amount,
        payment_method: formData.payment_method,
        payment_details
      });
      
      toast.success('Withdrawal request submitted successfully');
      setShowModal(false);
      setFormData({ amount: '', payment_method: 'bank_transfer' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'approved':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStats = () => {
    const pending = withdrawals.filter(w => w.status === 'pending').length;
    const completed = withdrawals.filter(w => w.status === 'completed').length;
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + (w.amount || 0), 0);
    
    return { pending, completed, totalWithdrawn };
  };

  const stats = getStats();

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Withdrawals</h1>
          <p className="text-gray-500 mt-1">Request and track your withdrawals</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={availableBalance < 100}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} className="mr-2" />
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-6 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-white/80 text-sm">Available Balance</p>
            <p className="text-4xl font-bold">₹{availableBalance.toLocaleString()}</p>
            {availableBalance < 100 && (
              <p className="text-white/60 text-sm mt-2 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                Minimum withdrawal amount is ₹100
              </p>
            )}
          </div>
          <div className="mt-4 md:mt-0 grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-white/80">Pending</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">₹{stats.totalWithdrawn.toLocaleString()}</p>
              <p className="text-sm text-white/80">Total Withdrawn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Warning */}
      {(!user?.bank_details?.account_number && !user?.upi_details?.upi_id) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-500 mt-0.5" size={20} />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Payment Details Missing</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please update your bank account or UPI details in your profile before requesting a withdrawal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Withdrawal History</h3>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 mt-4">No withdrawal requests yet</p>
            <p className="text-gray-400 text-sm mt-1">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="text-lg font-semibold text-gray-800">
                        ₹{withdrawal.amount?.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="flex items-center text-sm text-gray-500">
                          {withdrawal.payment_method === 'bank_transfer' ? (
                            <>
                              <CreditCard size={14} className="mr-1" />
                              Bank Transfer
                            </>
                          ) : (
                            <>
                              <Smartphone size={14} className="mr-1" />
                              UPI
                            </>
                          )}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">
                          {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
                  </span>
                </div>
                
                {/* Invoice Download */}
                {withdrawal.invoice_number && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Invoice: {withdrawal.invoice_number}</span>
                      <button
                        onClick={() => {/* TODO: Generate PDF on frontend */}}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FileText size={12} className="mr-1" />
                        Download Invoice
                      </button>
                    </div>
                  </div>
                )}
                
                {withdrawal.admin_remarks && (
                  <div className="mt-3 bg-gray-50 p-2 rounded text-sm text-gray-600">
                    <span className="font-medium">Note:</span> {withdrawal.admin_remarks}
                  </div>
                )}

                {/* Payout Status for Approved Withdrawals */}
                {withdrawal.status === 'approved' && (
                  <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {withdrawal.payout_status === 'processed' ? 'Payment Sent' : 'Payment Processing'}
                        </p>
                        <p className="text-xs text-green-600">
                          {withdrawal.payout_status === 'processed'
                            ? `₹${withdrawal.amount} sent ${withdrawal.payment_method === 'upi'
                                ? `to ${withdrawal.upi_id || 'your UPI ID'}`
                                : `to A/C ${withdrawal.account_number ? '****' + withdrawal.account_number.slice(-4) : 'ending with ****'}`
                              }`
                            : `Your payment is being processed via ${withdrawal.payment_method === 'upi' ? 'UPI' : 'Bank Transfer'}`
                          }
                        </p>
                        {withdrawal.razorpay_payout_id && (
                          <p className="text-xs text-green-500 mt-1">
                            Payout ID: {withdrawal.razorpay_payout_id}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          withdrawal.payout_status === 'processed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {withdrawal.payout_status === 'processed' ? 'Completed' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Withdrawal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Request Withdrawal</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Available Balance */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-600">Available Balance</p>
                <p className="text-2xl font-bold text-purple-800">₹{availableBalance.toLocaleString()}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="100"
                      max={availableBalance}
                      step="1"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum: ₹100 | Maximum: ₹{availableBalance.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_method: 'bank_transfer' }))}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                        formData.payment_method === 'bank_transfer'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard size={18} className="mr-2" />
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_method: 'upi' }))}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                        formData.payment_method === 'upi'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Smartphone size={18} className="mr-2" />
                      UPI
                    </button>
                  </div>
                </div>

                {/* Payment Details Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment will be sent to:</p>
                  {formData.payment_method === 'bank_transfer' ? (
                    user?.bank_details?.account_number ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="text-gray-500">Account:</span> {user.bank_details.account_name}</p>
                        <p><span className="text-gray-500">Bank:</span> {user.bank_details.bank_name}</p>
                        <p><span className="text-gray-500">A/C No:</span> ****{user.bank_details.account_number?.slice(-4)}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-500">No bank details found. Please update your profile.</p>
                    )
                  ) : (
                    user?.bank_details?.upi_id ? (
                      <p className="text-sm text-gray-600">{user.bank_details.upi_id}</p>
                    ) : (
                      <p className="text-sm text-red-500">No UPI ID found. Please update your profile.</p>
                    )
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.amount}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AgentLayout>
  );
};

export default AgentWithdrawalsPage;
