/**
 * Canonical client routes per normalized role — use for redirects and Generate header links.
 */
import { normalizeUserRole } from './normalizeUserRole';

export function dashboardHomePath(roleRaw) {
  const r = normalizeUserRole(roleRaw);
  if (r === 'company_admin') return '/company/dashboard';
  if (r === 'company_user') return '/company/user/dashboard';
  if (r === 'admin') return '/admin/dashboard';
  if (r === 'agent') return '/agent/dashboard';
  return '/dashboard';
}

export function profilePathForRole(roleRaw) {
  const r = normalizeUserRole(roleRaw);
  if (r === 'company_admin') return '/company/profile';
  if (r === 'company_user') return '/company/user/profile';
  if (r === 'admin') return '/admin/profile';
  if (r === 'agent') return '/agent/profile';
  return '/profile';
}

export function myReportsPathForRole(roleRaw) {
  const r = normalizeUserRole(roleRaw);
  if (r === 'company_admin') return '/company/my-reports';
  if (r === 'company_user') return '/company/user/reports';
  if (r === 'admin') return '/admin/reports';
  if (r === 'agent') return '/agent/reports';
  return '/reports';
}

/** Where the Excel/generate wizard lives for this role (path prefix for query strings). */
export function generateWizardPath(roleRaw) {
  const r = normalizeUserRole(roleRaw);
  if (r === 'company_user') return '/company/user/generate';
  return '/generate';
}

/** Home path when exiting the generate wizard (“back to dashboard / template picker”). */
export function generateHubLandingPath(roleRaw) {
  const r = normalizeUserRole(roleRaw);
  if (r === 'company_admin') return '/company/generate';
  if (r === 'company_user') return '/company/user/dashboard';
  if (r === 'admin') return '/admin/dashboard';
  if (r === 'agent') return '/agent/dashboard';
  return '/dashboard';
}
