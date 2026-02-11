import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks';
import {
  fetchAllUsers,
  updateUserRole,
  updateUserCredits,
  deleteUser,
  createSuperAdmin,
  selectUsers,
  selectUserPagination,
  selectUserLoading,
  selectUserError
} from '../store/slices/userSlice';
import { Button, Card, Input, Loading, Modal } from '../components/common';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const AdminPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const users = useSelector(selectUsers);
  const pagination = useSelector(selectUserPagination);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditCreditsModal, setShowEditCreditsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newCredits, setNewCredits] = useState({ report_credits: 0, enquiry_credits: 0 });

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      toast.error('Access denied. Super admin privileges required.');
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      dispatch(fetchAllUsers({ page: 1, limit: 10 }));
    }
  }, [dispatch, user]);

  const handleSearch = () => {
    dispatch(fetchAllUsers({
      page: 1,
      limit: pagination.limit,
      search: searchQuery,
      role: selectedRole
    }));
  };

  const handlePageChange = (newPage) => {
    dispatch(fetchAllUsers({
      page: newPage,
      limit: pagination.limit,
      search: searchQuery,
      role: selectedRole
    }));
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(updateUserRole({ userId, role: newRole })).unwrap();
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update user role');
    }
  };

  const handleEditCredits = (user) => {
    setSelectedUser(user);
    setNewCredits({
      report_credits: user.wallet?.report_credits || 0,
      enquiry_credits: user.wallet?.enquiry_credits || 0
    });
    setShowEditCreditsModal(true);
  };

  const handleUpdateCredits = async () => {
    try {
      await dispatch(updateUserCredits({
        userId: selectedUser._id,
        credits: newCredits
      })).unwrap();
      toast.success('User credits updated successfully');
      setShowEditCreditsModal(false);
      setSelectedUser(null);
      // Refresh the users list
      dispatch(fetchAllUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        role: selectedRole
      }));
    } catch (error) {
      toast.error(error || 'Failed to update user credits');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete user');
      }
    }
  };

  const handleCreateSuperAdmin = async (adminData) => {
    try {
      await dispatch(createSuperAdmin(adminData)).unwrap();
      toast.success('Super admin created successfully');
      setShowCreateAdminModal(false);
    } catch (error) {
      toast.error(error || 'Failed to create super admin');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="text-center max-w-md">
          <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">Manage users, roles, and system settings</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/admin/payments')}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <CurrencyRupeeIcon className="w-4 h-4" />
                Payment Analytics
              </Button>
              <Button
                onClick={() => setShowCreateAdminModal(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create Super Admin
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={<MagnifyingGlassIcon className="w-4 h-4" />}
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="user">User</option>
            </select>
            <Button onClick={handleSearch} variant="primary">
              Search
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-6">
          {loading ? (
            <Loading text="Loading users..." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Credits</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Joined</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={user._id === user._id} // Can't change own role
                          >
                            <option value="user">User</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {user.company_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>Report: {user.wallet?.report_credits || 0}</div>
                            <div>Enquiry: {user.wallet?.enquiry_credits || 0}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCredits(user)}
                              className="flex items-center gap-1"
                            >
                              <CreditCardIcon className="w-3 h-3" />
                              Credits
                            </Button>
                            {user._id !== user._id && ( // Can't delete self
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(user._id, user.name)}
                                className="flex items-center gap-1"
                              >
                                <TrashIcon className="w-3 h-3" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Create Super Admin Modal */}
        <CreateSuperAdminModal
          isOpen={showCreateAdminModal}
          onClose={() => setShowCreateAdminModal(false)}
          onSubmit={handleCreateSuperAdmin}
        />

        {/* Edit Credits Modal */}
        <EditCreditsModal
          isOpen={showEditCreditsModal}
          onClose={() => setShowEditCreditsModal(false)}
          user={selectedUser}
          credits={newCredits}
          onCreditsChange={setNewCredits}
          onSubmit={handleUpdateCredits}
        />
      </div>
    </div>
  );
};

// Create Super Admin Modal Component
const CreateSuperAdminModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        email: '',
        password: '',
        company_name: '',
        phone: ''
      });
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Super Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Company Name"
          name="company_name"
          value={formData.company_name}
          onChange={handleInputChange}
        />
        <Input
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Create Super Admin
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Credits Modal Component
const EditCreditsModal = ({ isOpen, onClose, user, credits, onCreditsChange, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onCreditsChange(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Credits - ${user?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Report Credits"
          name="report_credits"
          type="number"
          value={credits.report_credits}
          onChange={handleInputChange}
          min="0"
        />
        <Input
          label="Enquiry Credits"
          name="enquiry_credits"
          type="number"
          value={credits.enquiry_credits}
          onChange={handleInputChange}
          min="0"
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Update Credits
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminPage;