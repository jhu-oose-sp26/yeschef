## Plan: Auth Signup Confirmation Flow Review

TL;DR: The current backend and frontend already appear to implement the requested email-confirmation signup flow. The most relevant code is in `AuthController`, `AuthService`, `frontend/lib/api/auth.ts`, and `frontend/app/signup.tsx`. I will target those files for verification and any required adjustments, but I do not recommend changing anything until you confirm.

**Steps**
1. Confirm the existing backend signup implementation in `backend/src/main/java/com/yeschef/api/service/AuthService.java`:
   - `signup(AuthRequest request)` currently calls Supabase `POST /auth/v1/signup` with the anon key.
   - It extracts `user.id` from the Supabase response and saves a local `User` via JPA.
   - This is the key fix area because it avoids requiring a JWT before email confirmation.
2. Confirm the backend endpoint behavior in `backend/src/main/java/com/yeschef/api/controller/AuthController.java`:
   - `POST /auth/signup` returns `201 Created` with `{ "message": "Check your email to confirm your account" }`.
   - `POST /auth/login` delegates to `AuthService.login()`.
   - `POST /auth/resend-confirmation` already exists.
3. Confirm the login error mapping in `AuthService.login()`:
   - it returns `403 Forbidden` with `Email not confirmed. Please check your inbox.` for Supabase unconfirmed email errors.
4. Confirm frontend signup handling:
   - `frontend/lib/api/auth.ts` sends signup requests and expects a message response, not a JWT.
   - `frontend/app/signup.tsx` sets local `confirming` state on success and shows a "check your email" UI instead of navigating.
5. Verify tests and coverage in `backend/src/test/java/com/yeschef/api/AuthControllerTests.java` to ensure expectations are encoded.

**Relevant files**
- `backend/src/main/java/com/yeschef/api/controller/AuthController.java` — auth endpoints.
- `backend/src/main/java/com/yeschef/api/service/AuthService.java` — Supabase signup/login/resend logic.
- `backend/src/test/java/com/yeschef/api/AuthControllerTests.java` — contract tests for signup/login/resend behavior.
- `frontend/lib/api/auth.ts` — API wrapper for auth endpoints.
- `frontend/app/signup.tsx` — signup UI and confirmation flow.

**Verification**
1. Run backend unit tests for auth controller/service, especially `AuthControllerTests`.
2. Confirm runtime flow by exercising `POST /auth/signup` from frontend or a REST client with email confirmation enabled in Supabase.
3. Inspect logs or error responses from Supabase to ensure the signup endpoint is not trying to use a missing JWT.

**Decisions**
- The primary change area is backend `AuthService.signup`, but current code already appears to implement the requested fix.
- If any edit is needed, it should be limited to: ensuring local user creation is JPA-based and not dependent on Supabase auth session data, and verifying response/message semantics.
- No code changes should be made until you approve this plan.
