/**
 * Admin Generate Report Page
 * Allows admins to generate reports without payment/credits check
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTemplates, selectTemplates, selectTemplateLoading } from '../../store/slices/templateSlice';
import { clearGeneratedExcel, clearFormData } from '../../store/slices/reportSlice';
import { AdminLayout } from '../../components/layouts';
import { Loading } from '../../components/common';
import {
  FileText,
  Search,
  ChevronDown,
  FolderOpen,
  Zap,
  Shield
} from 'lucide-react';

const AdminGenerateReportPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const templates = useSelector(selectTemplates);
  const loading = useSelector(selectTemplateLoading);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    // Clear any previously generated Excel data and form data
    dispatch(clearGeneratedExcel());
    dispatch(clearFormData());
    
    // Fetch templates
    dispatch(fetchTemplates());
  }, [dispatch]);

  const handleTemplateSelect = (templateId) => {
    // Admin generates without payment check - navigate directly to generate page
    // Add admin flag to indicate no payment needed
    navigate(`/generate?templateId=${templateId}&admin=true`);
  };

  const filteredTemplates = (Array.isArray(templates) ? templates : []).filter((template) => {
    const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.properties?.['Type of Report'] === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories for the filter dropdown
  const uniqueCategories = [
    ...new Set(
      (Array.isArray(templates) ? templates : []).map(template => template.properties?.['Type of Report'])
    )
  ].filter(Boolean);

  if (loading) {
    return (
      <AdminLayout>
        <Loading fullScreen text="Loading templates..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">
                Generate Reports
              </h1>
              <p className="text-gray-500">Select a template to generate report (Admin - No credits required)</p>
            </div>
          </div>
          
          {/* Admin Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            <Shield className="w-4 h-4" />
            Admin Mode - Free Generation
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
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

        {/* Templates Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{templates?.length || 0}</p>
                <p className="text-sm text-gray-500">Total Templates</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FolderOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{uniqueCategories.length}</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{filteredTemplates.length}</p>
                <p className="text-sm text-gray-500">Matching Results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-6" />
              <p className="text-gray-600 text-lg font-medium">No templates found matching your criteria.</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter.</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
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
                  {template.properties?.['Type of Report'] && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                      {template.properties['Type of Report']}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100 mt-4">
                  <span className="text-gray-500">By {template.author || 'Admin'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateSelect(template.id);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Generate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGenerateReportPage;
