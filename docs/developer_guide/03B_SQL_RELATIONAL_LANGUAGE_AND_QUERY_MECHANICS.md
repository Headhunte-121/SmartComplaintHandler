# Guide 03B: SQL Relational Language, Query Mechanics, and Transactional Integrity

Welcome to the foundational systems engineering manual for the **Structured Query Language (SQL)** and relational database algebra within the **SmartComplaintHandler** platform.

In municipal civic infrastructure, complaint records, citizen audit trails, departmental assignments, and SLA deadlines must be stored with uncompromising mathematical consistency. Before examining the low-level B-Tree paging mechanics of SQLite ([Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)) or abstracting queries through the SQLAlchemy Object-Relational Mapper ([Guide 05: SQLAlchemy ORM and Data Layer](05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)), every systems engineer must master raw relational algebra and declarative SQL syntax.

This manual establishes the foundational mechanics of table creation, relational constraints, declarative querying, set-theoretic joins, subqueries, indexing, and ACID transactional boundaries.

---

## Prerequisites and Cross-Document Reference Map

This manual serves as the direct prerequisite for all storage and data persistence manuals across the repository:
* [Guide 01: Python Language and Runtime Mechanics](01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md) - Python primitive types and string manipulation.
* [Guide 03: Pydantic V2 Data Validation and Schemas](03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md) - Data transfer objects and schema validation mirrored in SQL column types.
* [Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md) - How SQL statements are translated into B-Tree operations and Write-Ahead Log frames.
* [Guide 05: SQLAlchemy ORM and Data Layer](05_SQLALCHEMY_ORM_AND_DATA_LAYER.md) - Object-Relational mapping abstractions compiled down to raw SQL dialect queries.
* [Guide 16: Database Migrations with Alembic](16_DATABASE_MIGRATIONS_WITH_ALEMBIC.md) - Programmatic schema evolution and migration script compilation.

---

## Table of Contents
1. [Chapter 1: The Relational Paradigm: Relations, Tuples, Attributes, and Edgar F. Codd's Foundations](#chapter-1-the-relational-paradigm-relations-tuples-attributes-and-edgar-f-codds-foundations)
2. [Chapter 2: Data Definition Language (DDL): Schema Creation](#chapter-2-data-definition-language-ddl-schema-creation)
3. [Chapter 3: Integrity Constraints: Primary Keys, Foreign Keys, `NOT NULL`, `UNIQUE`, and `CHECK`](#chapter-3-integrity-constraints-primary-keys-foreign-keys-not-null-unique-and-check)
4. [Chapter 4: Schema Evolution: `ALTER TABLE`, Dropping Columns, and Constraints Migration](#chapter-4-schema-evolution-alter-table-dropping-columns-and-constraints-migration)
5. [Chapter 5: Data Manipulation Language (DML): Inserting Rows](#chapter-5-data-manipulation-language-dml-inserting-rows)
6. [Chapter 6: Updating & Deleting Data: `UPDATE`, `DELETE`, and the Crucial `WHERE` Clause](#chapter-6-updating-deleting-data-update-delete-and-the-crucial-where-clause)
7. [Chapter 7: Upserts & Conflict Handling: `INSERT INTO ... ON CONFLICT DO UPDATE / NOTHING`](#chapter-7-upserts-conflict-handling-insert-into-on-conflict-do-update-nothing)
8. [Chapter 8: Data Query Language (DQL): The Anatomy of a `SELECT` Statement](#chapter-8-data-query-language-dql-the-anatomy-of-a-select-statement)
9. [Chapter 9: Filtering Predicates: `WHERE`, Comparison Operators, `IN`, `BETWEEN`, `LIKE`, and `IS NULL`](#chapter-9-filtering-predicates-where-comparison-operators-in-between-like-and-is-null)
10. [Chapter 10: Sorting and Windowing: `ORDER BY`, `ASC`/`DESC`, `LIMIT`, and `OFFSET` Pagination](#chapter-10-sorting-and-windowing-order-by-ascdesc-limit-and-offset-pagination)
11. [Chapter 11: Relational Joins Part 1: Cartesian Products and `INNER JOIN` Mechanics](#chapter-11-relational-joins-part-1-cartesian-products-and-inner-join-mechanics)
12. [Chapter 12: Relational Joins Part 2: `LEFT OUTER JOIN`, `RIGHT JOIN`, and `FULL OUTER JOIN`](#chapter-12-relational-joins-part-2-left-outer-join-right-join-and-full-outer-join)
13. [Chapter 13: Aggregate Functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, and Null Handling](#chapter-13-aggregate-functions-count-sum-avg-min-max-and-null-handling)
14. [Chapter 14: Grouping & Group Filtering: `GROUP BY` and the `HAVING` Clause vs `WHERE`](#chapter-14-grouping-group-filtering-group-by-and-the-having-clause-vs-where)
15. [Chapter 15: Subqueries & Derived Tables: Scalar, Column, and Table Subqueries (`EXISTS` vs `IN`)](#chapter-15-subqueries-derived-tables-scalar-column-and-table-subqueries-exists-vs-in)
16. [Chapter 16: Common Table Expressions (CTEs): The `WITH` Clause and Recursive Queries](#chapter-16-common-table-expressions-ctes-the-with-clause-and-recursive-queries)
17. [Chapter 17: Set Operations: `UNION`, `UNION ALL`, `INTERSECT`, and `EXCEPT`](#chapter-17-set-operations-union-union-all-intersect-and-except)
18. [Chapter 18: Indexes in SQL: B-Tree Index Creation, Composite Indexes, and Query Planner (`EXPLAIN QUERY PLAN`)](#chapter-18-indexes-in-sql-b-tree-index-creation-composite-indexes-and-query-planner-explain-query-plan)
19. [Chapter 19: Transactions & ACID Properties: `BEGIN`, `COMMIT`, `ROLLBACK`, and `SAVEPOINT`](#chapter-19-transactions-acid-properties-begin-commit-rollback-and-savepoint)
20. [Chapter 20: Transaction Isolation Levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable](#chapter-20-transaction-isolation-levels-read-uncommitted-read-committed-repeatable-read-and-serializable)
21. [Chapter 21: Database Normalization: First (1NF), Second (2NF), and Third (3NF) Normal Forms](#chapter-21-database-normalization-first-1nf-second-2nf-and-third-3nf-normal-forms)
22. [Chapter 22: SQL Relational Systems Engineering Checklist & Anti-Patterns Guide](#chapter-22-sql-relational-systems-engineering-checklist-anti-patterns-guide)

---

## Chapter 1: The Relational Paradigm: Relations, Tuples, Attributes, and Edgar F. Codd's Foundations

In 1970, mathematician Edgar F. Codd published *"A Relational Model of Data for Large Shared Data Banks"*, founding the relational database paradigm. Codd proved that information could be stored without relying on proprietary pointers or hierarchical tree paths, but through mathematical **Relations** rooted in First-Order Predicate Logic and Set Theory.

```
+----------------------------+-----------------------------+-----------------------------+
| Mathematical Set Theory   | Relational Database Term    | Common Application Analogy  |
+----------------------------+-----------------------------+-----------------------------+
| Relation                   | Table                       | Spreadsheet / Entity Class  |
| Tuple                      | Row / Record                | Object Instance             |
| Attribute                  | Column / Field              | Object Property             |
| Domain                     | Data Type & Constraints     | Primitive Type (int, str)   |
| Cardinality                | Row Count                   | Total record instances      |
| Degree (Arity)             | Column Count                | Total attributes per entity |
+----------------------------+-----------------------------+-----------------------------+
```

### The Declarative Nature of SQL
Unlike procedural languages (such as Python or C) where an engineer dictates *how* to execute a loop, SQL is a **Declarative Language**:
* The developer declares *what* data is required: `SELECT * FROM complaints WHERE status = 'OPEN'`.
* The database engine's **Query Planner** analyzes available indexes, computes relational cost estimations, and chooses the optimal execution algorithm (e.g., Index Seek vs Table Scan).

---

## Chapter 2: Data Definition Language (DDL): Schema Creation

**Data Definition Language (DDL)** commands define, alter, and destroy the structural schema of the database. The foundational command is `CREATE TABLE`:

```sql
-- Create departments lookup table establishing municipal administrative divisions
CREATE TABLE departments ( -- Declare table name for municipal agency records
    id TEXT PRIMARY KEY, -- Primary key string code (e.g., 'WATER', 'ROADS', 'SANITATION')
    name TEXT NOT NULL, -- Human-readable agency name
    contact_email TEXT NOT NULL UNIQUE, -- Unique municipal escalation email address
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Automatic record creation timestamp
); -- Conclude table definition
```

### Core SQL Data Types
While different SQL engines provide dialect-specific types, standard SQL establishes five fundamental type affinities:
* **`INTEGER`**: Signed 1, 2, 3, 4, 6, or 8-byte integers.
* **`REAL` / `FLOAT`**: 8-byte IEEE 754 floating-point numbers.
* **`TEXT` / `VARCHAR(N)`**: UTF-8 variable-length character strings.
* **`BLOB`**: Raw binary data (such as binary image payloads or cryptographic hashes).
* **`TIMESTAMP` / `DATETIME`**: ISO-8601 temporal strings or epoch numbers.

---

## Chapter 3: Integrity Constraints: Primary Keys, Foreign Keys, `NOT NULL`, `UNIQUE`, and `CHECK`

Without schema constraints, software bugs in upstream FastAPI route handlers ([Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)) can corrupt the database with null values, orphaned complaints, or negative SLA timestamps.

Constraints enforce mathematical business rules directly at the storage engine level:

```sql
-- Create complaints table with exhaustive structural integrity constraints
CREATE TABLE complaints ( -- Declare municipal complaint entity table
    id TEXT PRIMARY KEY, -- Unique complaint ticket identifier (e.g., 'CMP-2026-0001')
    title TEXT NOT NULL, -- Mandatory brief grievance summary
    description TEXT NOT NULL, -- Mandatory comprehensive narrative text
    department_id TEXT NOT NULL, -- Foreign key referencing assigned municipal department
    priority_level INTEGER NOT NULL DEFAULT 1, -- Urgency weight score
    status TEXT NOT NULL DEFAULT 'SUBMITTED', -- Current lifecycle state machine token
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Submission timestamp
    resolved_at TIMESTAMP NULL, -- Optional resolution timestamp
    -- 1. Foreign Key Constraint: Enforces referential integrity with departments table
    CONSTRAINT fk_complaint_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT, -- Prevent department deletion if tickets exist
    -- 2. Check Constraint: Restrict priority score within valid 1 to 5 integer boundary
    CONSTRAINT chk_priority_range CHECK (priority_level >= 1 AND priority_level <= 5), -- Bound priority weights
    -- 3. Check Constraint: Restrict lifecycle tokens to valid state machine strings
    CONSTRAINT chk_valid_status CHECK (status IN ('SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')) -- Enforce lifecycle tokens
); -- Conclude table definition
```

---

## Chapter 4: Schema Evolution: `ALTER TABLE`, Dropping Columns, and Constraints Migration

As business requirements evolve, the database schema must mutate without discarding existing citizen grievance data.

### Standard Schema Modifications
```sql
-- Add an optional geolocation column to store GPS coordinates for field workers
ALTER TABLE complaints ADD COLUMN latitude REAL NULL; -- Add latitude floating point column

-- Add an optional longitude column to store GPS coordinates for field workers
ALTER TABLE complaints ADD COLUMN longitude REAL NULL; -- Add longitude floating point column

-- Rename a column to conform to updated naming conventions
ALTER TABLE departments RENAME COLUMN contact_email TO escalation_email; -- Rename email column
```

### Table Recreation Pattern for Complex Constraints
In database engines like SQLite ([Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)), modifying an existing constraint or dropping a primary key requires the standard **Table Recreation Migration Pattern** (automated by Alembic in [Guide 16: Database Migrations with Alembic](16_DATABASE_MIGRATIONS_WITH_ALEMBIC.md)):
1. Create a new table `complaints_new` with the desired updated schema.
2. Copy all rows: `INSERT INTO complaints_new SELECT ... FROM complaints;`.
3. Drop the old table: `DROP TABLE complaints;`.
4. Rename: `ALTER TABLE complaints_new RENAME TO complaints;`.

---

## Chapter 5: Data Manipulation Language (DML): Inserting Rows

**Data Manipulation Language (DML)** commands mutate the tuples stored within tables. The `INSERT INTO` statement introduces new records:

```sql
-- Insert initial municipal agency departments into lookup table
INSERT INTO departments (id, name, escalation_email) -- Specify target table and column order
VALUES -- Declare row tuples to ingest
    ('WATER', 'Department of Water Supply', 'water-alerts@smartcity.gov'), -- Record 1
    ('ROADS', 'Bureau of Street Infrastructure', 'roads-potholes@smartcity.gov'), -- Record 2
    ('SANITATION', 'Waste Management Authority', 'sanitation-cleanup@smartcity.gov'); -- Record 3

-- Insert a new citizen complaint utilizing column defaults for status and timestamp
INSERT INTO complaints (id, title, description, department_id, priority_level) -- Target columns
VALUES ( -- Ingest values
    'CMP-2026-1049', -- Explicit ticket identifier string
    'Broken water pipe flooding avenue', -- Summary title
    'Main waterline burst near civic square junction spilling water across roadway.', -- Narrative
    'WATER', -- Department foreign key matching departments.id
    4 -- High urgency priority level
); -- Conclude insert statement
```

---

## Chapter 6: Updating & Deleting Data: `UPDATE`, `DELETE`, and the Crucial `WHERE` Clause

Modifying and removing existing records are executed via `UPDATE` and `DELETE`. 

```sql
-- Safely update complaint status to IN_PROGRESS upon officer assignment
UPDATE complaints -- Specify target table to mutate
SET status = 'IN_PROGRESS', -- Update lifecycle status column
    priority_level = 5 -- Elevate priority level due to hazard assessment
WHERE id = 'CMP-2026-1049'; -- Crucial predicate restricting mutation to single target ticket

-- Safely delete resolved complaints archived over 5 years ago
DELETE FROM complaints -- Specify target table for row deletion
WHERE status = 'RESOLVED' -- Restrict deletion to resolved tickets
  AND resolved_at < date('now', '-5 years'); -- Restrict to records older than 5 years
```

### The Unconstrained Mutation Disaster
A catastrophic engineering error in SQL is omitting the `WHERE` clause:
* `UPDATE complaints SET status = 'RESOLVED';` — Instantly marks **every single complaint in the entire city as resolved**, destroying operational triage!
* `DELETE FROM complaints;` — Instantly wipes every row from the table!

**Production Rule**: Always wrap manual updates and deletions in a transaction (`BEGIN TRANSACTION; ... COMMIT;`), verifying affected row counts before committing!

---

## Chapter 7: Upserts & Conflict Handling: `INSERT INTO ... ON CONFLICT DO UPDATE / NOTHING`

In distributed systems ([Guide 20: Form State Machines and Optimistic UI: Resilient Client-Side Mutation Architecture](20_FORM_STATE_MACHINES_AND_OPTIMISTIC_UI.md)), a client may re-transmit a record that already exists. Standard `INSERT` statements fail with a primary key collision error (`SQLITE_CONSTRAINT_PRIMARYKEY`).

The modern SQL standard provides **Upsert (Atomic Insert or Update)** semantics:

```sql
-- Perform an idempotent upsert: register department or update email if ID already exists
INSERT INTO departments (id, name, escalation_email) -- Attempt insertion of record
VALUES ('WATER', 'Department of Water Supply', 'new-water-desk@smartcity.gov') -- New values
ON CONFLICT (id) -- Target unique constraint column that may conflict
DO UPDATE SET -- Instruct engine to perform an update on conflict
    escalation_email = excluded.escalation_email, -- Update email to incoming value
    name = excluded.name; -- Update name to incoming value

-- Perform an insert-or-ignore: silently skip insertion if record already exists
INSERT INTO departments (id, name, escalation_email) -- Target table
VALUES ('ROADS', 'Bureau of Street Infrastructure', 'roads@smartcity.gov') -- Values
ON CONFLICT (id) -- Conflict target
DO NOTHING; -- Suppress error and do not mutate existing row
```

---

## Chapter 8: Data Query Language (DQL): The Anatomy of a `SELECT` Statement

**Data Query Language (DQL)** forms the computational core of relational databases. Although written linearly, SQL statements are executed by the query planner in a strict **Logical Query Processing Order**:

```
Written Order:                       Logical Execution Order:
1. SELECT [DISTINCT] columns         1. FROM & JOINs (Build base relation)
2. FROM table                        2. WHERE (Filter individual rows)
3. [JOIN other_table ON ...]         3. GROUP BY (Aggregate into groups)
4. WHERE predicates                  4. HAVING (Filter aggregated groups)
5. GROUP BY columns                  5. SELECT (Evaluate column expressions)
6. HAVING group_predicates           6. DISTINCT (Deduplicate rows)
7. ORDER BY sort_columns             7. ORDER BY (Sort result set)
8. LIMIT count OFFSET start          8. LIMIT / OFFSET (Slice pagination window)
```

Because `WHERE` executes *before* `SELECT`, you cannot reference column aliases defined in `SELECT` inside the `WHERE` clause!

---

## Chapter 9: Filtering Predicates: `WHERE`, Comparison Operators, `IN`, `BETWEEN`, `LIKE`, and `IS NULL`

The `WHERE` clause evaluates a boolean predicate for every tuple in the source relation, retaining only rows that evaluate to `TRUE`:

```sql
-- Comprehensive search query illustrating primary SQL predicate operators
SELECT id, title, department_id, priority_level, created_at -- Specify projection columns
FROM complaints -- Identify primary source table
WHERE department_id IN ('WATER', 'ELECTRICITY') -- Set membership test: match any listed department
  AND priority_level BETWEEN 3 AND 5 -- Range test: inclusive bounds (>= 3 AND <= 5)
  AND (title LIKE '%leak%' OR description LIKE '%flood%') -- Substring pattern matching (case-insensitive in SQLite)
  AND resolved_at IS NULL; -- Explicit Three-Valued Logic test for absent timestamp
```

### Three-Valued Logic (3VL) & NULL Pitfalls
In relational theory, `NULL` does not represent zero or an empty string; it represents **Unknown**. Consequently, standard equality comparisons against `NULL` evaluate to `UNKNOWN` rather than `TRUE` or `FALSE`:
* `status = NULL` is ALWAYS `UNKNOWN` (evaluates to false in a `WHERE` clause).
* You must always use the dedicated unary operators: `IS NULL` or `IS NOT NULL`.

---

## Chapter 10: Sorting and Windowing: `ORDER BY`, `ASC`/`DESC`, `LIMIT`, and `OFFSET` Pagination

To display complaints on an officer's triage screen, records must be sorted deterministically:

```sql
-- Retrieve the 20 highest-urgency open complaints with secondary sorting by creation age
SELECT id, title, department_id, priority_level, created_at -- Target columns
FROM complaints -- Source table
WHERE status != 'RESOLVED' -- Filter out resolved items
ORDER BY priority_level DESC, created_at ASC -- Sort primarily by priority (high to low), secondarily by age
LIMIT 20 -- Return at most 20 records
OFFSET 0; -- Begin at first record (Page 1)
```

### Offset Pagination Bottlenecks & Keyset Alternative
`OFFSET 10000` forces the database engine to fetch, sort, and discard 10,000 tuples before returning the next 20 rows, degrading from $O(1)$ to $O(N)$ query latency.

For production performance, utilize **Keyset Pagination (Cursor-Based)**:
```sql
-- Fast keyset pagination using indexed timestamp boundary
SELECT id, title, created_at -- Projection columns
FROM complaints -- Source table
WHERE created_at < '2026-09-12T08:00:00Z' -- Seek directly via B-Tree index past last seen cursor
ORDER BY created_at DESC -- Deterministic index order
LIMIT 20; -- Fetch fixed window
```

---

## Chapter 11: Relational Joins Part 1: Cartesian Products and `INNER JOIN` Mechanics

A single table rarely contains all required operational context. Normalization splits entities into distinct relations ([Chapter 21: Database Normalization](#chapter-21-database-normalization-first-1nf-second-2nf-and-third-3nf-normal-forms)), requiring **Relational Joins** to reconstruct combined views.

### Cartesian Products vs Inner Joins
Without an `ON` condition, combining two tables produces a **Cartesian Product (Cross Join)**: every row in Table A pairs with every row in Table B ($N \times M$ rows).

An **`INNER JOIN`** evaluates a join predicate, returning only tuples where the condition evaluates to `TRUE`:

```sql
-- Inner join complaints with departments to resolve human-readable agency names
SELECT -- Project combined attributes from both joined tables
    c.id AS complaint_id, -- Complaint ticket identifier
    c.title AS complaint_title, -- Complaint grievance title
    d.name AS department_name, -- Resolved agency name from departments table
    d.escalation_email AS agency_email, -- Department escalation contact email
    c.status AS lifecycle_status -- Current complaint status
FROM complaints c -- Base relation aliased as 'c'
INNER JOIN departments d -- Target join relation aliased as 'd'
    ON c.department_id = d.id; -- Join predicate linking foreign key to primary key
```

---

## Chapter 12: Relational Joins Part 2: `LEFT OUTER JOIN`, `RIGHT JOIN`, and `FULL OUTER JOIN`

In an `INNER JOIN`, if a department has zero assigned complaints, that department is completely omitted from the result set. When generating municipal agency reports, we must retain departments even if their complaint count is zero.

```
+-----------------+---------------------------------------------------------------------------+
| Join Type       | Result Set Retention Behavior                                             |
+-----------------+---------------------------------------------------------------------------+
| INNER JOIN      | Only rows with matching keys in BOTH left and right tables.               |
| LEFT OUTER JOIN | ALL rows from Left table; matching rows from Right, NULLs for unmatched.  |
| RIGHT JOIN      | ALL rows from Right table; matching rows from Left, NULLs for unmatched. |
| FULL OUTER JOIN | ALL rows from BOTH tables; NULLs wherever keys do not match.              |
+-----------------+---------------------------------------------------------------------------+
```

```sql
-- Left outer join ensuring all departments appear in report even if zero complaints exist
SELECT -- Projection
    d.id AS department_code, -- Department code primary key
    d.name AS department_name, -- Department title
    c.id AS complaint_id, -- Complaint ID (will evaluate to NULL if department has no complaints)
    c.title AS complaint_title -- Complaint title (will evaluate to NULL if department has no complaints)
FROM departments d -- Left relation: ALL departments are guaranteed to be returned
LEFT OUTER JOIN complaints c -- Right relation: matched complaints attached if present
    ON d.id = c.department_id; -- Join predicate linking department IDs
```

---

## Chapter 13: Aggregate Functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, and Null Handling

Aggregate functions collapse multiple row values into a single summary metric:

```sql
-- Compute high-level operational statistics across all complaints in system
SELECT -- Execute multiple aggregate calculations in a single query pass
    COUNT(*) AS total_complaints_filed, -- Counts all tuples including those with nulls
    COUNT(resolved_at) AS total_resolved_complaints, -- Counts ONLY rows where resolved_at IS NOT NULL
    AVG(priority_level) AS mean_priority_score, -- Computes arithmetic mean priority
    MIN(created_at) AS earliest_complaint_timestamp, -- Identifies oldest active grievance
    MAX(created_at) AS latest_complaint_timestamp -- Identifies newest active grievance
FROM complaints; -- Source complaints table
```

### Critical Nuance: `COUNT(*)` vs `COUNT(column)`
* `COUNT(*)`: Evaluates the cardinality of the relation, counting **every single row**.
* `COUNT(column)`: Counts only rows where `column IS NOT NULL`. If 50 complaints are resolved and 50 are pending (`resolved_at IS NULL`), `COUNT(resolved_at)` evaluates to 50, while `COUNT(*)` evaluates to 100!

---

## Chapter 14: Grouping & Group Filtering: `GROUP BY` and the `HAVING` Clause vs `WHERE`

To compute metrics per municipal agency, `GROUP BY` partitions the relation into buckets before evaluating aggregate functions:

```sql
-- Identify departments with high unresolved complaint volumes
SELECT -- Projection of group identifier and computed aggregates
    d.name AS department_name, -- Group key column
    COUNT(c.id) AS open_ticket_count, -- Count complaints in active group
    AVG(c.priority_level) AS avg_urgency -- Compute mean urgency per department
FROM departments d -- Base departments relation
INNER JOIN complaints c -- Joined complaints relation
    ON d.id = c.department_id -- Join condition
WHERE c.status != 'RESOLVED' -- Pre-Aggregation Filter: filters individual complaints BEFORE grouping
GROUP BY d.id, d.name -- Partition records by unique department
HAVING COUNT(c.id) >= 5 -- Post-Aggregation Filter: filters groups with 5 or more open complaints
ORDER BY open_ticket_count DESC; -- Order departments by volume descending
```

### The Invariant: `WHERE` vs `HAVING`
* `WHERE`: Filters **individual rows** before grouping occurs. Cannot reference aggregate functions (`WHERE COUNT(*) > 5` is a syntax error!).
* `HAVING`: Filters **aggregated groups** after grouping occurs. References aggregate calculations.

---

## Chapter 15: Subqueries & Derived Tables: Scalar, Column, and Table Subqueries (`EXISTS` vs `IN`)

A **subquery** is a nested SQL statement enclosed in parentheses. Subqueries can appear in `SELECT` (scalar), `FROM` (derived table), or `WHERE` (filtering predicate):

```sql
-- Find all complaints whose priority is higher than the city-wide average priority
SELECT id, title, priority_level -- Projection
FROM complaints -- Source relation
WHERE priority_level > ( -- Compare against scalar subquery result
    SELECT AVG(priority_level) -- Subquery computing single scalar floating-point value
    FROM complaints -- Subquery source table
); -- Conclude main query

-- Efficiently find departments that have at least one high-priority complaint (Score = 5)
SELECT id, name -- Projection
FROM departments d -- Outer relation
WHERE EXISTS ( -- Correlated existence test: halts evaluation on first matching row
    SELECT 1 -- Constant projection
    FROM complaints c -- Inner relation
    WHERE c.department_id = d.id -- Correlation condition linking inner to outer
      AND c.priority_level = 5 -- Urgency predicate
); -- Conclude correlated query
```

---

## Chapter 16: Common Table Expressions (CTEs): The `WITH` Clause and Recursive Queries

Complex nested subqueries become unreadable and difficult to maintain. **Common Table Expressions (CTEs)** define named temporary result sets that can be referenced sequentially in downstream queries:

```sql
-- Analyze complaint resolution times using Common Table Expressions
WITH ResolvedComplaints AS ( -- Define first modular CTE calculating resolution duration
    SELECT -- Projection
        id, -- Complaint identifier
        department_id, -- Assigned department code
        (julianday(resolved_at) - julianday(created_at)) * 24.0 AS resolution_hours -- Duration math
    FROM complaints -- Source table
    WHERE status = 'RESOLVED' -- Only include completed items
), -- Conclude first CTE
DepartmentPerformance AS ( -- Define second CTE aggregating resolution duration per department
    SELECT -- Projection
        department_id, -- Department identifier
        AVG(resolution_hours) AS avg_hours, -- Mean resolution hours
        COUNT(id) AS sample_size -- Completed ticket sample count
    FROM ResolvedComplaints -- Reference preceding CTE as if it were a physical table
    GROUP BY department_id -- Group by department
) -- Conclude second CTE
SELECT -- Final main query combining CTE results with departments metadata
    d.name, -- Department name
    ROUND(dp.avg_hours, 1) AS mean_hours_to_resolve, -- Formatted average hours
    dp.sample_size AS total_resolved -- Total count
FROM DepartmentPerformance dp -- Source CTE
INNER JOIN departments d -- Join departments table
    ON dp.department_id = d.id -- Match primary keys
ORDER BY mean_hours_to_resolve ASC; -- Rank agencies from fastest to slowest
```

---

## Chapter 17: Set Operations: `UNION`, `UNION ALL`, `INTERSECT`, and `EXCEPT`

Relational database tables represent mathematical sets. SQL provides set operators to combine or compare result sets from two queries having identical column counts and compatible data types:

```sql
-- Combine open complaints and emergency dispatch alerts into a unified operational feed
SELECT id, title, 'COMPLAINT' AS record_source -- Query 1
FROM complaints -- Source table
WHERE status = 'IN_PROGRESS' -- Active complaints
UNION ALL -- Combine result sets directly without incurring deduplication sort overhead
SELECT alert_id AS id, headline AS title, 'DISPATCH_ALERT' AS record_source -- Query 2
FROM emergency_alerts -- Source alerts table
WHERE is_active = 1; -- Active alerts only
```

### `UNION` vs `UNION ALL` Performance
* **`UNION`**: Combines rows and executes an **implicit sorting and deduplication pass**, eliminating identical rows. Highly expensive on large datasets!
* **`UNION ALL`**: Concatenates both result sets directly without sorting. Always prefer `UNION ALL` unless duplicate elimination is an explicit business requirement.

---

## Chapter 18: Indexes in SQL: B-Tree Index Creation, Composite Indexes, and Query Planner (`EXPLAIN QUERY PLAN`)

By default, finding a specific complaint requires a **Full Table Scan ($O(N)$)**: reading every page on disk from start to finish ([Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)).

A **B-Tree Index** maintains a balanced search tree of indexed column values paired with row identifiers, accelerating queries to **Logarithmic Time ($O(\log N)$)**:

```sql
-- Create composite index optimizing department triage queries
CREATE INDEX idx_complaints_dept_status_priority -- Name index explicitly
ON complaints (department_id, status, priority_level); -- Composite column order

-- Verify that the SQL query planner utilizes the index rather than scanning the table
EXPLAIN QUERY PLAN -- Instruct engine to output execution roadmap rather than result rows
SELECT id, title -- Projection
FROM complaints -- Source
WHERE department_id = 'WATER' -- Matches leftmost index column
  AND status = 'SUBMITTED' -- Matches second index column
ORDER BY priority_level DESC; -- Utilizes index ordering to avoid in-memory sort pass
```

### The Leftmost Prefix Rule
A composite index on `(A, B, C)` can satisfy queries filtering on:
- `A`
- `A AND B`
- `A AND B AND C`

It CANNOT optimize queries filtering exclusively on `B` or `C` alone, because the B-Tree is ordered primarily by `A`!

---

## Chapter 19: Transactions & ACID Properties: `BEGIN`, `COMMIT`, `ROLLBACK`, and `SAVEPOINT`

In civic workflows, transferring a complaint between departments requires updating the complaint record and inserting an audit log entry. If a power outage or crash occurs midway, partial state corruption results.

A **Transaction** groups multiple SQL statements into an indivisible logical unit governed by the **ACID Properties**:
* **Atomicity**: All statements succeed, or all are completely rolled back ("All or Nothing").
* **Consistency**: The database transitions exclusively from one valid state to another, satisfying all constraints.
* **Isolation**: Concurrent transactions cannot observe each other's intermediate uncommitted mutations.
* **Durability**: Once committed, changes survive server crashes, power failures, and restarts.

```sql
-- Atomically reassign complaint and insert audit trail record
BEGIN TRANSACTION; -- Initiate atomic transaction boundary

-- 1. Mutate complaint assigned department
UPDATE complaints -- Target table
SET department_id = 'ROADS', -- Reassign agency
    status = 'TRIAGED' -- Update state machine token
WHERE id = 'CMP-2026-1049'; -- Target ticket

-- 2. Insert immutable audit history record
INSERT INTO complaint_audit_logs (complaint_id, actor_id, action, timestamp) -- Target columns
VALUES ('CMP-2026-1049', 'officer_77', 'REASSIGNED_TO_ROADS', CURRENT_TIMESTAMP); -- Audit values

-- 3. Atomically commit both operations to disk
COMMIT; -- Finalize transaction and write to disk/WAL log
```

If any error occurs prior to `COMMIT`, executing `ROLLBACK;` instantly reverts the database to its pristine pre-transaction state.

---

## Chapter 20: Transaction Isolation Levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable

When hundreds of concurrent transactions execute across multi-core servers, database engines arbitrate concurrency using **Isolation Levels**:

```
+--------------------+---------------------+------------------------+--------------------+
| Isolation Level    | Dirty Read Hazard?  | Non-Repeatable Read?   | Phantom Read?      |
+--------------------+---------------------+------------------------+--------------------+
| Read Uncommitted   | YES (Reads uncommit)| YES                    | YES                |
| Read Committed     | NO                  | YES (Values change)    | YES                |
| Repeatable Read    | NO                  | NO                     | YES (New rows appear|
| Serializable       | NO                  | NO                     | NO (Strict serial) |
+--------------------+---------------------+------------------------+--------------------+
```

* **Dirty Read**: Transaction A reads uncommitted mutations made by Transaction B. If B rolls back, A acted on invalid data!
* **Non-Repeatable Read**: Transaction A reads a row, Transaction B updates and commits that row; Transaction A re-reads the row and observes mutated values.
* **Phantom Read**: Transaction A queries rows matching a range (`WHERE priority > 3`); Transaction B inserts a new row matching that range; Transaction A re-runs the query and discovers a "phantom" row.

SQLite simplifies this by executing transactions with serialized file-level concurrency using Write-Ahead Logging ([Guide 04: SQLite Storage Mechanics and WAL Mode](04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)).

---

## Chapter 21: Database Normalization: First (1NF), Second (2NF), and Third (3NF) Normal Forms

Database normalization is the mathematical process of organizing attributes and relations to **eliminate data redundancy and prevent update anomalies**.

### 1. First Normal Form (1NF)
* Every column must contain **atomic (indivisible) values**.
* No repeating groups or comma-separated lists (e.g., storing `attachments = "pic1.jpg,pic2.jpg"` in a complaints row violates 1NF; attachments must live in a dedicated `attachments` relation!).

### 2. Second Normal Form (2NF)
* Must satisfy 1NF.
* All non-key attributes must be **fully functionally dependent on the entire primary key**, eliminating partial key dependencies in composite keys.

### 3. Third Normal Form (3NF)
* Must satisfy 2NF.
* Eliminates **transitive dependencies**: non-key attributes must not depend on other non-key attributes ($X \to Y \to Z$).
* *Violation*: Storing `department_name` and `department_email` directly inside the `complaints` table. If the email changes, thousands of complaint rows must be updated!
* *3NF Solution*: Isolate `departments` into its own table, referencing only `department_id` foreign key.

---

## Chapter 22: SQL Relational Systems Engineering Checklist & Anti-Patterns Guide

Before authoring database schemas or ORM models in SQLAlchemy ([Guide 05: SQLAlchemy ORM and Data Layer](05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)), verify adherence to this 15-point checklist:

| Check # | Relational Area | Verification Requirement |
|:---|:---|:---|
| 1 | **Primary Keys** | Every table declares an explicit, immutable Primary Key (`id`). |
| 2 | **Foreign Keys** | Referential integrity enforced via foreign keys with explicit `ON DELETE` policies. |
| 3 | **Check Constraints**| Integer ranges, status tokens, and string bounds validated at the schema level. |
| 4 | **3NF Architecture** | Entities normalized to Third Normal Form to eliminate redundancy and update anomalies. |
| 5 | **WHERE Protection** | All manual `UPDATE` and `DELETE` queries guarded by strict `WHERE` clauses and transactions. |
| 6 | **Idempotent Upserts**| Insertion collisions handled cleanly with `ON CONFLICT DO UPDATE / NOTHING`. |
| 7 | **3VL Null Safety** | Missing values tested exclusively via `IS NULL` / `IS NOT NULL`, never `= NULL`. |
| 8 | **Keyset Pagination**| Large lists paginated using indexed timestamp/cursor boundaries rather than large `OFFSET`s. |
| 9 | **Index Coverage** | Foreign keys and high-frequency filter columns (`department_id`, `status`) indexed with B-Trees. |
| 10 | **Leftmost Prefix** | Composite index column ordering designed around application query filtering patterns. |
| 11 | **Query Plan Audit** | Complex queries audited via `EXPLAIN QUERY PLAN` to ensure zero unintended full table scans. |
| 12 | **Atomic Bounds** | Multi-table mutations executed within strict `BEGIN ... COMMIT` transactional blocks. |
| 13 | **UNION ALL Rule** | Set unions default to `UNION ALL` unless deduplication is an explicit functional requirement. |
| 14 | **Aggregate Safety** | Distinction between `COUNT(*)` (rows) and `COUNT(col)` (non-null values) explicitly verified. |
| 15 | **Safe Migrations** | Schema modifications executed using structured migration scripts (Alembic) without data loss. |
