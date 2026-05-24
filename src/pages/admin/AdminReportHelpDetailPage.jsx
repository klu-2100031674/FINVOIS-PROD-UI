import React from 'react';
import { AdminLayout } from '../../components/layouts';
import ReportHelpHandlerDetail from '../../components/reportHelp/ReportHelpHandlerDetail';

export default function AdminReportHelpDetailPage() {
  return (
    <ReportHelpHandlerDetail
      Layout={AdminLayout}
      accent="purple"
      listPath="/admin/report-help"
      typeAccentClass="text-[#7e22ce]"
      buildGeneratePath={(clientUserId, reportHelpId) => {
        const params = new URLSearchParams();
        if (clientUserId) params.set('assistedUserId', String(clientUserId));
        params.set('reportHelpId', reportHelpId);
        return `/admin/generate?${params.toString()}`;
      }}
      buildReportsLink={() => ({
        to: '/admin/reports',
        label: 'View in report validation',
      })}
    />
  );
}
