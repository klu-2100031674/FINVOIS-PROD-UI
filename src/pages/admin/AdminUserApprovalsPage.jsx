import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  UserCheck,
  Mail,
  Ban,
  MoreVertical,
  RefreshCw,
  Bell,
  Phone,
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';
import { formatRoleForDisplay } from '../../utils/roleDisplay';

const EmailBadge = ({ verified }) => (
  <span
    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
      verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}
  >
    {verified ? 'Verified' : 'Awaiting verification'}
  </span>
);

const AuthProviderBadge = ({ provider }) => {
  const isGoogle = String(provider || '').toLowerCase() === 'google';
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isGoogle ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isGoogle ? 'Google' : 'Email'}
    </span>
  );
};

const UserApprovalsTable = ({
  users,
  emptyMessage,
  processingId,
  onView,
  onApprove,
  onReject,
  showActions = true,
  approveRequiresVerified = true,
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            User
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Sign-in
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Registered
          </th>
          {showActions && (
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.length === 0 ? (
          <tr>
            <td colSpan={showActions ? 6 : 5} className="px-6 py-10 text-center text-gray-500 text-sm">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          users.map((user) => {
            const canApprove =
              !approveRequiresVerified || user.email_verified;
            return (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-400">{user.phone}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatRoleForDisplay(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EmailBadge verified={user.email_verified} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <AuthProviderBadge provider={user.auth_provider} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => onView(user)}
                        className="p-2 text-[#7e22ce] hover:bg-purple-50 rounded-full transition-colors"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      {onApprove && (
                        <button
                          type="button"
                          onClick={() => onApprove(user._id)}
                          disabled={processingId === user._id || !canApprove}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                          title={
                            canApprove
                              ? 'Approve'
                              : 'Approve after email is verified'
                          }
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {onReject && (
                        <button
                          type="button"
                          onClick={() => onReject(user)}
                          disabled={processingId === user._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

const RejectedUsersTable = ({
  users,
  processingId,
  actionMenuId,
  setActionMenuId,
  onView,
  onAllowReregistration,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!actionMenuId) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenuId, setActionMenuId]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rejected
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-sm">
                No rejected registrations
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatRoleForDisplay(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.signup_approved_at
                    ? new Date(user.signup_approved_at).toLocaleString()
                    : user.updatedAt
                      ? new Date(user.updatedAt).toLocaleString()
                      : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right relative">
                  <div className="inline-flex items-center justify-end gap-1" ref={actionMenuId === user._id ? menuRef : null}>
                    <button
                      type="button"
                      onClick={() => onView(user)}
                      className="p-2 text-[#7e22ce] hover:bg-purple-50 rounded-full"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActionMenuId(actionMenuId === user._id ? null : user._id)
                      }
                      disabled={processingId === user._id}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
                      title="More actions"
                      aria-label="More actions"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {actionMenuId === user._id && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg z-20 border border-gray-100 py-1 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setActionMenuId(null);
                            onAllowReregistration(user);
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <RefreshCw size={15} className="mr-2 shrink-0" />
                          Allow re-registration
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const AdminUserApprovalsPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [userToReject, setUserToReject] = useState(null);
  const [showReregisterModal, setShowReregisterModal] = useState(false);
  const [userToReregister, setUserToReregister] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderPhone, setReminderPhone] = useState('');
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderTesting, setReminderTesting] = useState(false);

  const fetchReminderConfig = async () => {
    try {
      setReminderLoading(true);
      const res = await api.get('/users/approval-reminder-config');
      if (res.data?.success && res.data?.data) {
        setReminderPhone(res.data.data.phone || '');
        setReminderEmail(res.data.data.email || '');
      }
    } catch (err) {
      console.error('Failed to load approval reminder config:', err);
    } finally {
      setReminderLoading(false);
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pendingRes, rejectedRes] = await Promise.all([
        api.get('/users/signup-approvals?includeUnverified=true'),
        api.get('/users/signup-approvals/rejected'),
      ]);
      setPendingUsers(pendingRes.data?.data || []);
      setRejectedUsers(rejectedRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching signup approvals:', error);
      toast.error('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchReminderConfig();
  }, []);

  const handleSaveReminder = async (e) => {
    if (e) e.preventDefault();
    if (!reminderPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    try {
      setReminderSaving(true);
      await api.put('/users/approval-reminder-config', {
        phone: reminderPhone.trim(),
        email: reminderEmail.trim(),
        enabled: true,
      });
      toast.success('Approval remainder settings saved');
      setShowReminderModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save approval remainder');
    } finally {
      setReminderSaving(false);
    }
  };

  const handleTestReminder = async () => {
    if (!reminderPhone.trim()) {
      toast.error('Please enter a phone number to test');
      return;
    }
    try {
      setReminderTesting(true);
      const res = await api.post('/users/approval-reminder-test', {
        phone: reminderPhone.trim(),
        email: reminderEmail.trim(),
      });
      if (res.data?.success) {
        const waSuccess = res.data.data?.whatsapp?.success;
        const emailSuccess = res.data.data?.email?.success;
        if (waSuccess && emailSuccess) {
          toast.success('Test WhatsApp message and Email sent!');
        } else if (waSuccess) {
          toast.success('Test WhatsApp sent successfully!');
        } else if (emailSuccess) {
          toast.success('Test Email sent successfully!');
        } else {
          toast.error(res.data.data?.whatsapp?.error || 'Failed to dispatch test reminder');
        }
      } else {
        toast.error(res.data?.error || 'Failed to send test reminder');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send test reminder');
    } finally {
      setReminderTesting(false);
    }
  };

  const filterBySearch = (list) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(term)
    );
  };

  const awaitingEmailUsers = useMemo(
    () => filterBySearch(pendingUsers.filter((u) => !u.email_verified)),
    [pendingUsers, searchTerm]
  );

  const readyForReviewUsers = useMemo(
    () => filterBySearch(pendingUsers.filter((u) => u.email_verified)),
    [pendingUsers, searchTerm]
  );

  const filteredRejected = useMemo(
    () => filterBySearch(rejectedUsers),
    [rejectedUsers, searchTerm]
  );

  const handleApproval = async (userId, status) => {
    try {
      setProcessingId(userId);
      await api.patch(`/users/${userId}/signup-approval`, { status });
      toast.success(
        status === 'approved' ? 'User approved successfully' : 'Registration rejected'
      );
      setShowRejectModal(false);
      setUserToReject(null);
      setShowModal(false);
      await fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${status} user`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAllowReregistration = async () => {
    if (!userToReregister?._id) return;
    try {
      setProcessingId(userToReregister._id);
      await api.post(`/users/${userToReregister._id}/allow-reregistration`);
      toast.success('Account deleted. They can complete re-registration with the same email.');
      setShowReregisterModal(false);
      setUserToReregister(null);
      setShowModal(false);
      await fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to allow re-registration');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const openRejectModal = (user) => {
    setUserToReject(user);
    setShowRejectModal(true);
  };

  const openReregisterModal = (user) => {
    setUserToReregister(user);
    setShowReregisterModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Approvals</h1>
          <p className="text-gray-500 mt-1">
            Review self-service signups: email verification, admin approval, and rejected accounts
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowReminderModal(true);
            fetchReminderConfig();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Bell size={16} />
          Approval Remainder
          {reminderPhone && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white ml-0.5" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Awaiting email verification</p>
              <p className="text-2xl font-bold text-purple-600">{awaitingEmailUsers.length}</p>
            </div>
            <Mail className="text-purple-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ready for review</p>
              <p className="text-2xl font-bold text-yellow-600">{readyForReviewUsers.length}</p>
            </div>
            <UserCheck className="text-yellow-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedUsers.length}</p>
            </div>
            <Ban className="text-red-400" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total pending signup</p>
              <p className="text-2xl font-bold text-gray-800">{pendingUsers.length}</p>
            </div>
            <Clock className="text-gray-400" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
          />
        </div>
      </div>

      <section className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mail size={18} className="text-purple-600" />
            Awaiting email verification
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Users who signed up but have not verified their email yet. Approval is disabled until
            they verify.
          </p>
        </div>
        <UserApprovalsTable
          users={awaitingEmailUsers}
          emptyMessage="No signups awaiting email verification"
          processingId={processingId}
          onView={handleViewUser}
          onApprove={(id) => handleApproval(id, 'approved')}
          onReject={openRejectModal}
          approveRequiresVerified
        />
      </section>

      <section className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck size={18} className="text-yellow-600" />
              Pending admin approval
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Email verified (including Google signups) — approve or reject to grant or deny platform
              access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowReminderModal(true);
              fetchReminderConfig();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 text-xs font-semibold rounded-md transition-all self-start sm:self-auto"
          >
            <Bell size={14} />
            Approval Remainder
            {reminderPhone ? (
              <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-medium">
                {reminderPhone}
              </span>
            ) : (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium">
                Add phone
              </span>
            )}
          </button>
        </div>
        <UserApprovalsTable
          users={readyForReviewUsers}
          emptyMessage="No registrations ready for review"
          processingId={processingId}
          onView={handleViewUser}
          onApprove={(id) => handleApproval(id, 'approved')}
          onReject={openRejectModal}
          approveRequiresVerified={false}
        />
      </section>

      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Ban size={18} className="text-red-600" />
            Rejected registrations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Users whose signup was rejected. Use Allow re-registration to delete their account so
            they can sign up again with the same email.
          </p>
        </div>
        <RejectedUsersTable
          users={filteredRejected}
          processingId={processingId}
          actionMenuId={actionMenuId}
          setActionMenuId={setActionMenuId}
          onView={handleViewUser}
          onAllowReregistration={openReregisterModal}
        />
      </section>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Registration details</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium text-gray-900">{selectedUser.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium text-gray-900">{selectedUser.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email verification</dt>
                  <dd className="mt-1">
                    <EmailBadge verified={selectedUser.email_verified} />
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Sign-in method</dt>
                  <dd className="mt-1">
                    <AuthProviderBadge provider={selectedUser.auth_provider} />
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Signup status</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {selectedUser.signup_approval_status || 'pending'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium text-gray-900">{selectedUser.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Role</dt>
                  <dd className="font-medium text-gray-900">
                    {formatRoleForDisplay(selectedUser.role)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Designation</dt>
                  <dd className="font-medium text-gray-900">
                    {selectedUser.designation || '—'}
                    {selectedUser.designation_other
                      ? ` (${selectedUser.designation_other})`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Organization</dt>
                  <dd className="font-medium text-gray-900">
                    {selectedUser.organization_name || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Location</dt>
                  <dd className="font-medium text-gray-900">
                    {[
                      selectedUser.village_city,
                      selectedUser.mandal,
                      selectedUser.district,
                      selectedUser.state,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </dd>
                </div>
                {selectedUser.agent_id && (
                  <div>
                    <dt className="text-gray-500">Referred by</dt>
                    <dd className="font-medium text-gray-900">
                      {selectedUser.agent_id.name} ({selectedUser.agent_id.email})
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-6 flex justify-end gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedUser.signup_approval_status === 'rejected' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      openReregisterModal(selectedUser);
                    }}
                    disabled={processingId === selectedUser._id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Allow re-registration
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleApproval(selectedUser._id, 'approved');
                      }}
                      disabled={
                        processingId === selectedUser._id || !selectedUser.email_verified
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        openRejectModal(selectedUser);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && userToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Reject registration?</h2>
            <p className="text-gray-600 text-sm mb-6">
              Reject <strong>{userToReject.name}</strong> ({userToReject.email})? They will be
              notified by email and will not be able to log in.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setUserToReject(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproval(userToReject._id, 'rejected')}
                disabled={processingId === userToReject._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showReregisterModal && userToReregister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Allow re-registration?</h2>
            <p className="text-gray-600 text-sm mb-6">
              This permanently deletes <strong>{userToReregister.name}</strong> (
              {userToReregister.email}) so they can complete re-registration with the same email.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReregisterModal(false);
                  setUserToReregister(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAllowReregistration}
                disabled={processingId === userToReregister._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === userToReregister._id
                  ? 'Deleting...'
                  : 'Delete & allow re-registration'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Approval Remainder</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 919014221011 or 9014221011"
                    value={reminderPhone}
                    onChange={(e) => setReminderPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Notification Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="e.g. admin@finvois.com"
                    value={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleTestReminder}
                  disabled={reminderTesting || reminderSaving}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  title="Test sending WhatsApp and Email immediately"
                >
                  {reminderTesting ? 'Sending test...' : 'Send test now'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReminderModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reminderSaving}
                    className="px-4 py-2 bg-[#7e22ce] hover:bg-[#6b21a8] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {reminderSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUserApprovalsPage;
