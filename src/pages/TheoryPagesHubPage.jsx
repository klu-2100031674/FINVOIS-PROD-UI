/**
 * Theory Pages hub — 4 sector templates (Manufacturing / Trading / Service).
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Sparkles, Factory, Store, Package, Wrench } from 'lucide-react';
import { AdminLayout } from '../components/layouts';
import ClientLayout from '../components/layouts/ClientLayout';
import { getTheoryPageTemplates } from '../utils/theoryPageTemplates';
import { effectiveUserRole } from '../utils/normalizeUserRole';
import { useAuth } from '../hooks';
import { theoryPagesGeneratePath } from '../utils/routePaths';

const CATEGORY_ICONS = {
  manufacturing: Factory,
  trading: Store,
  service_with_stock: Package,
  service_without_stock: Wrench,
};

const TheoryPagesHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = effectiveUserRole(user);
  const [searchQuery, setSearchQuery] = useState('');

  const useAdminLayout = role === 'admin' || role === 'company_admin';
  const templates = useMemo(() => getTheoryPageTemplates(), []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const handleSelect = (templateId) => {
    const params = new URLSearchParams({ templateId, newDraft: '1' });
    if (role === 'admin') params.set('admin', 'true');
    navigate(`${theoryPagesGeneratePath(user)}?${params.toString()}`);
  };

  const body = (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Theory Pages</h1>
            <p className="text-gray-500">
              Choose a business sector, fill General Information and Project Profile, then generate
              AI theory pages. Excel templates are not included.
            </p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-800 rounded-lg text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          AI-generated pages only — submitted for CA validation like reports
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-gray-800 placeholder-gray-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((template) => {
          const Icon = CATEGORY_ICONS[template.category] || BookOpen;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template.id)}
              className="text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-teal-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-6 h-6 text-teal-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-teal-800 font-['Manrope'] text-lg">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 mb-3">{template.description}</p>
                  <span className="text-xs text-teal-700 font-medium">Continue →</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">No theory templates match your search.</div>
      )}
    </div>
  );

  if (useAdminLayout) {
    return <AdminLayout>{body}</AdminLayout>;
  }
  return <ClientLayout>{body}</ClientLayout>;
};

export default TheoryPagesHubPage;
