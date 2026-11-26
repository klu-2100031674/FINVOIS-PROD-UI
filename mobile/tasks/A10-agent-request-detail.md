# A10 · Agent request detail: documents, messages, call, send

**Depends on:** A09, A08 · **Read first:** `docs/03-user-flows.md` F7–F8, `docs/04-wireframes.md` G-S9, `docs/06-security-architecture.md` §5–§6

## Goal
Agents work a request from their phone and deliver the finished report.

## Steps
1. API: `requests.get(id)`, `documents(id)` → `GET …/documents`, `messages(id)` and `postMessage(id, body)` → `GET/POST …/messages`, agent report PDF → `GET …/report/pdf`. Read the exact response shapes in `govtForms.js` and the referenced controllers before typing.
2. `RequestDetail` (agent): applicant card, **Call** via `Linking.openURL('tel:…')`, WhatsApp link `https://wa.me/<digits>` (opens the WhatsApp app; no permissions), Documents list, Messages thread with composer, PDF view (approved only), Claim/Release per state, **Send to applicant** when workflow is `generated` (uses A08 with Applicant preselected).
3. Documents: list names/types; open through download to cache dir + system viewer, delete after; screen-capture blocked on document viewer.
4. Messages: newest at bottom, optimistic send with rollback on failure, max length matching web limit (check the route), polling every 30 s while the screen is focused (no websockets).
5. Report generation status only: show workflow timeline Initiated → Preparing → With CA → Generated; add text "Report is created on the web."
6. Deep-link entry: route param `requestId`; if 403/404 show "You don't have access to this request."
7. Tests: send button visibility per workflow, message optimistic rollback, tel link builder, access-denied state.

## Acceptance checks
- [ ] Call opens the dialer with the right number; WhatsApp link opens chat.
- [ ] Documents open and cached copies are removed after closing.
- [ ] Messages sent from the app appear in the web request messages and vice versa.
- [ ] Send to applicant works only after CA approval + payment; blocked messages match the server text.
- [ ] Opening another agent's request by id (via deep link) shows the access message and no data.

## Do not
- Add camera/file-upload permissions (uploads are out of scope in v1).
