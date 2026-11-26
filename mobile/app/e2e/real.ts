import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

/**
 * Helpers for tests that run against the REAL Express API on an in-memory MongoDB
 * (FINVOIS-DEV-API/scripts/mobile-e2e-server.js). Accounts are throwaway values that exist
 * only inside that database. Never point these tests at a remote server.
 */
export interface E2eState {
  password: string;
  accounts: { admin: string; agents: string[]; partner: string; inactive: string };
  ids: {
    admin: string;
    anita: string;
    suresh: string;
    meena: string;
    reports: Record<string, string>;
    requests: Record<string, string>;
  };
}

export const apiBase = (info: TestInfo): string => String(info.config.metadata.apiBase);

export async function resetDb(request: APIRequestContext, info: TestInfo): Promise<E2eState> {
  const res = await request.post(`${apiBase(info)}/__e2e/reset`);
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as E2eState;
}

export async function sent(request: APIRequestContext, info: TestInfo) {
  return (await (await request.get(`${apiBase(info)}/__e2e/sent`)).json()) as {
    channel: 'email' | 'whatsapp';
    to: string;
    title?: string;
    bytes: number;
  }[];
}

export async function pushes(request: APIRequestContext, info: TestInfo) {
  return (await (await request.get(`${apiBase(info)}/__e2e/pushes`)).json()) as {
    to: string;
    title: string;
    body: string;
    data: { type: string; id: string };
  }[];
}

export async function dbUpdate(
  request: APIRequestContext,
  info: TestInfo,
  model: string,
  filter: Record<string, unknown>,
  update: Record<string, unknown>
) {
  const res = await request.post(`${apiBase(info)}/__e2e/update`, { data: { model, filter, update } });
  expect(res.ok()).toBeTruthy();
}

export async function failNext(request: APIRequestContext, info: TestInfo, channel: 'mail' | 'whatsapp') {
  await request.post(`${apiBase(info)}/__e2e/fail-next`, { data: { channel } });
}

/** Signs in through the real login screen with a seeded account. */
export async function loginAs(page: Page, state: E2eState, email: string) {
  await page.goto('/');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(state.password);
  await page.getByTestId('login-button').click();
}

export async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: false });
}

/** Signs in through the mobile API (not the UI) and returns tokens, for arranging or checking state. */
export async function apiLogin(request: APIRequestContext, info: TestInfo, email: string, password: string) {
  const res = await request.post(`${apiBase(info)}/api/mobile/auth/login`, {
    data: { email, password, deviceId: `e2e-${email}`, platform: 'android', appVersion: '1.0.0' },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
  return body;
}

/** Authenticated call against the real API from the test side. */
export async function apiCall(
  request: APIRequestContext,
  info: TestInfo,
  token: string,
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  path: string,
  data?: unknown
) {
  const res = await request[method](`${apiBase(info)}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    ...(data === undefined ? {} : { data }),
  });
  return { status: res.status(), body: await res.json().catch(() => null) };
}
