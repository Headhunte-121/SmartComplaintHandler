# Production-Grade Login System Upgrade (Vercel + Supabase + Google API)

This archive contains **only the modified files** required to upgrade `SmartComplaintHandler` into a production-grade authentication system hosted on **Vercel Serverless** and **Supabase PostgreSQL** with **Google Workspace OAuth 2.0 / OIDC** (`@iiitnr.edu.in`), along with a field-by-field breakdown of every changed field, schema attribute, database column, and configuration setting.

---

## 1. Summary of Changed Fields by File

Only the fields, columns, and configuration keys listed below were added or modified. All existing business logic for complaint routing, priority triage, squad dispatch, and SLA tracking remains untouched.

### A. Backend Configuration & Database (`backend/app/core/`)

| File Path | Changed / Added Fields | Previous Value / Behavior | Production Value / Behavior |
| :--- | :--- | :--- | :--- |
| `backend/app/core/config.py` | `ENVIRONMENT` | *(Missing)* | `"production"` when `VERCEL` or `VERCEL_ENV=production` is detected, else `"development"` |
| `backend/app/core/config.py` | `DEBUG` | `True` (hardcoded) | `not _is_production_env()` (`False` on Vercel production) |
| `backend/app/core/config.py` | `DATABASE_URL` | Hardcoded Supabase credentials in source code | Dynamically resolved from `DATABASE_URL`, `POSTGRES_URL`, `SUPABASE_DB_URL`, or `POSTGRES_PRISMA_URL` |
| `backend/app/core/config.py` | `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_RECYCLE_SECONDS`, `DB_CONNECT_TIMEOUT_SECONDS` | *(Missing)* | `5`, `10`, `300`, `10` (prevents hung connections on Supabase) |
| `backend/app/core/config.py` | `SECRET_KEY`, `REFRESH_SECRET_KEY`, `ALGORITHM` | Hardcoded in `security.py` | Loaded from `SECRET_KEY` / `JWT_SECRET_KEY` / `SUPABASE_JWT_SECRET` environment variables |
| `backend/app/core/config.py` | `ACCESS_TOKEN_EXPIRE_HOURS`, `REMEMBER_ME_EXPIRE_DAYS`, `OTP_EXPIRE_MINUTES` | Hardcoded constants | `24`, `30`, `10` (configurable via environment variables) |
| `backend/app/core/config.py` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `None` (ignored `VITE_GOOGLE_CLIENT_ID`) | Resolves from `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`, or `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| `backend/app/core/config.py` | `GOOGLE_STRICT_TOKEN_VERIFY` | `False` (never referenced in code) | `True` automatically in production; requires a verified Google `access_token` or `credential` |
| `backend/app/core/config.py` | `ALLOW_UNREGISTERED_LOGIN_PROVISIONING` | Implicitly `True` (anyone could log in with any email and auto-create an account) | `False` in production (unregistered emails must sign up or use Google SSO first) |
| `backend/app/core/config.py` | `EXPOSE_DEV_OTP_IN_RESPONSE` | Implicitly `True` (leaked raw OTP in JSON response) | `False` in production; `True` in local development/testing |
| `backend/app/core/config.py` | `CORS_ORIGINS`, `model_config.extra` | Missing (`pydantic-settings` crashed on extra `.env` keys) | `CORS_ORIGINS="*"` (or comma-separated Vercel domains) and `extra="ignore"` |
| `backend/app/core/database.py` | `connect_args` | `{"sslmode": "require"}` | Adds `"connect_timeout": 10`, `"keepalives": 1`, `"keepalives_idle": 30`, `"keepalives_interval": 10`, `"keepalives_count": 5` and strips unsupported `pgbouncer` query params |
| `backend/app/core/database.py` | `engine_kwargs["poolclass"]` | Default `QueuePool` (exhausted Supabase max client connections across frozen Vercel Lambdas) | Uses `NullPool` on Vercel Serverless (`VERCEL=1`) or Supabase Transaction Pooler (`:6543` / `pooler.supabase.com`) |

### B. Security & Token Cryptography (`backend/app/core/security.py`)

| File Path | Changed / Added Fields & Functions | Previous Value / Behavior | Production Value / Behavior |
| :--- | :--- | :--- | :--- |
| `backend/app/core/security.py` | `_prepare_password_bytes(password)` | Raw `password.encode("utf-8")` (crashed with `ValueError` in `bcrypt >= 4.0` when UTF-8 bytes > 72) | Pre-hashes passwords > 72 UTF-8 bytes with SHA-256 hex (64 ASCII bytes) before `bcrypt`, with `PBKDF2-HMAC-SHA256` fallback |
| `backend/app/core/security.py` | `create_access_token` claims: `jti`, `type` | Only `exp` and `iat` | Adds `jti: uuid4().hex` and `type: "access"` |
| `backend/app/core/security.py` | `create_refresh_token` / `decode_refresh_token` | *(Missing)* | Issues and validates signed JWT refresh tokens (`type: "refresh"`) using `REFRESH_SECRET_KEY` |
| `backend/app/core/security.py` | `create_otp_verification_token` / `verify_otp_verification_token` | *(Missing — OTPs were stored only in a local Python `dict` that was lost across Vercel Serverless instances)* | Stateless HMAC-SHA256 signed JWT challenge token (`type: "otp_challenge"`) so OTP verification works across any Vercel Serverless instance |

### C. Supabase `users` Table Model & Pydantic Schemas (`backend/app/models/user.py`, `backend/app/schemas/user.py`, `backend/app/db/seed.py`)

| File Path | Model / Schema | Changed / Added Fields | Purpose |
| :--- | :--- | :--- | :--- |
| `backend/app/models/user.py` | `User` (SQLAlchemy ORM) | `auth_provider: Mapped[Optional[str]]` | Tracks `"password"`, `"google"`, or `"both"` |
| `backend/app/models/user.py` | `User` (SQLAlchemy ORM) | `google_sub: Mapped[Optional[str]]` | Stores Google's immutable OIDC subject identifier (`sub`), indexed |
| `backend/app/models/user.py` | `User` (SQLAlchemy ORM) | `avatar_url: Mapped[Optional[str]]` | Stores Google Workspace profile picture URL |
| `backend/app/models/user.py` | `User` (SQLAlchemy ORM) | `email_verified: Mapped[bool]` | Tracks verified institutional email ownership (`default=True`) |
| `backend/app/models/user.py` | `User` (SQLAlchemy ORM) | `last_login_at: Mapped[Optional[datetime]]` | UTC timestamp updated on every password or Google SSO login |
| `backend/app/schemas/user.py` | `OTPVerifyRequest`, `RegisterRequest` | `otp_token: Optional[str] = None` | Carries stateless HMAC-signed OTP challenge token for Vercel Serverless verification |
| `backend/app/schemas/user.py` | `UserResponse` | `avatar_url`, `auth_provider`, `email_verified`, `last_login_at` | Exposes Google avatar, auth provider type, verification status, and last login timestamp to the frontend |
| `backend/app/schemas/user.py` | `AuthResponse` | `refresh_token: Optional[str] = None`, `expires_at: Optional[datetime] = None` | Returns JWT refresh token and exact UTC expiration timestamp alongside `access_token` |
| `backend/app/schemas/user.py` | `RefreshTokenRequest` | `refresh_token: str`, `remember_me: bool = True` | Request DTO for `POST /api/v1/auth/refresh` |
| `backend/app/schemas/user.py` | `PasswordChangeRequest` | `current_password: Optional[str] = None`, `new_password: str` | Request DTO for `POST /api/v1/auth/change-password` |
| `backend/app/db/seed.py` | `ensure_schema()` | `auth_provider`, `google_sub`, `avatar_url`, `email_verified`, `last_login_at` | Idempotent `ALTER TABLE users ADD COLUMN IF NOT EXISTS ...` migrations for Supabase PostgreSQL and SQLite |

### D. Authentication Service & API Endpoints (`backend/app/services/user_service.py`, `backend/app/api/deps.py`, `backend/app/api/v1/endpoints/auth.py`)

| File Path | Function / Endpoint | Changed Fields & Behavior |
| :--- | :--- | :--- |
| `backend/app/services/user_service.py` | `_VERIFIED_ENGINES` & `_ensure_users_table_ready(db)` | **Fixes Supabase table lock storm:** Previously, `User.__table__.create()` and three `ALTER TABLE` statements ran on **every single login and `/auth/me` request**, acquiring `ACCESS EXCLUSIVE` locks in PostgreSQL and failing if `departments` did not exist yet. Now uses `Base.metadata.create_all()` and caches verified engine URLs in `_VERIFIED_ENGINES` so DDL checks run **once per serverless cold start**. |
| `backend/app/services/user_service.py` | `authenticate_google_user(req, db)` | **Fixes Google API verification bypass:** Previously (`elif req.access_token and not req.email:`), whenever the frontend sent `email` in the JSON payload, the backend **skipped calling Google's API entirely**, allowing anyone to spoof any `@iiitnr.edu.in` email without a real Google token. Now, whenever `req.credential` or `req.access_token` is provided (or when `GOOGLE_STRICT_TOKEN_VERIFY=True` in production), the backend **always** verifies the token with Google's `userinfo` / `tokeninfo` endpoints, validates `aud` against `GOOGLE_CLIENT_ID`, cross-checks `req.email`, and syncs `google_sub`, `avatar_url`, `auth_provider`, and `last_login_at` to Supabase. |
| `backend/app/services/user_service.py` | `generate_otp_challenge` & `verify_otp` | Uses cryptographically secure `secrets.randbelow(900000) + 100000`, adds a 10-minute expiration TTL and 5-attempt brute-force limit, disables the `"123456"` bypass in production, and issues/validates a stateless `otp_token`. |
| `backend/app/api/deps.py` | `get_current_user`, `get_optional_current_user`, `require_roles` | Adds reusable FastAPI JWT Bearer authentication and role-based access control (RBAC) dependencies. |
| `backend/app/api/v1/endpoints/auth.py` | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/change-password` | Adds production token refresh rotation, session logout acknowledgement, authenticated password update endpoint, and role verification on `/admins` and `/purge-tickets`. |

### E. Frontend API Client, Auth Context & Login/Register UI (`frontend/src/`)

| File Path | Changed Fields / Exports | Production Improvement |
| :--- | :--- | :--- |
| `frontend/src/api/client.js` | `AUTH_TOKEN_KEY`, `REFRESH_TOKEN_KEY`, `AUTH_USER_KEY`, `AUTH_EXPIRES_AT_KEY`, `AUTH_EXPIRED_EVENT`, response `401` interceptor | Automatically intercepts `401 Unauthorized` responses on protected API calls, exchanges `smart_complaint_refresh_token` via `POST /api/v1/auth/refresh`, queues concurrent requests while refreshing, and dispatches `smart-complaint:auth-expired` if refresh fails. |
| `frontend/src/api/auth.js` | `loginWithGoogle`, `verifyOTP`, `registerUser`, `refreshSession`, `logoutUser`, `changePassword` | **Removes fake client-side token forgery:** Previously, if `/auth/google` failed or timed out, `loginWithGoogle` fabricated a local non-JWT string (`iiitnr_google_sso_${Date.now()}`), leaving the user unpersisted in Supabase and causing subsequent backend API calls to fail with 401. Now properly retries via relative `/api/v1/auth/google` if needed and returns authoritative backend JWTs. |
| `frontend/src/context/AuthContext.jsx` | `authInitializing`, `persistAuthSession`, `clearAuthStorage`, `useEffect(fetchMe)` | Verifies cached tokens against `GET /api/v1/auth/me` on startup so deactivated or expired sessions are immediately cleared, persists `refresh_token` and `expires_at`, disables Google auto-select on logout, and removes the unauthenticated `switchPersona` catch-block bypass. |
| `frontend/src/pages/Login.jsx` & `frontend/src/pages/Register.jsx` | `ensureGoogleSdkLoaded()`, `handleContinueWithGoogle`, `tokenClientConfig.error_callback` | Dynamically awaits the Google Identity Services script (`https://accounts.google.com/gsi/client`) and backend `/api/v1/auth/config` if the user clicks **Continue with Google** before async initialization finishes, and handles popup closure cleanly without hanging the loading state. |

---

## 2. Deployment Checklist for Vercel & Supabase

1. **Supabase Database URL (`DATABASE_URL`)**:
   - In your Vercel Backend Project Settings -> **Environment Variables**, set `DATABASE_URL` to your Supabase Pooler URI (with `?sslmode=require`).
   - `backend/app/core/database.py` automatically detects Vercel Serverless and Supabase Pooler hosts (`pooler.supabase.com` / `:6543`) and applies `NullPool` with TCP keepalives so serverless invocations never exhaust Supabase connection limits.
2. **Backend Environment Variables on Vercel**:
   - `SECRET_KEY`: 64-character random hex secret for signing access tokens.
   - `REFRESH_SECRET_KEY`: 64-character random hex secret for signing refresh tokens.
   - `GOOGLE_CLIENT_ID`: Your Google Cloud OAuth 2.0 Web Client ID (`xxxx.apps.googleusercontent.com`).
   - `GOOGLE_ALLOWED_DOMAIN`: `iiitnr.edu.in`
   - `GOOGLE_STRICT_TOKEN_VERIFY`: `True`
   - `ALLOW_UNREGISTERED_LOGIN_PROVISIONING`: `False`
   - `EXPOSE_DEV_OTP_IN_RESPONSE`: `False`
3. **Frontend Environment Variables on Vercel**:
   - `VITE_API_BASE_URL`: `/api/v1` (routes seamlessly through `frontend/vercel.json` rewrites).
   - `VITE_GOOGLE_CLIENT_ID`: Your Google Cloud OAuth 2.0 Web Client ID (`xxxx.apps.googleusercontent.com`).
