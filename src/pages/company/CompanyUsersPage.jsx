import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import { companyAPI } from '../../api/endpoints';
import { useAuth } from '../../hooks';
import { formatRoleForDisplay } from '../../utils/roleDisplay';
import { normalizeUserRole } from '../../utils/normalizeUserRole';

const normalizeId = (v) => String(v || '').trim();

const resolveCompanyIdFromUser = async (user) => {
  let companyId = companyAPI.normalizeCompanyId(
    user?.companyId?._id ||
      user?.companyId?.id ||
      user?.companyId?.$oid ||
      user?.company?._id ||
      user?.company?.id ||
      user?.company_id ||
      (typeof user?.companyId === 'string' || typeof user?.companyId === 'number' ? user.companyId : '')
  );
  if (companyId) return companyId;

  try {
    const companiesResponse = await companyAPI.getAllCompanies();
    const companies = companiesResponse?.data || [];
    const currentUserId = normalizeId(user?._id || user?.id);

    const matchedCompany = companies.find((company) => {
      const adminRef = company?.companyAdminId;
      const primaryId = typeof adminRef === 'object' ? adminRef?._id : adminRef;
      const fromArray = (Array.isArray(company?.companyAdminIds) ? company.companyAdminIds : []).map((ref) =>
        typeof ref === 'object' ? ref?._id : ref
      );
      const ids = [...fromArray.map(String), String(primaryId || '')].filter(Boolean);
      return ids.includes(currentUserId);
    });

    const fallbackCompany = matchedCompany || companies[0];
    return companyAPI.normalizeCompanyId(fallbackCompany?._id);
  } catch {
    return '';
  }
};

const isCompanyPerson = (u) => {
  const role = normalizeUserRole(u?.role);
  // In this codebase, company members are frequently stored as role "user" with a companyId.
  // The company-scoped endpoint should already filter to the organization.
  if (role === 'agent') return false;
  return role === 'company_admin' || role === 'company_user' || role === 'user';
};

const getUserId = (u) => normalizeId(u?._id || u?.id);

const getReportUserId = (report) => {
  const candidate =
    report?.user_id ??
    report?.userId ??
    report?.user ??
    report?.created_by ??
    report?.createdBy ??
    null;

  const id =
    typeof candidate === 'object'
      ? candidate?._id || candidate?.id || candidate?.$oid
      : candidate;

  return normalizeId(id);
};

const isApprovedReport = (report) => {
  const v = String(report?.validation_status || report?.status || '').toLowerCase();
  return v === 'approved' || v === 'completed';
};

const fetchAllCompanyReports = async () => {
  // Prefer admin-reports for company-wide (company-scoped) listing.
  // Fallback to /reports if backend doesn't allow it.
  try {
    const first = await api.get('/admin-reports?page=1&limit=50');
    const firstData = first?.data?.data || {};
    const firstPageReports = Array.isArray(firstData?.reports) ? firstData.reports : [];
    const pagination = firstData?.pagination || {};
    const totalPages = Number(pagination?.total_pages || pagination?.totalPages || 1) || 1;

    const all = [...firstPageReports];
    const maxPages = Math.min(totalPages, 50); // safety
    for (let page = 2; page <= maxPages; page += 1) {
      const res = await api.get(`/admin-reports?page=${page}&limit=50`);
      const data = res?.data?.data || {};
      const pageReports = Array.isArray(data?.reports) ? data.reports : [];
      all.push(...pageReports);
    }
    return all;
  } catch {
    // fallback: may be scoped to current user; still better than nothing
    const reportsResponse = await api.get('/reports');
    return reportsResponse?.data?.data || [];
  }
};

const CompanyUsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [reportStatsByUserId, setReportStatsByUserId] = useState(() => new Map());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const companyId = await resolveCompanyIdFromUser(user);
        if (!companyId) {
          toast.error('Could not resolve company for this account');
          setCompanyUsers([]);
          setReportStatsByUserId(new Map());
          return;
        }

        const usersResponse = await companyAPI.getCompanyUsers(companyId);
        const usersPayload = usersResponse?.data;
        const users = Array.isArray(usersPayload)
          ? usersPayload
          : Array.isArray(usersPayload?.users)
            ? usersPayload.users
            : Array.isArray(usersResponse?.users)
              ? usersResponse.users
              : [];

        const people = users.filter(isCompanyPerson);

        const reports = await fetchAllCompanyReports();

        const stats = new Map();
        for (const p of people) {
          stats.set(getUserId(p), { generated: 0, approved: 0 });
        }

        for (const r of reports) {
          const uid = getReportUserId(r);
          if (!uid || !stats.has(uid)) continue;
          const cur = stats.get(uid);
          cur.generated += 1;
          if (isApprovedReport(r)) cur.approved += 1;
        }

        setCompanyUsers(people);
        setReportStatsByUserId(stats);
      } catch (e) {
        console.error('Failed to load company users page:', e);
        toast.error(typeof e === 'string' ? e : 'Failed to load company users');
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = companyUsers.map((u) => {
      const id = getUserId(u);
      const stats = reportStatsByUserId.get(id) || { generated: 0, approved: 0 };
      return { user: u, id, ...stats };
    });

    const filtered = q
      ? base.filter(({ user }) => {
          const name = String(user?.name || '').toLowerCase();
          const email = String(user?.email || '').toLowerCase();
          const mobile = String(user?.mobile || '');
          return name.includes(q) || email.includes(q) || mobile.includes(search.trim());
        })
      : base;

    return filtered.sort((a, b) => {
      const roleA = String(a.user?.role || '');
      const roleB = String(b.user?.role || '');
      if (roleA !== roleB) return roleA.localeCompare(roleB);
      return String(a.user?.name || '').localeCompare(String(b.user?.name || ''));
    });
  }, [companyUsers, reportStatsByUserId, search]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-blue-600" size={22} />
              Company Users
            </h1>
            <p className="text-gray-500 mt-1">
              Company Users and Company Admins Reports.
            </p>
          </div>

          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No company users found.</p>
            </div>
          ) : (
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Reports
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved Reports
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map(({ user: u, id, generated, approved }) => (
                    <tr
                      key={id}
                      className="hover:bg-gray-50 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/company/user/${id}/reports`, {
                          state: { userName: u?.name || u?.email || 'User' },
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/company/user/${id}/reports`, {
                            state: { userName: u?.name || u?.email || 'User' },
                          });
                        }
                      }}
                      title="Click to view this person's reports"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                              {String(u?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{u?.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {formatRoleForDisplay(u?.role, u).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-medium">
                        {generated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-medium">
                        {approved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CompanyUsersPage;

