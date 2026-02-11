import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Save, X } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import api from '../../api/apiClient';
import toast from 'react-hot-toast';

const AdminPricingPage = () => {
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [formData, setFormData] = useState({
    report_type: '',
    name: '',
    price_per_credit: '',
    credits_required: 1,
    description: '',
    is_active: true
  });

  const reportTypes = [
    'CC1', 'CC2', 'CC3', 'CC4', 'CC5', 'CC6',
    'Term Loan', 'Housing Loan', 'Business Loan',
    'Personal Loan', 'Vehicle Loan', 'Gold Loan'
  ];

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await api.get('/report-pricing');
      setPricingList(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast.error('Failed to fetch pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && selectedPricing) {
        await api.put(`/report-pricing/${selectedPricing._id}`, formData);
        toast.success('Pricing updated successfully');
      } else {
        await api.post('/report-pricing', formData);
        toast.success('Pricing created successfully');
      }
      
      fetchPricing();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save pricing');
    }
  };

  const handleEdit = (pricing) => {
    setSelectedPricing(pricing);
    setFormData({
      report_type: pricing.report_type,
      name: pricing.name || pricing.report_type,
      price_per_credit: pricing.price_per_credit,
      credits_required: pricing.credits_required || 1,
      description: pricing.description || '',
      is_active: pricing.is_active
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (pricingId) => {
    if (window.confirm('Are you sure you want to delete this pricing?')) {
      try {
        await api.delete(`/report-pricing/${pricingId}`);
        toast.success('Pricing deleted successfully');
        fetchPricing();
      } catch (error) {
        toast.error('Failed to delete pricing');
      }
    }
  };

  const handleToggleStatus = async (pricing) => {
    try {
      await api.put(`/report-pricing/${pricing._id}`, {
        ...pricing,
        is_active: !pricing.is_active
      });
      toast.success(`Pricing ${pricing.is_active ? 'deactivated' : 'activated'}`);
      fetchPricing();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      report_type: '',
      name: '',
      price_per_credit: '',
      credits_required: 1,
      description: '',
      is_active: true
    });
    setSelectedPricing(null);
    setEditMode(false);
    setShowModal(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Report Pricing</h1>
          <p className="text-gray-500 mt-1">Manage pricing for different report types</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add New Price
        </button>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pricingList.map((pricing) => (
          <div
            key={pricing._id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              pricing.is_active ? 'border-green-500' : 'border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${pricing.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <DollarSign className={pricing.is_active ? 'text-green-600' : 'text-gray-400'} size={20} />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-800">{pricing.report_type}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pricing.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {pricing.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(pricing)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(pricing._id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-800">
                ₹{pricing.price_per_credit?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">per credit • {pricing.credits_required || 1} credit(s) required</p>
              {pricing.description && (
                <p className="text-sm text-gray-500 mt-2">{pricing.description}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleToggleStatus(pricing)}
                className={`w-full py-2 text-sm rounded-lg transition-colors ${
                  pricing.is_active
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {pricing.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pricingList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <DollarSign className="mx-auto text-gray-300" size={48} />
          <p className="text-gray-500 mt-4">No pricing configured yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Price
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editMode ? 'Edit Pricing' : 'Add New Pricing'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    name="report_type"
                    value={formData.report_type}
                    onChange={handleInputChange}
                    required
                    disabled={editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Report Type</option>
                    {reportTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., CC1 - Capital Cash Flow"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Per Credit (₹)
                    </label>
                    <input
                      type="number"
                      name="price_per_credit"
                      value={formData.price_per_credit}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credits Required
                    </label>
                    <input
                      type="number"
                      name="credits_required"
                      value={formData.credits_required}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a description for this pricing..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={18} className="mr-2" />
                    {editMode ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPricingPage;
