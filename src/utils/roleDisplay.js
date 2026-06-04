import { normalizeUserRole } from './normalizeUserRole';

/**
 * Maps backend role values to user-facing labels only.
 * Never use for routes, API payloads, or role comparisons.
 */
function hasCompanyContext(userContext) {
  if (!userContext) return false;
  const companyId =
    userContext.companyId?._id ||
    userContext.companyId?.id ||
    userContext.companyId ||
    userContext.company_id ||
    userContext.company?.id ||
    userContext.company?._id;
  return Boolean(companyId || userContext.company_name);
}

export function formatRoleForDisplay(role, userContext = null) {
  if (!role) {
    if (hasCompanyContext(userContext)) return 'Company user';
    return 'User';
  }
  const r = normalizeUserRole(role);
  if (r === 'agent') return 'Channel partner';
  if (r === 'executive') return 'Executive';
  if (r === 'company_admin') return 'Company admin';
  // Display label kept as "Super admin" even though the code-level role is `admin`.
  if (r === 'admin') return 'Super admin';
  if (r === 'company_user') return 'Company user';
  if (r === 'user') {
    if (hasCompanyContext(userContext)) return 'Company user';
    return 'User';
  }
  return String(role).replace(/_/g, ' ');
}
