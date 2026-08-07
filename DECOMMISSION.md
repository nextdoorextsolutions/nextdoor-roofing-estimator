# Decommissioning the standalone estimator backend

The estimator SPA now talks to the **main ndespanels CRM backend**. Its own
Render service and MySQL database are no longer in the request path and should
be shut down — but nothing here deletes infrastructure. The manual steps are
listed for the owner at the bottom; do them in that order, and only after
cutover is verified.

## What changed in this repo

| Before | After |
|---|---|
| `trpc.geocode` / `trpc.getRoofData` (flat, standalone backend) | `trpc.crm.getRoofData` (one call: geocode + Solar + guard) |
| `trpc.submitLead` / `trpc.requestManualQuote` | `trpc.crm.submitEstimatorLead` (both paths) |
| Pricing computed in the browser | Computed in the backend; the client renders |
| Lead email sent from the browser via EmailJS | Owner alert + homeowner confirmation sent server-side |
| One failure branch ("manual quote") | Four states: OK / NO_DATA / UPSTREAM_ERROR / BAD_INPUT |
| `/admin` reading MySQL | Redirect notice → the CRM |

`client/src/lib/emailjs.ts` was deleted. The `@emailjs/browser` dependency is
still in `package.json`; it is unused and can go at the next dependency pass.

`vercel.json` already proxies `/api/trpc` → `https://www.ndespanels.com/api/trpc`.
That target was wrong before (the procedures live under `crm.*`, so flat paths
404'd); it is correct now. No change needed.

## Still referencing the retired backend

These are inert after cutover but are left in place deliberately, so the
shutdown is a decision rather than a surprise:

- `client/src/pages/AdminDashboard.tsx` — calls `trpc.admin.getLeadsWithEstimates`,
  `updateLeadStatus`, `updateLeadNotes`, `deleteLead`. All MySQL-backed on the
  old service. **The route no longer points here** (`App.tsx` → `AdminMoved`).
  Delete the file once the Render service is gone.
- `client/src/_core/hooks/useAuth.ts` + `client/src/components/DashboardLayout.tsx`
  — only used by `AdminDashboard`. Same disposition.
- `server/` (the whole directory) — `routers.ts`, `db.ts` (drizzle **mysql2**),
  `_core/`. Nothing in the SPA calls it any more.
- `drizzle/` — the MySQL `leads` / `estimates` schema and its three migrations.
  This is the second lead store; estimator leads now live in the CRM's
  `report_requests`.
- `render.yaml` — the deploy config for the service being retired.

## Data check before shutdown

The old MySQL `leads` / `estimates` tables may hold leads that never reached the
CRM. Check before deleting the database:

```sql
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM estimates;
SELECT MIN(created_at), MAX(created_at) FROM leads;
```

Anything in there is a customer who asked us for a quote. If the count is
non-zero, export it and import into `report_requests` with
`lead_source = 'estimator'` before dropping anything.

## Manual steps for the owner

1. **Verify cutover on the Vercel preview** — run the acceptance tests in the
   build brief against the preview URL before touching production.
2. **Confirm `GOOGLE_SOLAR_KEY` is set on the main backend's Render service**,
   with the Solar API enabled for that key in Google Cloud. This is root cause
   #3 of the original failure: the retired service required a Solar key its
   deploy config never declared. The new code fails loudly (`UPSTREAM_ERROR`,
   stage `config`) instead of reporting a coverage miss, so a missing key is now
   visible — but it is still an outage.
3. **Set `ESTIMATOR_LEAD_ALERT_EMAIL`** on the main backend, or lead alerts fall
   back to `EMAIL_FROM`.
4. **Watch the first day of production leads** — confirm rows appear in
   `report_requests` with `lead_source='estimator'` and a populated
   `measurement_source`.
5. **Export the old MySQL data** (query above), if any.
6. **Suspend the Render service** `nextdoor-backend` / `nextdoor-estimator-backend`.
   Suspend first, delete later — suspension is reversible.
7. **After a week of clean operation**: delete the Render service, drop the
   MySQL database, and delete the directories listed above from this repo.
8. **Revoke the old service's API keys** in Google Cloud, including any Solar or
   Maps key issued only to it.

## Rollback

Cutover is a `vercel.json` rewrite target plus this repo's tRPC call sites. To
roll back before step 7, repoint `/api/trpc` at the old Render URL and revert
this repo to the previous commit. After the database is dropped, there is no
rollback — which is why steps 5–7 are last and a week apart.
