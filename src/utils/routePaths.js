/**
 * Canonical client routes per normalized role — use for redirects and Generate header links.
 * Pass a full `user` object when available so inactive-company members resolve to retail paths.
 */
import { normalizeUserRole, effectiveUserRole } from './normalizeUserRole';

function navigationRole(roleOrUser) {
  if (roleOrUser !== null && typeof roleOrUser === 'object' && !Array.isArray(roleOrUser)) {
    return effectiveUserRole(roleOrUser);
  }
  return normalizeUserRole(roleOrUser);
}

export function dashboardHomePath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/dashboard';
  if (r === 'company_user') return '/company/user/dashboard';
  if (r === 'admin') return '/admin/dashboard';
  if (r === 'lead_manager') return '/admin/lead-manager/dashboard';
  if (r === 'msme_dpr_viewer') return '/msme-dpr-dashboard';
  if (r === 'agent') return '/agent/dashboard';
  if (r === 'executive') return '/executive/dashboard';
  return '/dashboard';
}

export function profilePathForRole(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'msme_dpr_viewer') return '/msme-dpr-dashboard';
  if (r === 'company_admin') return '/company/profile';
  if (r === 'company_user') return '/company/user/profile';
  if (r === 'admin') return '/admin/profile';
  if (r === 'lead_manager') return '/admin/profile';
  if (r === 'agent') return '/agent/profile';
  if (r === 'executive') return '/executive/profile';
  return '/profile';
}

export function myReportsPathForRole(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/my-reports';
  if (r === 'company_user') return '/company/user/reports';
  if (r === 'admin') return '/admin/reports';
  if (r === 'agent') return '/agent/reports';
  if (r === 'executive') return '/executive/reports';
  return '/reports';
}

/** Where the Excel/generate wizard lives for this role (path prefix for query strings). */
export function generateWizardPath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_user') return '/company/user/generate';
  return '/generate';
}

/** Home path when exiting the generate wizard (“back to dashboard / template picker”). */
export function generateHubLandingPath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/generate';
  if (r === 'company_user') return '/company/user/dashboard';
  if (r === 'admin') return '/admin/dashboard';
  if (r === 'agent') return '/agent/dashboard';
  if (r === 'executive') return '/executive/dashboard';
  return '/dashboard';
}
