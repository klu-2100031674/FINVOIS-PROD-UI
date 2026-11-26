# 04 · Wireframes

Visual wireframes (colored) were reviewed and approved by the owner in the design session on 2026-09-30. This file is the text specification of each screen so an agent can build without the images. Widths are for a 360 dp phone. Spacing: 16 dp screen gutter, 8 dp grid. Touch targets ≥ 44 dp.

Status pill colors: Pending/Initiated = amber, Under review/Preparing/With CA = blue, Approved/Generated = green, Rejected = red, Unassigned = amber, Assigned = blue.

## S1 · Login (both roles)
```
┌──────────────────────────┐
│        [logo]            │
│        Finovis           │
│     DPR management       │
│                          │
│ ┌──────────────────────┐ │
│ │ Email                │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Password        (eye)│ │
│ └──────────────────────┘ │
│ [        Sign in       ] │
│  Admin and support staff │
│  only                    │
└──────────────────────────┘
```
States: idle, submitting (button spinner, fields disabled), error text under fields. Keyboard avoids form. No "Forgot password" and no sign-up in v1.

## Admin

Bottom tabs: **Dashboard**, **Reports**, **Requests**, **Profile**.

### A-S2 · Dashboard
```
DPR dashboard                 (bell)
[Report type: All ▾]
┌────────────┐ ┌────────────┐
│ Pending    │ │Under review│
│ 12         │ │ 8          │
└────────────┘ └────────────┘
┌────────────┐ ┌────────────┐
│ Approved   │ │ Rejected   │
│ 431        │ │ 5          │
└────────────┘ └────────────┘
┌──────────────────────────┐
│ Total            456     │
└──────────────────────────┘
Updated 09:41
```
Each card is tappable → Reports tab with that status filter. Skeleton while loading.

### A-S3 · Reports list
```
(back) Pending · 12
[ search name / client ]
[status ▾] [type ▾]
┌──────────────────────────┐
│ Ravi Traders    [Pending]│
│ MSME · 2 May             │
└──────────────────────────┘
… infinite scroll (page/limit)
```

### A-S4 · Report detail
```
(back) Ravi Traders   [Pending]
┌──────────────────────────┐
│ Applicant / client        │
│ Report type, created date │
│ Linked request + handler  │
└──────────────────────────┘
[ View report PDF ]
[ Approve ]   [ Reject ]
[ Mark under review ]
[ Send report ]   (approved only)
```
Buttons shown only in valid states: Approve/Reject/Review when status is pending or under review; Send when approved.

### A-S5 · Requests list (assignment)
```
Requests
[Pending][Assigned][All]
┌──────────────────────────┐
│ Ravi Traders  [Unassigned]│
│ MSME · 2 May             │
│ Sai Foods        [Anita]  │
└──────────────────────────┘
```

### A-S6 · Request detail + Assign sheet
```
(back) Ravi Traders  [Pending]
Applicant, phone, scheme
Handler: none
[ Assign to staff ]
────────── sheet ──────────
Assign to staff
(o) Anita     3 open
(•) Suresh    7 open
(o) Meena     1 open
[ Confirm assign ]
```
When owned: shows handler and **Unassign**. When with CA or generated: no buttons, text "Locked: with CA" / "Report generated".

### S7 · Send report sheet (shared)
```
Send report
Recipients
[x] Me (CA)
[x] Assigned staff · Suresh
[ ] Applicant  (phone/email editable)
Channel
[WhatsApp] [Email]     (toggle chips, ≥1)
[ Send ]
```
Result view after send: list of recipient × channel with Delivered / Failed + reason, and **Retry failed**.

## Agent

Bottom tabs: **My work**, **Profile**.

### G-S8 · My work
```
My work                        (bell)
[ Open 9 | Mine 3 | Done 41 ]
┌──────────────────────────┐
│ Ravi Traders  [Initiated]│
│ MSME · assigned by CA    │
│ Claim expires 12:40      │
└──────────────────────────┘
```

### G-S9 · Request detail
```
(back) Om Textiles  [Generated]
Applicant, phone, email
[ Call ]   [ Messages ]
[ Documents · 4 ]
[ View report PDF ]
[ Send to applicant ]   (approved + paid)
[ Claim ] / [ Release ]  (per state)
```

## Shared screens
- **PDF viewer:** full screen, close button, share button (share sheet on user action only), screen capture blocked (see doc 06).
- **Notification permission rationale:** one screen before the OS prompt: "Get alerts when work is assigned or a report is approved." Buttons: Allow, Not now.
- **Inactivity lock overlay:** blurs content, asks password/biometric.
- **Profile:** name, email, role, app version, Sign out.

## Push alert examples (system UI)
- "New DPR assigned" — Ravi Traders · MSME
- "Report approved" — Om Textiles is ready to send
- "Claim expiring" — Sai Foods releases in 5 min
- "New DPR submitted" (admin) — Tap to view pending requests

Payloads must NOT contain applicant names; the text above is composed on-device after fetching by id, or uses generic wording (see doc 08).
