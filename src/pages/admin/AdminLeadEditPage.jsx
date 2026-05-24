/**
 * Admin Lead Edit Page
 * Update lead details, linked services, and active status
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeadById, updateLead, clearLeadError, resendLeadCredentials } from '@/store/slices/leadSlice';
import { fetchAllServices } from '@/store/slices/adminServiceSlice';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Search,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const AdminLeadEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentLead, loading, error } = useSelector((state) => state.lead);
  const { services } = useSelector((state) => state.adminService);

  const [name, setName] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  useEffect(() => {
    dispatch(fetchLeadById(id));
    dispatch(fetchAllServices());
    dispatch(clearLeadError());
  }, [id, dispatch]);

  useEffect(() => {
    if (currentLead) {
      setName(currentLead.name || '');
      setIsActive(currentLead.isActive !== false);
      const linked = (currentLead.services || []).map((s) => s._id || s);
      setSelectedServices(linked);
    }
  }, [currentLead]);

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        updateLead({
          id,
          name: name.trim(),
          services: selectedServices,
          isActive,
        })
      ).unwrap();
      toast.success('Lead updated successfully');
      navigate('/admin/leads');
    } catch (err) {
      toast.error(err || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleResendCredentials = async () => {
    setResending(true);
    try {
      await dispatch(resendLeadCredentials(id)).unwrap();
      toast.success(`Credentials email sent to ${currentLead.email}`);
    } catch (err) {
      toast.error(err || 'Failed to resend credentials');
    } finally {
      setResending(false);
    }
  };

  if (loading && !currentLead) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#7e22ce] mx-auto" />
            <p className="mt-3 text-muted-foreground">Loading lead...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !currentLead) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/admin/leads')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Back to Leads
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/leads')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Edit Lead</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {currentLead?.email}
            </p>
          </div>
        </div>

        {/* Not-yet-activated warning */}
        {currentLead?.passwordResetRequired && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                Account not yet activated
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                This lead has not logged in and changed their password yet.
                If they did not receive the credentials email, resend it below — a new password will be generated.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResendCredentials}
              disabled={resending}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {resending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Mail className="h-4 w-4" />}
              Resend Credentials
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Lead Details */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#7e22ce]" />
              Lead Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={currentLead?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm font-medium text-gray-700">Account Status</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Deactivating will block this lead from logging in
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {isActive ? (
                  <>
                    <ToggleRight className="h-5 w-5" /> Active
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" /> Inactive
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Linked Services */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Linked Services</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                The lead receives email notifications for form submissions on these services.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce] outline-none"
              />
            </div>

            {services.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No services available</p>
            ) : (() => {
              const filtered = services.filter(s =>
                !serviceSearch ||
                s.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                s.keywords?.some(k => k.toLowerCase().includes(serviceSearch.toLowerCase()))
              );
              return filtered.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No services match "{serviceSearch}"</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {filtered.map((service) => {
                    const isSelected = selectedServices.includes(service._id);
                    return (
                      <button
                        key={service._id}
                        type="button"
                        onClick={() => handleServiceToggle(service._id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-[#7e22ce] bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#7e22ce] border-[#7e22ce]' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                        {service.keywords?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {service.keywords.slice(0, 3).join(', ')}
                            {service.keywords.length > 3 && ` +${service.keywords.length - 3} more`}
                          </p>
                        )}
                      </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {selectedServices.length > 0 && (
              <p className="text-sm text-[#7e22ce] font-medium">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/leads')}
              className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminLeadEditPage;
