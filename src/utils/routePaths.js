/**
 * Canonical client routes per normalized role — use for redirects and Generate header links.
 * Pass a full `user` object when available so inactive-company members resolve to retail paths.
 */
import { normalizeUserRole, effectiveUserRole, isExecutiveRole } from './normalizeUserRole';

function navigationRole(roleOrUser) {
  if (roleOrUser !== null && typeof roleOrUser === 'object' && !Array.isArray(roleOrUser)) {
    return effectiveUserRole(roleOrUser);
  }
  return normalizeUserRole(roleOrUser);
}

/** Bank-scoped executive base: `/executive/sbi` or `/executive/boi`. */
export function executiveBasePath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'boi_executive') return '/executive/boi';
  if (r === 'sbi_executive' || r === 'executive' || isExecutiveRole(r)) return '/executive/sbi';
  return '/executive/sbi';
}

export function executiveDashboardPath(roleOrUser) {
  return `${executiveBasePath(roleOrUser)}/dashboard`;
}

export function executiveReportsPath(roleOrUser) {
  return `${executiveBasePath(roleOrUser)}/reports`;
}

export function executiveDraftsPath(roleOrUser) {
  return `${executiveBasePath(roleOrUser)}/drafts`;
}

export function dashboardHomePath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/dashboard';
  if (r === 'company_user') return '/company/user/dashboard';
  if (r === 'admin') return '/admin/dashboard';
  if (r === 'lead_manager') return '/admin/lead-manager/dashboard';
  if (r === 'msme_dpr_viewer') return '/msme-dpr-dashboard';
  if (r === 'mepma_dpr_viewer') return '/mepma-dpr-dashboard';
  if (r === 'agent') return '/agent/dashboard';
  if (isExecutiveRole(r)) return executiveDashboardPath(roleOrUser);
  if (r === 'department') return '/department/dashboard';
  if (r === 'customer_service') return '/dashboard';
  if (r === 'customer') return '/customer/dashboard';
  return '/dashboard';
}

export function profilePathForRole(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'msme_dpr_viewer') return '/msme-dpr/profile';
  if (r === 'mepma_dpr_viewer') return '/mepma-dpr/profile';
  if (r === 'department') return '/department/profile';
  if (r === 'company_admin') return '/company/profile';
  if (r === 'company_user') return '/company/user/profile';
  if (r === 'admin') return '/admin/profile';
  if (r === 'lead_manager') return '/admin/profile';
  if (r === 'agent') return '/agent/profile';
  if (isExecutiveRole(r)) return `${executiveBasePath(roleOrUser)}/profile`;
  if (r === 'customer') return '/customer/profile';
  return '/profile';
}

export function myReportsPathForRole(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/my-reports';
  if (r === 'company_user') return '/company/user/reports';
  if (r === 'admin') return '/admin/reports';
  if (r === 'agent') return '/agent/reports';
  if (isExecutiveRole(r)) return executiveReportsPath(roleOrUser);
  if (r === 'customer') return '/customer/reports';
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
  if (isExecutiveRole(r)) return executiveDashboardPath(roleOrUser);
  return '/dashboard';
}

/** Theory Pages hub path by role. */
export function theoryPagesHubPath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/theory-pages';
  if (r === 'company_user') return '/company/user/theory-pages';
  if (r === 'admin') return '/admin/theory-pages';
  return '/theory-pages';
}

/** Theory Pages generate wizard path by role. */
export function theoryPagesGeneratePath(roleOrUser) {
  const r = navigationRole(roleOrUser);
  if (r === 'company_admin') return '/company/theory-pages/generate';
  if (r === 'company_user') return '/company/user/theory-pages/generate';
  if (r === 'admin') return '/admin/theory-pages/generate';
  return '/theory-pages/generate';
}
