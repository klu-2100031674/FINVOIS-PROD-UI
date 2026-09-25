export type SalesRole = 'manager' | 'executive';

export type ClientStage =
  | 'Available'
  | 'Assigned'
  | 'Contacted'
  | 'Interested'
  | 'Follow-Up'
  | 'Negotiation'
  | 'Converted'
  | 'Rejected';

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'demo'
  | 'follow_up'
  | 'note'
  | 'whatsapp'
  | 'sms';

export type FollowUpStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RejectionReason =
  | 'not_interested'
  | 'budget_constraint'
  | 'competitor_chosen'
  | 'wrong_contact'
  | 'duplicate'
  | 'no_response'
  | 'other';

export interface SalesUser {
  id: string;
  name: string;
  email: string;
  role: SalesRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SalesClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  city?: string;
  state?: string;
  source?: string;
  stage: ClientStage;
  priority: Priority;
  assignedTo?: SalesUser;
  rejectionReason?: RejectionReason;
  rejectionNote?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  convertedAt?: string;
}

export interface SalesActivity {
  id: string;
  clientId: string;
  executiveId: string;
  executiveName: string;
  type: ActivityType;
  note: string;
  createdAt: string;
}

export interface SalesFollowUp {
  id: string;
  clientId: string;
  client: Pick<SalesClient, 'id' | 'name' | 'phone' | 'company' | 'stage'>;
  executiveId: string;
  executiveName: string;
  scheduledAt: string;
  note?: string;
  status: FollowUpStatus;
  completedAt?: string;
  createdAt: string;
}

// ---- API response shapes ----

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface KpiStats {
  totalClients: number;
  converted: number;
  conversionRate: number;
  activeExecutives: number;
  pendingFollowUps: number;
  todayActivities: number;
}

export interface DailyConversion {
  date: string;
  converted: number;
  contacted: number;
}

export interface ExecutiveStats {
  totalAssigned: number;
  converted: number;
  rejected: number;
  inProgress: number;
  conversionRate: number;
  todayActivities: number;
  overdueFollowUps: number;
}

export interface UploadResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; phone: string; reason: string }>;
}

export interface LoginResponse {
  token: string;
  user: SalesUser;
}
