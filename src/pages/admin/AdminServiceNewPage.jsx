import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card } from '@/components/common';
import { createService } from '@/store/slices/adminServiceSlice';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const AdminServiceNewPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    setSaving(true);
    try {
      const result = await dispatch(createService({
        name: formData.name.trim(),
        description: formData.description.trim(),
        keywords: formData.keywords,
        displayOrder: Number(formData.displayOrder) || 0,
      })).unwrap();

      toast.success('Service created successfully');
      const serviceId = result?.service?._id || result?._id;
      navigate(serviceId ? `/admin/services/${serviceId}` : '/admin/services');
    } catch (err) {
      toast.error(err || 'Failed to create service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/services')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Create New Service</h1>
            <p className="text-muted-foreground">
              Add a new service that leads can subscribe to for DPR notifications
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Service Details">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Term Loan Advisory"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description shown on the public services listing"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords <span className="text-gray-400">(comma separated)</span>
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="e.g. manufacturing, export, textile"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used to match DPR generation requests and route lead notifications.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first in the public listing.
                </p>
              </div>
            </div>
          </Card>

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
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Service
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminServiceNewPage;
