function last10(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function isPlaceholderEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  return value.endsWith('@phone.customer.finvois') || value.endsWith('@bankmanager.finvois');
}

/**
 * Active customer session covers this lead form when the phone or email
 * on the form matches the signed-in customer. Bank managers still use OTP.
 */
export function customerSessionCoversLeadForm(user, isAuthenticated, form = {}) {
  if (!isAuthenticated || !user) return false;
  if (String(user.role || '').toLowerCase() !== 'customer') return false;

  const formPhone = last10(form.mobileNumber || form.phone);
  const userPhone = last10(user.phone || user.mobile);
  const formEmail = String(form.email || '').trim().toLowerCase();
  const userEmail = String(user.email || '').trim().toLowerCase();

  const phoneMatch = Boolean(formPhone && userPhone && formPhone === userPhone);
  const emailMatch = Boolean(
    formEmail && userEmail && !isPlaceholderEmail(userEmail) && formEmail === userEmail
  );
  return phoneMatch || emailMatch;
}
