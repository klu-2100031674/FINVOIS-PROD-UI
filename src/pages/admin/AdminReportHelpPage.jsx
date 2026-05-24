import React from 'react';
import { AdminLayout } from '../../components/layouts';
import ReportHelpHandlerList from '../../components/reportHelp/ReportHelpHandlerList';

export default function AdminReportHelpPage() {
  return (
    <ReportHelpHandlerList
      Layout={AdminLayout}
      accent="purple"
      listPath="/admin/report-help"
      detailPathPrefix="/admin/report-help"
      title="Platform report help"
      subtitle="Requests from users, company users, and company admins without a channel partner — review, request documents, and generate reports on their behalf."
      emptyDescription="When clients submit report help to Finvois support, requests will appear here."
    />
  );
}
