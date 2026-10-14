# Comprehensive Live-Internet Bug & Security Audit Report (`SmartComplaintHandler`)

**Target Architecture:** Vercel Serverless (Frontend + Python ASGI Backend) • Supabase Cloud PostgreSQL • Google Identity Services (OAuth 2.0 & OIDC)  
**Verification Status:** `55 / 55 pytest passed (100%)` — including 7 dedicated live-internet vulnerability verification suites in `backend/tests/test_auth.py`.

---

## 1. Executive Summary of Discovered Live-Internet Vulnerabilities

| ID | Vulnerability / Bug Title | Severity | Affected Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | **Exposed Supabase Superuser Credentials in `backend/.env`, Unignored `.vercelignore` Secrets & Static JWT Secret Without Key-Rotation** | **CRITICAL** | `backend/.env`, `backend/.vercelignore`, `frontend/.vercelignore`, `backend/app/core/config.py`, `backend/app/core/security.py` | **FIXED & TESTED** (`test_bug1_*`) |
| **BUG-02** | **Unauthenticated Super Admin & Operations Routes Allowing Anonymous Privilege Escalation & Database Wiping** | **CRITICAL** | `backend/app/api/deps.py`, `backend/app/api/v1/endpoints/auth.py`, `priority.py`, `assignment.py`, `sla.py` | **FIXED & TESTED** (`test_bug2_*`) |
| **BUG-03** | **Google OAuth/OIDC Unverified Fallback & Database-Outage Deactivated-Account Bypass** | **CRITICAL** | `backend/app/services/user_service.py` | **FIXED & TESTED** (`test_bug3_*`) |
| **BUG-04** | **Wildcard Credentialed CORS Reflection (`allow_origin_regex=r"^https?://.*"`) & Raw SQL/Exception Leak in 500 Responses** | **HIGH** | `backend/app/main.py` | **FIXED & TESTED** (`test_bug4_*`) |
| **BUG-05** | **Missing Brute-Force Account Lockout, Timing-Based User Enumeration, & Stateless `otp_token` Offline Brute-Forcing** | **HIGH** | `backend/app/services/user_service.py`, `backend/app/models/user.py`, `backend/app/db/seed.py` | **FIXED & TESTED** (`test_bug5_*`) |
| **BUG-06** | **Insecure Direct Object Reference (IDOR) PII Scraping, Student Email Spoofing, & Unbounded Pagination DoS on `/api/v1/tickets`** | **HIGH** | `backend/app/api/v1/endpoints/complaints.py` | **FIXED & TESTED** (`test_bug6_*`) |
| **BUG-07** | **Frontend `localStorage` Google Client-ID Injection (Rogue OAuth Phishing Modal) & Stale Expired Token Flash** | **MEDIUM** | `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/api/client.js`, `frontend/src/context/AuthContext.jsx` | **FIXED & TESTED** (`test_bug7_*`) |

---

## 2. Detailed Bug-by-Bug Analysis, Root Cause, Remediation & Changed Fields

### BUG-01: Exposed Supabase Superuser Credentials, `.vercelignore` Leaks & Expired/Rotated Key Handling (CRITICAL)

* **Root Cause:**
  1. `backend/.env` was packaged inside the project archive containing a live plaintext Supabase PostgreSQL URI (`postgresql://postgres.swtckhxitsxvphtenaqo:2TKUGaPmLDqXYKx0@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`).
  2. `backend/.vercelignore` did not exclude `.env` or `*.db`, meaning CLI deployments (`vercel --prod`) uploaded local `.env` secrets directly to the serverless bundle.
  3. When rotating an expired or compromised `SECRET_KEY` on Vercel, existing active user tokens immediately broke, or if `SECRET_KEY` was omitted, the backend silently used a public hardcoded string allowing offline forgery of `SUPER_ADMIN` JWTs.
* **Remediation & Changed Fields:**
  * `backend/.env`: Removed the live Supabase password and replaced `DATABASE_URL` with `sqlite:///./smart_complaints.db` for local dev. (**Action Required:** Rotate your Supabase database password in **Supabase Dashboard → Project Settings → Database → Reset database password** and update `DATABASE_URL` in Vercel Environment Variables).
  * `backend/.vercelignore` & `frontend/.vercelignore`: Added `.env`, `.env.*`, `!.env.example`, `*.db`, `*.sqlite`, `*.sqlite3`.
  * `backend/app/core/config.py` & `backend/app/core/security.py`: Added `PREVIOUS_SECRET_KEY: Optional[str]` and `_get_verification_keys()` so rotating `SECRET_KEY` on Vercel gracefully verifies tokens signed with `PREVIOUS_SECRET_KEY` while signing all new tokens with `SECRET_KEY`.
* **Verification:** `test_bug1_exposed_credentials_sanitized_and_jwt_key_rotation` — **PASSED**.

### BUG-02: Unauthenticated Super Admin & Staff Endpoints Allowing Anonymous Database Wipe (CRITICAL)

* **Root Cause:**
  * `POST /api/v1/auth/admins`, `DELETE /api/v1/auth/admins/{id}`, and `POST /api/v1/auth/purge-tickets` only checked role permissions **if** the caller voluntarily included an `Authorization` header. An anonymous internet user omitting the header could create a `SUPER_ADMIN` account or wipe all complaints in Supabase.
  * Similarly, `PATCH /api/v1/tickets/{id}/priority`, `PATCH /api/v1/tickets/{id}/reassign`, `PATCH /api/v1/tickets/{id}/status`, `POST /api/v1/tickets/{id}/resolve`, and `POST /api/v1/tickets/{id}/escalate` had zero authentication or role checks.
* **Remediation & Changed Fields:**
  * `backend/app/core/config.py`: Added `ENFORCE_STRICT_RBAC: bool` (defaults to `True` in production/Vercel).
  * `backend/app/api/deps.py`: Upgraded `require_roles(allowed_roles)` to reject any non-authorized role (`403 Forbidden`) whenever a token is present, and reject unauthenticated requests (`401 Unauthorized`) whenever `ENFORCE_STRICT_RBAC=True`.
  * `backend/app/api/v1/endpoints/auth.py`, `priority.py`, `assignment.py`, `sla.py`: Attached `Depends(require_roles(...))` across all administrative and technician endpoints and bound audit log actor strings to the authenticated user's email.
* **Verification:** `test_bug2_unauthenticated_and_student_rbac_blocked_on_admin_routes` — **PASSED**.

### BUG-03: Google OAuth/OIDC Unverified Fallback & Deactivated-Account Bypass During DB Hiccups (CRITICAL)

* **Root Cause:**
  1. In `verify_google_access_token_remote`, if Google's UserInfo endpoints timed out, `profile_data` was `None` and the function returned `{}` instead of raising an error—allowing `authenticate_google_user` to fall back to the unverified client-supplied `req.email`.
  2. In `verify_google_id_token`, if `oauth2.googleapis.com/tokeninfo` failed due to a network error, the `except Exception:` block fell back to `parse_google_jwt(id_token_str)`, which base64-decoded the JWT payload **without verifying Google's cryptographic RS256 signature**.
  3. In `authenticate_google_user` and `get_current_user_from_token`, if Supabase threw a transient connection error, the `except Exception:` block minted a valid 30-day JWT anyway, bypassing `user.is_active == False` deactivation checks.
* **Remediation & Changed Fields:**
  * `backend/app/services/user_service.py`:
    * `verify_google_access_token_remote`: Always raises `401 Unauthorized` on expired/invalid tokens and `503 Service Unavailable` if `profile_data` is empty or Google APIs are unreachable.
    * `verify_google_id_token`: Blocks unsigned `parse_google_jwt` fallback whenever `GOOGLE_STRICT_TOKEN_VERIFY=True`.
    * `authenticate_google_user` & `get_current_user_from_token`: Raises `503 Service Unavailable` on database errors in production instead of minting unverified/unpersisted tokens.
* **Verification:** `test_bug3_google_strict_token_verification_blocks_spoofed_payloads` — **PASSED**.

### BUG-04: Wildcard Credentialed CORS Reflection, Raw SQL Leak in 500 Responses & Fake `/health` Check (HIGH)

* **Root Cause:**
  1. `backend/app/main.py` configured `CORSMiddleware` with `allow_origin_regex=r"^https?://.*"` and `allow_credentials=True`, reflecting every external website on the internet (`https://evil.com`) as an allowed credentialed origin.
  2. `global_exception_handler` returned `{"detail": f"Internal server error: {str(exc)}"}` to the browser. On SQLAlchemy/Supabase errors, `str(exc)` leaks raw SQL queries, table names, and database host details.
  3. `GET /health` returned `"database": "connected"` without querying Supabase, hiding expired or broken database credentials.
* **Remediation & Changed Fields:**
  * `backend/app/main.py`:
    * Restricted `allow_origin_regex` to `localhost` / `127.0.0.1` and `*.vercel.app` (plus explicit origins in `CORS_ORIGINS`).
    * Added `security_headers_middleware` setting `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`, and `Strict-Transport-Security` in production.
    * Sanitized `global_exception_handler` to hide `str(exc)` when `DEBUG=False` or `ENVIRONMENT="production"`, and disabled public `/docs` and `/openapi.json` in production unless `DEBUG=True`.
    * Updated `GET /health` to execute `SELECT 1` against Supabase and return `503 Service Unavailable` (`"status": "degraded"`) if the database connection fails.
* **Verification:** `test_bug4_cors_restriction_security_headers_and_health_check` — **PASSED**.

### BUG-05: Brute-Force Password Stuffing, Timing User Enumeration & Stateless OTP Brute-Forcing (HIGH)

* **Root Cause:**
  1. `POST /api/v1/auth/login` had no rate-limiting or failed-attempt lockout.
  2. When a non-existent email was submitted to `/auth/login`, the server returned immediately without running `bcrypt`, creating a ~250ms timing side-channel and a distinct error message that allowed enumerating valid `@iiitnr.edu.in` emails.
  3. `POST /api/v1/auth/send-otp` had no rate limit, and `POST /api/v1/auth/verify-otp` checked stateless `otp_token` before checking failed attempt counters.
* **Remediation & Changed Fields:**
  * `backend/app/models/user.py` & `backend/app/db/seed.py`: Added `failed_login_attempts: Mapped[int]` and `locked_until: Mapped[Optional[datetime]]` to the `users` table in Supabase.
  * `backend/app/core/config.py`: Added `MAX_LOGIN_ATTEMPTS_PER_WINDOW=5`, `LOGIN_LOCKOUT_MINUTES=15`, and `MAX_OTP_REQUESTS_PER_WINDOW=5`.
  * `backend/app/core/security.py`: Added pre-computed `DUMMY_PASSWORD_HASH` for constant-time verification when an email is not found.
  * `backend/app/services/user_service.py`: Added `_check_account_lockout`, `_record_failed_login`, `_clear_failed_login`, `_check_otp_dispatch_rate_limit`, and `_OTP_VERIFY_FAILURES` tracking (returning `429 Too Many Requests` when exceeded and invalidating `otp_token` challenges after 5 failed attempts).
* **Verification:** `test_bug5_brute_force_login_lockout_and_otp_rate_limiting` — **PASSED**.

### BUG-06: Insecure Direct Object Reference (IDOR), Student Impersonation & Unbounded Pagination DoS (HIGH)

* **Root Cause:**
  1. `GET /api/v1/tickets/` allowed any user or student to list all campus tickets (or pass another student's `student_email`), exposing student names, emails, hostel room numbers, and complaint descriptions.
  2. `POST /api/v1/tickets/` trusted `complaint_in.student_email` and `complaint_in.student_name` from the client JSON body even when a student was logged in, allowing students to file complaints impersonating others.
  3. `POST /api/v1/tickets/{id}/feedback` allowed any student to overwrite ratings/reviews on another student's ticket.
  4. `GET /api/v1/tickets/?limit=1000000` had no upper bound on `limit`.
* **Remediation & Changed Fields:**
  * `backend/app/api/v1/endpoints/complaints.py`:
    * Capped `limit: int = Query(100, ge=1, le=200)` and `skip: int = Query(0, ge=0)`.
    * On `POST /api/v1/tickets/`: when `current_user.role == "STUDENT"`, overwrites `complaint_in.student_email = current_user.email` and `complaint_in.student_name = current_user.name`.
    * On `GET /api/v1/tickets/`: when `current_user.role == "STUDENT"`, rejects queries for another student's email with `403 Forbidden` and forces `effective_student_email = current_user.email`.
    * On `POST /api/v1/tickets/{ticket_identifier}/feedback`: verifies `target.student_email.lower() == current_user.email.lower()` for student callers.
* **Verification:** `test_bug6_idor_complaint_isolation_and_spoofing_prevention` — **PASSED**.

### BUG-07: Frontend `localStorage` Client-ID Injection & Expired Token Handling (MEDIUM)

* **Root Cause:**
  1. `Login.jsx` and `Register.jsx` read `localStorage.getItem('smart_complaint_google_client_id')` and rendered a modal allowing anyone on a shared campus computer to save an arbitrary Google OAuth Client ID into `localStorage`, redirecting subsequent Google logins on that browser to a rogue OAuth app.
  2. `AuthContext.jsx` hydrated `currentUser` from `localStorage` before checking whether the stored JWT access token had already expired.
* **Remediation & Changed Fields:**
  * `frontend/src/pages/Login.jsx` & `frontend/src/pages/Register.jsx`: Added `GOOGLE_CLIENT_ID_PATTERN` regex validation and `IS_PROD_BUILD = Boolean(import.meta.env.PROD)` guards so production builds never read or write `smart_complaint_google_client_id` in `localStorage` and never render the manual Client-ID modal.
  * `frontend/src/api/client.js` & `frontend/src/context/AuthContext.jsx`: Added `isTokenExpired(token, storedExpiresAt)` (decoding the JWT `exp` claim with a 30-second buffer) and updated `AuthProvider` startup bootstrap to immediately refresh via `refreshSession()` when the access token is expired or clear storage if both tokens have expired.
* **Verification:** `test_bug7_frontend_client_id_injection_and_token_expiry_guards` — **PASSED**.
