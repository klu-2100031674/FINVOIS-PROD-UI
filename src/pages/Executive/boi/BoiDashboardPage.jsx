import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, FileText, Home as HomeIcon, Briefcase, CheckCircle2 } from 'lucide-react';
import ClientLayout from '../../../components/layouts/ClientLayout';
import { getTemplatesForExecutiveRole } from '../../../utils/executiveTemplates';

const BoiDashboardPage = () => {
  const templates = useMemo(() => getTemplatesForExecutiveRole('boi_executive'), []);

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 font-manrope">BOI Verification Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a Bank of India verification template to fill the form and generate a PDF report.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon =
              template.category === 'Office'
                ? Building2
                : template.category === 'Business'
                  ? Briefcase
                  : template.category === 'Due Diligence'
                    ? FileText
                    : HomeIcon;
            return (
              <Link
                key={template.id}
                to={template.path}
                className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-[#7e22ce] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-purple-50 text-[#7e22ce]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                      Active
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-[#7e22ce] transition-colors">{template.name}</h2>
                  <p className="text-xs font-semibold text-[#7e22ce] mt-0.5">{template.bank} Verification</p>
                  <p className="text-sm text-gray-550 mt-2 line-clamp-2">{template.description}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="inline-flex items-center text-sm font-semibold text-[#7e22ce]">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Open Form
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#7e22ce] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </ClientLayout>
  );
};

export default BoiDashboardPage;
