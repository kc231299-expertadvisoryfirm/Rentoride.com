# RentoRide — Setup Guide (Production-Ready Build)

## What changed vs. the original project
The core bug — bookings made via `booking.js` never appearing in
`my-bookings.html` or the owner dashboard — is fixed. Every page now
reads/writes the **same** Supabase tables through **one** shared client
(`js/supabase.js`). Three disagreeing bike-data sources (hardcoded HTML,
`bikes-data.js` object, Supabase table) are now one: Supabase only.

## 1. Run the database migrations
In your Supabase project → SQL Editor, run in order:
1. `db/001_schema.sql` — tables, enums, triggers, RLS policies
2. `db/002_storage.sql` — `vehicle-photos` (public) + `owner-documents`
   (private) buckets and their access policies

## 2. Create your first admin account
There's no seed script for this on purpose (never hardcode admin
credentials in a repo). After running the migrations:
1. Sign up normally through `login.html` (as a customer or owner — doesn't
   matter, you'll change the role next)
2. In Supabase → Table Editor → `profiles`, find your row and change
   `role` from `customer` to `admin`
3. Log in at `admin-login.html` with that same email/password

## 3. File structure
```
/index.html              marketing homepage (no Supabase needed)
/login.html               real Supabase auth (customer/owner signup+login)
/bikes.html                live listing, loads approved bikes from Supabase
/bike-details.html         single bike, live data
/booking.html               booking flow, writes to `bookings`, conflict-checked
/my-bookings.html            customer's bookings, reads `bookings`
/list-vehicle.html            owner lists a vehicle, uploads photos+docs, inserts `bikes`
/owner-dashboard.html          owner's vehicles/bookings/earnings/bank/withdrawals
/admin-login.html + /admin.html   RLS-enforced admin panel

/js/supabase.js            ONE shared client + auth helpers (RentoRideAuth) — include first
/js/bikes-data.js          price-calc helper only (no more hardcoded catalog)
/js/utils.js               shared nav/profile-menu helpers (unchanged)
/js/*.js                   one file per page, all Supabase-backed now

/db/001_schema.sql         tables + RLS (the real security boundary)
/db/002_storage.sql        storage buckets + policies
/css/shared-states.css     loading skeleton / error states (linked from bikes.html)
```

## 4. Retired files (not deleted, just not linked from anywhere)
- `home.html` — duplicate of `index.html`
- `dashboard.html` — superseded prototype (Login/Signup/Add Bike combined
  page); everything it did is now split properly across `login.html`,
  `list-vehicle.html`, `owner-dashboard.html`

## 5. Security notes (read before going live)
- The Supabase **publishable** key in `js/supabase.js` is safe to ship
  client-side *only because* RLS is now enforced on every table — a
  logged-in user can only read/write what the policies in
  `001_schema.sql` allow, no matter what the frontend code does.
- Bank account numbers: the client currently sends the full number to
  Supabase over TLS, where it's stored in `account_number_encrypted`
  (plaintext column name is misleading — see the comment in
  `owner-dashboard.js`). **Before real payouts happen**, move the actual
  encryption into a Supabase Edge Function (using pgsodium/Vault) so the
  plaintext number never lands in a queryable column, even briefly.
- Owner verification documents (RC, insurance, ID) upload to a **private**
  Storage bucket — never publicly listable. Admin review of these still
  needs a signed-URL endpoint (a Supabase Edge Function) rather than
  direct client reads; flagged as a next step, not yet built.

## 6. Known "frontend ready, backend integration required" items
Flagged explicitly in code rather than faked:
- Admin broadcast notifications (form validates, doesn't send — needs a
  `notifications` table + email/push delivery)
- Revenue/analytics charts (placeholder — needs aggregation queries or a
  charting library wired to real data)
- Platform settings (commission %, maintenance mode) save to
  `localStorage` per-device for now — needs a `platform_settings` table
  to be global

## 7. Deployment
Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages) —
this is plain HTML/CSS/JS with no build step. Point it at this folder,
done. Supabase handles the backend; no server to deploy.
