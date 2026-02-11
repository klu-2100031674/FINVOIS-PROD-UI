import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Save, 
  X, 
  FileSpreadsheet,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Settings,
  Upload,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'CC', label: 'Cash Credit (CC)' },
  { value: 'TERM_LOAN', label: 'Term Loan' },
  { value: 'HOUSING_LOAN', label: 'Housing Loan' },
  { value: 'BUSINESS_LOAN', label: 'Business Loan' },
  { value: 'PERSONAL_LOAN', label: 'Personal Loan' },
  { value: 'VEHICLE_LOAN', label: 'Vehicle Loan' },
  { value: 'GOLD_LOAN', label: 'Gold Loan' },
  { value: 'OTHER', label: 'Other' }
];

const AdminTemplateConfigPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [migrating, setMigrating] = useState(false);
  
  const [formData, setFormData] = useState({
    template_id: '',
    name: '',
    description: '',
    version: '1.0.0',
    author: 'CA',
    report_type: 'CC',
    properties: {
      no_of_years: 1,
      type_of_report: 'CC'
    },
    initial_hide: [],
    initial_remove_formulas: [],
    after_generate_remove_formulas: [],
    after_generate_hide: [],
    after_generate_lock: [],
    analysis_sheets: [],
    is_active: true,
    is_featured: false,
    display_order: 0
  });

  const [pricingData, setPricingData] = useState({
    base_price: 0,
    credits_required: 1,
    currency: 'INR',
    discount_percentage: 0,
    sheet_pricing: []
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/template-config/admin/all');
      setTemplates(response.data?.data?.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateFromMeta = async () => {
    if (!window.confirm('This will import all templates from meta.json. Continue?')) {
      return;
    }
    
    try {
      setMigrating(true);
      const response = await api.post('/template-config/migrate-from-meta');
      toast.success(`Migration complete! Created: ${response.data.data.created}, Updated: ${response.data.data.updated}`);
      fetchTemplates();
    } catch (error) {
      toast.error('Migration failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setMigrating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('properties.')) {
      const propName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [propName]: type === 'number' ? parseInt(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
      }));
    }
  };

  const handleArrayInput = (field, value) => {
    // Split by comma and trim whitespace
    const items = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && selectedTemplate) {
        await api.put(`/template-config/${selectedTemplate.template_id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await api.post('/template-config', formData);
        toast.success('Template created successfully');
      }
      
      fetchTemplates();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save template');
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      template_id: template.template_id,
      name: template.name,
      description: template.description || '',
      version: template.version || '1.0.0',
      author: template.author || 'CA',
      report_type: template.report_type,
      properties: template.properties || { no_of_years: 1, type_of_report: 'CC' },
      initial_hide: template.initial_hide || [],
      initial_remove_formulas: template.initial_remove_formulas || [],
      after_generate_remove_formulas: template.after_generate_remove_formulas || [],
      after_generate_hide: template.after_generate_hide || [],
      after_generate_lock: template.after_generate_lock || [],
      analysis_sheets: template.analysis_sheets || [],
      is_active: template.is_active,
      is_featured: template.is_featured || false,
      display_order: template.display_order || 0
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleEditPricing = (template) => {
    setSelectedTemplate(template);
    setPricingData({
      base_price: template.pricing?.base_price || 0,
      credits_required: template.pricing?.credits_required || 1,
      currency: template.pricing?.currency || 'INR',
      discount_percentage: template.pricing?.discount_percentage || 0,
      sheet_pricing: template.pricing?.sheet_pricing || []
    });
    setShowPricingModal(true);
  };

  const handleSavePricing = async () => {
    try {
      await api.patch(`/template-config/${selectedTemplate.template_id}/pricing`, pricingData);
      toast.success('Pricing updated successfully');
      fetchTemplates();
      setShowPricingModal(false);
    } catch (error) {
      toast.error('Failed to update pricing');
    }
  };

  const handleAddSheetPricing = () => {
    setPricingData(prev => ({
      ...prev,
      sheet_pricing: [
        ...prev.sheet_pricing,
        { sheet_name: '', display_name: '', price: 0, is_included: true, is_optional: false, is_visible: true }
      ]
    }));
  };

  const handleSheetPricingChange = (index, field, value) => {
    setPricingData(prev => ({
      ...prev,
      sheet_pricing: prev.sheet_pricing.map((sp, i) => 
        i === index ? { ...sp, [field]: value } : sp
      )
    }));
  };

  const handleRemoveSheetPricing = (index) => {
    setPricingData(prev => ({
      ...prev,
      sheet_pricing: prev.sheet_pricing.filter((_, i) => i !== index)
    }));
  };

  const handleAddAnalysisSheet = () => {
    setFormData(prev => ({
      ...prev,
      analysis_sheets: [
        ...prev.analysis_sheets,
        { sheet_name: '', display_name: '', required: false, is_visible: true, amount_display: '' }
      ]
    }));
  };

  const handleAnalysisSheetChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      analysis_sheets: prev.analysis_sheets.map((sheet, i) => 
        i === index ? { ...sheet, [field]: value } : sheet
      )
    }));
  };

  const handleRemoveAnalysisSheet = (index) => {
    setFormData(prev => ({
      ...prev,
      analysis_sheets: prev.analysis_sheets.filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/template-config/${templateId}`);
        toast.success('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleToggleStatus = async (template) => {
    try {
      await api.patch(`/template-config/${template.template_id}/status`, {
        is_active: !template.is_active
      });
      toast.success(`Template ${template.is_active ? 'deactivated' : 'activated'}`);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: '',
      name: '',
      description: '',
      version: '1.0.0',
      author: 'CA',
      report_type: 'CC',
      properties: { no_of_years: 1, type_of_report: 'CC' },
      initial_hide: [],
      initial_remove_formulas: [],
      after_generate_remove_formulas: [],
      after_generate_hide: [],
      after_generate_lock: [],
      analysis_sheets: [],
      is_active: true,
      is_featured: false,
      display_order: 0
    });
    setSelectedTemplate(null);
    setEditMode(false);
    setShowModal(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Template Configuration</h1>
          <p className="text-gray-500 mt-1">Manage Excel templates and pricing</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={handleMigrateFromMeta}
            disabled={migrating}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={`mr-2 ${migrating ? 'animate-spin' : ''}`} />
            {migrating ? 'Migrating...' : 'Import from meta.json'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Template
          </button>
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FileSpreadsheet className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 mt-4">No templates configured yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Click "Import from meta.json" to migrate existing templates
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template._id}
              className={`bg-white rounded-xl shadow-md border-l-4 ${
                template.is_active ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              {/* Template Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${template.is_active ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <FileSpreadsheet className={template.is_active ? 'text-purple-600' : 'text-gray-400'} size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {template.template_id}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {template.report_type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Pricing Badge */}
                    <div className="text-right mr-4">
                      <p className="text-xl font-bold text-gray-800">
                        ₹{template.effective_price || template.pricing?.base_price || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {template.pricing?.credits_required || 1} credit(s)
                        {template.pricing?.discount_percentage > 0 && (
                          <span className="text-green-600 ml-1">({template.pricing.discount_percentage}% off)</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <button
                      onClick={() => handleEditPricing(template)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit Pricing"
                    >
                      <DollarSign size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Template"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(template)}
                      className={`p-2 rounded-lg transition-colors ${
                        template.is_active 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={template.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {template.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(template.template_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => setExpandedTemplate(
                        expandedTemplate === template._id ? null : template._id
                      )}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {expandedTemplate === template._id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>
                </div>
                
                {template.description && (
                  <p className="text-sm text-gray-500 mt-3 ml-16">{template.description}</p>
                )}
              </div>
              
              {/* Expanded Details */}
              {expandedTemplate === template._id && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Initial Hide Sheets</h4>
                      <div className="flex flex-wrap gap-1">
                        {(template.initial_hide || []).map((sheet, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white rounded border">
                            {sheet}
                          </span>
                        ))}
                        {(!template.initial_hide || template.initial_hide.length === 0) && (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Remove Formulas From</h4>
                      <div className="flex flex-wrap gap-1">
                        {(template.initial_remove_formulas || []).map((sheet, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white rounded border">
                            {sheet}
                          </span>
                        ))}
                        {(!template.initial_remove_formulas || template.initial_remove_formulas.length === 0) && (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Lock After Generate</h4>
                      <div className="flex flex-wrap gap-1">
                        {(template.after_generate_lock || []).map((sheet, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white rounded border">
                            {sheet}
                          </span>
                        ))}
                        {(!template.after_generate_lock || template.after_generate_lock.length === 0) && (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis Sheets (Term Loan)</h4>
                      <div className="flex flex-wrap gap-1">
                        {(template.analysis_sheets || []).map((sheet, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white rounded border flex items-center gap-1">
                            {sheet.sheet_name}
                            {sheet.required && <span className="text-[10px] text-red-500 font-bold">*</span>}
                          </span>
                        ))}
                        {(!template.analysis_sheets || template.analysis_sheets.length === 0) && (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sheet Pricing */}
                  {template.pricing?.sheet_pricing?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sheet Pricing</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {template.pricing.sheet_pricing.map((sp, i) => (
                          <div key={i} className="text-xs p-2 bg-white rounded border">
                            <span className="font-medium">{sp.sheet_name}</span>
                            <span className="text-gray-500 ml-2">₹{sp.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? 'Edit Template' : 'Add New Template'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template ID *
                  </label>
                  <input
                    type="text"
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleInputChange}
                    required
                    disabled={editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., Format CC1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Template Display Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Template description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type *
                  </label>
                  <select
                    name="report_type"
                    value={formData.report_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {REPORT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. of Years
                  </label>
                  <input
                    type="number"
                    name="properties.no_of_years"
                    value={formData.properties.no_of_years}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sheet Configurations */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Sheet Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Hide (comma-separated sheet names)
                    </label>
                    <input
                      type="text"
                      value={formData.initial_hide.join(', ')}
                      onChange={(e) => handleArrayInput('initial_hide', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Sheet1, Sheet2, Sheet3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Remove Formulas (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.initial_remove_formulas.join(', ')}
                      onChange={(e) => handleArrayInput('initial_remove_formulas', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="FinalWorkings"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      After Generate - Lock Sheets (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.after_generate_lock.join(', ')}
                      onChange={(e) => handleArrayInput('after_generate_lock', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Coverpage"
                    />
                  </div>

                  {/* Analysis Sheets Configuration */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Analysis Sheets (Term Loan Only)</h4>
                      <button
                        type="button"
                        onClick={handleAddAnalysisSheet}
                        className="text-xs flex items-center text-purple-600 hover:text-purple-700"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Sheet
                      </button>
                    </div>
                    
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-2 items-center mb-2 px-2">
                      <div className="col-span-2">
                        <span className="text-xs font-semibold text-gray-700">Sheet Name (Key)</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-xs font-semibold text-gray-700">Display Name</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-xs font-semibold text-gray-700">Amount Display</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-xs font-semibold text-gray-700">Include / Visible</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {formData.analysis_sheets.map((sheet, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={sheet.sheet_name}
                              onChange={(e) => handleAnalysisSheetChange(index, 'sheet_name', e.target.value)}
                              placeholder="Sheet Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={sheet.display_name}
                              onChange={(e) => handleAnalysisSheetChange(index, 'display_name', e.target.value)}
                              placeholder="Display Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={sheet.amount_display || ''}
                              onChange={(e) => handleAnalysisSheetChange(index, 'amount_display', e.target.value)}
                              placeholder="Amt Display (e.g. ₹500)"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div className="col-span-3 flex items-center justify-around">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sheet.required}
                                onChange={(e) => handleAnalysisSheetChange(index, 'required', e.target.checked)}
                                className="h-3 w-3 text-purple-600 rounded"
                              />
                              <span className="ml-1 text-[10px] text-gray-600">Req</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sheet.is_visible !== false}
                                onChange={(e) => handleAnalysisSheetChange(index, 'is_visible', e.target.checked)}
                                className="h-3 w-3 text-purple-600 rounded"
                              />
                              <span className="ml-1 text-[10px] text-gray-600">Visible</span>
                            </label>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveAnalysisSheet(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {formData.analysis_sheets.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2 italic">
                          No analysis sheets configured.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-6 border-t border-gray-200 pt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save size={18} className="mr-2" />
                  {editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Configure Pricing</h2>
                <p className="text-sm text-gray-500">{selectedTemplate.name}</p>
              </div>
              <button onClick={() => setShowPricingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Base Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    value={pricingData.base_price}
                    onChange={(e) => setPricingData(prev => ({ ...prev, base_price: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credits Required
                  </label>
                  <input
                    type="number"
                    value={pricingData.credits_required}
                    onChange={(e) => setPricingData(prev => ({ ...prev, credits_required: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  value={pricingData.discount_percentage}
                  onChange={(e) => setPricingData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Per-Sheet Pricing */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Per-Sheet Pricing</h3>
                  <button
                    type="button"
                    onClick={handleAddSheetPricing}
                    className="flex items-center text-sm text-purple-600 hover:text-purple-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Sheet
                  </button>
                </div>

                {pricingData.sheet_pricing.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No per-sheet pricing configured. All sheets included in base price.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pricingData.sheet_pricing.map((sp, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={sp.sheet_name}
                          onChange={(e) => handleSheetPricingChange(index, 'sheet_name', e.target.value)}
                          placeholder="Sheet Name"
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="text"
                          value={sp.display_name || ''}
                          onChange={(e) => handleSheetPricingChange(index, 'display_name', e.target.value)}
                          placeholder="Display Name"
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="number"
                          value={sp.price}
                          onChange={(e) => handleSheetPricingChange(index, 'price', parseInt(e.target.value) || 0)}
                          placeholder="Price"
                          min="0"
                          className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={sp.is_included !== false}
                            onChange={(e) => handleSheetPricingChange(index, 'is_included', e.target.checked)}
                            className="mr-1"
                          />
                          Included
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={sp.is_optional}
                            onChange={(e) => handleSheetPricingChange(index, 'is_optional', e.target.checked)}
                            className="mr-1"
                          />
                          Optional
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={sp.is_visible !== false}
                            onChange={(e) => handleSheetPricingChange(index, 'is_visible', e.target.checked)}
                            className="mr-1"
                          />
                          Visible
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveSheetPricing(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-4 bg-gray-50 -mx-6 px-6 py-4 -mb-6 rounded-b-xl">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Price Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">₹{pricingData.base_price}</span>
                  </div>
                  {pricingData.sheet_pricing.filter(s => s.is_included !== false && !s.is_optional).length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">+ Included Sheets:</span>
                      <span className="font-medium text-green-600">
                        ₹{pricingData.sheet_pricing
                          .filter(s => s.is_included !== false && !s.is_optional)
                          .reduce((sum, s) => sum + (s.price || 0), 0)}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const baseTotal = pricingData.base_price + 
                      pricingData.sheet_pricing
                        .filter(s => s.is_included !== false && !s.is_optional)
                        .reduce((sum, s) => sum + (s.price || 0), 0);
                    const discountAmount = baseTotal * (pricingData.discount_percentage || 0) / 100;
                    const effectivePrice = baseTotal - discountAmount;
                    
                    return (
                      <>
                        {pricingData.discount_percentage > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>- Discount ({pricingData.discount_percentage}%):</span>
                            <span className="font-medium">-₹{discountAmount.toFixed(0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                          <span className="font-semibold text-gray-800">Total Price:</span>
                          <span className="font-bold text-lg text-purple-700">₹{effectivePrice.toFixed(0)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePricing}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={18} className="mr-2" />
                  Save Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTemplateConfigPage;
