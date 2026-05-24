import { normalizeRoleFromUser } from './normalizeUserRole';

export const isChannelPartner = (user) => {
  if (!user) return false;
  if (normalizeRoleFromUser(user.role) === 'agent') return true;
  if (user.userCategory === 'FAGT') return true;
  if (user.referral_code) return true;
  return false;
};

export const resolveCompanyDisplayName = (user) => {
  if (!user) return null;
  const populated = user.companyId;
  if (populated && typeof populated === 'object' && populated.companyName) {
    return populated.companyName;
  }
  if (user.company_name) return user.company_name;
  const companyId =
    user.companyId?._id || user.companyId?.id || user.companyId || user.company_id;
  return companyId ? user.company_name || null : null;
};

export const userBelongsToCompany = (user) => {
  const companyId =
    user?.companyId?._id || user?.companyId?.id || user?.companyId || user?.company_id;
  return Boolean(companyId);
};
