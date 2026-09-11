# Guide 05: SQLAlchemy 2.0 ORM & Relational Architecture

This manual serves as the authoritative systems engineering reference for the **SQLAlchemy 2.0 Object-Relational Mapping (ORM)** layer, Core expression compilation, connection pool dynamics, and transactional lifecycles across the **Automated Smart Complaint Routing & Workflow Automation Platform**.

In modern distributed and high-concurrency systems, the data access layer serves as the mission-critical bridge between high-level application business logic (FastAPI route handlers, background SLA schedulers, automated routing engines) and the underlying physical storage engine (SQLite 3 WAL database). SQLAlchemy 2.0 represents a monumental architectural evolution over legacy 1.x paradigms, establishing complete separation between SQL expression compilation and execution, unifying type annotations with Declarative Mapping (`Mapped[...]` and `mapped_column()`), standardizing query construction around `select()`, and enforcing explicit transactional boundaries.

Every chapter in this manual provides:
1. **Low-Level Systems Theory:** Architectural mechanics explaining how Python objects are tracked, compiled into parameterized SQL ASTs, dispatched to low-level DBAPI drivers, and synchronized with relational disk tables.
2. **Exhaustively Commented Code:** Every single line of Python code in every code block includes an explicit inline explanatory comment (`#`) detailing the precise systems action, parameter purpose, and runtime implication.
3. **Enterprise Domain Models:** Real-world examples modeled directly on grievance intake, departmental hierarchy, maintenance squad routing, and audit logs.

---

## Table of Contents
1. [Chapter 1: The SQLAlchemy 2.0 Architectural Paradigm & Core vs ORM Separation](#chapter-1-the-sqlalchemy-20-architectural-paradigm-core-vs-orm-separation)
2. [Chapter 2: The Engine, Dialects, and DBAPI Connection Pool Mechanics](#chapter-2-the-engine-dialects-and-dbapi-connection-pool-mechanics)
3. [Chapter 3: Connection Pools in Depth: QueuePool, NullPool, StaticPool & SQLite Specifics](#chapter-3-connection-pools-in-depth-queuepool-nullpool-staticpool-sqlite-specifics)
4. [Chapter 4: Declarative Mapping & Modern Mapped / mapped_column Typings](#chapter-4-declarative-mapping-modern-mapped-mapped_column-typings)
5. [Chapter 5: Primary Keys, Composite Keys, Sequence Generation & Foreign Keys](#chapter-5-primary-keys-composite-keys-sequence-generation-foreign-keys)
6. [Chapter 6: Table Relationships: One-to-Many, Many-to-One, and Back-Populates Mechanics](#chapter-6-table-relationships-one-to-many-many-to-one-and-back-populates-mechanics)
7. [Chapter 7: Many-to-Many Relationships & Association Object Patterns](#chapter-7-many-to-many-relationships-association-object-patterns)
8. [Chapter 8: Cascades and Lifecycle Propagation (`all, delete-orphan`)](#chapter-8-cascades-and-lifecycle-propagation-all-delete-orphan)
9. [Chapter 9: Relationship Loading Strategies: Lazy vs Eager (joinedload, selectinload, subqueryload, contains_eager)](#chapter-9-relationship-loading-strategies-lazy-vs-eager-joinedload-selectinload-subqueryload-contains_eager)
10. [Chapter 10: The Async / ASGI Lazy Loading Hazard & Greenlet Mechanics](#chapter-10-the-async-asgi-lazy-loading-hazard-greenlet-mechanics)
11. [Chapter 11: The SQLAlchemy 2.0 Query Paradigm: select(), insert(), update(), delete()](#chapter-11-the-sqlalchemy-20-query-paradigm-select-insert-update-delete)
12. [Chapter 12: Advanced Filtering, Expressions, Aggregations, Grouping & Having](#chapter-12-advanced-filtering-expressions-aggregations-grouping-having)
13. [Chapter 13: Bulk Operations, Batch Inserts, and Returning Clauses](#chapter-13-bulk-operations-batch-inserts-and-returning-clauses)
14. [Chapter 14: The Session Lifecycle, Transactional Boundaries & sessionmaker Factory](#chapter-14-the-session-lifecycle-transactional-boundaries-sessionmaker-factory)
15. [Chapter 15: The Unit of Work Pattern & Topological Flush Sorting](#chapter-15-the-unit-of-work-pattern-topological-flush-sorting)
16. [Chapter 16: The Identity Map & In-Memory Entity Caching](#chapter-16-the-identity-map-in-memory-entity-caching)
17. [Chapter 17: Session States: Transient, Pending, Persistent, and Detached](#chapter-17-session-states-transient-pending-persistent-and-detached)
18. [Chapter 18: Schema Reflection, Inspection & DDL Generation (MetaData & inspect)](#chapter-18-schema-reflection-inspection-ddl-generation-metadata-inspect)
19. [Chapter 19: Core SQL Expression Language & Hybrid Properties / Expressions](#chapter-19-core-sql-expression-language-hybrid-properties-expressions)
20. [Chapter 20: Database Events, Listeners & Lifecycle Hooks (before_insert, after_update)](#chapter-20-database-events-listeners-lifecycle-hooks-before_insert-after_update)
21. [Chapter 21: FastAPI Integration: Generator Dependencies, Scoped Sessions & Middleware](#chapter-21-fastapi-integration-generator-dependencies-scoped-sessions-middleware)
22. [Chapter 22: The SQLAlchemy 2.0 Systems Engineering Mastery Checklist](#chapter-22-the-sqlalchemy-20-systems-engineering-mastery-checklist)
---

## Chapter 1: The SQLAlchemy 2.0 Architectural Paradigm & Core vs ORM Separation

### 1.1 The Two-Tiered Architecture: SQLAlchemy Core vs SQLAlchemy ORM

SQLAlchemy is deliberately engineered not as a monolithic active-record framework, but as a layered composite of two foundational subsystems: **SQLAlchemy Core** and **SQLAlchemy ORM**. Understanding the boundary between these two layers is imperative for designing performant database architectures.

1. **SQLAlchemy Core:**
   * Acts as a database abstraction toolkit and SQL expression compiler.
   * Encapsulates the `Engine`, connection pooling (`Pool`), low-level DBAPI cursor execution, schema definition constructs (`Table`, `Column`, `MetaData`), and programmatic SQL AST nodes (`select()`, `insert()`, `update()`, `delete()`).
   * Operates entirely without object-mapping overhead. It deals with raw relational concepts: tables, rows, columns, and tuples.
   * Compiles abstract Python SQL expressions into dialect-specific SQL text (e.g., translating a generic `select()` statement into SQLite-compatible ANSI SQL or PostgreSQL-specific syntax with dialect-tailored parameter binding syntax like `?` or `$1`).

2. **SQLAlchemy ORM (Object-Relational Mapping):**
   * Built directly on top of SQLAlchemy Core.
   * Translates Python class definitions (`Mapped` entities) into relational schema mappings and vice-versa.
   * Implements enterprise architectural patterns: **Unit of Work** (buffering mutations and computing topological dependency graphs before flushing to disk) and **Identity Map** (ensuring that a given database primary key is materialized as exactly one Python object instance within a transaction session).
   * Translates object graph modifications into Core SQL execution statements during the flush phase.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SQLAlchemy ORM Layer                            │
│  - Declarative Mapping (Mapped[T], mapped_column)                      │
│  - Session & Unit of Work (Identity Map, Flush, Change Tracking)       │
│  - Relationship Loaders (joinedload, selectinload)                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Compiles Object State to Core AST
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SQLAlchemy Core Layer                           │
│  - SQL Expression Language (select(), insert(), update(), delete())    │
│  - Schema Metadata (Table, Column, Index, ForeignKeyConstraint)        │
│  - Type Engine (String, Integer, DateTime, Dialect Type Coercion)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Formats SQL Dialect & Parameter Dicts
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Engine & Dialect Subsystem                      │
│  - Dialect Compiler (SQLite / PostgreSQL / MySQL SQL Formatter)        │
│  - Connection Pool (QueuePool, NullPool, StaticPool)                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Passes Native DBAPI Connection
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Python DBAPI Driver (sqlite3)                      │
│  - C Extension Module (libsqlite3) / Native OS Socket                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 The Paradigm Shift: SQLAlchemy 1.x Legacy vs SQLAlchemy 2.0

In legacy SQLAlchemy 1.x, query construction was deeply coupled to the `Session.query()` interface, which frequently obscured whether an operation was executing immediately, loading relationships lazily, or mutating internal session state. Furthermore, implicit auto-begin and ambiguous commit boundaries caused subtle transaction leaks in concurrent web frameworks.

SQLAlchemy 2.0 unifies Core and ORM query execution under a single cohesive model:
* **The `select()` Construct:** The legacy `session.query(Model)` syntax is completely deprecated in favor of explicit `select(Model)`. Queries are constructed as immutable Core AST objects and executed explicitly via `session.execute(statement)`.
* **Explicit Commit Lifecycle:** Sessions require explicit transaction demarcation. "Autocommit mode" is permanently removed. Transactions must be committed using `session.commit()` or managed via contextual transaction blocks (`with session.begin():`).
* **PEP 484 Type System Integration:** Model declarations leverage modern Python type hints via `Mapped[T]` and `mapped_column()`, eliminating runtime `Any` types and enabling full static analysis with Mypy and Pyright.

```python
from sqlalchemy import create_engine, select  # Import engine creator and 2.0 select construct
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session  # Import ORM declarative building blocks

class DemoBase(DeclarativeBase):  # Define isolated declarative base class for demonstration
    pass  # Terminal pass statement establishing base class catalog

class DepartmentEntity(DemoBase):  # Define department mapped entity with explicit table metadata
    __tablename__ = "demo_departments"  # Physical relational table name in SQLite
    id: Mapped[int] = mapped_column(primary_key=True)  # Auto-incrementing primary key identifier
    name: Mapped[str] = mapped_column(nullable=False)  # Division department name string column

demo_engine = create_engine("sqlite:///:memory:")  # Instantiate ephemeral in-memory database engine
DemoBase.metadata.create_all(demo_engine)  # Emit DDL statements to construct physical schema in memory

with Session(demo_engine) as session:  # Open isolated transactional session context manager
    session.add(DepartmentEntity(name="Electrical Services"))  # Stage new department entity into unit of work
    session.commit()  # Flush staged insert to SQLite storage and commit transaction boundary

with Session(demo_engine) as session:  # Open clean query session with empty identity map
    stmt = select(DepartmentEntity).where(DepartmentEntity.name == "Electrical Services")  # Build immutable AST
    dept = session.execute(stmt).scalar_one_or_none()  # Execute query and unpack single scalar entity instance
```

---

## Chapter 2: The Engine, Dialects, and DBAPI Connection Pool Mechanics

### 2.1 The Engine: Central Architectural Anchor

The `Engine` object is the central nervous system of any SQLAlchemy application. It is created once per application lifecycle and shared across all threads and worker tasks. The engine does not represent an active physical connection to the database; rather, it is a factory and coordinator that manages:
1. **The Dialect:** The translation engine that bridges SQLAlchemy's generic relational algebra and the specific SQL syntax, data type coercions, and quirks of the target storage system (e.g., SQLite, PostgreSQL, Oracle).
2. **The Connection Pool:** An in-memory cache of established DBAPI connections, recycling active sockets to avoid the substantial OS-level overhead of repeatedly handshaking and authenticating new database connections.

```python
from sqlalchemy import create_engine  # Core engine initialization factory
from sqlalchemy.pool import QueuePool  # QueuePool manager maintaining fixed persistent handles

DATABASE_URL = "sqlite:///./complaints_system.db"  # Database connection string pointing to local SQLite file

engine = create_engine(  # Construct global singleton engine coordinator
    DATABASE_URL,  # Database connection string targeting application SQLite file
    connect_args={"check_same_thread": False},  # Allow cross-thread connection sharing for FastAPI workers
    echo=False,  # Suppress raw SQL standard output printing to prevent console saturation
    poolclass=QueuePool,  # Use bounded QueuePool to strictly govern connection checkout concurrency
    pool_size=10,  # Maintain up to 10 persistent open connections in the pool
    max_overflow=20,  # Permit up to 20 temporary overflow connections during intake bursts
    pool_timeout=30.0,  # Block for at most 30 seconds before timing out when pool is exhausted
    pool_recycle=1800  # Recycle open connections after 30 minutes to refresh internal buffers
)  # Terminal close of engine configuration invocation
```

### 2.2 Dialect Compilation & Parameter Binding Mechanics

When an engineer issues a query via SQLAlchemy, the engine never interpolates Python values directly into the SQL string. Direct string formatting leads to catastrophic SQL injection vulnerabilities. Instead, the dialect decomposes the query into two distinct components:
1. **The Parameterized SQL Text:** An invariant SQL string with positional (`?`) or named (`:param_1`) placeholders.
2. **The Bound Parameter Dictionary:** A dictionary of native Python values mapped to each placeholder key.

The dialect passes both structures directly to the underlying DBAPI driver (`sqlite3`), which transmits them to the database engine. The database compiler parses and compiles the query execution plan *before* substituting the bound parameters, guaranteeing that user input cannot alter the syntactic structure of the query.

```python
from sqlalchemy import select, create_engine  # Import query builder construct and engine factory
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column  # Import declarative mapping tools

class BaseCatalog(DeclarativeBase):  # Define base metadata registry class
    pass  # Class definition terminal pass

class TicketRecord(BaseCatalog):  # Define complaint ticket schema entity
    __tablename__ = "complaint_records"  # Physical table name in SQLite
    id: Mapped[int] = mapped_column(primary_key=True)  # Primary key auto-incrementing integer
    tracking_code: Mapped[str] = mapped_column(nullable=False)  # Unique alphanumeric tracking code

mock_engine = create_engine("sqlite:///:memory:")  # Instantiate mock dialect engine in memory
query_stmt = select(TicketRecord).where(TicketRecord.tracking_code == "TICK-8492")  # Construct select AST

compiled_query = query_stmt.compile(  # Compile the abstract statement into target dialect form
    dialect=mock_engine.dialect,  # Target the SQLite dialect compiler for syntax emission
    compile_kwargs={"render_postcompile": True}  # Expand postcompile parameters for raw inspection
)  # Terminal compilation call

sql_text = str(compiled_query)  # Extract parameterized SQL string with dialect placeholders
bound_values = compiled_query.params  # Extract bound parameter dictionary containing sanitized values
```

---

## Chapter 3: Connection Pools in Depth: QueuePool, NullPool, StaticPool & SQLite Specifics

### 3.1 Connection Pooling Paradigms

Opening a physical database connection in a network database requires a multi-step handshake: TCP socket synthesis, TLS key exchange, authentication challenge-response, and backend process worker spawning on the database server. To eliminate this latency penalty, connection pools maintain a pool of warm, authenticated connections ready for immediate checkout.

SQLAlchemy provides distinct pooling implementations tailored to specific deployment topologies:
* **`QueuePool` (Default for Network DBs):** Maintains a fixed number of persistent connections (`pool_size`) and allows a burst limit of temporary connections (`max_overflow`). When all connections are checked out, incoming requests block for up to `pool_timeout` seconds before raising an exception.
* **`NullPool` (Serverless & Forked Environments):** Completely disables connection pooling. Every checkout establishes a new physical connection, and every checkin closes it immediately. Crucial in multiprocessing environments (like Celery or Gunicorn pre-fork workers) where child processes must never inherit open file descriptors or sockets from a parent process.
* **`StaticPool` (In-Memory Databases):** Maintains exactly one single connection and returns that same connection on every checkout. Essential for SQLite in-memory databases (`:memory:`), because an in-memory SQLite database is instantly vaporized as soon as its establishing connection is closed.

```text
Connection Checkout Lifecycle:
[FastAPI Request Handler]
        │
        ▼
   SessionLocal()
        │
        ▼ (Requests raw connection)
┌────────────────────────────────────────────────────────┐
│             SQLAlchemy Connection Pool                 │
│                                                        │
│  [Available Connections: Idle & Warm]                 │
│         │                                              │
│         ├─ Connection 1 (Checked out to Thread A)      │
│         ├─ Connection 2 (Available) ──> [Dispatched]   │
│         └─ Connection 3 (Available)                    │
└────────────────────────────────────────────────────────┘
        │
        ▼ (Executes queries)
[Database Engine (SQLite / Postgres)]
        │
        ▼ (Session closed: session.close())
┌────────────────────────────────────────────────────────┐
│  Connection returned to Pool (Reset & Rolled Back)     │
└────────────────────────────────────────────────────────┘
```

### 3.2 SQLite Connection Pool Configuration

In SQLite, the database is an embedded file on disk rather than a network server. Consequently, socket connection overhead is zero. However, SQLite's single-writer concurrency lock requires strict discipline. If `QueuePool` is used with SQLite in a multi-threaded application without WAL mode, concurrent writes will frequently collide and raise `sqlite3.OperationalError: database is locked`.

```python
from sqlalchemy import create_engine  # Import factory function for database engine construction
from sqlalchemy.pool import QueuePool, NullPool, StaticPool  # Import specific pool management classes

prod_engine = create_engine(  # Production SQLite engine with bounded QueuePool
    "sqlite:///./data/complaints.db",  # Target physical SQLite database file on disk
    connect_args={"check_same_thread": False},  # Allow threads to share physical connection descriptors
    poolclass=QueuePool,  # Use thread-safe queue pool for managing database connections
    pool_size=5,  # Keep 5 persistent open database connections in memory
    max_overflow=10,  # Allow up to 10 additional connections when intake traffic peaks
    pool_timeout=30.0,  # Abort checkout and raise exception if wait exceeds 30 seconds
    pool_recycle=1800  # Recycle open connections every 30 minutes to clean up handles
)  # Finalize production engine creation

celery_worker_engine = create_engine(  # Forked worker engine disabling connection pooling
    "sqlite:///./data/complaints.db",  # Target physical SQLite database file on disk
    poolclass=NullPool  # Use NullPool so background child processes never share inherited file locks
)  # Finalize worker engine creation

isolated_test_engine = create_engine(  # Ephemeral test engine with singleton connection pool
    "sqlite:///:memory:",  # Create purely in-memory SQLite database instance
    connect_args={"check_same_thread": False},  # Bypass thread verification checks in test runners
    poolclass=StaticPool  # Use StaticPool to pin single connection so schema is preserved across sessions
)  # Finalize test engine creation
```

---

## Chapter 4: Declarative Mapping & Modern Mapped / mapped_column Typings

### 4.1 Modern Declarative Base with DeclarativeBase

In SQLAlchemy 2.0, the legacy `declarative_base()` factory function has been replaced by subclassing `sqlalchemy.orm.DeclarativeBase`. This establishes an explicit, statically analyzable Python base class that hosts the underlying `MetaData` catalog.

Every model inheriting from `DeclarativeBase` automatically registers its table schema with the shared metadata object. This catalog is used by migrations (Alembic) and test setups to construct the entire database schema with a single call to `Base.metadata.create_all(engine)`.

```python
from sqlalchemy.orm import DeclarativeBase  # Import root declarative base class
from sqlalchemy import MetaData  # Import metadata schema collection container

convention = {  # Define explicit constraint naming conventions for deterministic migrations
    "ix": "ix_%(column_0_label)s",  # Naming pattern for single-column and multi-column indexes
    "uq": "uq_%(table_name)s_%(column_0_name)s",  # Naming pattern for unique constraints
    "ck": "ck_%(table_name)s_%(constraint_name)s",  # Naming pattern for check constraints
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",  # Foreign key constraint format
    "pk": "pk_%(table_name)s"  # Naming pattern for primary key constraints
}  # End of constraint convention dictionary

class Base(DeclarativeBase):  # Inherit from DeclarativeBase to construct application foundation
    metadata = MetaData(naming_convention=convention)  # Bind explicit naming convention to schema catalog
```

### 4.2 Type Annotations: Mapped[...] and mapped_column()

SQLAlchemy 2.0 introduces the `Mapped[T]` generic type annotation in tandem with the `mapped_column()` descriptor. This construct achieves two objectives simultaneously:
1. **Static Type Safety:** IDEs and type checkers understand that `ticket.id` evaluates to `int`, and `ticket.title` evaluates to `str` when reading an instance, eliminating type ambiguity.
2. **Column Metadata Specification:** `mapped_column()` defines physical database column constraints: primary keys, nullability, unique indexes, default values, and foreign keys.

```python
from datetime import datetime  # Import standard datetime representation
from typing import Optional  # Import Optional type marker for nullable relational columns
from sqlalchemy import String, Text, DateTime, Integer  # Import core relational column types
from sqlalchemy.orm import Mapped, mapped_column  # Import modern 2.0 declarative typing primitives

class ComplaintAuditTrail(Base):  # Define complaint audit trail entity mapped to SQLite
    __tablename__ = "complaint_audit_trails"  # Table identifier in the relational schema
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Primary key identifier
    ticket_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # Indexed target ticket foreign ID
    performed_by: Mapped[str] = mapped_column(String(100), nullable=False)  # User or system actor name string
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Categorical action name
    previous_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Nullable prior status state
    new_state: Mapped[str] = mapped_column(String(50), nullable=False)  # Post-transition status state
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Optional descriptive audit text
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)  # UTC audit stamp
```

---

## Chapter 5: Primary Keys, Composite Keys, Sequence Generation & Foreign Keys

### 5.1 Primary Key Mechanics & Integer Primary Key Optimization

In SQLite and relational engines, the primary key uniquely identifies each tuple in a relation. In SQLite specifically, declaring a column as `INTEGER PRIMARY KEY` creates an alias for SQLite's 64-bit signed integer `ROWID`. This creates a clustered B-Tree index, granting $O(1)$ point-lookup access speed.

Composite primary keys are constructed by marking multiple attributes with `primary_key=True`. This enforces a composite uniqueness constraint across the combination of keys.

```python
from sqlalchemy import String, Integer, ForeignKey  # Import core relational data types and foreign key
from sqlalchemy.orm import Mapped, mapped_column  # Import 2.0 mapped typing descriptors

class DepartmentSquadAssignment(Base):  # Define composite key technician assignment entity
    __tablename__ = "department_squad_assignments"  # Relational table name in SQLite
    department_id: Mapped[int] = mapped_column(  # First constituent column of composite primary key
        Integer,  # Integer relational storage type
        ForeignKey("departments.id", ondelete="CASCADE"),  # Cascade delete if parent department is deleted
        primary_key=True  # Designate as first half of composite primary key
    )  # Close department_id column definition
    technician_badge: Mapped[str] = mapped_column(  # Second constituent column of composite primary key
        String(50),  # Alphanumeric technician badge identifier string
        primary_key=True  # Designate as second half of composite primary key
    )  # Close technician_badge column definition
    duty_shift: Mapped[str] = mapped_column(String(30), nullable=False, default="MORNING")  # Assigned work shift
```

### 5.2 Foreign Key Constraints & Referential Integrity

A `ForeignKey("target_table.column")` construct establishes an explicit referential constraint between two relational tables. It guarantees that the value stored in the child column must exist within the referenced parent column.

In SQLite, foreign key enforcement is disabled by default for backwards compatibility. It must be explicitly enabled per connection via `PRAGMA foreign_keys = ON;`. In SQLAlchemy, this is achieved by attaching a listener to the `connect` event on the engine.

```python
from sqlalchemy import event, create_engine  # Import engine event registration decorator and engine factory
from sqlite3 import Connection as SQLite3Connection  # Import low-level SQLite connection type for type checking

sqlite_app_engine = create_engine("sqlite:///./data/app.db")  # Initialize application database engine

@event.listens_for(sqlite_app_engine, "connect")  # Attach hook firing upon each DBAPI connection checkout
def enable_sqlite_foreign_key_pragmas(dbapi_connection, connection_record):  # Callback executing low-level pragmas
    if isinstance(dbapi_connection, SQLite3Connection):  # Ensure underlying handle is native sqlite3 connection
        raw_cursor = dbapi_connection.cursor()  # Allocate raw low-level database cursor
        raw_cursor.execute("PRAGMA foreign_keys=ON;")  # Enforce relational foreign key constraints
        raw_cursor.execute("PRAGMA busy_timeout=5000;")  # Set 5000ms busy wait handler to mitigate database locks
        raw_cursor.close()  # Close raw cursor to release handle resources
```

---

## Chapter 6: Table Relationships: One-to-Many, Many-to-One, and Back-Populates Mechanics

### 6.1 Bidirectional Relationships and back_populates

In a relational database, table associations are established strictly through value matching across primary and foreign key columns. In Python memory, however, developers interact with an object graph where models hold direct references or collections of related entity objects. SQLAlchemy bridges this difference through the `relationship()` directive.

In SQLAlchemy 2.0, the bidirectional relationship synchronization must be configured explicitly using `back_populates` on both sides of the association. Legacy SQLAlchemy allowed `backref`, which magically injected an implicit attribute onto the target class at runtime. Modern engineering standards mandate `back_populates` because it guarantees that both classes explicitly declare their navigational properties, enabling full static type checking, code discovery, and autocomplete.

```text
Relational Foreign Key vs Object Graph Navigation:
┌─────────────────────────┐               ┌─────────────────────────┐
│     departments         │               │     maintenance_teams   │
│  id (PK)                │◄──────────────┤  department_id (FK)     │
│  name                   │   1-to-Many   │  name                   │
└─────────────────────────┘               └─────────────────────────┘
            │                                         │
     Python Object                             Python Object
┌─────────────────────────┐               ┌─────────────────────────┐
│   dept.teams            │ ────────────► │   team.department       │
│   (List[MaintenanceTeam])               │   (Department)          │
└─────────────────────────┘               └─────────────────────────┘
```

When an entity is assigned to one side of the relationship (e.g., `team.department = dept`), SQLAlchemy's instrumentation layer intercepts the attribute mutation and immediately appends `team` into `dept.teams` in memory, before any database flush occurs.

```python
from typing import List, Optional  # Import type hint containers for collections and nullable references
from sqlalchemy import String, Integer, ForeignKey  # Import core relational data types and foreign key
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship  # Import 2.0 ORM constructs

class RelBase(DeclarativeBase):  # Define isolated declarative base class for relationship models
    pass  # Class catalog placeholder

class Department(RelBase):  # Define department entity representing operational campus domains
    __tablename__ = "rel_departments"  # Physical table name in SQLite
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Primary key identifier
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # Division name
    teams: Mapped[List["MaintenanceTeam"]] = relationship(  # 1-to-Many collection of maintenance teams
        "MaintenanceTeam",  # Target related entity class name
        back_populates="department",  # Explicit reciprocal relationship attribute name on child
        cascade="all, delete-orphan"  # Cascade all lifecycle events and purge orphaned teams
    )  # Close teams relationship definition

class MaintenanceTeam(RelBase):  # Define maintenance team entity representing specialized repair squads
    __tablename__ = "rel_maintenance_teams"  # Physical table name in SQLite
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Primary key identifier
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # Team operational squad name
    department_id: Mapped[int] = mapped_column(  # Foreign key column referencing parent department ID
        Integer,  # Relational integer type
        ForeignKey("rel_departments.id", ondelete="CASCADE"),  # Enforce database-level cascade on deletion
        nullable=False  # Disallow orphaned teams without an assigned department
    )  # Close department_id column definition
    department: Mapped["Department"] = relationship(  # Many-to-1 navigational reference to parent
        "Department",  # Target parent entity class name
        back_populates="teams"  # Explicit reciprocal relationship attribute name on parent
    )  # Close department relationship definition
```

---

## Chapter 7: Many-to-Many Relationships & Association Object Patterns

### 7.1 Pure Secondary Table vs Association Object Pattern

When two entities exhibit a Many-to-Many relationship (e.g., Complaint Tickets and Diagnostic Tags, or Technicians and Tickets), relational theory dictates the insertion of an intermediate junction table. In SQLAlchemy, this can be implemented in two ways:

1. **Pure Secondary Table (`secondary=table`):**
   * Uses a raw SQLAlchemy `Table` construct containing only the two foreign keys.
   * Appropriate only if the association itself carries **zero** contextual metadata.
   * If you ever need to track *when* the association was created, *who* authorized it, or *what role* was assigned, the pure secondary table pattern fails and requires costly refactoring.

2. **The Association Object Pattern (Production Standard):**
   * Promotes the junction table to a full first-class declarative entity model.
   * Encapsulates composite primary keys alongside domain attributes (timestamps, assignment notes, technician role, active status flags).
   * Grants complete control over querying, auditing, and lifecycle events on the junction itself.

```python
from datetime import datetime  # Import standard datetime for assignment timestamping
from typing import List  # Import List container for 1-to-many relationship typing
from sqlalchemy import String, Integer, DateTime, ForeignKey  # Import relational types and keys
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship  # Import mapping primitives

class AssocBase(DeclarativeBase):  # Define declarative base for association object demonstration
    pass  # Class catalog definition

class TicketDispatch(AssocBase):  # Association object linking tickets to specialized technicians
    __tablename__ = "ticket_dispatches"  # Physical junction table name in SQLite
    ticket_id: Mapped[int] = mapped_column(  # Foreign key to ticket entity acting as composite PK part 1
        ForeignKey("dispatched_tickets.id", ondelete="CASCADE"),  # Cascade on ticket deletion
        primary_key=True  # Designate as part of composite primary key
    )  # Close ticket_id column
    technician_id: Mapped[int] = mapped_column(  # Foreign key to technician entity acting as composite PK part 2
        ForeignKey("technicians.id", ondelete="CASCADE"),  # Cascade on technician deletion
        primary_key=True  # Designate as part of composite primary key
    )  # Close technician_id column
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)  # Timestamp
    assignment_role: Mapped[str] = mapped_column(String(50), default="PRIMARY_LEAD", nullable=False)  # Role flag
    ticket: Mapped["DispatchedTicket"] = relationship(  # Navigational link back to ticket entity
        "DispatchedTicket",  # Target parent ticket class name
        back_populates="technician_assignments"  # Matching collection attribute name on ticket
    )  # Close ticket relationship
    technician: Mapped["Technician"] = relationship(  # Navigational link back to technician entity
        "Technician",  # Target parent technician class name
        back_populates="ticket_assignments"  # Matching collection attribute name on technician
    )  # Close technician relationship

class DispatchedTicket(AssocBase):  # Ticket entity participating in many-to-many relationship
    __tablename__ = "dispatched_tickets"  # Physical ticket table name
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Primary key identifier
    title: Mapped[str] = mapped_column(String(200), nullable=False)  # Complaint headline title
    technician_assignments: Mapped[List["TicketDispatch"]] = relationship(  # Navigational collection
        "TicketDispatch",  # Target association class name
        back_populates="ticket",  # Reciprocal scalar reference on association object
        cascade="all, delete-orphan"  # Purge dispatch records if ticket is destroyed
    )  # Close technician_assignments relationship

class Technician(AssocBase):  # Technician entity participating in many-to-many relationship
    __tablename__ = "technicians"  # Physical technician table name
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Primary key identifier
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # Full staff technician name
    ticket_assignments: Mapped[List["TicketDispatch"]] = relationship(  # Navigational collection
        "TicketDispatch",  # Target association class name
        back_populates="technician",  # Reciprocal scalar reference on association object
        cascade="all, delete-orphan"  # Purge dispatch records if technician is deleted
    )  # Close ticket_assignments relationship
```

---

## Chapter 8: Cascades and Lifecycle Propagation (`all, delete-orphan`)

### 8.1 The Cascade System Architecture

When a parent entity undergoes a lifecycle change (such as being persisted, merged, or deleted), SQLAlchemy's cascade system dictates whether and how that operation propagates downward to associated child entities in memory and in the database.

SQLAlchemy provides distinct cascade flags:
* **`save-update` (Default):** Adding a parent to a session automatically adds all reachable child objects.
* **`merge` (Default):** Merging a detached parent into a session cascades the merge operation across its relationship graph.
* **`expunge`:** Removing a parent from a session removes its related children from the session as well.
* **`delete`:** Deleting a parent emits `DELETE` statements for its associated child entities.
* **`delete-orphan`:** Automatically deletes a child entity if it is disassociated from its parent (e.g., removing a ticket from `department.tickets` via `department.tickets.remove(ticket)`). Without this flag, disassociating an object merely clears its foreign key, resulting in orphaned records in the database.
* **`all`:** A convenient shorthand representing `"save-update, merge, refresh-expire, expunge, delete"`. The standard production combination for strict parent-child ownership hierarchies is **`"all, delete-orphan"`**.

```python
from typing import List  # Import List typing construct for child collection annotations
from sqlalchemy import String, Integer, ForeignKey, create_engine  # Import relational types and engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session  # Import ORM tools

class CascadeBase(DeclarativeBase):  # Declarative base class for cascade behavior demonstration
    pass  # Class catalog definition

class ParentCategory(CascadeBase):  # Parent category entity owning multiple child sub-categories
    __tablename__ = "parent_categories"  # Physical category table name
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Category primary key
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # Name string
    children: Mapped[List["ChildSubcategory"]] = relationship(  # 1-to-many relationship with full orphan cleanup
        "ChildSubcategory",  # Child model class name
        back_populates="parent",  # Reciprocal parent property name on child
        cascade="all, delete-orphan",  # Automatically delete child if removed from list or parent deleted
        passive_deletes=True  # Delegate foreign key delete propagation to SQLite ON DELETE CASCADE
    )  # Close children relationship

class ChildSubcategory(CascadeBase):  # Child entity strictly owned by a parent category
    __tablename__ = "child_subcategories"  # Physical subcategory table name
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)  # Subcategory primary key
    parent_id: Mapped[int] = mapped_column(  # Foreign key column referencing parent category
        Integer,  # Relational integer type
        ForeignKey("parent_categories.id", ondelete="CASCADE"),  # Database-level cascade deletion
        nullable=False  # Disallow null parent foreign keys
    )  # Close parent_id column
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # Subcategory name string
    parent: Mapped["ParentCategory"] = relationship(  # Many-to-1 reference back to parent
        "ParentCategory",  # Parent model class name
        back_populates="children"  # Reciprocal collection name on parent
    )  # Close parent relationship

casc_engine = create_engine("sqlite:///:memory:")  # Create temporary in-memory database
CascadeBase.metadata.create_all(casc_engine)  # Create physical tables in memory

with Session(casc_engine) as session:  # Open transactional session
    cat = ParentCategory(name="Facilities")  # Instantiate parent category
    sub1 = ChildSubcategory(name="Air Conditioning")  # Instantiate first child subcategory
    sub2 = ChildSubcategory(name="Lighting")  # Instantiate second child subcategory
    cat.children.extend([sub1, sub2])  # Associate children via memory collection
    session.add(cat)  # Staging parent automatically cascades save-update to sub1 and sub2
    session.commit()  # Flush and commit all three entities to the database

with Session(casc_engine) as session:  # Open fresh session to test orphan deletion
    cat_db = session.get(ParentCategory, 1)  # Fetch parent category by primary key 1
    cat_db.children.pop(0)  # Remove first child ('Air Conditioning') from parent relationship list
    session.commit()  # Flush: SQLAlchemy detects orphaned child and issues DELETE statement automatically
```

---

## Chapter 9: Relationship Loading Strategies: Lazy vs Eager (joinedload, selectinload, subqueryload, contains_eager)

### 9.1 The $N+1$ Query Problem: Systems Anatomy

The most catastrophic performance anti-pattern in relational ORM engineering is the **$N+1$ Query Problem**. By default, SQLAlchemy relationships configure **lazy loading** (`lazy="select"`). Under this strategy, accessing a related collection does not fetch the related records when the parent is loaded; instead, it issues a brand-new `SELECT` query on-demand the exact microsecond the attribute is accessed in Python code.

Consider iterating over 100 complaint tickets to read each ticket's department name:
1. **1 Query:** `SELECT * FROM tickets;` (Fetches 100 ticket rows).
2. **$N$ (100) Queries:** As the loop evaluates `ticket.department.name` for each ticket, SQLAlchemy halts execution and issues an individual query: `SELECT * FROM departments WHERE id = ?;`.

Total network/database round-trips: $1 + 100 = 101$ queries. In a production environment with network latency, a 10-millisecond operation degrades into a multi-second outage.

```text
The N+1 Lazy Loading Trap:
[App Client] ──Query 1 (Get 100 Tickets)──> [DB: SELECT * FROM tickets] ──> Returns 100 rows
      │
      ├─ Loop Row 1: Read ticket.department ──Query 2──> [DB: SELECT * FROM dept WHERE id=1]
      ├─ Loop Row 2: Read ticket.department ──Query 3──> [DB: SELECT * FROM dept WHERE id=2]
      │  ...
      └─ Loop Row 100: Read ticket.dept ──Query 101──> [DB: SELECT * FROM dept WHERE id=5]
Total Round-Trips = 1 + 100 = 101 queries!

The Eager Loading Solution (selectinload):
[App Client] ──Query 1 (Get 100 Tickets)──> [DB: SELECT * FROM tickets] ──> Returns 100 rows
[App Client] ──Query 2 (Fetch all Depts)──> [DB: SELECT * FROM dept WHERE id IN (1,2,5)] ──> Returns 3 rows
Total Round-Trips = Exactly 2 queries!
```

### 9.2 Comparative Analysis of Eager Loading Strategies

To eliminate the $N+1$ problem, SQLAlchemy 2.0 provides explicit loading strategies via the `options()` clause:

| Loading Strategy | SQL Emission Pattern | Ideal Relationship Cardinality | Performance Characteristics & Limitations |
| :--- | :--- | :--- | :--- |
| **`joinedload()`** | Single query with `LEFT OUTER JOIN` | Many-to-One / One-to-One | Fetches parent and child in a single round-trip. Inefficient for One-to-Many collections because duplicate parent row data is transferred across the wire for every child record. |
| **`selectinload()`** | 2 queries: Initial query followed by `WHERE id IN (...)` | One-to-Many / Many-to-Many | Optimal for collections. Transmits zero duplicate data. Scales efficiently regardless of collection depth. Preferred standard in SQLAlchemy 2.0. |
| **`subqueryload()`**| 2 queries: Re-executes the original query as a subquery | One-to-Many with complex filters | Useful when `IN` clause parameter limits (such as SQLite's 999/32766 limit) are exceeded, but incurs query re-execution overhead on the database engine. |
| **`contains_eager()`**| Consumes columns already joined via an explicit `join()` | Filtered joins across relationships | Instructs SQLAlchemy to populate relationship attributes directly from columns already selected in the primary query's `join()`. |

```python
from sqlalchemy import select, create_engine  # Import query builder and engine initializer
from sqlalchemy.orm import joinedload, selectinload, Session  # Import eager loading query options
from app.models.ticket import Ticket  # Import production complaint ticket ORM model
from app.models.department import Department  # Import production department ORM model

demo_eng = create_engine("sqlite:///:memory:")  # Initialize ephemeral database engine for loader tests

with Session(demo_eng) as session:  # Open transactional session
    # 1. joinedload: Ideal for Many-to-One references (e.g. Ticket -> Department)
    # Generates: SELECT tickets.*, departments.* FROM tickets LEFT OUTER JOIN departments ON ...
    stmt_joined = select(Ticket).options(joinedload(Ticket.department)).limit(50)  # Single JOIN query
    tickets_with_dept = session.execute(stmt_joined).scalars().all()  # Materialize tickets with pre-populated dept

    # 2. selectinload: The production gold standard for One-to-Many collections (e.g. Department -> Tickets)
    # Generates Query 1: SELECT * FROM departments;
    # Generates Query 2: SELECT * FROM tickets WHERE department_id IN (1, 2, 3, ...);
    stmt_selectin = select(Department).options(selectinload(Department.tickets))  # Two clean, decoupled queries
    departments_with_tickets = session.execute(stmt_selectin).scalars().all()  # Materialize depts with collections
```

---

## Chapter 10: The Async / ASGI Lazy Loading Hazard & Greenlet Mechanics

### 10.1 The Greenfield Hazard: DetachedInstanceError & MissingGreenlet

In modern asynchronous Python web frameworks (such as FastAPI with `AsyncSession`), lazy loading is not merely an architectural inefficiency—it is an **unrecoverable fatal crash**.

When an entity is loaded asynchronously, its database socket is released back to the event loop. If your code or a Pydantic response serializer later evaluates an un-loaded relationship (e.g., `ticket.department`), SQLAlchemy detects that the attribute is missing and attempts to issue a synchronous I/O query to SQLite. Because the asynchronous event loop strictly forbids blocking synchronous socket/file I/O, the operation fails catastrophically, raising:
`sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can't call a synchronous function in an async context.`

Furthermore, if the session has already closed (which routinely occurs after a FastAPI dependency exits), accessing that same un-loaded attribute raises:
`sqlalchemy.orm.exc.DetachedInstanceError: Parent instance <Ticket at 0x...> is not bound to a Session; lazy load operation of attribute 'department' cannot proceed.`

```text
The Async Crash Lifecycle:
1. FastAPI Route executes: `result = await session.execute(select(Ticket))`
2. Database connection checks back into pool.
3. Route exits; FastAPI dependency closes `session`.
4. FastAPI serializes return value via Pydantic: `TicketResponse.model_validate(ticket)`
5. Pydantic accesses `ticket.department`
6. SQLAlchemy attempts lazy load on closed session / outside greenlet context.
7. CRASH: DetachedInstanceError / MissingGreenlet (HTTP 500 Internal Server Error)
```

### 10.2 Architectural Prevention: Strict Eager Loading & Expire on Commit

To prevent these crashes across ASGI architectures:
1. **Always Eagerly Load Related Models:** Use `selectinload()` or `joinedload()` in every query whose result will be passed to a response serializer.
2. **Configure `expire_on_commit=False`:** When creating `sessionmaker` or `async_sessionmaker`, always set `expire_on_commit=False`. This prevents SQLAlchemy from expiring entity attributes upon transaction commit, allowing response models to read loaded attributes safely even after the database transaction has finalized.

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession  # Import async ORM tools
from sqlalchemy import select  # Import 2.0 select query builder
from sqlalchemy.orm import selectinload  # Import selectinload eager loading option
from app.models.department import Department  # Import Department domain model

# Configure asynchronous SQLite database engine using aiosqlite driver
async_engine = create_async_engine(  # Initialize non-blocking async engine
    "sqlite+aiosqlite:///./data/complaints.db",  # SQLite URI with aiosqlite async driver prefix
    echo=False  # Disable query console logging
)  # Finalize async engine configuration

# Instantiate production async sessionmaker with explicit expire_on_commit suppression
AsyncSessionLocal = async_sessionmaker(  # Construct async session factory
    bind=async_engine,  # Bind sessionmaker to the non-blocking async engine
    class_=AsyncSession,  # Explicitly declare session class as AsyncSession
    expire_on_commit=False,  # CRITICAL: Prevent attribute expiration on commit to avoid MissingGreenlet
    autoflush=False  # Prevent automatic mid-query flushes
)  # Finalize session factory definition

async def fetch_departments_safely() -> list[Department]:  # Asynchronous service query function
    async with AsyncSessionLocal() as async_session:  # Open isolated async session context manager
        # Construct query with explicit selectinload to preload child collections in the async pass
        query = select(Department).options(selectinload(Department.tickets))  # Preload tickets collection
        result = await async_session.execute(query)  # Await non-blocking query execution on event loop
        return list(result.scalars().all())  # Return materialized models safe for detached serialization
```

---

## Chapter 11: The SQLAlchemy 2.0 Query Paradigm: select(), insert(), update(), delete()

### 11.1 The Result Execution Pipeline: Result, ScalarResult, and Scalars

In SQLAlchemy 2.0, executing any statement via `session.execute(statement)` returns a generic `Result` object. The `Result` represents an iterable buffer over tabular database rows (tuples of columns or entities). To extract mapped entity instances from this tabular structure, SQLAlchemy provides the `.scalars()` adapter:

```text
session.execute(select(Ticket)) ──> Result (Tabular Row Tuples: [(Ticket_1,), (Ticket_2,)])
                                            │
                                            ▼ .scalars()
                                   ScalarResult (Unwrapped Entities: [Ticket_1, Ticket_2])
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
        .all() -> List                .first() -> Entity/None       .one() -> Entity (or Error)
```

The key scalar extraction methods:
* **`scalars().all()`:** Returns a Python list containing all matching entity instances.
* **`scalars().first()`:** Returns the first entity instance or `None` if the result set is empty without raising an exception.
* **`scalar_one_or_none()`:** Returns exactly one entity or `None`. If more than one row matches, it raises `sqlalchemy.exc.MultipleResultsFound`.
* **`scalar_one()`:** Returns exactly one entity. If zero rows match, it raises `NoResultFound`; if more than one row matches, it raises `MultipleResultsFound`.

```python
from sqlalchemy import select, insert, update, delete, create_engine  # Import Core DML and DQL builders
from sqlalchemy.orm import Session  # Import session management class
from app.models.ticket import Ticket  # Import Ticket domain entity
from app.models.department import Department  # Import Department domain entity

test_engine = create_engine("sqlite:///:memory:")  # Initialize in-memory database engine

with Session(test_engine) as session:  # Open isolated database session
    # 1. SELECT Query with explicit scalar unwrapping
    query = select(Ticket).where(Ticket.status == "SUBMITTED").order_by(Ticket.created_at.desc())  # Build query AST
    active_tickets = session.execute(query).scalars().all()  # Materialize all matching tickets into list

    # 2. 2.0-Style Direct UPDATE Statement
    update_stmt = (  # Build immutable update AST modifying status in bulk
        update(Ticket)  # Target ticket table
        .where(Ticket.id == 42)  # Predicate identifying target ticket
        .values(status="IN_PROGRESS", resolution_notes="Assigned to technician")  # Values dict
    )  # Close update statement
    session.execute(update_stmt)  # Dispatch compiled SQL UPDATE to engine

    # 3. 2.0-Style Direct DELETE Statement
    delete_stmt = delete(Ticket).where(Ticket.status == "CANCELLED")  # Build delete statement AST
    session.execute(delete_stmt)  # Dispatch compiled SQL DELETE to engine
    session.commit()  # Commit transaction boundary to persist all modifications
```

---

## Chapter 12: Advanced Filtering, Expressions, Aggregations, Grouping & Having

### 12.1 Logical Operators, Range Queries & Null Handling

SQLAlchemy expressions overload Python standard operators (`==`, `!=`, `<`, `>`, `&`, `|`, `~`) to produce SQL AST expression nodes rather than native booleans. To build complex boolean expressions, SQLAlchemy provides explicit functional operators:
* `and_(*clauses)`: Conjoins multiple clauses with SQL `AND`.
* `or_(*clauses)`: Conjoins multiple clauses with SQL `OR`.
* `not_(clause)`: Inverts a predicate with SQL `NOT`.
* `column.in_(iterable)`: Translates to `column IN (?, ?, ...)`.
* `column.is_(None)` / `column.is_not(None)`: Enforces ANSI SQL standard `IS NULL` and `IS NOT NULL`.

```python
from sqlalchemy import select, and_, or_, not_  # Import relational boolean logical operators
from app.models.ticket import Ticket  # Import Ticket model entity

# Query identifying high-priority escalated tickets requiring immediate squad intervention
escalated_tickets_stmt = (  # Construct composite predicate query
    select(Ticket)  # Target Ticket entity
    .where(  # Apply multi-clause boolean filter
        and_(  # Conjoin conditions with logical AND
            Ticket.status.in_(["SUBMITTED", "IN_PROGRESS"]),  # Must be in an active operational state
            or_(  # Match either high urgency or critical escalation
                Ticket.priority == "CRITICAL",  # Priority tier check
                and_(Ticket.priority == "HIGH", Ticket.assigned_team_id.is_(None))  # High but unassigned
            ),  # Close OR branch
            not_(Ticket.title.like("%[TEST]%"))  # Exclude test grievances using SQL NOT LIKE
        )  # Close AND branch
    )  # Close where clause
)  # Finalize statement construction
```

### 12.2 SQL Aggregations: func, GROUP BY, and HAVING

The `func` object is a dynamic SQL function generator. Accessing any attribute on `func` (such as `func.count()`, `func.avg()`, `func.max()`, `func.min()`, `func.coalesce()`) produces the corresponding SQL function call in the target dialect.

When computing aggregate analytics across campus departments, combining `func` with `group_by()` and `having()` allows high-performance summary calculations directly inside the SQLite engine, eliminating the memory overhead of loading thousands of raw rows into Python.

```python
from sqlalchemy import select, func, desc  # Import aggregation function helper and ordering primitives
from app.models.ticket import Ticket  # Import Ticket domain entity
from app.models.department import Department  # Import Department domain entity

# Analytics query: Compute total grievances and unresolved backlog per department
analytics_stmt = (  # Build relational aggregation query AST
    select(  # Project department metadata and aggregated metric values
        Department.name.label("department_name"),  # Department operational label
        func.count(Ticket.id).label("total_tickets"),  # Total count of all historical tickets
        func.sum(  # Conditional sum counting only active grievances
            func.case(  # SQL CASE expression returning 1 for active states and 0 for resolved
                (Ticket.status.in_(["SUBMITTED", "IN_PROGRESS"]), 1),  # Active state condition
                else_=0  # Inactive or resolved condition
            )  # Close CASE construct
        ).label("active_backlog")  # Label calculated sum as active backlog
    )  # Close projection list
    .join(Ticket, Department.id == Ticket.department_id)  # Perform inner join linking tickets to departments
    .group_by(Department.id, Department.name)  # Group results by department unique identifiers
    .having(func.count(Ticket.id) > 5)  # Restrict to departments with more than 5 registered complaints
    .order_by(desc("active_backlog"))  # Sort output by highest active backlog descending
)  # Finalize statement AST
```

---

## Chapter 13: Bulk Operations, Batch Inserts, and Returning Clauses

### 13.1 Bulk Insert Performance: Session.add() vs Bulk insert()

When ingesting large batches of records (such as CSV grievance imports or historical audit migrations), adding entities individually via `session.add(model)` causes substantial latency. Every individual entity added to the session must be instantiated in Python, registered in the Identity Map, tracked for attribute mutations, and flushed as an individual SQL `INSERT` statement.

For high-throughput ingestion, SQLAlchemy 2.0 provides direct bulk parameter execution using Core `insert()`. By passing a list of dictionaries to `session.execute(insert(Model), list_of_dicts)`, SQLAlchemy bypasses the Identity Map overhead and emits an optimized multi-row SQL insert in a single DBAPI cursor execution call.

```python
from typing import List, Dict, Any  # Import standard typing containers for payload dictionaries
from sqlalchemy import insert  # Import insert construct from SQLAlchemy Core
from sqlalchemy.orm import Session  # Import transactional session class
from app.models.ticket import Ticket  # Import Ticket domain entity

def bulk_ingest_grievances(session: Session, records: List[Dict[str, Any]]) -> None:  # Ingestion function
    if not records:  # Guard against empty payload lists to avoid redundant database calls
        return  # Return early if records list is empty

    # Execute high-performance multi-row batch insert bypassing ORM identity tracking
    insert_stmt = insert(Ticket)  # Target Ticket table for batch insertion
    session.execute(insert_stmt, records)  # Dispatch all dictionaries in a single multi-row DBAPI call
    session.commit()  # Commit transaction boundary to persist batch to disk
```

### 13.2 The RETURNING Clause (SQLite 3.35+)

Starting with version 3.35.0, SQLite natively supports the SQL standard `RETURNING` clause. This allows an `INSERT`, `UPDATE`, or `DELETE` statement to atomically return computed columns (such as auto-incremented primary keys, default timestamps, or updated statuses) in the same round-trip without requiring an expensive secondary `SELECT` lookup.

```python
from sqlalchemy import insert  # Import insert statement builder
from app.models.ticket import Ticket  # Import Ticket domain entity

# Construct an insert statement returning generated primary keys and default values atomically
returning_insert_stmt = (  # Build parameterized insert statement
    insert(Ticket)  # Target Ticket model table
    .values(  # Provide column values for newly ingested ticket
        tracking_code="TICK-9021",  # Public unique grievance tracking code
        title="Elevator brake fault",  # Issue headline summary
        description="Grinding noise during descent between floors 3 and 2",  # Grievance description text
        location="Hostel Tower A",  # Campus physical location
        priority="CRITICAL",  # Severity tier
        status="SUBMITTED"  # Initial lifecycle state machine status
    )  # Close values dictionary
    .returning(Ticket.id, Ticket.created_at)  # Atomically retrieve generated ID and server UTC timestamp
)  # Finalize statement AST
```

---

## Chapter 14: The Session Lifecycle, Transactional Boundaries & sessionmaker Factory

### 14.1 The Session: Operational Concept & Invariants

The `Session` is the fundamental operational coordinator in SQLAlchemy ORM. It establishes a transactional conversation with the database, maintaining:
1. **The DBAPI Connection Reference:** Checks out a physical database connection from the pool on demand and holds it until transaction completion.
2. **The Identity Map:** An in-memory cache mapping `(ModelClass, primary_key)` to exactly one live Python instance.
3. **The Unit of Work Buffer:** A collection of pending object additions, dirty attribute modifications, and pending deletions.

### 14.2 The Explicit Transaction Lifecycle: session.begin()

In SQLAlchemy 2.0, transactions are strictly explicit. The recommended production pattern utilizes the context manager syntax `with session.begin():`. If an unhandled exception occurs inside the block, SQLAlchemy catches it, automatically issues a `ROLLBACK` to SQLite, and re-raises the error. If the block completes successfully, SQLAlchemy issues a `COMMIT` to persist all changes atomically.

```python
from sqlalchemy import create_engine  # Import engine initialization factory
from sqlalchemy.orm import sessionmaker  # Import session factory generator
from app.models.ticket import Ticket  # Import Ticket model entity

engine = create_engine("sqlite:///./data/complaints.db")  # Initialize database engine

# Define the standard production SessionLocal session factory
SessionLocal = sessionmaker(  # Construct reusable session factory
    bind=engine,  # Bind sessionmaker to application engine
    autoflush=False,  # Prevent premature implicit flushing prior to validation
    expire_on_commit=False  # Keep loaded attributes valid in memory after commit
)  # Finalize sessionmaker configuration

def resolve_ticket_transaction(ticket_id: int, audit_notes: str) -> None:  # Transactional resolution workflow
    with SessionLocal() as session:  # Instantiate new independent transactional session
        with session.begin():  # Demarcate atomic transaction boundary (commits on exit, rolls back on error)
            ticket = session.get(Ticket, ticket_id)  # Retrieve target ticket from identity map or database
            if ticket is None:  # Check if ticket exists in database
                raise ValueError(f"Ticket with ID {ticket_id} does not exist.")  # Raise error aborting transaction
            ticket.status = "RESOLVED"  # Update state machine lifecycle status
            ticket.resolution_notes = audit_notes  # Record mandatory engineering resolution audit log
        # At this point, session.begin() has issued COMMIT, releasing the database lock
```

---

## Chapter 15: The Unit of Work Pattern & Topological Flush Sorting

### 15.1 The Unit of Work Architectural Pattern

The **Unit of Work** pattern (formalized by Martin Fowler) maintains a list of business objects affected by a business transaction and coordinates the writing out of changes and the resolution of concurrency problems.

When you modify objects in SQLAlchemy (e.g., calling `session.add(child)`, updating `ticket.status = "IN_PROGRESS"`, or calling `session.delete(old_record)`), the database is **not** immediately contacted. Instead, the session buffers these mutations in memory. Only when `session.flush()` or `session.commit()` is invoked does SQLAlchemy compute the exact delta between the Python memory state and the database state.

### 15.2 Topological Sorting of Flush Statements

During the flush phase, SQLAlchemy does not emit SQL statements in the arbitrary order in which Python code was executed. Doing so would frequently violate foreign key constraints (e.g., trying to insert a child `MaintenanceTeam` before its parent `Department` has been assigned a primary key).

SQLAlchemy builds a **Directed Acyclic Graph (DAG)** of all pending operations and executes a **topological sort**:
1. All `INSERT` statements for parent tables (e.g., `departments`) are executed first.
2. Generated parent primary keys are propagated to child in-memory instances.
3. All `INSERT` statements for child tables (e.g., `maintenance_teams`, `tickets`) are executed.
4. All `UPDATE` statements for modified existing entities are executed.
5. All `DELETE` statements are executed in reverse topological order (children deleted before parents to satisfy foreign key constraints).

```text
Topological Flush Execution Order:
[Parent Entity: Department] ──(Insert 1st)──> Generates department.id = 1
                                                     │
                                                     ▼ (Assigns FK)
[Child Entity: MaintenanceTeam] ──(Insert 2nd)──> maintenance_teams.department_id = 1
                                                     │
                                                     ▼ (Assigns FK)
[Child Entity: Ticket] ─────────(Insert 3rd)──> tickets.assigned_team_id = 1
```

```python
from sqlalchemy import create_engine  # Import engine constructor
from sqlalchemy.orm import Session  # Import session management class
from app.models.department import Department  # Import Department parent entity
from app.models.team import MaintenanceTeam  # Import MaintenanceTeam child entity

db_engine = create_engine("sqlite:///:memory:")  # Initialize in-memory SQLite engine

with Session(db_engine) as session:  # Open transactional session
    # Code execution order is intentionally reversed in Python
    team = MaintenanceTeam(name="HVAC Emergency Squad")  # Create child entity first without foreign key
    dept = Department(name="Heating & Air Division")  # Create parent entity second
    team.department = dept  # Link child to parent via relationship descriptor
    session.add(team)  # Stage child entity; cascade automatically stages parent 'dept'
    # When flush() is invoked, SQLAlchemy analyzes foreign key dependencies, inserts Department first,
    # extracts dept.id, assigns it to team.department_id, and inserts MaintenanceTeam second.
    session.flush()  # Compute topological DAG and emit ordered SQL statements
```

---

## Chapter 16: The Identity Map & In-Memory Entity Caching

### 16.1 The Identity Map Pattern: Structure & Invariants

The **Identity Map** pattern ensures that each database row is represented by exactly **one** object instance inside a given `Session`. Internally, the identity map is implemented as a dictionary keyed by the composite tuple of the entity's mapped class and its primary key: `(Class, (primary_key_value,))`.

This pattern provides two fundamental guarantees:
1. **Zero Redundant Database Round-Trips:** If your code requests the same entity multiple times in the same transaction (e.g., calling `session.get(Department, 1)` in five distinct business functions), the database is queried exactly once. Subsequent lookups are resolved in $O(1)$ memory time directly from the Identity Map.
2. **Deterministic Identity & Pointer Equality:** If two different parts of your application load the same database row, they receive pointers to the identical Python object in memory (`obj_a is obj_b` evaluates to `True`). Mutations made to `obj_a` are immediately visible on `obj_b` with zero synchronization lag.

```python
from sqlalchemy import create_engine  # Import engine creation factory
from sqlalchemy.orm import Session  # Import session management class
from app.models.department import Department  # Import Department domain model

ram_engine = create_engine("sqlite:///:memory:")  # Create in-memory database engine

with Session(ram_engine) as session:  # Open isolated database session
    # Initial query: Row does not exist in Identity Map, so SQLAlchemy executes SQL SELECT against database
    dept_first_fetch = session.get(Department, 1)  # Executes SELECT ... WHERE id = 1

    # Secondary lookup: SQLAlchemy detects (Department, (1,)) in Identity Map and returns cached instance
    dept_second_fetch = session.get(Department, 1)  # ZERO SQL emitted; instant O(1) in-memory lookup

    # Verify that both variables point to the identical Python heap memory address
    assert dept_first_fetch is dept_second_fetch  # Strict pointer identity verification evaluates True
```

---

## Chapter 17: Session States: Transient, Pending, Persistent, and Detached

### 17.1 The Four Object States

Every mapped entity instance in an application always exists in exactly one of four distinct lifecycle states relative to a `Session`:

1. **Transient:**
   * The object has been instantiated in Python (e.g., `t = Ticket(title="Broken AC")`), but has never been associated with a `Session`.
   * It has no relational representation in the database and no assigned primary key.
2. **Pending:**
   * The object has been associated with a session via `session.add(t)`, but has not yet been flushed to the database.
   * It is queued in the Unit of Work's pending insertion set.
3. **Persistent:**
   * The object has a corresponding row in the database and is registered in the session's Identity Map.
   * This state occurs either after a `session.flush()` of a pending instance or immediately upon loading an existing record via `session.get()` or `select()`.
4. **Detached:**
   * The object corresponds to a database row and possesses a primary key, but is no longer bound to any active session (e.g., following `session.close()` or `session.expunge(t)`).
   * Modifying attributes on a detached object has zero effect on the database, and attempting to access un-loaded relationships will raise a `DetachedInstanceError`.

```text
The Entity State Machine:
 [Transient Object] ──────session.add()──────► [Pending Object]
                                                      │
                                                session.flush()
                                                      ▼
 [Detached Object] ◄──────session.close()───── [Persistent Object]
         │                                            │
         └─────────────session.merge()────────────────┘
```

```python
from sqlalchemy import inspect, create_engine  # Import inspector utility and engine factory
from sqlalchemy.orm import Session  # Import session management class
from app.models.ticket import Ticket  # Import Ticket domain model

test_eng = create_engine("sqlite:///:memory:")  # Create in-memory database engine

with Session(test_eng) as session:  # Open isolated database session
    # 1. TRANSIENT: Freshly allocated in Python heap memory, unknown to database
    ticket = Ticket(title="Leaking valve", description="Water drip", location="Lab 1")  # Instantiate model
    ticket_state = inspect(ticket)  # Inspect state machine descriptor for ticket instance
    assert ticket_state.transient  # Verify instance is in transient state

    # 2. PENDING: Staged into session Unit of Work buffer, not yet flushed
    session.add(ticket)  # Register instance into active session
    assert ticket_state.pending  # Verify instance has transitioned to pending state

    # 3. PERSISTENT: Flushed to physical SQLite table, assigned primary key
    session.flush()  # Emit SQL INSERT statement and retrieve generated primary key
    assert ticket_state.persistent  # Verify instance is now persistent and identity-mapped

# 4. DETACHED: Session context has exited and closed DB connection
assert ticket_state.detached  # Verify instance is now detached from closed session
```

---

## Chapter 18: Schema Reflection, Inspection & DDL Generation (MetaData & inspect)

### 18.1 Runtime Schema Inspection with inspect()

SQLAlchemy provides a unified runtime inspection system via the top-level `inspect()` function. Passing an engine, a connection, a mapped class, or an entity instance into `inspect()` returns specialized inspection objects (`Inspector`, `Mapper`, `InstanceState`) that expose the underlying relational metadata at runtime.

This mechanism is vital for building dynamic diagnostic endpoints, automated test assertions, and schema drift detectors.

```python
from sqlalchemy import inspect, create_engine  # Import schema inspector and engine factory
from app.core.database import engine  # Import configured application engine

def audit_database_schema() -> dict:  # Define schema inspection diagnostic utility
    schema_inspector = inspect(engine)  # Instantiate Inspector bound to physical database engine
    table_manifest = {}  # Initialize dictionary to store table column metadata

    # Retrieve all table names currently materialized in the SQLite database file
    table_names = schema_inspector.get_table_names()  # Fetch list of existing physical table strings

    for table in table_names:  # Iterate over each discovered relational table
        columns = schema_inspector.get_columns(table)  # Inspect column definitions for current table
        foreign_keys = schema_inspector.get_foreign_keys(table)  # Inspect foreign key constraints
        table_manifest[table] = {  # Store extracted table schema metadata
            "column_count": len(columns),  # Total count of columns defined in table
            "columns": [col["name"] for col in columns],  # List of physical column string identifiers
            "foreign_keys": [fk["constrained_columns"] for fk in foreign_keys]  # List of foreign key targets
        }  # Close table metadata assignment

    return table_manifest  # Return complete schema manifest for diagnostic auditing
```

---

## Chapter 19: Core SQL Expression Language & Hybrid Properties / Expressions

### 19.1 The Hybrid Property Pattern

In enterprise domain modeling, calculated attributes frequently need to be evaluated in two completely different contexts:
1. **In Python Memory (Object-Level):** Evaluating an attribute on an already-loaded entity instance in Python (e.g., `if ticket.is_overdue: ...`).
2. **In SQL Queries (Database-Level):** Filtering or ordering rows in a SQL query before they are loaded into memory (e.g., `select(Ticket).where(Ticket.is_overdue)`).

Without hybrid properties, developers are forced to write two duplicate logic routines: a Python property method and a separate SQLAlchemy Core SQL expression.

SQLAlchemy solves this through the `@hybrid_property` and `@hybrid_property.expression` decorators:

```python
from datetime import datetime  # Import standard datetime for timestamp calculations
from sqlalchemy import func, select, DateTime  # Import SQL function compiler and query builders
from sqlalchemy.orm import Mapped, mapped_column  # Import declarative mapping primitives
from sqlalchemy.ext.hybrid import hybrid_property  # Import hybrid property extension decorators
from app.models.base import Base  # Import root declarative base class

class ComplaintSLAEntity(Base):  # Define complaint entity with hybrid SLA deadline calculations
    __tablename__ = "complaint_sla_entities"  # Physical table name in SQLite
    id: Mapped[int] = mapped_column(primary_key=True)  # Primary key integer identifier
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)  # Intake UTC timestamp
    sla_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # Contractual resolution deadline
    status: Mapped[str] = mapped_column(default="SUBMITTED")  # Lifecycle state string

    @hybrid_property  # Python-level evaluation on in-memory instance
    def is_overdue(self) -> bool:  # Returns boolean indicating if deadline has elapsed
        return self.status != "RESOLVED" and datetime.utcnow() > self.sla_deadline  # In-memory comparison

    @is_overdue.expression  # SQL-level AST evaluation compiled into database query
    def is_overdue(cls):  # Emits SQL boolean expression for database-level WHERE filtering
        return (cls.status != "RESOLVED") & (func.datetime("now") > cls.sla_deadline)  # SQL expression AST
```

---

## Chapter 20: Database Events, Listeners & Lifecycle Hooks (before_insert, after_update)

### 20.1 The Event Subsystem Architecture

SQLAlchemy features a comprehensive, event-driven interception framework. Events allow engineers to attach callbacks to specific lifecycle points across engines, connections, sessions, and individual ORM mappers.

Key ORM lifecycle events:
* **`before_insert`:** Fired before an entity's `INSERT` statement is emitted during a flush. Ideal for generating tracking codes, computing derived fields, or assigning cryptographic signatures.
* **`before_update`:** Fired before an `UPDATE` statement is flushed. Ideal for enforcing state transition rules and updating audit timestamps.
* **`after_update` / `after_delete`:** Fired after the database statement executes. Ideal for dispatching notifications, triggering cache invalidations, or recording audit records.

```python
import uuid  # Import UUID generator for unique tracking token synthesis
from sqlalchemy import event  # Import core event interception module
from app.models.ticket import Ticket  # Import Ticket domain entity

# Intercept Ticket entity right before its INSERT statement is flushed to SQLite
@event.listens_for(Ticket, "before_insert")  # Attach listener to Ticket mapper before_insert event
def generate_ticket_tracking_code(mapper, connection, target):  # Event callback signature
    if not target.tracking_code:  # Check if tracking code has not been manually assigned
        # Generate deterministic prefix followed by first 8 uppercase characters of a fresh UUID
        unique_suffix = uuid.uuid4().hex[:8].upper()  # Synthesize unique random alphanumeric token
        target.tracking_code = f"TICK-{unique_suffix}"  # Assign synthesized tracking code to target entity
```

---

## Chapter 21: FastAPI Integration: Generator Dependencies, Scoped Sessions & Middleware

### 21.1 The Canonical Generator Dependency Pattern

In FastAPI applications, the industry-standard pattern for managing database sessions is the **Generator Dependency** (`yield`).

```text
The FastAPI Request/Response Database Session Lifecycle:
1. Incoming HTTP Request ──> Uvicorn / Starlette Routing
2. FastAPI resolves dependency: `db: Session = Depends(get_db)`
3. `get_db()` instantiates `db = SessionLocal()`
4. `yield db` suspends execution and passes `db` into the route handler.
5. Route Handler runs queries, modifies data, and returns response payload.
6. FastAPI resumes `get_db()` immediately after `yield`.
7. `finally:` block executes unconditionally: `db.close()`.
8. Physical connection is returned to the pool; transaction locks are cleared.
```

If an unhandled exception or HTTP error occurs inside the route handler, execution jumps immediately to the `finally:` block of `get_db()`. This guarantees that database connections are never leaked and SQLite file locks are released without fail.

```python
from typing import Generator  # Import generator typing construct for dependency signature
from fastapi import FastAPI, Depends, HTTPException, status  # Import FastAPI framework building blocks
from sqlalchemy.orm import Session  # Import Session typing primitive
from app.core.database import SessionLocal  # Import sessionmaker factory from core
from app.models.ticket import Ticket  # Import Ticket domain model

app = FastAPI()  # Initialize FastAPI application instance

def get_db() -> Generator[Session, None, None]:  # Canonical database session dependency provider
    db = SessionLocal()  # Instantiate fresh independent database session for the request
    try:  # Guard session block to ensure deterministic teardown
        yield db  # Suspend and yield session handle directly to calling route handler
    finally:  # Unconditionally executed upon route completion or exception raising
        db.close()  # Close session, roll back uncommitted work, and return connection to pool

@app.get("/tickets/{ticket_id}")  # Declare HTTP GET endpoint for ticket retrieval
def retrieve_ticket(ticket_id: int, db: Session = Depends(get_db)):  # Inject database session dependency
    ticket = db.get(Ticket, ticket_id)  # Fetch ticket by primary key using identity map lookup
    if not ticket:  # Check if ticket was found in database
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")  # Return 404
    return {"id": ticket.id, "tracking_code": ticket.tracking_code, "status": ticket.status}  # Return DTO
```

---

## Chapter 22: The SQLAlchemy 2.0 Systems Engineering Mastery Checklist

### 22.1 Production Systems Verification Checklist

Before deploying any service utilizing SQLAlchemy 2.0 and SQLite to production, verify that every item on this architectural checklist is satisfied:

```markdown
- [ ] 1. SQLAlchemy 2.0 Query Syntax: Zero occurrences of legacy `session.query()`. All queries use `select()`.
- [ ] 2. Static Type Declarations: All models declare attributes via `Mapped[T]` and `mapped_column()`.
- [ ] 3. Explicit Transactions: Transactions demarcated explicitly via `with session.begin():` or `session.commit()`.
- [ ] 4. SQLite Foreign Keys Enabled: `PRAGMA foreign_keys = ON;` registered on engine connect event.
- [ ] 5. Write-Ahead Logging (WAL): Engine verifies `PRAGMA journal_mode = WAL;` and `busy_timeout = 5000;`.
- [ ] 6. Expire on Commit Disabled: `sessionmaker(expire_on_commit=False)` configured to prevent async greenlet errors.
- [ ] 7. N+1 Query Elimination: Eager loading (`selectinload()` for collections, `joinedload()` for many-to-one) applied to all serialized relationships.
- [ ] 8. Bidirectional Relationships: All `relationship()` definitions use explicit `back_populates`.
- [ ] 9. Strict Cascade Hygiene: Child ownership relationships declare `cascade="all, delete-orphan"`.
- [ ] 10. Bulk Ingestion Optimization: High-throughput ingestion uses Core `insert()` with value lists, bypassing Identity Map.
- [ ] 11. Modern Returning Clauses: SQLite 3.35+ `returning()` utilized to retrieve server-computed keys in single round-trips.
- [ ] 12. Generator Teardown: FastAPI routes receive database sessions via `yield` dependency ensuring `db.close()`.
```
