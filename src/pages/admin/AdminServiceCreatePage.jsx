/**
 * Admin Register Lead Page
 * Register new leads and link them to services
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '@/components/common';
import { createLead, fetchAllLeads } from '@/store/slices/leadSlice';
import { fetchAllServices } from '@/store/slices/adminServiceSlice';
import { Loader2, ArrowLeft, UserPlus, Mail, Briefcase, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const AdminServiceCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { services } = useSelector(state => state.adminService);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    selectedServices: [],
    keywords: ''
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdLead, setCreatedLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(fetchAllServices()),
        dispatch(fetchAllLeads())
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const selected = prev.selectedServices;
      if (selected.includes(serviceId)) {
        return { ...prev, selectedServices: selected.filter(id => id !== serviceId) };
      } else {
        return { ...prev, selectedServices: [...selected, serviceId] };
      }
    });
  };

  const handleSelectAll = () => {
    if (formData.selectedServices.length === services.length) {
      setFormData(prev => ({ ...prev, selectedServices: [] }));
    } else {
      setFormData(prev => ({ ...prev, selectedServices: services.map(s => s._id) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Lead name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Lead email is required');
      return;
    }

    if (formData.selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setSaving(true);
    try {
      // Process custom keywords
      const customKeywords = formData.keywords
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : [];

      const result = await dispatch(createLead({
        name: formData.name,
        email: formData.email,
        services: formData.selectedServices,
        customKeywords: customKeywords
      })).unwrap();

      setCreatedLead(result);
      toast.success('Lead registered successfully!');

      // Reset form
      setFormData({ name: '', email: '', selectedServices: [], keywords: '' });
    } catch (err) {
      toast.error(err || 'Failed to register lead');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCreatedLead(null);
    setFormData({ name: '', email: '', selectedServices: [], keywords: '' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#7e22ce]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/services')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Register New Lead</h1>
            <p className="text-muted-foreground">
              Create a lead account and link to services for notifications
            </p>
          </div>
        </div>

        {/* Success Message - Show created lead credentials */}
        {createdLead && (
          <Card title="Lead Registered Successfully!" className="mb-6 border-green-200 bg-green-50">
            <div className="space-y-4">
              <p className="text-sm text-green-700">
                The lead has been created. Share the following credentials with the lead securely.
              </p>
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">UUID:</span>
                  <span className="font-mono text-xs">{createdLead.lead?.uuid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Login Token:</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">{createdLead.lead?.loginToken}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Name:</span>
                  <span className="font-medium">{createdLead.lead?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="font-medium">{createdLead.lead?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Temporary Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">
                      {showPassword ? createdLead.autoGeneratedPassword : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Linked Services:</span>
                  <span className="font-medium">
                    {createdLead.lead?.services?.length || 0} services
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">DPR Keywords:</span>
                  <span className="text-xs text-gray-600 max-w-[250px] truncate">
                    {createdLead.lead?.keywords?.join(', ') || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Password Reset Required:</span>
                  <span className={`font-medium ${createdLead.lead?.passwordResetRequired ? 'text-orange-600' : 'text-green-600'}`}>
                    {createdLead.lead?.passwordResetRequired ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Created At:</span>
                  <span className="text-sm">{createdLead.lead?.createdAt ? new Date(createdLead.lead.createdAt).toLocaleString() : '-'}</span>
                </div>
              </div>
              <p className="text-xs text-orange-600 font-medium mt-3">
                ⚠️ This password will only be shown once. Lead must reset password on first login.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Register Another Lead
                </button>
                <button
                  onClick={() => navigate('/admin/services')}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Back to Services
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Registration Form */}
        {!createdLead && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lead Information */}
            <Card title="Lead Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Name *
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                      placeholder="Enter lead name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                      placeholder="lead@company.com"
                      required
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                The lead will receive login credentials via email. A temporary password will be auto-generated.
              </p>
            </Card>

            {/* DPR Keywords */}
            <Card title="DPR Matching Keywords">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add custom keywords to match DPR generation requests. These will be combined with keywords from linked services.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords || ''}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                    placeholder="e.g., manufacturing, export, textile"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When a DPR is generated with matching keywords, this lead will be notified.
                  </p>
                </div>
                {formData.selectedServices.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-700">
                      <strong>Service keywords</strong> will be auto-added from selected services.
                      Add any additional custom keywords above.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Service Selection */}
            <Card title="Link to Services">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Select services to link this lead to. The lead will receive notifications for these services.
                </p>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-[#7e22ce] hover:text-purple-700 font-medium"
                >
                  {formData.selectedServices.length === services.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {services.map((service) => (
                  <label
                    key={service._id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.selectedServices.includes(service._id)
                        ? 'border-[#7e22ce] bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedServices.includes(service._id)}
                      onChange={() => handleServiceToggle(service._id)}
                      className="mt-1 w-4 h-4 text-[#7e22ce] rounded border-gray-300 focus:ring-[#7e22ce]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{service.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {service.keywords?.slice(0, 3).join(', ') || 'No keywords'}
                      </p>
                      {service.leadsCount > 0 && (
                        <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {service.leadsCount} existing leads
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {formData.selectedServices.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>{formData.selectedServices.length}</strong> service(s) selected.
                    The lead will receive email notifications for DPR matches and form submissions on these services.
                  </p>
                </div>
              )}
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/services')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || formData.selectedServices.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Register Lead
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminServiceCreatePage;
