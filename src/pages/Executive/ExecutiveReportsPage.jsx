import React from 'react';
import { Link } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import ExecutiveReportsList from '../../components/executive/ExecutiveReportsList';

const ExecutiveReportsPage = () => {
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-manrope">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and download PDF reports you have generated.
            </p>
          </div>
          <Link
            to="/executive/dashboard"
            className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-sm font-medium text-[#7e22ce] border border-[#7e22ce] rounded-lg hover:bg-purple-50 shrink-0"
          >
            New report
          </Link>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <ExecutiveReportsList />
        </section>
      </div>
    </ClientLayout>
  );
};

export default ExecutiveReportsPage;
