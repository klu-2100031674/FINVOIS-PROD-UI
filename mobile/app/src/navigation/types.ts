import type { NavigatorScreenParams } from '@react-navigation/native';

export type ReportStatusFilter = 'pending_validation' | 'under_review' | 'approved' | 'rejected';

export type EmailTab = 'sent' | 'schedule' | 'data' | 'templates';

export type EmailTabParams = { tab?: EmailTab; notice?: string } | undefined;

export type AdminTabParamList = {
  Dashboard: undefined;
  Reports: { status?: ReportStatusFilter; reportType?: string } | undefined;
  Requests: { filter?: 'pending' | 'assigned' | 'all' } | undefined;
  Enquiries: undefined;
  Email: EmailTabParams;
  Profile: undefined;
};

export type AgentTabParamList = {
  'My work': { tab?: 'open' | 'mine' | 'active' | 'done' } | undefined;
  Enquiries: undefined;
  Email: EmailTabParams;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Admin: NavigatorScreenParams<AdminTabParamList> | undefined;
  Agent: NavigatorScreenParams<AgentTabParamList> | undefined;
  ReportDetail: { reportId: string };
  AdminRequestDetail: { requestId: string };
  AgentRequestDetail: { requestId: string };
  AgentDocuments: { requestId: string };
  AgentMessages: { requestId: string };
  RequestForm: { requestId: string };
  EmailRequestDetail: { requestId: string };
  EmailFolder: { folderId: string };
  EmailSchedule: { requestId?: string; pickedTemplateId?: string };
  EmailTemplateForm: { templateId?: string; columns?: { key: string; label: string }[]; returnToSchedule?: boolean };
  PdfViewer: { source: 'admin-report' | 'request-report'; id: string; title?: string };
  EnquiryDetail: { enquiryId: string };
  FreeCredits: undefined;
};
