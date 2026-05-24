import { normalizeRoleFromUser } from './normalizeUserRole';

export const isSelfServicePlatformUser = (user) => {
  if (!user) return false;
  const companyId =
    user.companyId?._id || user.companyId?.id || user.companyId || user.company_id;
  if (companyId) return false;
  const role = normalizeRoleFromUser(user);
  return role === 'user' || role === 'agent';
};

export const resolveSignupApprovalStatus = (user) => {
  const status = user?.signup_approval_status;
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'rejected';
  return 'approved';
};

export const canAccessApplication = (user) =>
  resolveSignupApprovalStatus(user) === 'approved';
