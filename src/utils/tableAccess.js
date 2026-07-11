import { normalizeUserRole } from './normalizeUserRole';

/**
 * Whether the user may view Stage1 financials sheet.
 * Temporarily: all users have Table access. Restore gate below when needed.
 */
export function hasTableAccess(user) {
  return true;
  // const role = normalizeUserRole(user?.role);
  // if (role !== 'user') return true;
  // return user?.table_access === true;
}
