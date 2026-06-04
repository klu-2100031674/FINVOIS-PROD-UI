import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, FileText, Home as HomeIcon, Briefcase, CheckCircle2 } from 'lucide-react';
import ClientLayout from '../../components/layouts/ClientLayout';
import { EXECUTIVE_TEMPLATES } from '../../utils/executiveTemplates';
import { executiveAPI } from '../../api/executiveAPI';

const ExecutiveDashboardPage = () => {
  const [sbiLogoUrl, setSbiLogoUrl] = useState('');

  useEffect(() => {
    let sbiUrl = '';
    (async () => {
      try {
        sbiUrl = await executiveAPI.fetchLogoBlobUrl('sbi');
        setSbiLogoUrl(sbiUrl);
      } catch (err) {
        console.error('Could not load SBI logo on dashboard', err);
      }
    })();
    return () => {
      if (sbiUrl) URL.revokeObjectURL(sbiUrl);
    };
  }, []);

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header and Branding section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-manrope">Verification Templates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select a verification template to fill the form and generate a PDF report.
            </p>
          </div>
          {sbiLogoUrl && (
            <div className="flex items-center gap-3 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 shadow-xs self-stretch sm:self-auto justify-center sm:justify-start">
              <div className="flex items-center justify-center h-10 w-24 shrink-0">
                <img src={sbiLogoUrl} alt="SBI Logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="text-left border-l pl-3 border-purple-200">
                <span className="block text-[9px] uppercase font-bold text-blue-600 tracking-wider">State Bank of India</span>
                <span className="block text-xs font-semibold text-purple-700">Official Verification Partner</span>
              </div>
            </div>
          )}
        </div>

        {/* Templates Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXECUTIVE_TEMPLATES.map((template) => {
            const Icon = template.category === 'Office' ? Building2 : template.category === 'Business' ? Briefcase : HomeIcon;
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

export default ExecutiveDashboardPage;
