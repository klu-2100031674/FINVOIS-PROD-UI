import type { Page, Route } from '@playwright/test';

export const ADMIN = { id: 'a1', name: 'Test CA', email: 'ca@test.com', role: 'admin' };
export const AGENT = { id: 'g1', name: 'Test Agent', email: 'agent@test.com', role: 'customer_service' };

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

export interface MockOptions {
  loginStatus?: number;
  loginBody?: unknown;
  user?: typeof ADMIN | typeof AGENT;
  refreshStatus?: number;
}

/** Mocks every /mobile/auth/* call and records what the app sent. */
export async function mockAuth(page: Page, opts: MockOptions = {}) {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const user = opts.user ?? ADMIN;

  await page.route('**/mobile/auth/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.split('/mobile/auth/')[1];
    const body = (req.postDataJSON?.() ?? {}) as Record<string, unknown>;
    calls.push({ path, body });

    if (path === 'login') {
      const status = opts.loginStatus ?? 200;
      if (status !== 200) return json(route, status, opts.loginBody ?? { success: false, error: 'Invalid credentials' });
      return json(route, 200, { success: true, user, accessToken: 'access-1', refreshToken: 'refresh-1' });
    }
    if (path === 'refresh') {
      const status = opts.refreshStatus ?? 200;
      if (status !== 200) return json(route, status, { success: false, error: 'Your session ended. Sign in again.' });
      return json(route, 200, { success: true, accessToken: 'access-2', refreshToken: 'refresh-2' });
    }
    if (path === 'logout') return json(route, 200, { success: true });
    return json(route, 404, { success: false });
  });

  return calls;
}

export async function fillLogin(page: Page, email = 'ca@test.com', password = 'not-a-real-password') {
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-button').click();
}
