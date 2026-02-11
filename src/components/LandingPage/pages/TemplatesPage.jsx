import React from 'react';
import GenericPage from './GenericPage';
import { FileText, Download } from 'lucide-react';

const templates = [
    { title: "CC1: Cash Credit Assessment", category: "Working Capital", downloads: "5k+" },
    { title: "CC2: Enhanced Cash Credit", category: "Working Capital", downloads: "3.8k+" },
    { title: "CC3: CC Review & Renewal", category: "Working Capital", downloads: "4.2k+" },
    { title: "CC4: Quarterly Assessment", category: "Working Capital", downloads: "2.1k+" },
    { title: "CC5: Ad-hoc Limit", category: "Working Capital", downloads: "1.5k+" },
    { title: "Term Loan (With Stock)", category: "Manufacturing", downloads: "6.5k+" },
    { title: "Term Loan (No Stock)", category: "Manufacturing", downloads: "5.3k+" },
    { title: "Term Loan + Cash Credit", category: "Composite", downloads: "8.1k+" },
];

const TemplatesPage = () => {
    return (
        <GenericPage
            title="Project Report Templates"
            subtitle="Browse our collection of pre-approved project report templates for various industries."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                        <div className="h-40 bg-gray-100 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-50 to-blue-50 opacity-50" />
                            <FileText className="w-12 h-12 text-gray-400 group-hover:text-purple-600 transition-colors duration-300" />
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                {template.category}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Download className="w-3 h-3" />
                                {template.downloads}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 font-manrope mb-2 group-hover:text-purple-700 transition-colors">
                            {template.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Comprehensive DPR template compliant with bank standards.
                        </p>
                        <button className="w-full py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:border-purple-600 hover:text-purple-600 transition-all">
                            View Template
                        </button>
                    </div>
                ))}
            </div>
        </GenericPage>
    );
};

export default TemplatesPage;
