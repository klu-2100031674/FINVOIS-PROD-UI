import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Button, Card, Loading } from '../components/common';
import { AdminLayout } from '../components/layouts';
import { adminAPI } from '../api/endpoints';
import toast from 'react-hot-toast';
import {
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const AdminPaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paymentsData, setPaymentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Check if user is admin/super_admin
  useEffect(() => {
    if (user && !['admin', 'super_admin'].includes(user.role)) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  const fetchPayments = async (period = selectedPeriod, page = currentPage) => {
    try {
      setLoading(true);
      const response = await adminAPI.getPayments({
        period,
        page,
        limit: 20
      });

      // The response is {success: true, data: {...}, message: "..."}
      // We need response.data which contains {period, summary, payments, pagination}
      if (response && response.success && response.data) {
        setPaymentsData(response.data);
      } else {
        console.warn('Invalid response structure:', response);
        setPaymentsData(null);
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(`Failed to load payment data: ${error.message || 'Unknown error'}`);
      setPaymentsData(null); // Ensure paymentsData is null on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role && ['admin', 'super_admin'].includes(user.role)) {
      fetchPayments();
    }
  }, [user]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setCurrentPage(1);
    fetchPayments(period, 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPayments(selectedPeriod, newPage);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading fullScreen text="Loading payment analytics..." />
      </AdminLayout>
    );
  }

  if (!paymentsData) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <BanknotesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Unable to load payment data</h4>
            <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
            <Button onClick={() => fetchPayments()} variant="primary">
              Retry
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 font-['Manrope'] mb-2">
            Payment Analytics
          </h1>
          <p className="text-gray-600">Reports payment transactions overview</p>
        </div>

        {/* Summary Cards */}
        {paymentsData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <BanknotesIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(paymentsData.summary.total_revenue)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(paymentsData.summary.today_revenue)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <ChartBarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(paymentsData.summary.week_revenue)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100">
                  <ClockIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(paymentsData.summary.month_revenue)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Period Filter */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filter by Period</h3>
              <p className="text-sm text-gray-600">Showing: {paymentsData?.period}</p>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'week', label: 'Last 7 Days' },
                { key: 'month', label: 'Last 30 Days' }
              ].map((period) => (
                <Button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key)}
                  variant={selectedPeriod === period.key ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Payments List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Transactions ({paymentsData?.summary?.total_payments || 0})
            </h3>
          </div>

          {paymentsData?.payments?.length === 0 ? (
            <div className="text-center py-12">
              <BanknotesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No payments found</h4>
              <p className="text-gray-600">No payment transactions for the selected period.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {paymentsData?.payments?.map((dateGroup) => (
                <div key={dateGroup.date} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{dateGroup.displayDate}</h4>
                        <p className="text-sm text-gray-600">
                          {dateGroup.count} payment{dateGroup.count !== 1 ? 's' : ''} • {formatCurrency(dateGroup.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dateGroup.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h5 className="font-medium text-gray-900">{payment.title}</h5>
                              <p className="text-sm text-gray-600">{payment.templateId}</p>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>{payment.user.name}</p>
                              <p>{payment.user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(payment.paidAt)} at {formatTime(payment.paidAt)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{payment.paymentId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {paymentsData?.pagination && paymentsData.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((paymentsData.pagination.current_page - 1) * paymentsData.pagination.per_page) + 1} to{' '}
                {Math.min(paymentsData.pagination.current_page * paymentsData.pagination.per_page, paymentsData.pagination.total_count)}{' '}
                of {paymentsData.pagination.total_count} payments
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === paymentsData.pagination.total_pages}
                  variant="secondary"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsPage;