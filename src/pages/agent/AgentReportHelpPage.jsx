import React from 'react';
import { AgentLayout } from '../../components/layouts';
import ReportHelpHandlerList from '../../components/reportHelp/ReportHelpHandlerList';

export default function AgentReportHelpPage() {
  return (
    <ReportHelpHandlerList
      Layout={AgentLayout}
      layoutProps={{ activeTab: 'report-help' }}
      accent="green"
      listPath="/agent/report-help"
      detailPathPrefix="/agent/report-help"
      title="Report help requests"
      subtitle="Structured requests from referred clients — review details, request documents, and take action without chat."
      emptyDescription="When clients submit report help requests, they will appear here."
    />
  );
}
