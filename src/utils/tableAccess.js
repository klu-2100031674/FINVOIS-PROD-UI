import { normalizeRoleFromUser, normalizeUserRole } from './normalizeUserRole';

/**
 * Roles that require Validation Rights (table_access === true)
 * to view Stage 1 financials. All other roles always have access.
 */
export const TABLE_ACCESS_ELIGIBLE_ROLES = [
  'user',
  'company_user',
  'company_admin',
  'agent',
  'customer',
  'customer_service',
];

export function isTableAccessEligibleRole(role) {
  const r = normalizeUserRole(role);
  return TABLE_ACCESS_ELIGIBLE_ROLES.includes(r);
}

/**
 * Whether this account is in a role that can be gated / request Validation Rights.
 */
export function isTableAccessEligibleUser(user) {
  return isTableAccessEligibleRole(normalizeRoleFromUser(user));
}

/**
 * Whether the user may view Stage1 financials sheet (Validation Rights).
 * Eligible roles require table_access === true; others always have access.
 */
export function hasTableAccess(user) {
  if (!isTableAccessEligibleUser(user)) return true;
  return user?.table_access === true;
}
