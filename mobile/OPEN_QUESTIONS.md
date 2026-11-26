# Open Questions

Ask the owner. Do not guess. Move an item to `DECISIONS.md` once answered.

| # | Question | Blocks | Recommendation |
|---|---|---|---|
| Q1 | The admin "Pending" count (`pending_validation` reports awaiting CA) and the assign action (works on **DepartmentRequests** that have no staff owner) are different objects. A request with no report yet never appears in `/admin-reports`. Proposed: admin gets a separate **Requests** tab (unassigned/assigned requests, from `/govt-forms/requests`) for assigning, and the **Reports** tab for approve/reject/send. Confirm. | Tasks A05, A06 | Accept the two-tab design (already reflected in docs) |
| Q2 | Should a user be forced to sign in again after N minutes of inactivity? | Task A11 | 10 minutes background timeout, biometric unlock optional |
| Q3 | Public Play Store listing or private/internal distribution? Login-only app; affects listing text and review. | Task A12 | Public listing with login required, plus internal test track first |
| Q4 | Who owns the privacy-policy URL and support email required by the stores? | Task A12 | Owner supplies both before A12 |
| Q5 | Root/jailbreak handling: warn only, or block admin actions on a compromised device? | Task A11 | Warn, log server-side, block only sending reports |
| Q6 | Push provider: Expo Push Service (simplest) vs direct FCM/APNs. | Task B05 | Expo Push Service, with FCM V1 + APNs keys configured in EAS |
| Q8 | The web approve/reject endpoints email the report owner by default (`send_email=true`). Should mobile approve/reject keep that default? | Task A06 | Keep the web default |
| Q7 | Does the same person ever hold both roles? The app assumes one role per account. | Task A03 | One role per account |
