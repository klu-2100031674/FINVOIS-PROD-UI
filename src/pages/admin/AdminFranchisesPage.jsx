import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, Edit, Inbox, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layouts';
import { fetchFranchises } from '@/store/slices/franchiseSlice';
import { formatInvestmentRange } from '@/constants/franchiseConstants';

const AdminFranchisesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { franchises, loading, error } = useSelector((state) => state.franchise);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchFranchises(true));
  }, [dispatch]);

  const filtered = (franchises || []).filter(
    (f) =>
      !searchTerm ||
      f.franchiseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Franchise Management</h1>
            <p className="text-gray-500 mt-1">Add and manage franchise listings for the public site</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/franchises/applications')}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Inbox className="h-4 w-4" />
              Applications
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/franchises/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]"
            >
              <Plus className="h-4 w-4" />
              Add Franchise
            </button>
          </div>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search franchises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce]"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(fetchFranchises(true))}
              className="ml-auto text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Franchise</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Investment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Outlets</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Applications</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f._id || f.uuid} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{f.franchiseName}</div>
                      <div className="text-gray-500 text-xs">{f.brandName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.category}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatInvestmentRange(f.minInvestment, f.maxInvestment)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.existingOutlets || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{f.applicationsCount || 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          f.isActive !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {f.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/franchises/${f.uuid || f._id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[#7e22ce] hover:bg-purple-50 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No franchises match your search.' : 'No franchises yet. Add your first franchise.'}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFranchisesPage;
