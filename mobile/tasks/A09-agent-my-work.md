# A09 · Agent My work: tabs, claim, release

**Depends on:** A03 · **Read first:** `docs/03-user-flows.md` F5–F6, `docs/04-wireframes.md` G-S8, `docs/10-verified-backend-facts.md`

## Goal
Agents see Open / Mine / Done queues and can claim and release requests.

## Steps
1. Extend `requests.ts` with agent calls: `listQueue(queue)` → `GET /govt-forms/requests?queue=open|assigned|completed`, `counts()` → `GET /govt-forms/requests/counts`, `claim(id)`, `release(id)`.
2. `MyWork` with three tabs and count badges (Open from `counts.open`, Mine from `counts.assigned`, Done list length or a count if provided). Pull-to-refresh, refetch on focus, list of ListRow with workflow StatusPill.
3. Claim countdown: for `claimed`/`assigned` requests without generation started, show time left using `claimedAt + 15 min` (port `claimExpiresAt` semantics from web `dprWorkflowStatus.js`), updating each 30 s; when it hits zero refetch.
4. Claim from detail (A10 finishes the detail); here implement the mutation and list invalidation. Handle "already claimed" 400/409 with a friendly message and list refresh.
5. Release confirmation dialog; disabled when generation started (per workflow).
6. Completed tab supports search text (server `search` param).
7. Tests: countdown calculation, tab-to-queue mapping, claim conflict handling.

## Acceptance checks
- [ ] Open tab lists the same items as the web CS Open queue.
- [ ] Claim moves the item to Mine; release returns it to Open.
- [ ] Two agents claiming the same item: only one succeeds, the other sees the friendly message.
- [ ] Countdown reaches zero and the item disappears from Mine after refetch (server auto-unclaim).

## Do not
- Build the report-generation UI or start-generation calls.
