# Company Attendance MVP v2

## Included
- Responsive web/PWA interface intended for Android and desktop browsers.
- Supabase email/password authentication.
- Employee self-service IN/OUT flow.
- Server-side Edge Function validates the punch sequence and writes server timestamps.
- Admin/manager attendance reporting and admin-only employee invitation function.
- RLS starter policies and audit log.
- No face image or face template collection.

## Setup
1. Create a Supabase project.
2. In SQL Editor, run `supabase/schema.sql`.
3. Deploy Edge Functions:
   - `supabase functions deploy punch`
   - `supabase functions deploy admin-create-employee`
4. Set Edge Function secrets using the Supabase CLI/dashboard. Supabase normally injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; verify these exist for the deployed functions. Never put the service-role key in browser code.
5. Create the first administrator in Supabase Auth (invite them from the dashboard).
6. Insert their profile row with their Auth UUID:
   `insert into public.profiles(id,employee_code,full_name,role) values ('AUTH-UUID','ADMIN-001','Company Admin','admin');`
7. Host `public/` on an HTTPS static host.
8. Open the app, enter the project URL and anon/publishable key, then sign in.
9. Admin invites employees from Employees. Configure Supabase email SMTP for reliable invitations.

## Security notes before production
- This is an implementation scaffold, not a certified or audited system.
- Review and test RLS and function behavior in a staging project before importing real employee data.
- Add rate limits, monitoring, backup/restore drills, admin MFA, password reset, invitation expiry, account deactivation and audit-log immutability.
- Current attendance sequence validation is a basic MVP. For strict concurrency guarantees, move validation and insertion into a Postgres transaction/RPC with an employee-level lock.
- CORS is permissive for a demo; restrict allowed origins to your deployed domain.
- Date/report timezone must be set to the company's official timezone; current browser report date is local to the admin device.
- Employee role can read own records; managers/admins can read all attendance through RLS.
- Admin can manage profiles. Managers can read but not manage employees.
- Do not deploy until you have completed security review and employee privacy/legal review.

## Face recognition / biometric roadmap
This version intentionally does not claim to recognize faces. The safer default is device-held biometric authentication via a passkey-capable identity provider, where the server validates a cryptographic assertion and does not receive face data. Supabase email/password in this scaffold is not a passkey implementation. If the company still requires camera-based face recognition, it needs a separately assessed provider/model, liveness/anti-spoofing, explicit lawful basis and notice, a non-biometric alternative, strict retention/deletion, and a privacy/security assessment before use.
