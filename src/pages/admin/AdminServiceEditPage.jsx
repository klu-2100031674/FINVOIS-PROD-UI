/**
 * Admin Service Edit Page
 * Edit existing service content, form configuration, settings, and manage leads
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '@/components/common';
import ServiceContentEditor from '@/components/admin/ServiceContentEditor';
import FormBuilder from '@/components/admin/FormBuilder';
import { fetchServiceById, updateServiceContent, updateServiceForm, updateServiceSettings } from '@/store/slices/adminServiceSlice';
import { fetchAllLeads, updateLead } from '@/store/slices/leadSlice';
import { Loader2, Save, ArrowLeft, Users, Plus, Mail, Search, UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';
import apiClient from '@/api/apiClient';

const AdminServiceEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentService, loading, error } = useSelector(state => state.adminService);
  const { leads } = useSelector(state => state.lead);
  const [activeTab, setActiveTab] = useState('content');
  const [saving, setSaving] = useState(false);
  const [serviceLeads, setServiceLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [linkingLeadId, setLinkingLeadId] = useState(null);
  const [unlinkingLeadId, setUnlinkingLeadId] = useState(null);

  // Local state for editable fields
  const [pageTitle, setPageTitle] = useState('');
  const [formTitle, setFormTitle] = useState('Contact Us');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    dispatch(fetchServiceById(id));
    dispatch(fetchAllLeads());
  }, [id, dispatch]);

  useEffect(() => {
    if (currentService) {
      setPageTitle(currentService.content?.title || currentService.name || '');
      setFormTitle(currentService.formConfig?.title || 'Contact Us');
      setDescription(currentService.description || '');
      setKeywords(currentService.keywords?.join(', ') || '');
    }
  }, [currentService]);

  // Fetch leads for this service when Leads tab is active
  useEffect(() => {
    if (activeTab === 'leads') {
      fetchServiceLeads();
    }
  }, [activeTab, id]);

  const fetchServiceLeads = async () => {
    setLeadsLoading(true);
    try {
      const response = await apiClient.get(`/services/${id}/leads`);
      setServiceLeads(response.data.leads || []);
    } catch (err) {
      console.error('Failed to fetch service leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleContentSave = async (sections) => {
    setSaving(true);
    try {
      await dispatch(updateServiceContent({
        id,
        content: {
          ...currentService.content,
          title: pageTitle,
          sections
        }
      })).unwrap();
      toast.success('Content saved successfully');
    } catch (err) {
      toast.error('Failed to save content');
      console.error('Content save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFormConfigSave = async (fields) => {
    setSaving(true);
    try {
      await dispatch(updateServiceForm({
        id,
        formConfig: {
          title: formTitle,
          fields
        }
      })).unwrap();
      toast.success('Form configuration saved successfully');
    } catch (err) {
      toast.error('Failed to save form configuration');
      console.error('Form config save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateServiceSettings({ id, description, keywords })).unwrap();
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkLead = async (lead) => {
    setUnlinkingLeadId(lead._id);
    try {
      const remainingServices = (lead.services || [])
        .map(s => s._id || s)
        .filter(sId => sId.toString() !== id.toString());
      await dispatch(updateLead({ id: lead._id, services: remainingServices })).unwrap();
      toast.success(`${lead.name} unlinked from this service`);
      fetchServiceLeads();
      dispatch(fetchAllLeads());
    } catch (err) {
      toast.error(err || 'Failed to unlink lead');
    } finally {
      setUnlinkingLeadId(null);
    }
  };

  const handleLinkLead = async (lead) => {
    setLinkingLeadId(lead._id);
    try {
      // Build merged services array: existing + this service (deduplicated)
      const existingServiceIds = (lead.services || []).map(s => s._id || s);
      const merged = [...new Set([...existingServiceIds, id])];
      await dispatch(updateLead({ id: lead._id, services: merged })).unwrap();
      toast.success(`${lead.name} linked to this service`);
      setShowLeadModal(false);
      setLeadSearch('');
      fetchServiceLeads();
      dispatch(fetchAllLeads());
    } catch (err) {
      toast.error(err || 'Failed to link lead');
    } finally {
      setLinkingLeadId(null);
    }
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

  if (error || !currentService) {
    return (
      <AdminLayout>
      <div className="text-center py-12">
        <p className="text-red-600">Service not found</p>
        <button
          onClick={() => navigate('/admin/services')}
          className="mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back to Services
        </button>
      </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/services')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Edit Service</h1>
            <p className="text-muted-foreground">{currentService.name}</p>
          </div>
        </div>
        <button
          disabled={saving}
          onClick={() => {
            if (activeTab === 'content') {
              handleContentSave(currentService.content?.sections || []);
            } else if (activeTab === 'form') {
              handleFormConfigSave(currentService.formConfig?.fields || []);
            } else {
              handleSettingsSave();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-white text-[#7e22ce] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('form')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-white text-[#7e22ce] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Form Builder
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'leads'
              ? 'bg-white text-[#7e22ce] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Leads
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-white text-[#7e22ce] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <Card title="Service Content">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
              placeholder="Enter page title"
            />
          </div>
          <ServiceContentEditor
            initialSections={currentService.content?.sections || []}
            onSave={handleContentSave}
          />
        </Card>
      )}

      {/* Form Builder Tab */}
      {activeTab === 'form' && (
        <Card title="Service Form Configuration">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
              placeholder="Contact Us"
            />
          </div>
          <FormBuilder
            initialFields={currentService.formConfig?.fields || []}
            onSave={handleFormConfigSave}
          />
        </Card>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <Card title="Service Leads">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage leads linked to this service. Leads will receive email notifications when DPR matches or forms are submitted.
            </p>
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
          </div>

          {leadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#7e22ce]" />
            </div>
          ) : serviceLeads.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No leads linked to this service yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a lead to link them here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Registered On</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceLeads.map((lead) => (
                    <tr key={lead._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{lead.name}</td>
                      <td className="py-3 px-4">
                        <a href={`mailto:${lead.email}`} className="text-[#7e22ce] hover:underline flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/admin/leads/${lead._id}`)}
                            className="text-sm text-[#7e22ce] hover:underline"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleUnlinkLead(lead)}
                            disabled={unlinkingLeadId === lead._id}
                            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Unlink this lead from service"
                          >
                            {unlinkingLeadId === lead._id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <UserMinus className="h-4 w-4" />}
                            Unlink
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card title="Service Settings">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                type="text"
                value={currentService.name}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-muted-foreground mt-1">Service names cannot be edited</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                placeholder="Service description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="text-xs text-muted-foreground mt-1">Used for DPR matching and email routing</p>
            </div>
          </div>
        </Card>
      )}
    </div>

    {/* Link Existing Lead Modal */}
    {showLeadModal && (() => {
      // IDs already linked to this service
      const linkedIds = new Set(serviceLeads.map(l => l._id));
      // All leads not yet linked, filtered by search
      const available = leads.filter(l =>
        !linkedIds.has(l._id) &&
        (leadSearch === '' ||
          l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
          l.email.toLowerCase().includes(leadSearch.toLowerCase()))
      );
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Link a Lead</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Select an existing lead to link to <span className="font-medium text-[#9333EA]">{currentService.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowLeadModal(false); setLeadSearch(''); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9333EA]/30 focus:border-[#9333EA]"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y">
              {available.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="h-10 w-10 mb-3" />
                  <p className="text-sm font-medium">
                    {leads.length === 0 ? 'No leads in database yet' : 'All leads are already linked'}
                  </p>
                  <p className="text-xs mt-1 text-gray-300">
                    {leadSearch ? 'Try a different search' : 'Register a lead from the Leads page first'}
                  </p>
                </div>
              ) : (
                available.map(lead => (
                  <div key={lead._id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                      <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                    </div>
                    <button
                      onClick={() => handleLinkLead(lead)}
                      disabled={linkingLeadId === lead._id}
                      className="ml-4 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#9333EA] text-white text-xs font-medium rounded-lg hover:bg-[#7e22ce] disabled:opacity-60 transition-colors"
                    >
                      {linkingLeadId === lead._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      Link
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <span className="text-xs text-gray-400">{available.length} lead{available.length !== 1 ? 's' : ''} available</span>
              <button
                onClick={() => { setShowLeadModal(false); setLeadSearch(''); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </AdminLayout>
  );
};

export default AdminServiceEditPage;