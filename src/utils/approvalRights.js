import { normalizeRoleFromUser, normalizeUserRole } from './normalizeUserRole';

/**
 * Roles that may be granted Approval Rights (report validation + banker reports).
 */
export const APPROVAL_RIGHTS_ELIGIBLE_ROLES = ['agent', 'customer_service'];

export function isApprovalRightsEligibleRole(role) {
  const r = normalizeUserRole(role);
  return APPROVAL_RIGHTS_ELIGIBLE_ROLES.includes(r);
}

export function isApprovalRightsEligibleUser(user) {
  return isApprovalRightsEligibleRole(normalizeRoleFromUser(user));
}

/**
 * Whether the user currently has Approval Rights.
 */
export function hasApprovalRights(user) {
  if (!isApprovalRightsEligibleUser(user)) return false;
  return user?.approval_rights === true;
}
