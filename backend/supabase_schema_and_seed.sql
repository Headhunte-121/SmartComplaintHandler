-- ==============================================================================
-- Smart Complaint Handler - Canonical Supabase PostgreSQL Schema & Seed Script
-- Idempotent setup for tables, departments, teams, users, buildings, and roads
-- ==============================================================================


CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    active_ticket_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    hashed_password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'STUDENT' NOT NULL,
    phone VARCHAR(50),
    hostel_name VARCHAR(120),
    room_number VARCHAR(60),
    department_name VARCHAR(100),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    auth_provider VARCHAR(50) DEFAULT 'password' NOT NULL,
    google_sub VARCHAR(255),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    assigned_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    student_email VARCHAR(150),
    building VARCHAR(120),
    wing VARCHAR(100),
    floor VARCHAR(50),
    room VARCHAR(60),
    custom_location VARCHAR(200),
    feedback_rating INTEGER,
    feedback_comments TEXT,
    feedback_submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS campus_buildings (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    badge VARCHAR(30),
    category VARCHAR(50) DEFAULT 'ACADEMIC' NOT NULL,
    color VARCHAR(50),
    map_pin JSONB,
    wings JSONB,
    floors JSONB,
    rooms_per_floor INTEGER DEFAULT 20,
    custom_rooms JSONB,
    description TEXT,
    polygons JSONB,
    entrances JSONB,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS campus_roads (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    road_type VARCHAR(50) DEFAULT 'road' NOT NULL,
    width INTEGER DEFAULT 14 NOT NULL,
    color VARCHAR(50),
    latlngs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
