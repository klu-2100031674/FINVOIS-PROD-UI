export function normalizeUserRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (['company admin', 'company-admin', 'companyadmin'].includes(normalized)) {
    return 'company_admin';
  }
  if (['company user', 'company-user', 'companyuser', 'company_user'].includes(normalized)) {
    return 'company_user';
  }
  if (normalized === 'super_admin') return 'admin';
  return normalized;
}

function hasOrgCompanyId(user) {
  if (!user || typeof user !== 'object') return false;
  const cid =
    user.companyId?._id ||
    user.companyId?.id ||
    user.companyId ||
    user.company_id;
  return Boolean(cid);
}

/**
 * Applies string normalization plus infers `company_user` when the API still sends `role: "user"` for company members.
 */
export function normalizeRoleFromUser(user) {
  let r = normalizeUserRole(user?.role);
  if (r === 'user' && hasOrgCompanyId(user)) {
    return 'company_user';
  }
  return r;
}
