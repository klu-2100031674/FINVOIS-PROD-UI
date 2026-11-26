import { useEffect, useMemo, useRef, useState } from 'react';
import { CLAIM_TICK_MS, claimExpiresAt, type ClaimFields } from '~/utils/claim';

// The server's expiry job runs every 15 s, so a claim that is past its time may still be listed for a moment.
export const EXPIRY_RETRY_MS = 15_000;
// Lets the server clock and ours agree that the claim has really run out before asking again.
const EXPIRY_GRACE_MS = 500;

/**
 * Returns "now", refreshed every 30 s while any request has a claim timer, so countdown text stays current.
 * `onExpire` runs when the earliest timer reaches zero (and every 15 s after that while the server still lists it),
 * which is when the caller should refetch: the server has returned the request to Open.
 */
export function useClaimClock(requests: ClaimFields[], onExpire: () => void, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  const [attempt, setAttempt] = useState(0);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const expiries = useMemo(
    () => requests.map((r) => claimExpiresAt(r)?.getTime()).filter((t): t is number => t !== undefined),
    [requests]
  );
  const next = expiries.length ? Math.min(...expiries) : null;

  useEffect(() => {
    if (!active || next === null) return;
    const refresh = () => setNow(Date.now());
    // A timer may start long after mount (a claim made later), so do not wait 30 s for the first correct "now".
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, CLAIM_TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active, next]);

  useEffect(() => {
    if (!active || next === null) return;
    const wait = next - Date.now();
    const id = setTimeout(
      () => {
        setNow(Date.now());
        onExpireRef.current();
        setAttempt((n) => n + 1);
      },
      wait > 0 ? wait + EXPIRY_GRACE_MS : EXPIRY_RETRY_MS
    );
    return () => clearTimeout(id);
  }, [active, next, attempt]);

  return now;
}
