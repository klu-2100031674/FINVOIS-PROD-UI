import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks';
import { fetchTemplates, selectTemplates, selectTemplateLoading } from '../store/slices/templateSlice';
import { fetchReports, selectReports, clearGeneratedExcel, clearFormData } from '../store/slices/reportSlice';
import { Loading } from '../components/common'; // Assuming Loading is a generic full-screen loader
import finvoisLogo from '../assets/finvois.png';
import toast from 'react-hot-toast';

// Lucide-react icons for modern UI
import {
  FileText, // For logo and template cards
  LayoutDashboard, // For dashboard title
  FileStack, // For My Reports button
  User, // For user avatar/name
  LogOut, // For logout button
  Search, // For search input
  ListFilter, // For category filter
  LineChart, // For Reports Generated stats
  FolderOpen, // For no templates found
  ChevronDown, // For dropdown arrow
  ShieldCheckIcon, // For admin button
} from 'lucide-react';
import AIAssistant from '../components/dashboard/AIAssistant';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const templates = useSelector(selectTemplates);
  const reports = useSelector(selectReports);
  const loading = useSelector(selectTemplateLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    // Clear any previously generated Excel data and form data when returning to dashboard
    console.log('🧹 Dashboard useEffect - clearing generated Excel data and form data...');
    dispatch(clearGeneratedExcel());
    dispatch(clearFormData());

    // Fetch data on mount
    console.log('🎯 Dashboard useEffect - fetching data...');
    dispatch(fetchTemplates()).then(result => {
      console.log('📄 Templates fetch result:', result);
    });
    dispatch(fetchReports()).then(result => {
      console.log('📊 Reports fetch result:', result);
    });
  }, [dispatch]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const handleTemplateSelect = (templateId) => {
    // Payment is now handled during final report generation
    navigate(`/generate?templateId=${templateId}`);
  };

  const filteredTemplates = (Array.isArray(templates) ? templates : []).filter((template) => {
    const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.properties?.['Type of Report'] === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Debug logging
  console.log('📄 Dashboard - templates:', templates, 'type:', typeof templates, 'isArray:', Array.isArray(templates));

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  // Extract unique categories for the filter dropdown
  const uniqueCategories = [
    ...new Set(
      (Array.isArray(templates) ? templates : []).map(template => template.properties?.['Type of Report'])
    )
  ].filter(Boolean); // Filter out undefined/null values

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-900">
              <img
                src={finvoisLogo}
                alt="Finvois Logo"
                className="h-9 w-auto"
              />

            </Link>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <Link
                to={user?.role === 'admin' || user?.role === 'super_admin' ? '/admin/reports' : user?.role === 'agent' ? '/agent/reports' : '/reports'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
              >
                <FileStack className="w-4 h-4 mr-2" />
                My Reports
              </Link>

              {/* Credits system removed - now using pay-per-report model */}

              <div className="flex items-center space-x-2 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <span className="font-medium hidden sm:block">{user?.name || 'Guest'}</span>
              </div>

              {/* Profile Link */}
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:block">Profile</span>
              </button>

              {/* Admin Link (only for super admin) */}
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:block">Admin</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {(user?.role === 'user' || user?.role === 'agent') && (
          <div className="mb-12">
            <AIAssistant onSelectTemplate={handleTemplateSelect} />
          </div>
        )}

        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-['Manrope']">
                All Templates
              </h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Templates Card */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center group hover:shadow-lg transition-shadow duration-200">
                <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-3xl font-bold text-gray-900 font-['Manrope']">
                    {templates.length}
                  </h3>
                  <p className="text-gray-600 text-sm">Templates Available</p>
                </div>
              </div>

              {/* Reports Generated Card */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center group hover:shadow-lg transition-shadow duration-200">
                <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors duration-200">
                  <LineChart className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-3xl font-bold text-gray-900 font-['Manrope']">
                    {(reports || []).length}
                  </h3>
                  <p className="text-gray-600 text-sm">Reports Generated</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="flex-1 w-full relative">
                  <input
                    type="text"
                    placeholder="Search templates by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-800 placeholder-gray-500"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {/* Category Filter */}
                <div className="lg:w-64 w-full relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-800 appearance-none cursor-pointer bg-white pr-10"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-md border border-gray-100">
                  <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-6" />
                  <p className="text-gray-600 text-lg font-medium">No templates found matching your criteria.</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter.</p>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors duration-200">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          v{template.version}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 font-['Manrope'] mb-2">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100 mt-4">
                      <span className="text-gray-500">By {template.author || 'Admin'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click from triggering
                          handleTemplateSelect(template.id);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
