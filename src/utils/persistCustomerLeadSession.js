import { setAuthToken } from '@/api/api';
import { setAuthData } from '@/store/slices/authSlice';

export function extractLeadFormAuth(resData) {
  if (!resData || typeof resData !== 'object') return null;
  const token = resData.token || resData.data?.token;
  const user = resData.user || resData.data?.user;
  if (!token || !user) return null;
  return { token, user };
}

export function persistCustomerLeadSession(dispatch, resData) {
  const auth = extractLeadFormAuth(resData);
  if (!auth) return false;
  const user = {
    ...auth.user,
    role: auth.user.role || 'customer',
    mobile: auth.user.phone || auth.user.mobile,
    email_verified: auth.user.email_verified !== false,
    signup_approval_status: auth.user.signup_approval_status || 'approved',
  };
  setAuthToken(auth.token);
  dispatch(setAuthData({ token: auth.token, user }));
  return true;
}
