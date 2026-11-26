import { api } from './client';

// Reuses the web's admin routes: GET /users and PATCH /system-config/users/:id/free-reports.
// The server emails the user when credits go up.

export interface CreditUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  free_reports_count?: number;
}

export const creditKeys = { users: ['free-credits', 'users'] as const };

export const ROLE_LABELS: Record<string, string> = {
  agent: 'Channel partner',
  customer: 'User',
  customer_service: 'Customer service',
  executive: 'Executive',
  company_admin: 'Company admin',
};

export const roleLabel = (role: string) => ROLE_LABELS[role] ?? role.replace(/_/g, ' ');

/** Everyone except admins: channel partners, users and staff. */
export async function listCreditUsers(): Promise<CreditUser[]> {
  const { data } = await api.get<{ success: boolean; data: CreditUser[] }>('/users');
  if (!Array.isArray(data?.data)) throw new Error('Unexpected users response');
  return data.data.filter((u) => u.role !== 'admin' && u.role !== 'super_admin');
}

/** Sets the total free report count (not an increment), same as the web Free Credits page. */
export async function setFreeCredits(userId: string, count: number): Promise<void> {
  if (!Number.isInteger(count) || count < 0) throw new Error('Enter a whole number, 0 or more.');
  await api.patch(`/system-config/users/${userId}/free-reports`, { count });
}
