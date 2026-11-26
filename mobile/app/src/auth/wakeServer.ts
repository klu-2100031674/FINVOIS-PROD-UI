// Same flow as the web AuthPage: the API runs on an Azure VM that is stopped when idle, so sign-in first
// asks the StartVm Azure Function to start it and polls until the function reports "running".
// Skipped when the URL or key is not set (local API, e2e) so nothing else changes.
// ponytail: the function key ships in the app bundle, exactly as it does in the web bundle. Move the
// call behind a keyless endpoint if that key must stay private.

const START_URL = process.env.EXPO_PUBLIC_VM_START_URL ?? '';
const FUNCTION_KEY = process.env.EXPO_PUBLIC_VM_FUNCTION_KEY ?? '';

export const WAKE_ATTEMPTS = 12;
export const WAKE_DELAY_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const wakeConfigured = (url = START_URL, key = FUNCTION_KEY) => Boolean(url && key);

async function startVm(url: string, key: string): Promise<string | undefined> {
  const res = await fetch(`${url}?code=${encodeURIComponent(key)}`, { method: 'POST' });
  const data = (await res.json().catch(() => null)) as { status?: string } | null;
  if (!res.ok) throw new Error(`StartVm responded ${res.status}`);
  return data?.status;
}

/** True once the VM is running (or wake-up is not configured). False after every attempt failed. */
export async function ensureServerAwake({
  url = START_URL,
  key = FUNCTION_KEY,
  attempts = WAKE_ATTEMPTS,
  delayMs = WAKE_DELAY_MS,
}: { url?: string; key?: string; attempts?: number; delayMs?: number } = {}): Promise<boolean> {
  if (!wakeConfigured(url, key)) return true;
  for (let i = 0; i < attempts; i += 1) {
    try {
      if ((await startVm(url, key)) === 'running') return true;
    } catch {
      // network blip or the function itself cold-starting: retry like the web does
    }
    if (i < attempts - 1) await sleep(delayMs);
  }
  return false;
}
