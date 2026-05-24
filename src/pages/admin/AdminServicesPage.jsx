/**
 * Admin Services List Page
 * Manage services for lead notifications and DPR matching
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllServices } from '@/store/slices/adminServiceSlice';
import { Plus, Search, Edit, Users, Mail, ArrowUpDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const AdminServicesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { services, loading, error } = useSelector(state => state.adminService);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    console.log('AdminServicesPage: Dispatching fetchAllServices');
    dispatch(fetchAllServices());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchAllServices());
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedServices = [...filteredServices].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (sortBy === 'leadsCount') {
      aVal = a.leadsCount || 0;
      bVal = b.leadsCount || 0;
    }
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage services for lead notifications and DPR matching
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/services/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] font-medium"
        >
          <Plus className="h-4 w-4" />
          Add New Service
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-red-600 font-medium">Error: {error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-sm border border-red-300 rounded-lg hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-3xl font-bold mt-1">{services.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Mail className="h-6 w-6 text-[#7e22ce]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Services with Leads</p>
              <p className="text-3xl font-bold mt-1">
                {services.filter(s => s.leadsCount > 0).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-3xl font-bold mt-1">
                {services.reduce((sum, s) => sum + (s.leadsCount || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services by name, description, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">All Services</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e22ce] mx-auto"></div>
                <p className="mt-3 text-muted-foreground">Loading services...</p>
              </div>
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No services found</p>
              <button
                onClick={() => navigate('/admin/services/create')}
                className="px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]"
              >
                Create your first service
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-[#7e22ce]"
                      >
                        Service Name
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Description</th>
                    <th className="text-left py-3 px-4 font-medium">Keywords</th>
                    <th className="text-left py-3 px-4 font-medium">
                      <button
                        onClick={() => handleSort('leadsCount')}
                        className="flex items-center gap-1 hover:text-[#7e22ce]"
                      >
                        Leads
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Form Fields</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((service) => (
                    <tr key={service._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.content?.title && service.content.title !== service.name && (
                            <p className="text-sm text-muted-foreground">{service.content.title}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                          {service.description || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {service.keywords?.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                          {service.keywords?.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                              +{service.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {(service.leadsCount > 0) && (
                            <>
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{service.leadsCount}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {service.formConfig?.fields?.length || 0} fields
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/services/${service._id}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
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
    </div>
    </AdminLayout>
  );
};

export default AdminServicesPage;