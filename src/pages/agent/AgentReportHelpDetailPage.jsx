import React from 'react';
import { AgentLayout } from '../../components/layouts';
import ReportHelpHandlerDetail from '../../components/reportHelp/ReportHelpHandlerDetail';

export default function AgentReportHelpDetailPage() {
  return (
    <ReportHelpHandlerDetail
      Layout={AgentLayout}
      layoutProps={{ activeTab: 'report-help' }}
      accent="green"
      listPath="/agent/report-help"
      typeAccentClass="text-emerald-700"
      buildGeneratePath={(clientUserId, reportHelpId) => {
        const params = new URLSearchParams();
        if (clientUserId) params.set('assistedUserId', String(clientUserId));
        params.set('reportHelpId', reportHelpId);
        return `/agent/generate?${params.toString()}`;
      }}
      buildReportsLink={(clientUserId, userName) => ({
        to: `/agent/referrals/${clientUserId}/reports`,
        state: { userName },
        label: 'View client reports',
      })}
    />
  );
}
