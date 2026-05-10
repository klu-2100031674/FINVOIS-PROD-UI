/**
 * Admin Free Credits Page
 * Configure default free reports for new users and manage per-user free credits.
 */
import React, { useEffect, useState } from 'react';
import { Gift, Search, Save, RefreshCw, User } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import { formatRoleForDisplay } from '../../utils/roleDisplay';
import { normalizeUserRole } from '../../utils/normalizeUserRole';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AdminFreeCreditsPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkCreditsInput, setBulkCreditsInput] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [perUserCreditsInput, setPerUserCreditsInput] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredUsers(
        users.filter(u =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/users');
      const list = (res.data?.data || []).filter((u) => {
        const role = normalizeUserRole(u?.role);
        // Platform admins should not be edited from this screen.
        return role !== 'admin';
      });
      setUsers(list);
      setFilteredUsers(list);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleSelectAllVisible = () => {
    const visibleUserIds = filteredUsers.map(u => u._id);
    const allVisibleSelected = visibleUserIds.length > 0 && visibleUserIds.every(id => selectedUserIds.includes(id));

    if (allVisibleSelected) {
      setSelectedUserIds(prev => prev.filter(id => !visibleUserIds.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...visibleUserIds])));
    }
  };

  const handleBulkUpdate = async () => {
    const val = Number(bulkCreditsInput);
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid non-negative number');
      return;
    }

    if (selectedUserIds.length === 0) {
      toast.error('Select at least one user');
      return;
    }

    try {
      setBulkUpdating(true);
      await Promise.all(
        selectedUserIds.map(userId =>
          api.patch(`/system-config/users/${userId}/free-reports`, { count: val })
        )
      );

      setUsers(prev => prev.map(u => (
        selectedUserIds.includes(u._id)
          ? { ...u, free_reports_count: val }
          : u
      )));

      toast.success(`Updated free credits for ${selectedUserIds.length} user(s)`);
      setSelectedUserIds([]);
      setBulkCreditsInput('');
    } catch {
      toast.error('Failed to update selected users');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handlePerUserInputChange = (userId, value) => {
    setPerUserCreditsInput((prev) => ({
      ...prev,
      [userId]: value
    }));
  };

  const handlePerUserUpdate = async (userId) => {
    const raw = perUserCreditsInput[userId];
    const val = Number(raw);

    if (raw === '' || Number.isNaN(val) || val < 0) {
      toast.error('Enter a valid non-negative number');
      return;
    }

    try {
      setUpdatingUserId(userId);
      await api.patch(`/system-config/users/${userId}/free-reports`, { count: val });

      setUsers((prev) => prev.map((u) => (
        u._id === userId ? { ...u, free_reports_count: val } : u
      )));

      toast.success('User credits updated');
    } catch {
      toast.error('Failed to update user credits');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const visibleUserIds = filteredUsers.map(u => u._id);
  const allVisibleSelected = visibleUserIds.length > 0 && visibleUserIds.every(id => selectedUserIds.includes(id));

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Free Report Credits</h1>
            <p className="text-gray-500 text-sm">Manage per-user free credits</p>
          </div>
        </div>

        {/* Per-User Credits Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800 font-['Manrope']">Per-User Credits</h2>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={bulkCreditsInput}
                  onChange={(e) => setBulkCreditsInput(e.target.value)}
                  placeholder="Credits"
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkUpdating || selectedUserIds.length === 0 || bulkCreditsInput === ''}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {bulkUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Selected
                </button>
                <span className="text-xs text-gray-500">
                  {selectedUserIds.length} selected
                </span>
              </div>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading users...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-center py-3 px-5 font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                        aria-label="Select all visible users"
                      />
                    </th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-600">Role</th>
                    <th className="text-center py-3 px-5 font-semibold text-gray-600">Free Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const normalizedRole = normalizeUserRole(u.role);
                      return (
                      <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u._id)}
                            onChange={() => handleToggleUserSelection(u._id)}
                            className="w-4 h-4 accent-purple-600 cursor-pointer"
                            aria-label={`Select ${u.name || u.email}`}
                          />
                        </td>
                        <td className="py-3 px-5 font-medium text-gray-800 truncate max-w-[150px]" title={u.name}>{u.name}</td>
                        <td className="py-3 px-5 text-gray-500 truncate max-w-[200px]" title={u.email}>{u.email}</td>
                        <td className="py-3 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            normalizedRole === 'agent'
                              ? 'bg-purple-100 text-purple-700'
                              : normalizedRole === 'company_admin'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {formatRoleForDisplay(u.role, u)}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-16 text-center inline-block py-1.5 text-sm font-bold text-gray-800">
                              {u.free_reports_count ?? 0}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={perUserCreditsInput[u._id] ?? ''}
                              onChange={(e) => handlePerUserInputChange(u._id, e.target.value)}
                              placeholder="Credits"
                              className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handlePerUserUpdate(u._id)}
                              disabled={updatingUserId === u._id || (perUserCreditsInput[u._id] ?? '') === ''}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-xs font-medium"
                            >
                              {updatingUserId === u._id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFreeCreditsPage;
