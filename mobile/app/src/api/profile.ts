import { api } from './client';

export interface Profile {
  must_change_password?: boolean;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await api.get<{ data: Profile }>('/users/profile');
  return data.data;
}

/** Changing your own password. The server checks the current one and then ends every phone session. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/users/password', { current_password: currentPassword, new_password: newPassword });
}

/** Replacing a temporary password on first sign-in. The server only allows this for the signed-in user. */
export async function setFirstPassword(newPassword: string): Promise<void> {
  await api.post('/users/change-password', { newPassword });
}

/** The rule the web's Set Your Password page and POST /users/change-password apply. Null when the password passes. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  return null;
}
