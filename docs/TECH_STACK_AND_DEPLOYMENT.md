# Smart Complaint Handler — Technology Stack & Deployment Architecture

A comprehensive technical reference documenting the frameworks, libraries, database models, and cloud deployment topology powering the Smart Complaint Handler for IIIT Naya Raipur.

---

## 1. Technology Stack Breakdown

| Layer | Technology | Version | Purpose in the Project |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `v18.2` | Single-Page Application (SPA) architecture for real-time reactivity without full page reloads across the student, operator, technician, and executive dashboards. |
| **Frontend Build Tool** | **Vite** | `v5.1` | Ultra-fast ESM-based local development server and optimized production rollup bundling with automatic vendor chunking. |
| **Styling & Design System** | **Tailwind CSS** | `v3.4` | Custom Obsidian Dark glassmorphic design system (`#090d14`), micro-interactions, responsive grids, and high-density operational telemetry. |
| **Icons & Visuals** | **Lucide React** | `v0.330` | Lightweight, scalable SVG icon set providing crisp status, navigation, and diagnostic icons without external icon fonts. |
| **Client-Side Routing** | **React Router DOM** | `v6.22` | Declarative routing with client-side route guards enforcing institutional role clearances (`Student`, `Staff`, `Admin`, `SuperAdmin`). |
| **API Client** | **Axios** | `v1.6` | HTTP client configured with global request/response interceptors, automatic JWT Bearer token attachment, and centralized error handling. |
| **State Management** | **React Context API** | Native | Centralized `AuthContext` managing authentication tokens, role permissions, active session persistence, and logout teardown. |
| **Backend Framework** | **FastAPI** | `v0.109` | High-performance Python ASGI web framework handling RESTful API routes, async database queries, and automatic OpenAPI / Swagger docs. |
| **Data Validation & DTOs** | **Pydantic** | `v2.6` | Strict runtime type enforcement, input sanitization, and automated schema serialization for complaint submissions and updates. |
| **ORM & Database Layer** | **SQLAlchemy** | `v2.0` | Declarative relational object-relational mapping (ORM) with transaction management, session pooling, and relational joins. |
| **Database Engine** | **PostgreSQL (Supabase)** | `v15+` | Managed relational database hosted on AWS Mumbai (`ap-south-1`), storing users, complaints, squads, SLA deadlines, and audit trails. |
| **DB Driver & Connection Pool**| **Psycopg 3 / psycopg2** | `v3.1 / v2.9` | High-speed binary PostgreSQL database adapter supporting SSL connections and Supabase Transaction Pooler (`Supavisor`). |
| **Authentication & Cryptography**| **PyJWT & Bcrypt** | `v2.8 / v4.0` | Stateless JWT token issuance (HS256 cryptographic signing) and salted bcrypt hashing for password storage. |
| **Domain SSO Integration** | **Google OAuth 2.0 / OIDC** | REST API | Restricts campus authentication strictly to verified `@iiitnr.edu.in` Google Workspace institutional accounts. |
| **AI Triage & Classification** | **Python NLP Engine** | Native / Fallback | Natural language tokenization and keyword classification mapping grievance text to departments, priority levels, and 4-tier SLA deadlines. |

---

## 2. Cloud Deployment Topology

```mermaid
flowchart TD
    subgraph ClientLayer["1. Client Layer (Browser)"]
        Browser["Student / Staff / Directorate Devices<br/>(Desktop, Tablet, Mobile)"]
    end

    subgraph VercelEdge["2. Frontend Hosting (Vercel Global CDN)"]
        FrontendVercel["React SPA (Vite Production Build)<br/><code>https://smart-complaint-handler-forntend-theta.vercel.app</code><br/>Edge Caching & Global SSL"]
    end

    subgraph VercelServerless["3. Backend API (Vercel Serverless Functions)"]
        FastAPIEndpoint["FastAPI ASGI Handler (<code>@vercel/python</code>)<br/>Region: bom1 (Mumbai, India)<br/>Route: /api/v1/*"]
        AuthMiddleware["JWT Verification & RBAC Dependency Guards"]
        AIEngine["AI Triage & SLA Matrix Calculator"]
    end

    subgraph CloudDB["4. Managed Cloud Database (Supabase Cloud)"]
        Supavisor["Supavisor Transaction Pooler<br/>Port: 6543 (SSL Required)"]
        PostgresDB["PostgreSQL Relational DB<br/>Region: aws-0-ap-south-1 (Mumbai)<br/>Tables: users, tickets, maintenance_teams, departments"]
    end

    Browser -->|HTTPS Request| FrontendVercel
    FrontendVercel -->|REST API Calls (Axios)| FastAPIEndpoint
    FastAPIEndpoint --> AuthMiddleware
    AuthMiddleware --> AIEngine
    AIEngine -->|SQLAlchemy Queries| Supavisor
    Supavisor --> PostgresDB
```

### Deployment Specifications

1. **Frontend Hosting (Vercel Edge Network)**:
   - **Production URL**: `https://smart-complaint-handler-forntend-theta.vercel.app`
   - **Build Pipeline**: Runs `vite build`, outputting pre-compressed static HTML/CSS/JS chunks served with HTTP/2 and gzip/brotli compression.
   - **Client Routing**: Configured via `vercel.json` rewrites redirecting all route requests to `index.html`.

2. **Backend API (Vercel Serverless Functions)**:
   - **Platform**: Vercel Serverless Python Runtime (`@vercel/python`)
   - **Execution Region**: `bom1` (Mumbai, India) for minimal latency within India.
   - **Entry Point**: `api/index.py` wrapping the FastAPI ASGI app.
   - **Cold Start Optimization**: Connection pool caching and lightweight module imports.

3. **Database Infrastructure (Supabase Cloud PostgreSQL)**:
   - **Platform**: Supabase Cloud PostgreSQL
   - **Cloud Provider & Region**: AWS `ap-south-1` (Mumbai, India) co-located with the Vercel backend region.
   - **Connection Mode**: Supabase Transaction Connection Pooler (`port 6543`) with `sslmode=require` to prevent database connection exhaustion during serverless cold starts.

4. **Version Control & Continuous Delivery**:
   - **Repository**: GitHub (`Headhunte-121/SmartComplaintHandler`)
   - **Automation**: Automatic Vercel deployment webhooks trigger on every `git push` to branch `UI-changes`, enabling continuous integration.

---

## 3. Engineering Decisions: Why Each Tool Was Selected

- **Why FastAPI over Django or Flask?**
  FastAPI executes asynchronously, supports automatic Swagger API documentation at `/docs`, and uses Pydantic for high-speed schema validation.
- **Why Vite instead of Create-React-App?**
  Create-React-App is deprecated and slow. Vite builds production bundles in ~2.5 seconds using Rollup with native ES modules.
- **Why Tailwind CSS without UI Component Libraries (MUI / AntD)?**
  Third-party component libraries produce heavy JavaScript bundles and rigid default styling. Tailwind CSS allows full custom control over the Obsidian dark theme without runtime styling overhead.
- **Why Supabase PostgreSQL over SQLite or MongoDB?**
  Relational integrity (foreign keys between tickets, departments, squads, and users) is essential for an audit-logged complaint system. Supabase provides cloud-hosted PostgreSQL with built-in SSL and connection pooling for serverless environments.

---

## 4. Branch & Backend Compatibility Notes (`main` vs `UI-changes`)

The backend codebase on branch `UI-changes` is **100% backwards-compatible** with `main`:
1. **Safe Database Fields**: `team_id` and `team_name` were added as optional, nullable columns on `users`.
2. **Real Headcounts**: `/teams/workloads` computes actual assigned technician counts instead of hardcoding `1`.
3. **Staff Squad Assignment**: Added `PATCH /admins/{user_id}/squad` to power the SuperAdmin Staff Directory dropdown.
4. **Trailing Slash Safety**: Added root `/complaints` route aliases to eliminate Vercel `308 Permanent Redirect` warnings.
5. **Standardized Event Logging**: Priority overrides, closure reports, and reassignments are saved with structured ISO timestamps for the timeline audit log.
