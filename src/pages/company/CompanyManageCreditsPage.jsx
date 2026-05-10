import React, { useEffect, useMemo, useState } from 'react';
import { Gift, RefreshCw, Send, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import { companyAPI } from '../../api/endpoints';
import api from '../../api/apiClient';
import { useAuth } from '../../hooks';
import { normalizeUserRole } from '../../utils/normalizeUserRole';

const BLOCKED_TARGET_ROLES = new Set(['admin', 'company_admin']);

const CompanyManageCreditsPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [myCredits, setMyCredits] = useState(0);
  const [creditInputs, setCreditInputs] = useState({});
  const [busyUserId, setBusyUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkCreditsInput, setBulkCreditsInput] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const companyId = useMemo(
    () => String(user?.companyId?._id || user?.companyId || '').trim(),
    [user?.companyId]
  );

  const fetchData = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [companyUsersResponse, profileResponse] = await Promise.all([
        companyAPI.getCompanyUsers(companyId),
        api.get('/users/profile')
      ]);

      const listRaw = companyUsersResponse?.data || [];
      const list = Array.isArray(listRaw) ? listRaw : [];
      const currentUserId = String(user?._id || '');
      const visibleUsers = list.filter((member) => {
        const memberRole = normalizeUserRole(member?.role);
        if (String(member?._id || '') === currentUserId) return false;
        return !BLOCKED_TARGET_ROLES.has(memberRole);
      });

      setUsers(visibleUsers);
      setMyCredits(Number(profileResponse?.data?.data?.free_reports_count || 0));
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((member) =>
      String(member?.name || '').toLowerCase().includes(term) ||
      String(member?.email || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const visibleUserIds = useMemo(
    () => filteredUsers.map((member) => String(member._id)),
    [filteredUsers]
  );
  const allVisibleSelected = visibleUserIds.length > 0 && visibleUserIds.every((id) => selectedUserIds.includes(id));

  const handleToggleUserSelection = (userId) => {
    const id = String(userId);
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleUserIds.includes(id)));
      return;
    }
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleUserIds])));
  };

  const handleTransfer = async (targetUser) => {
    const targetUserId = targetUser?._id;
    const credits = Number(creditInputs[targetUserId]);

    if (!targetUserId) return;
    if (!Number.isInteger(credits) || credits <= 0) {
      toast.error('Enter a positive whole number');
      return;
    }
    if (credits > myCredits) {
      toast.error('You do not have enough free credits');
      return;
    }

    try {
      setBusyUserId(targetUserId);
      const response = await companyAPI.transferFreeCredits(targetUserId, credits);
      const senderBalance = Number(response?.data?.sender?.free_reports_count ?? myCredits - credits);
      const receiverBalance = Number(response?.data?.receiver?.free_reports_count ?? 0);

      setMyCredits(senderBalance);
      setUsers((prev) =>
        prev.map((member) =>
          member._id === targetUserId
            ? { ...member, free_reports_count: receiverBalance }
            : member
        )
      );
      setCreditInputs((prev) => ({ ...prev, [targetUserId]: '' }));
      toast.success(`Transferred ${credits} credits`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Transfer failed');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleBulkTransfer = async () => {
    const creditsEach = Number(bulkCreditsInput);
    const targets = users.filter((member) => selectedUserIds.includes(String(member._id)));

    if (!Number.isInteger(creditsEach) || creditsEach <= 0) {
      toast.error('Enter a positive whole number for bulk credits');
      return;
    }
    if (targets.length === 0) {
      toast.error('Select at least one user');
      return;
    }

    const requiredTotal = creditsEach * targets.length;
    if (requiredTotal > myCredits) {
      toast.error(`You need ${requiredTotal} credits, but only ${myCredits} are available`);
      return;
    }

    try {
      setBulkBusy(true);
      let latestSenderBalance = myCredits;
      let successCount = 0;

      for (const target of targets) {
        const response = await companyAPI.transferFreeCredits(target._id, creditsEach);
        latestSenderBalance = Number(response?.data?.sender?.free_reports_count ?? latestSenderBalance - creditsEach);
        const receiverBalance = Number(response?.data?.receiver?.free_reports_count ?? 0);

        setUsers((prev) =>
          prev.map((member) =>
            member._id === target._id
              ? { ...member, free_reports_count: receiverBalance }
              : member
          )
        );
        successCount += 1;
      }

      setMyCredits(latestSenderBalance);
      setSelectedUserIds([]);
      setBulkCreditsInput('');
      toast.success(`Transferred ${creditsEach} credits each to ${successCount} users`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Bulk transfer failed');
      await fetchData();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gift className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-['Manrope']">Manage Credits</h1>
              <p className="text-sm text-gray-500">Transfer your free credits to company users</p>
            </div>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-right">
            <p className="text-xs text-purple-700">Your Available Credits</p>
            <p className="text-2xl font-bold text-purple-800">{myCredits}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-72 max-w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company users..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={bulkCreditsInput}
                  onChange={(e) => setBulkCreditsInput(e.target.value)}
                  placeholder="Bulk Y"
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleBulkTransfer}
                  disabled={bulkBusy || selectedUserIds.length === 0 || !bulkCreditsInput}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-60"
                >
                  {bulkBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Share To Selected
                </button>
                <span className="text-xs text-gray-500">{selectedUserIds.length} selected</span>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-500 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-center px-5 py-3 font-semibold text-gray-600">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                        aria-label="Select all visible users"
                      />
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-center px-5 py-3 font-semibold text-gray-600">Current Credits</th>
                    <th className="text-center px-5 py-3 font-semibold text-gray-600">Transfer</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-10">
                        No eligible company users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((member) => {
                      const memberRole = normalizeUserRole(member?.role);
                      const isBusy = busyUserId === member._id;
                      return (
                        <tr key={member._id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(String(member._id))}
                              onChange={() => handleToggleUserSelection(member._id)}
                              className="w-4 h-4 accent-purple-600 cursor-pointer"
                              aria-label={`Select ${member?.name || member?.email}`}
                            />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{member?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500">{member?.email || '-'}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {memberRole}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-gray-800">
                            {Number(member?.free_reports_count || 0)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={creditInputs[member._id] || ''}
                                onChange={(e) =>
                                  setCreditInputs((prev) => ({
                                    ...prev,
                                    [member._id]: e.target.value
                                  }))
                                }
                                placeholder="0"
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleTransfer(member)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-60"
                              >
                                {isBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Share
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

export default CompanyManageCreditsPage;
