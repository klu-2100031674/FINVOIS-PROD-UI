import React, { useEffect, useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Eye, UserPlus } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import { formatRoleForDisplay } from '../../utils/roleDisplay';
import {
  resolveCompanyDisplayName,
  userBelongsToCompany,
} from '../../utils/companyMembership';
import { resolveSignupApprovalStatus } from '../../utils/signupApproval';

const isSignupPending = (user) => resolveSignupApprovalStatus(user) === 'pending';
const isSignupRejected = (user) => resolveSignupApprovalStatus(user) === 'rejected';
const isSignupApproved = (user) => resolveSignupApprovalStatus(user) === 'approved';
const isSignupRestricted = (user) => !isSignupApproved(user);

const isUserActive = (user) => {
  if (typeof user?.is_active === 'boolean') return user.is_active;
  return String(user?.status || '').toLowerCase() !== 'inactive';
};

const getUserStatusLabel = (user) => {
  if (isSignupPending(user)) return 'REVIEW';
  if (isSignupRejected(user)) return 'REJECTED';
  return isUserActive(user) ? 'ACTIVE' : 'INACTIVE';
};

const getUserStatusBadgeClass = (user) => {
  if (isSignupPending(user)) return 'bg-blue-100 text-blue-800';
  if (isSignupRejected(user)) return 'bg-red-100 text-red-800';
  return isUserActive(user) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionRate, setCommissionRate] = useState(0);

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const EMPTY_NEW_USER = { name: '', email: '', password: '', role: 'user', phone: '' };
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users?includeInactive=true');
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((user) => {
        const companyName = resolveCompanyDisplayName(user) || '';
        return (
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.mobile?.includes(searchTerm) ||
          companyName.toLowerCase().includes(term)
        );
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'review') {
      filtered = filtered.filter((user) => isSignupPending(user));
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((user) => isSignupRejected(user));
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(
        (user) => isSignupApproved(user) && isUserActive(user)
      );
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(
        (user) => isSignupApproved(user) && !isUserActive(user)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      await api.patch(`/users/${userId}`, { is_active: isActive });
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
    setActionMenu(null);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      toast.success(`User role updated to ${formatRoleForDisplay(newRole)}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
    setActionMenu(null);
  };

  const handleEditCommission = (user) => {
    setSelectedUser(user);
    setCommissionRate(user.commission_rate || 0);
    setShowCommissionModal(true);
    setActionMenu(null);
  };

  const handleUpdateCommission = async () => {
    try {
      await api.put(`/users/${selectedUser._id}/commission-rate`, {
        commission_rate: commissionRate
      });
      toast.success('Commission rate updated successfully');
      setShowCommissionModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('Name, email and password are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users/create-admin', {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone.trim() || undefined,
      });
      toast.success(`User "${newUser.name}" created successfully`);
      setShowCreateModal(false);
      setNewUser(EMPTY_NEW_USER);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    setActionMenu(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'company_admin':
        return 'bg-orange-100 text-orange-800';
      case 'agent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">Manage all users, channel partners, and company admins</p>
        </div>
        <button
          onClick={() => { setNewUser(EMPTY_NEW_USER); setShowCreateModal(true); }}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] transition-colors"
        >
          <UserPlus size={18} className="mr-2" />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Super Admin</option>
              <option value="lead_manager">Service Manager</option>
              <option value="company_admin">Company Admin</option>
              <option value="agent">Channel partner</option>
              <option value="executive">Executive</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="review">Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-gray-500 text-sm">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const companyName = resolveCompanyDisplayName(user);
                const inCompany = userBelongsToCompany(user);
                const signupRestricted = isSignupRestricted(user);
                return (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone || user.mobile ? (
                        <div className="text-xs text-gray-400">{user.phone || user.mobile}</div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {inCompany ? (
                      <span className="font-medium text-gray-900">{companyName || '—'}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {formatRoleForDisplay(user.role, user).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUserStatusBadgeClass(user)}`}>
                      {getUserStatusLabel(user)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.referral_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    {signupRestricted ? (
                      <button
                        type="button"
                        onClick={() => handleViewUser(user)}
                        className="p-2 text-[#7e22ce] hover:bg-purple-50 rounded-full transition-colors"
                        title="View details (manage in User Approvals)"
                      >
                        <Eye size={18} />
                      </button>
                    ) : (
                      <>
                    <button
                      type="button"
                      onClick={() => setActionMenu(actionMenu === user._id ? null : user._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {actionMenu === user._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => handleViewUser(user)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye size={16} className="mr-2" /> View Details
                          </button>
                          {user.role === 'agent' && (
                            <button
                              onClick={() => handleEditCommission(user)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 size={16} className="mr-2" /> Edit Commission
                            </button>
                          )}
                          {user.role === 'user' && (
                            <>
                              <button
                                onClick={() => handleRoleChange(user._id, 'agent')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit2 size={16} className="mr-2" />
                                Promote to channel partner
                              </button>
                              <button
                                onClick={() => handleRoleChange(user._id, 'executive')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit2 size={16} className="mr-2" />
                                Promote to Executive
                              </button>
                            </>
                          )}
                          {user.role === 'agent' && (
                            <button
                              onClick={() => handleRoleChange(user._id, 'user')}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 size={16} className="mr-2" />
                              Demote to User
                            </button>
                          )}
                          {user.role === 'executive' && (
                            <button
                              onClick={() => handleRoleChange(user._id, 'user')}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 size={16} className="mr-2" />
                              Demote to User
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(user._id, !isUserActive(user))}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit2 size={16} className="mr-2" /> 
                            {isUserActive(user) ? 'Deactivate User' : 'Activate User'}
                          </button>
                          {/* Delete action intentionally disabled.
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete User
                          </button>
                          */}
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">
                      {userBelongsToCompany(selectedUser)
                        ? resolveCompanyDisplayName(selectedUser) || '—'
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium">{formatRoleForDisplay(selectedUser.role, selectedUser).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{getUserStatusLabel(selectedUser)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">{selectedUser.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Referral Code</p>
                    <p className="font-medium">{selectedUser.referral_code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission Rate</p>
                    <p className="font-medium">{selectedUser.commission_rate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined On</p>
                    <p className="font-medium">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedUser.bank_details && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Bank Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500">Account Name:</p>
                      <p>{selectedUser.bank_details.account_name || 'N/A'}</p>
                      <p className="text-gray-500">Account Number:</p>
                      <p>{selectedUser.bank_details.account_number || 'N/A'}</p>
                      <p className="text-gray-500">Bank Name:</p>
                      <p>{selectedUser.bank_details.bank_name || 'N/A'}</p>
                      <p className="text-gray-500">IFSC Code:</p>
                      <p>{selectedUser.bank_details.ifsc_code || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {selectedUser.upi_details && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">UPI Details</h4>
                    <p className="text-sm">{selectedUser.upi_details.upi_id || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission Rate Edit Modal */}
      {showCommissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-800">Edit Commission Rate</h2>
                <button
                  onClick={() => setShowCommissionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                    placeholder="Enter commission rate"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rate must be between 0% and 100%
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCommission}
                  className="px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] transition-colors"
                >
                  Update Commission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create New User Modal ─────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="agent">Channel Partner</option>
                  <option value="executive">Executive</option>
                  <option value="lead_manager">Service Manager</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(u => ({ ...u, phone: e.target.value }))}
                  placeholder="+91 9999999999"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsersPage;
