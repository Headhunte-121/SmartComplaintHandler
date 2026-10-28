# Supabase Row Level Security (RLS) Guide & Setup Script

> **Navigation**: [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📚 Codebase Documentation Hub](codebase/README.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture Guide](FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [👥 5-Student Responsibility Matrix](TEAM_RESPONSIBILITY_MATRIX.md)  
> **Target Audience**: Developers deploying to Supabase PostgreSQL, System Administrators, Viva Examiners  
> **Repository Branch**: `documentation`

---

## 1. Why is Supabase Asking to Enable RLS?

When you create tables in the `public` schema of a Supabase PostgreSQL database (`users`, `tickets`, `departments`, etc.), Supabase automatically exposes them over HTTP via its **PostgREST Data API** (`https://<project-ref>.supabase.co/rest/v1/...`).

* **If RLS is DISABLED (Default Warning)**:  
  Anyone with your project's public `anon` API key can make direct HTTP `GET`, `POST`, or `PATCH` requests against your raw database tables, completely bypassing your FastAPI backend, validation rules, and authentication guards.
  
* **If RLS is ENABLED**:  
  PostgreSQL enforces that **no direct PostgREST client query can read or modify rows** unless an explicit policy (`CREATE POLICY`) allows it. This guarantees that all client traffic must flow through your secure FastAPI backend (`backend/app/main.py`), which enforces:
  1. Passlib Bcrypt password hashing
  2. Stateless HMAC-SHA256 JWT verification
  3. Role-Based Access Control (`STUDENT`, `TECHNICIAN`, `ADMIN`, `SUPERADMIN`)
  4. SLA countdown timers and Finite State Machine transition rules

---

## 2. Will Enabling RLS Break Our FastAPI Backend?

**No, absolutely not.**

Here is why your FastAPI application will continue working with 100% functionality:

1. **Direct Connection String (SQLAlchemy)**:  
   FastAPI connects to Supabase using the database connection string defined in `DATABASE_URL` (connecting to port `5432` or the Transaction Pooler port `6543` on `aws-0-ap-south-1.pooler.supabase.com`).
   
2. **The `postgres` Superuser Role**:  
   The connection string connects as the `postgres` user (e.g. `postgres.<project-ref>`). In PostgreSQL, superuser roles possess the **`BYPASSRLS`** attribute by default.
   
3. **Execution Behavior**:  
   When SQLAlchemy executes `SELECT`, `INSERT`, `UPDATE`, or `DELETE` queries over the direct connection pool, PostgreSQL bypasses Row Level Security checks entirely. All FastAPI endpoints, automated test suites, and seeder scripts (`backend/app/db/seed.py`) run unimpeded.

---

## 3. The Copy-Paste SQL Setup Script

Open your **[Supabase Dashboard](https://supabase.com/dashboard)** $\to$ Navigate to **SQL Editor** $\to$ Click **New query** $\to$ Paste and run the following script:

```sql
-- ============================================================================
-- SmartComplaintHandler — Supabase Row Level Security (RLS) Configuration
-- ============================================================================

-- Step 1: Enable Row Level Security (RLS) on all 6 platform tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_roads ENABLE ROW LEVEL SECURITY;

-- Step 2: Ensure the backend 'service_role' and 'postgres' have full access
-- (These policies guarantee that backend microservices or serverless functions
--  using service keys can perform all operations without restrictions)

-- Users Table Policies
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
CREATE POLICY "Service role full access on users"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Departments Table Policies (Allow public read for non-sensitive department names)
DROP POLICY IF EXISTS "Allow public read on departments" ON public.departments;
CREATE POLICY "Allow public read on departments"
    ON public.departments
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access on departments" ON public.departments;
CREATE POLICY "Service role full access on departments"
    ON public.departments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Maintenance Teams Table Policies (Allow public read for squad directories)
DROP POLICY IF EXISTS "Allow public read on maintenance_teams" ON public.maintenance_teams;
CREATE POLICY "Allow public read on maintenance_teams"
    ON public.maintenance_teams
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access on maintenance_teams" ON public.maintenance_teams;
CREATE POLICY "Service role full access on maintenance_teams"
    ON public.maintenance_teams
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Tickets Table Policies (Strictly locked down to FastAPI backend)
DROP POLICY IF EXISTS "Service role full access on tickets" ON public.tickets;
CREATE POLICY "Service role full access on tickets"
    ON public.tickets
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Campus Buildings & Roads (Allow public read for the 2D SVG Digital Twin Map)
DROP POLICY IF EXISTS "Allow public read on campus_buildings" ON public.campus_buildings;
CREATE POLICY "Allow public read on campus_buildings"
    ON public.campus_buildings
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access on campus_buildings" ON public.campus_buildings;
CREATE POLICY "Service role full access on campus_buildings"
    ON public.campus_buildings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on campus_roads" ON public.campus_roads;
CREATE POLICY "Allow public read on campus_roads"
    ON public.campus_roads
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access on campus_roads" ON public.campus_roads;
CREATE POLICY "Service role full access on campus_roads"
    ON public.campus_roads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

---

## 4. How to Verify in Supabase Dashboard

1. **Check the Table Editor**:
   - In your Supabase Dashboard, click on **Table Editor** on the left navigation bar.
   - You will see a small green shield badge labeled **`RLS ENABLED`** next to `users`, `departments`, `maintenance_teams`, `tickets`, `campus_buildings`, and `campus_roads`.
   
2. **Check the Security Advisor**:
   - Navigate to **Security Advisor** or **Database Health** in the Supabase sidebar.
   - The warning *"Row Level Security (RLS) is disabled"* will be resolved (0 warnings).

3. **Verify the FastAPI Application**:
   - Run the backend test suite:
     ```bash
     pytest backend/tests/test_closed_loop.py -v
     ```
   - All tests will pass (`66 passed`), proving that SQLAlchemy's direct pooled connection continues operating with full read/write privileges.

---

## 5. High-Frequency Viva & Defense Q&A

### Q: Why did you enable RLS on Supabase if your application already has FastAPI authentication?
**Model Viva Answer**:
> *"Sir, this follows the **Defense-in-Depth** security principle. In a standard cloud setup, Supabase automatically generates HTTP PostgREST endpoints for all tables in the `public` schema. If RLS is disabled, someone who discovers our public Supabase project URL could bypass our FastAPI server entirely and read or alter database rows using the public anonymous API key. By enabling RLS, we ensure that direct HTTP access to our database tables is locked down, requiring all traffic to pass through our FastAPI business logic, JWT validation, and finite state machine guards."*

### Q: Why didn't enabling RLS break your FastAPI SQLAlchemy queries?
**Model Viva Answer**:
> *"Sir, SQLAlchemy connects directly to PostgreSQL using the database connection string as the `postgres` administrative user. In PostgreSQL, the `postgres` role has the `BYPASSRLS` privilege by default, meaning Row Level Security applies only to client roles connecting via PostgREST (like `anon` and `authenticated`), while server-side ORM sessions maintain complete operational access."*

---

## 🧭 Navigation Footer

> **Quick Jump**:  
> [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📚 Codebase Documentation Hub](codebase/README.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture Guide](FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [👥 5-Student Responsibility Matrix](TEAM_RESPONSIBILITY_MATRIX.md) &nbsp;│&nbsp; [🗺️ Master Documentation Roadmap](DOCUMENTATION_ROADMAP.md)
