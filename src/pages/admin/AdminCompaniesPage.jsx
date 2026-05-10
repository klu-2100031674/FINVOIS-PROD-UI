import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts';
import { companyAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Eye,
  ImageOff,
  ShieldCheck,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

const LogoThumb = ({ url, label }) => {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-12 w-16 items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-gray-300">
          <ImageOff size={16} />
        </span>
        <span className="text-[10px] uppercase text-gray-400">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={url}
        alt={label}
        className="h-12 w-16 object-contain rounded-md border border-gray-200 bg-white p-1"
        onError={() => setBroken(true)}
      />
      <span className="text-[10px] uppercase text-gray-400">{label}</span>
    </div>
  );
};

const AdminCompaniesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAllCompanies();
      setCompanies(response?.data || []);
    } catch (error) {
      toast.error(error || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      toast.success(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleToggleCompanyStatus = async (company) => {
    const name = company.companyName || 'this company';
    const nextIsActive = company.isActive === false;
    const confirmed = window.confirm(
      `${nextIsActive ? 'Activate' : 'Deactivate'} "${name}"?`
    );
    if (!confirmed) return;
    try {
      setTogglingId(company._id);
      await companyAPI.updateCompanyStatus(company._id, nextIsActive);
      toast.success(`Company ${nextIsActive ? 'activated' : 'deactivated'} successfully`);
      setSuccessMessage('');
      await fetchCompanies();
    } catch (error) {
      toast.error(error || 'Failed to update company status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteCompany = async (company) => {
    const name = company.companyName || 'this company';
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nUser accounts will NOT be removed — they are only unassigned from this company. Former company admins become regular users. Reports stay in the system but are no longer linked to this company.\n\nThis cannot be undone.`
    );
    if (!confirmed) return;
    try {
      setDeletingId(company._id);
      await companyAPI.deleteCompany(company._id);
      toast.success('Company deleted');
      setSuccessMessage('');
      await fetchCompanies();
    } catch (error) {
      toast.error(error || 'Failed to delete company');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    let list = [...companies];
    if (statusFilter !== 'all') {
      const wantActive = statusFilter === 'active';
      list = list.filter((c) => (c.isActive !== false) === wantActive);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((c) =>
        [c.companyName, c.contactPersonName, c.contactEmail]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }
    return list;
  }, [companies, search, statusFilter]);

  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.isActive !== false).length;
    return { total, active, inactive: total - active };
  }, [companies]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={24} className="text-purple-600" /> Company Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, edit, and manage companies and their branding logos.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/companies/create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} /> Create Company
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                Total Companies
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Active</p>
              <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Inactive</p>
              <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
            {successMessage}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, contact, or email…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'active', 'inactive'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === value
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-52 gap-2 text-gray-500">
              <RefreshCw size={16} className="animate-spin" /> Loading companies…
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-16 px-6 text-gray-500">
              <Building2 size={36} className="mx-auto text-gray-300 mb-2" />
              {companies.length === 0 ? (
                <>
                  <p className="font-medium text-gray-700">No companies yet</p>
                  <p className="text-sm mt-1">Create your first company to get started.</p>
                </>
              ) : (
                <p className="text-sm">No companies match your filters.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Logos
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredCompanies.map((company) => (
                    <tr key={company._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-sm">
                          {company.companyName || '—'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {company.uuid}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <LogoThumb
                            key={`${company._id}-ap-${company.apLogoUrl || ''}`}
                            url={company.apLogoDisplayUrl || company.apLogoUrl}
                            label="Logo 1"
                          />
                          <LogoThumb
                            key={`${company._id}-cl-${company.companyLogoUrl || ''}`}
                            url={company.companyLogoDisplayUrl || company.companyLogoUrl}
                            label="Logo 2"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900">{company.contactPersonName || '—'}</div>
                        <div className="text-xs text-gray-500">{company.contactEmail || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.createdAt
                          ? new Date(company.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            company.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {company.isActive !== false ? (
                            <ShieldCheck size={12} />
                          ) : (
                            <ShieldAlert size={12} />
                          )}
                          {company.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/companies/${company._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCompanyStatus(company)}
                            disabled={togglingId === company._id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border disabled:opacity-50 ${
                              company.isActive === false
                                ? 'border-green-200 text-green-700 hover:bg-green-50'
                                : 'border-red-200 text-red-700 hover:bg-red-50'
                            }`}
                          >
                            {togglingId === company._id
                              ? 'Updating…'
                              : company.isActive === false
                              ? 'Activate'
                              : 'Deactivate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompany(company)}
                            disabled={deletingId === company._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            {deletingId === company._id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
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

export default AdminCompaniesPage;
