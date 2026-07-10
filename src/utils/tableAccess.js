import { normalizeUserRole } from './normalizeUserRole';

/**
 * Whether the user may view Stage1 financials sheet.
 * Non-user roles always have access. role=user requires table_access === true.
 */
export function hasTableAccess(user) {
  const role = normalizeUserRole(user?.role);
  if (role !== 'user') return true;
  return user?.table_access === true;
}
