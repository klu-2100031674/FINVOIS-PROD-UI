import React, { useEffect, useState } from 'react';
import { Plus, Edit2, ShieldAlert, Check, X, Shield, Lock, Mail, UserPlus, ToggleLeft, ToggleRight, Settings2, Trash2, ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts';
import api, { apiErrorMessage } from '../../api/apiClient';
import toast from 'react-hot-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'email', label: 'Email Input' },
  { value: 'phone', label: 'Phone Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'date', label: 'Date Input' },
  { value: 'dropdown', label: 'Dropdown Select' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'file', label: 'File Upload' },
  { value: 'address', label: 'Address Block' }
];

const BUILTIN_FIELD_IDS = {
  name: 'govt_builtin_name',
  email: 'govt_builtin_email',
  phone: 'govt_builtin_phone',
};

const isBuiltinField = (field) =>
  field.id === BUILTIN_FIELD_IDS.name ||
  field.id === BUILTIN_FIELD_IDS.email ||
  field.id === BUILTIN_FIELD_IDS.phone;

const isLegacyContactField = (field) =>
  field.type === 'email' ||
  field.type === 'phone' ||
  (field.type === 'text' && field.id.toLowerCase().includes('name'));

const buildBuiltinFields = (requiredContact) => {
  const contactRule = requiredContact === 'both' ? 'both' : 'either';
  return [
    {
      id: BUILTIN_FIELD_IDS.name,
      type: 'text',
      label: 'Name',
      placeholder: 'Full name',
      required: true,
    },
    {
      id: BUILTIN_FIELD_IDS.email,
      type: 'email',
      label: 'Email',
      placeholder: 'Email address',
      required: contactRule === 'both',
    },
    {
      id: BUILTIN_FIELD_IDS.phone,
      type: 'phone',
      label: 'Phone Number',
      placeholder: 'Phone number',
      required: contactRule === 'both',
    },
  ];
};

const getBuiltinFieldStatusLabel = (field, requiredContact) => {
  if (field.id === BUILTIN_FIELD_IDS.name) return 'Required';
  if (requiredContact === 'both') return 'Required';
  return 'Either one required';
};

const AdminGovtFormsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptFormData, setDeptFormData] = useState({ name: '', email: '', password: '', is_active: true });
  const [savingDept, setSavingDept] = useState(false);

  // Form Builder Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeFormDept, setActiveFormDept] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formName, setFormName] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formFields, setFormFields] = useState([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [requiredContact, setRequiredContact] = useState('either');
  const [savingForm, setSavingForm] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptRes, formsRes] = await Promise.all([
        api.get('/govt-forms/departments'),
        api.get('/govt-forms/forms')
      ]);
      setDepartments(deptRes.data?.data || []);
      setForms(formsRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error(apiErrorMessage(error, 'Failed to fetch details'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDeptModal = () => {
    setSelectedDept(null);
    setDeptFormData({ name: '', email: '', password: '', is_active: true });
    setShowDeptModal(true);
  };

  const handleOpenEditDeptModal = (dept) => {
    setSelectedDept(dept);
    setDeptFormData({ name: dept.name, email: dept.email, password: '', is_active: dept.is_active });
    setShowDeptModal(true);
  };

  const handleToggleDeptStatus = async (dept) => {
    const newStatus = !dept.is_active;
    try {
      await api.patch(`/govt-forms/departments/${dept._id}/status`, { is_active: newStatus });
      toast.success(`Department "${dept.name}" ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchInitialData();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to update status'));
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptFormData.name.trim() || !deptFormData.email.trim()) {
      toast.error('Name and Email are required');
      return;
    }

    if (!selectedDept && !deptFormData.password.trim()) {
      toast.error('Password is required for new departments');
      return;
    }

    setSavingDept(true);
    try {
      if (selectedDept) {
        await api.put(`/govt-forms/departments/${selectedDept._id}`, {
          name: deptFormData.name.trim(),
          email: deptFormData.email.trim(),
          password: deptFormData.password.trim() || undefined,
          is_active: deptFormData.is_active
        });
        toast.success(`Department "${deptFormData.name}" updated successfully`);
      } else {
        await api.post('/govt-forms/departments', {
          name: deptFormData.name.trim(),
          email: deptFormData.email.trim(),
          password: deptFormData.password.trim(),
          is_active: deptFormData.is_active
        });
        toast.success(`Department "${deptFormData.name}" created successfully`);
      }
      setShowDeptModal(false);
      fetchInitialData();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to save department'));
    } finally {
      setSavingDept(false);
    }
  };

  // --- Form Builder Operations ---
  const handleOpenFormBuilder = (dept) => {
    setActiveFormDept(dept);
    const existingForm = forms.find(f => f.departmentId?._id === dept._id || f.departmentId === dept._id);

    if (existingForm) {
      setSelectedForm(existingForm);
      setFormName(existingForm.name);
      setFormRoute(existingForm.customRoute);
      const contactReq =
        existingForm.requiredContact === 'both'
          ? 'both'
          : 'either';
      setRequiredContact(contactReq);
      const mappedFields = (existingForm.fields || [])
        .filter((f) => !isBuiltinField(f) && !isLegacyContactField(f))
        .map((f) => ({
          ...f,
          optionsText: f.options?.join(', ') || '',
        }));
      setFormFields(mappedFields);
      setFormIsActive(existingForm.isActive);
    } else {
      setSelectedForm(null);
      setFormName(`${dept.name} Public Form`);
      setFormRoute(dept.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
      setFormFields([]);
      setRequiredContact('either');
      setFormIsActive(true);
    }
    setShowFormModal(true);
  };

  const handleAddField = () => {
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
      options: [],
      optionsText: ''
    };
    setFormFields([...formFields, newField]);
  };

  const handleRemoveField = (index) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, key, val) => {
    const updated = [...formFields];
    updated[index][key] = val;
    if (key === 'optionsText') {
      updated[index].options = val.split(',').map(s => s.trim()).filter(Boolean);
    }
    setFormFields(updated);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formRoute.trim()) {
      toast.error('Form name and URL route are required');
      return;
    }
    if (!requiredContact) {
      toast.error('Select whether either Email or Phone, or both, are compulsory');
      return;
    }

    setSavingForm(true);
    try {
      const cleanedCustomFields = formFields.map(({ optionsText, ...rest }) => rest);
      const allFields = [...buildBuiltinFields(requiredContact), ...cleanedCustomFields];
      const payload = {
        name: formName.trim(),
        customRoute: formRoute.trim(),
        fields: allFields,
        requiredContact,
        isActive: formIsActive,
        departmentId: activeFormDept._id
      };

      if (selectedForm) {
        await api.put(`/govt-forms/forms/${selectedForm._id}`, payload);
        toast.success('Department form updated successfully');
      } else {
        await api.post('/govt-forms/forms', payload);
        toast.success('Department form created successfully');
      }
      setShowFormModal(false);
      fetchInitialData();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save form. Custom route must be unique.'));
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Govt Forms Department Settings</h1>
          <p className="text-gray-500 mt-1">Configure Department accounts and build public form routing segments</p>
        </div>
        <button
          onClick={handleOpenCreateDeptModal}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Create Department
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Public Form Config
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      No departments configured. Click "Create Department" to begin.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => {
                    const deptForm = forms.find(f => f.departmentId?._id === dept._id || f.departmentId === dept._id);

                    return (
                      <tr key={dept._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                              {dept.name?.[0]?.toUpperCase() || 'D'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {deptForm ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[#7e22ce] font-semibold">{deptForm.name}</span>
                              <a
                                href={`/report-requests/${deptForm.customRoute}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-400 hover:text-purple-600 font-mono flex items-center gap-0.5"
                              >
                                /{deptForm.customRoute} <ArrowRight size={10} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No Form Set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {dept.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/admin/department-name?departmentId=${dept._id}`}
                              className="p-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg flex items-center gap-1 text-xs font-bold transition-all"
                              title="View Department Dashboard"
                            >
                              <BarChart3 size={14} />
                              Dashboard
                            </Link>
                            <button
                              onClick={() => handleOpenFormBuilder(dept)}
                              className="p-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-1 text-xs font-bold transition-all"
                              title="Build Department Form"
                            >
                              <Settings2 size={14} />
                              Configure Form
                            </button>
                            <button
                              onClick={() => handleOpenEditDeptModal(dept)}
                              className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
                              title="Edit Credentials"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleDeptStatus(dept)}
                              className={`p-1 transition-colors ${
                                dept.is_active ? 'text-green-600 hover:text-red-600' : 'text-red-600 hover:text-green-600'
                              }`}
                              title={dept.is_active ? 'Deactivate Department' : 'Reactivate Department'}
                            >
                              {dept.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
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
        </div>
      )}

      {/* Department CRUD Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedDept ? 'Edit Department Details' : 'Create Department Account'}
              </h2>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  placeholder="e.g. Finance Department"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  value={deptFormData.email}
                  onChange={(e) => setDeptFormData({ ...deptFormData, email: e.target.value })}
                  placeholder="finance@gov.in"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {selectedDept && <span className="text-gray-400 font-normal">(leave blank to keep unchanged)</span>} *
                </label>
                <input
                  type="password"
                  required={!selectedDept}
                  value={deptFormData.password}
                  onChange={(e) => setDeptFormData({ ...deptFormData, password: e.target.value })}
                  placeholder="Login password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={deptFormData.is_active}
                  onChange={(e) => setDeptFormData({ ...deptFormData, is_active: e.target.checked })}
                  className="rounded text-[#7e22ce] focus:ring-[#7e22ce] h-4 w-4 border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 select-none">
                  Active (Allow login)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="flex-1 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingDept && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  {savingDept ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Builder Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedForm ? 'Edit Department Form Layout' : 'Build Form Layout'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Configuring public form for <strong>{activeFormDept?.name}</strong></p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form Config Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Title *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Birth Certificate Form"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom route slug URL *</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-xs text-gray-500 font-mono">
                      /report-requests/
                    </span>
                    <input
                      type="text"
                      required
                      value={formRoute}
                      onChange={(e) => setFormRoute(e.target.value)}
                      placeholder="birth-certificate"
                      className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form_active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-[#7e22ce] focus:ring-[#7e22ce] h-4 w-4 border-gray-300"
                />
                <label htmlFor="form_active" className="text-sm font-medium text-gray-700 select-none">
                  Form is active (Accept submissions at custom link)
                </label>
              </div>

              {/* Required Applicant Fields */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-purple-900">Required Applicant Fields</h3>
                  <p className="text-xs text-purple-700 mt-1">
                    Every form must include Name, Email, and Phone Number. Name is always compulsory.
                    Choose whether applicants must provide either contact field or both.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {buildBuiltinFields(requiredContact).map((field) => (
                    <div key={field.id} className="bg-white border border-purple-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-gray-700">{field.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{field.type.replace('_', ' ')}</p>
                      <p className="text-[11px] mt-1 font-medium text-purple-700">
                        {getBuiltinFieldStatusLabel(field, requiredContact)}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Email &amp; Phone requirement <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="requiredContact"
                        value="either"
                        checked={requiredContact === 'either'}
                        onChange={(e) => setRequiredContact(e.target.value)}
                        className="text-[#7e22ce] focus:ring-[#7e22ce]"
                      />
                      Either Email or Phone is compulsory
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="requiredContact"
                        value="both"
                        checked={requiredContact === 'both'}
                        onChange={(e) => setRequiredContact(e.target.value)}
                        className="text-[#7e22ce] focus:ring-[#7e22ce]"
                      />
                      Both Email and Phone are compulsory
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Field Builder list */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Additional Form Fields</h3>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-3 py-1.5 bg-purple-50 text-[#7e22ce] border border-purple-200 rounded text-xs font-bold hover:bg-purple-100 transition-colors"
                  >
                    + Add Form Field
                  </button>
                </div>

                <div className="space-y-4">
                  {formFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative space-y-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="absolute right-3 top-3 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Field Label *</label>
                          <input
                            type="text"
                            required
                            value={field.label}
                            onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                            placeholder="Applicant Name"
                            className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Field Type *</label>
                          <select
                            value={field.type}
                            onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce]"
                          >
                            {FIELD_TYPES.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Placeholder (Optional)</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                            placeholder="Enter text"
                            className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce]"
                          />
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            Selection Choices <span className="text-gray-400 font-normal">(comma-separated)</span> *
                          </label>
                          <input
                            type="text"
                            required
                            value={field.optionsText || ''}
                            onChange={(e) => handleFieldChange(index, 'optionsText', e.target.value)}
                            placeholder="e.g. Male, Female, Other"
                            className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#7e22ce]"
                          />
                        </div>
                      )}

                      {/* Options checkboxes */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`req_${field.id}`}
                          checked={field.required}
                          onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                          className="rounded text-[#7e22ce] h-3.5 w-3.5 border-gray-300"
                        />
                        <label htmlFor={`req_${field.id}`} className="text-xs font-medium text-gray-600 select-none">
                          Field is Required
                        </label>
                      </div>
                    </div>
                  ))}

                  {formFields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                      No additional fields yet. Name, Email, and Phone Number are included by default.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="flex-1 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingForm && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  {savingForm ? 'Saving Form...' : 'Save Form Configurations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGovtFormsPage;
