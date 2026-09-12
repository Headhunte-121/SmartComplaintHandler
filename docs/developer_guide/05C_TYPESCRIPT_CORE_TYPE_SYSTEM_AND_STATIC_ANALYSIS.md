# Guide 05C: TypeScript Core Type System, Static Analysis, and Compiler Mechanics

Welcome to the foundational systems engineering manual for **TypeScript (TS)**, **Static Type Analysis**, and **Compiler Mechanics** within the **SmartComplaintHandler** platform.

In modern frontend and full-stack software architecture, JavaScript's dynamic typing introduces runtime failure risks when handling complex municipal payloads across distributed networks ([Guide 05B: JavaScript Core Language & Syntax Primitives](05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md)). Before constructing reactive component trees in React 18 ([Guide 07: React 18 & Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)), typing API request/response DTOs in Axios ([Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)), or configuring build toolchains in Vite ([Guide 10: Vite & Modern Build Toolchains](10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)), software engineers must understand how TypeScript parses source ASTs, performs structural subtyping checks, infers types contextually, and enforces compile-time invariants.

This manual establishes the foundational mechanics of the TypeScript type system from the absolute ground up.

---

## Prerequisites and Cross-Document Reference Map

This manual serves as the direct type-safety baseline across the entire frontend application suite:
* [Guide 05B: JavaScript Core Language & Syntax Primitives](05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md) - Baseline ECMAScript syntax and runtime primitives.
* [Guide 06: Modern JavaScript & V8 Mechanics](06_JAVASCRIPT_RUNTIME_AND_V8_MECHANICS.md) - Runtime execution of transpiled JavaScript bytecode.
* [Guide 07: React 18 & Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md) - Typing React props, state hooks, and SyntheticEvents.
* [Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md) - Type-safe REST request payloads and response DTOs.
* [Guide 10: Vite & Modern Build Toolchains](10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md) - Esbuild and Rollup TypeScript compilation and type stripping.
* [Guide 20: Form State Machines & Optimistic UI](20_FORM_STATE_MACHINES_AND_OPTIMISTIC_UI.md) - Discriminated union typing for form transitions.

---

## Table of Contents
1. [Chapter 1: The TypeScript Philosophy: Type Erasure and Zero-Cost Abstraction](#chapter-1-the-typescript-philosophy-type-erasure-and-zero-cost-abstraction)
2. [Chapter 2: The TypeScript Compiler Architecture (`tsc`)](#chapter-2-the-typescript-compiler-architecture-tsc)
3. [Chapter 3: Primitive Types and Strict Type Checking](#chapter-3-primitive-types-and-strict-type-checking)
4. [Chapter 4: Special Type Primitives: `any`, `unknown`, `never`, and `void`](#chapter-4-special-type-primitives-any-unknown-never-and-void)
5. [Chapter 5: Type Inference and Contextual Typing](#chapter-5-type-inference-and-contextual-typing)
6. [Chapter 6: Object Types and Property Modifiers: Optional, Readonly, and Index Signatures](#chapter-6-object-types-and-property-modifiers-optional-readonly-and-index-signatures)
7. [Chapter 7: Interfaces vs Type Aliases: Declaration Merging and Semantic Differences](#chapter-7-interfaces-vs-type-aliases-declaration-merging-and-semantic-differences)
8. [Chapter 8: Union Types and Intersection Types: Type Algebra](#chapter-8-union-types-and-intersection-types-type-algebra)
9. [Chapter 9: Literal Types and Discriminated Unions: State Machine Modeling](#chapter-9-literal-types-and-discriminated-unions-state-machine-modeling)
10. [Chapter 10: Array and Tuple Types: Homogeneous Arrays and Fixed-Length Tuples](#chapter-10-array-and-tuple-types-homogeneous-arrays-and-fixed-length-tuples)
11. [Chapter 11: Function Typing: Parameters, Return Types, and Overloads](#chapter-11-function-typing-parameters-return-types-and-overloads)
12. [Chapter 12: Generics Fundamentals: Type Variables (`<T>`)](#chapter-12-generics-fundamentals-type-variables-t)
13. [Chapter 13: Generic Constraints and `keyof`: Indexed Access Types](#chapter-13-generic-constraints-and-keyof-indexed-access-types)
14. [Chapter 14: Type Narrowing Mechanics: In-Scope Type Refinement](#chapter-14-type-narrowing-mechanics-in-scope-type-refinement)
15. [Chapter 15: User-Defined Type Guards: Custom Predicates (`val is Type`)](#chapter-15-user-defined-type-guards-custom-predicates-val-is-type)
16. [Chapter 16: Conditional Types and the `infer` Keyword](#chapter-16-conditional-types-and-the-infer-keyword)
17. [Chapter 17: Mapped Types: Homomorphic Mapping and Key Remapping](#chapter-17-mapped-types-homomorphic-mapping-and-key-remapping)
18. [Chapter 18: Standard Utility Types: Platform DTO Modeling](#chapter-18-standard-utility-types-platform-dto-modeling)
19. [Chapter 19: Classes in TypeScript: Parameter Properties and Access Modifiers](#chapter-19-classes-in-typescript-parameter-properties-and-access-modifiers)
20. [Chapter 20: Ambient Declarations and Type Definitions: `.d.ts` Files](#chapter-20-ambient-declarations-and-type-definitions-dts-files)
21. [Chapter 21: The `tsconfig.json` Configuration: Production Compiler Flags](#chapter-21-the-tsconfigjson-configuration-production-compiler-flags)
22. [Chapter 22: Synthesis & Architectural Verification: 15-Point Municipal TypeScript Engineering Checklist](#chapter-22-synthesis-architectural-verification-15-point-municipal-typescript-engineering-checklist)

---

## Chapter 1: The TypeScript Philosophy: Type Erasure and Zero-Cost Abstraction

TypeScript is a **typed superset of JavaScript** developed by Microsoft that compiles down to plain JavaScript:
1. **Type Erasure**: All types, interfaces, generics, and type annotations are **completely stripped away** during compilation. The resulting JavaScript emitted by `tsc` contains zero runtime type-checking code.
2. **Runtime Zero-Cost**: Because types do not exist in the final JavaScript bundle, TypeScript introduces **zero runtime memory or CPU overhead**.
3. **Structural Subtyping ("Duck Typing")**: TypeScript determines type compatibility based on the **shape** (structure) of an object rather than its nominal declaration name.

```typescript
// Demonstrating structural subtyping in municipal ticket entities
interface TicketIdentifier { // Define required structural interface shape
  id: string; // Mandatory string identifier property
  department: string; // Mandatory department string property
} // Conclude interface declaration

function logTicketRoute(ticket: TicketIdentifier): void { // Accept any object conforming to TicketIdentifier shape
  console.log(`Routing ticket ${ticket.id} to ${ticket.department}`); // Access guaranteed properties
} // Conclude function declaration

// Object with excess properties matches structurally because it satisfies all required properties!
const grievanceRecord = { id: "CMP-101", department: "WATER", severity: 5, reporter: "Citizen" }; // Plain object
logTicketRoute(grievanceRecord); // Conforms structurally to TicketIdentifier shape
```

---

## Chapter 2: The TypeScript Compiler Architecture (`tsc`)

The TypeScript compiler (`tsc`) processes source files through a 5-phase pipeline:

```
Source Code (*.ts / *.tsx)
      |
      v
1. Scanner (Tokenization: Lexical stream of syntactic tokens)
      |
      v
2. Parser (AST Construction: Generates Abstract Syntax Tree)
      |
      v
3. Binder (Symbol Table: Connects declarations across AST scopes)
      |
      v
4. Type Checker (Semantic Analysis: Enforces structural type compatibility)
      |
      v
5. Emitter (Code Generation: Emits plain *.js and declaration *.d.ts files)
```

---

## Chapter 3: Primitive Types and Strict Type Checking

TypeScript provides static annotations corresponding to ECMAScript primitive types:

```typescript
// Primitive type annotations in municipal complaint domain
const complaintCode: string = "CMP-2026-8801"; // Strict string annotation
const priorityTier: number = 4; // IEEE 754 64-bit float number annotation
const isResolved: boolean = false; // Strict boolean annotation
const uniqueEntityToken: symbol = Symbol("ticket_entity"); // Unique ECMAScript symbol token
const totalGlobalGrievances: bigint = 9007199254740993n; // Arbitrary-precision BigInt integer
```

---

## Chapter 4: Special Type Primitives: `any`, `unknown`, `never`, and `void`

| Type | Nature | Can assign anything TO it? | Can assign it TO other types? | Typical Usage |
| :--- | :--- | :---: | :---: | :--- |
| **`any`** | Dynamic Escape Hatch | Yes | Yes (Bypasses all type checks!) | Legacy migration (Strictly avoided!) |
| **`unknown`** | Type-Safe Top Type | Yes | No (Must narrow with `typeof`/`instanceof` first) | Untrusted external API responses |
| **`never`** | Empty Bottom Type | No | Yes | Exhaustive switch branches, unreachable code |
| **`void`** | Unit Type | No | Only to `undefined` | Function returning no value |

```typescript
// Safe handling of untrusted API responses using unknown and type narrowing
function parseRawGrievancePayload(rawPayload: unknown): string { // Accept untrusted payload as unknown
  if (typeof rawPayload === "object" && rawPayload !== null && "title" in rawPayload) { // Narrow type via runtime checks
    const ticket = rawPayload as { title: string }; // Safe casting after verification
    return ticket.title; // Safely access verified property
  } // Conclude narrowing branch
  throw new TypeError("Payload violates grievance object schema"); // Reject invalid payload shape
} // Conclude parse function

function enforceExhaustiveHandling(value: never): never { // Function unreachable if all cases handled
  throw new Error(`Unhandled discriminated union case: ${JSON.stringify(value)}`); // Enforce compile-time exhaustiveness
} // Conclude exhaustive helper
```

---

## Chapter 5: Type Inference and Contextual Typing

TypeScript's inference engine automatically deduces types from initial value expressions:
* **Best Practice**: Allow TypeScript to infer local variables and return types where obvious; explicitly annotate function parameters, API response models, and public interface boundaries.

```typescript
// Demonstrating contextual typing in array transformation
const triageSeverities = [1, 2, 3, 4, 5]; // Inferred automatically as number[]

// Parameter 'score' contextually typed as 'number'; return contextually typed as 'boolean'
const criticalTickets = triageSeverities.filter((score) => score >= 4); // Inferred as number[]
```

---

## Chapter 6: Object Types and Property Modifiers: Optional, Readonly, and Index Signatures

TypeScript enhances object shapes with granular property modifiers:

```typescript
// Object type definition with modifiers
interface MunicipalComplaint { // Structure describing a citizen grievance
  readonly id: string; // Readonly property cannot be reassigned after instantiation
  title: string; // Mutable string property
  description?: string; // Optional property (can be string or undefined)
  [metadataKey: string]: unknown; // Dynamic index signature accepting arbitrary string keys
} // Conclude interface declaration

const ticket: MunicipalComplaint = { // Instantiate object conforming to schema
  id: "CMP-404", // Immutable identifier
  title: "Broken street lamp", // Ticket summary
  zoneWard: 14 // Dynamic metadata property conforming to index signature
}; // Conclude object instantiation
```

---

## Chapter 7: Interfaces vs Type Aliases: Declaration Merging and Semantic Differences

* **`interface`**: Primarily used for modeling structural object contracts. Supports **Declaration Merging** (multiple `interface` declarations with the same name automatically combine properties).
* **`type` alias**: Can model objects, primitives, unions, tuples, and mapped types. Does **not** support declaration merging (raises compile error on duplicate names).

```typescript
// 1. Interface declaration merging (widely used in library type extensions)
interface AppWindow { // Initial interface definition
  theme: "light" | "dark"; // Theme setting
} // Conclude initial interface

interface AppWindow { // Merged interface definition in same scope
  userId?: string; // Appended property merged with theme
} // Conclude merged interface

// 2. Type alias modeling a union
type MunicipalDepartment = "WATER" | "ROADS" | "SANITATION" | "ELECTRICITY"; // Union type alias
```

---

## Chapter 8: Union Types and Intersection Types: Type Algebra

* **Union Types (`A | B`)**: A value can be *either* type `A` *or* type `B`. You can only access properties common to both types without narrowing.
* **Intersection Types (`A & B`)**: A value must satisfy *both* type `A` *and* type `B` simultaneously (combines all properties).

```typescript
// Union and intersection type algebra
type CitizenContact = { email: string } | { phone: string }; // Union: must have email OR phone
type Timestamps = { createdAt: Date; updatedAt: Date }; // Audit timestamps object shape
type AuditedComplaint = MunicipalComplaint & Timestamps; // Intersection: must contain ticket AND timestamps
```

---

## Chapter 9: Literal Types and Discriminated Unions: State Machine Modeling

A **Discriminated Union** (Tagged Union) combines multiple object shapes sharing a common literal property (the **discriminant**). It enables mathematically exhaustive state machine typing:

```typescript
// Discriminated union modeling complaint workflow states
type ComplaintState = // Union of all valid state machine phases
  | { status: "SUBMITTED"; submittedAt: Date } // Initial state discriminant 'SUBMITTED'
  | { status: "TRIAGED"; department: string; urgencyScore: number } // Triaged state discriminant 'TRIAGED'
  | { status: "RESOLVED"; resolutionNotes: string; resolvedAt: Date }; // Final state discriminant 'RESOLVED'

function renderWorkflowBadge(state: ComplaintState): string { // Type-safe pattern matcher
  switch (state.status) { // Inspect discriminant tag
    case "SUBMITTED": // TypeScript narrows 'state' to Submitted variant
      return `Awaiting triage since ${state.submittedAt.toISOString()}`; // Access narrowed submittedAt
    case "TRIAGED": // TypeScript narrows 'state' to Triaged variant
      return `Assigned to ${state.department} (Priority: ${state.urgencyScore})`; // Access narrowed fields
    case "RESOLVED": // TypeScript narrows 'state' to Resolved variant
      return `Resolved: ${state.resolutionNotes}`; // Access narrowed resolutionNotes
  } // Conclude switch statement
} // Conclude renderWorkflowBadge function
```

---

## Chapter 10: Array and Tuple Types: Homogeneous Arrays and Fixed-Length Tuples

* **Homogeneous Arrays (`T[]` / `Array<T>`)**: Dynamic-length collections where every element has type `T`.
* **Tuples (`[T1, T2, ...]`)**: Fixed-length arrays where element positions have distinct, predetermined types (such as React's `[state, setState]` return from `useState`).

```typescript
// Labeled tuple for geographical coordinate pairs
type GeoCoordinates = [latitude: number, longitude: number, altitudeMeters?: number]; // 2D/3D tuple

const municipalHQ: GeoCoordinates = [17.3850, 78.4867]; // Two-element valid tuple
const municipalTower: GeoCoordinates = [17.3850, 78.4867, 542]; // Three-element valid tuple with optional altitude
```

---

## Chapter 11: Function Typing: Parameters, Return Types, and Overloads

Functions encapsulate operations with typed signatures:

```typescript
// Function type signature with default, optional, and rest parameters
type PriorityCalculator = (baseScore: number, urgencyMultiplier?: number) => number; // Type alias

const computeUrgency: PriorityCalculator = (base, multiplier = 1.0) => { // Implement typed signature
  return base * multiplier; // Calculate numerical priority score
}; // Conclude urgency calculator routine

// Function with rest tuple parameter
function logComplaintEvents(ticketId: string, ...events: string[]): void { // Rest parameter capturing strings
  for (const ev of events) { // Iterate across variable event entries
    console.log(`[Ticket ${ticketId}] ${ev}`); // Print event log line
  } // Conclude iteration
} // Conclude log function
```

---

## Chapter 12: Generics Fundamentals: Type Variables (`<T>`)

Generics allow functions, classes, and interfaces to operate over arbitrary types while preserving strict type safety:

```typescript
// Generic API response envelope used across all backend endpoints
interface ApiResponse<TData> { // Generic type variable TData represents payload schema
  success: boolean; // Boolean response status indicator
  data: TData; // Strongly typed payload data
  timestamp: string; // ISO 8601 timestamp string
} // Conclude generic interface

interface ComplaintDto { // Concrete complaint payload interface
  id: string; // Ticket identifier
  title: string; // Grievance title
} // Conclude complaint DTO

// Hydrating generic envelope with concrete ComplaintDto type argument
const responsePayload: ApiResponse<ComplaintDto> = { // Typed API response container
  success: true, // Success flag
  data: { id: "CMP-505", title: "Water contamination" }, // Data payload conforming to ComplaintDto
  timestamp: "2026-03-31T10:00:00Z" // Formatted timestamp
}; // Conclude response payload
```

---

## Chapter 13: Generic Constraints and `keyof`: Indexed Access Types

Generic constraints restrict type variables via the `extends` keyword:

```typescript
// Type-safe property getter using generic constraint and keyof operator
function getEntityProperty<TEntity, TKey extends keyof TEntity>(entity: TEntity, key: TKey): TEntity[TKey] { // Type-safe getter
  return entity[key]; // Access property dynamically with full compile-time safety
} // Conclude getter function

const ticketItem = { id: "CMP-606", priorityScore: 5, resolved: false }; // Concrete entity object
const ticketIdValue = getEntityProperty(ticketItem, "id"); // Inferred as string
const priorityValue = getEntityProperty(ticketItem, "priorityScore"); // Inferred as number
```

---

## Chapter 14: Type Narrowing Mechanics: In-Scope Type Refinement

TypeScript tracks code paths and narrows types within conditional branches:
* `typeof`: Narrows primitives (`string`, `number`, `boolean`, `symbol`, `bigint`, `undefined`).
* `instanceof`: Narrows class instances along prototype chains (e.g., `err instanceof Error`).
* `in` operator: Narrows objects by checking presence of property name.

---

## Chapter 15: User-Defined Type Guards: Custom Predicates (`val is Type`)

When type logic is complex, **User-Defined Type Guards** return a **type predicate** (`argumentName is TargetType`):

```typescript
// User-defined type guard verifying complaint object structure
function isComplaintRecord(obj: unknown): obj is ComplaintDto { // Custom type predicate return
  return ( // Return boolean validation expression
    typeof obj === "object" && // Confirm object type
    obj !== null && // Reject null reference
    "id" in obj && // Confirm existence of 'id' property
    typeof (obj as { id: unknown }).id === "string" // Verify 'id' is a string
  ); // Conclude validation expression
} // Conclude type guard function
```

---

## Chapter 16: Conditional Types and the `infer` Keyword

A **Conditional Type** selects one of two types based on a ternary condition:
$$\text{TypeA} \text{ extends } \text{TypeB} \text{ ? } \text{TrueType} \text{ : } \text{FalseType}$$

The `infer` keyword enables pattern-matching and extracting sub-types within conditional expressions:

```typescript
// Conditional type extracting unwrapped Promise resolution type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T; // Infer resolved value type U

type AsyncTicketData = Promise<ComplaintDto>; // Asynchronous Promise wrapping ComplaintDto
type ResolvedTicketData = UnwrapPromise<AsyncTicketData>; // Resolves directly to ComplaintDto!
```

---

## Chapter 17: Mapped Types: Homomorphic Mapping and Key Remapping

A **Mapped Type** constructs new object shapes by iterating over keys using the `in keyof` syntax:

```typescript
// Custom mapped type creating an update patch structure where all fields are optional and nullable
type NullablePatch<T> = { // Generic mapped type container
  [K in keyof T]?: T[K] | null; // Remap every property K to permit null values or omission
}; // Conclude mapped type

interface BaseComplaint { // Domain entity interface
  id: string; // Identifier string
  description: string; // Description text
  priority: number; // Priority rating
} // Conclude interface

type ComplaintPatchPayload = NullablePatch<BaseComplaint>; // Generates { id?: string | null; description?: string | null; priority?: number | null; }
```

---

## Chapter 18: Standard Utility Types: Platform DTO Modeling

TypeScript standard library includes built-in utility types:

| Utility Type | Description |
| :--- | :--- |
| **`Partial<T>`** | Makes all properties in `T` optional (`?`). |
| **`Required<T>`** | Makes all properties in `T` mandatory (strips `?`). |
| **`Readonly<T>`** | Marks all properties in `T` as `readonly`. |
| **`Record<K, T>`** | Constructs an object type with property keys `K` of type `T`. |
| **`Pick<T, K>`** | Constructs a type by picking a subset of keys `K` from `T`. |
| **`Omit<T, K>`** | Constructs a type by omitting keys `K` from `T`. |
| **`ReturnType<T>`** | Extracts the return type of a function type `T`. |

```typescript
// Applying standard utilities to municipal complaint DTO models
interface FullComplaintEntity { // Full database model representation
  id: string; // Primary key
  title: string; // Grievance title
  department: string; // Department string
  secretAuditToken: string; // Internal sensitive field
  createdAt: Date; // Timestamp
} // Conclude full entity

// 1. Client submission DTO: Omit server-generated fields
type ComplaintSubmissionDto = Omit<FullComplaintEntity, "id" | "secretAuditToken" | "createdAt">; // Strip internal fields

// 2. Summary card DTO: Pick minimal display properties
type ComplaintSummaryCardDto = Pick<FullComplaintEntity, "id" | "title" | "department">; // Retain essential display fields

// 3. Department status lookup table
type DepartmentMetrics = Record<string, { openTickets: number; averageSlaHours: number }>; // Dynamic dictionary
```

---

## Chapter 19: Classes in TypeScript: Parameter Properties and Access Modifiers

TypeScript extends ECMAScript classes with compile-time access modifiers and parameter property shorthand:

```typescript
// Domain service class with parameter properties and strict encapsulation
class MunicipalTicketRouter { // Service container
  // Parameter property: 'private readonly dept' automatically declares and assigns instance field
  constructor(private readonly defaultDept: string, protected minSeverityThreshold: number) { // Constructor injection
    console.log(`Router initialized for default department: ${this.defaultDept}`); // Log initialization
  } // Conclude constructor

  public routeGrievance(severity: number): string { // Public method accessible anywhere
    if (severity >= this.minSeverityThreshold) { // Evaluate severity threshold
      return "EMERGENCY_DISPATCH"; // Yield emergency routing action
    } // Conclude evaluation
    return this.defaultDept; // Yield default department fallback
  } // Conclude routeGrievance method
} // Conclude class
```

---

## Chapter 20: Ambient Declarations and Type Definitions: `.d.ts` Files

* **`.d.ts` Files (Type Declaration Files)**: Contain type information *only* (no executable JavaScript code).
* **`declare` keyword**: Tells TypeScript that a variable, module, or function exists in the global runtime environment (e.g., injected by a `<script>` tag or browser extension):

```typescript
// Ambient declaration for Vite environment variables
interface ImportMetaEnv { // Augment Vite's ImportMetaEnv interface
  readonly VITE_API_BASE_URL: string; // Backend FastAPI base endpoint URL
  readonly VITE_APP_TITLE: string; // Municipal platform title
} // Conclude ambient interface
```

---

## Chapter 21: The `tsconfig.json` Configuration: Production Compiler Flags

Every frontend project in our repository enforces these critical flags in `tsconfig.json`:

```
{
  "compilerOptions": {
    "target": "ES2022",                // Modern ECMAScript runtime feature target
    "module": "ESNext",                // Native ES Module syntax
    "moduleResolution": "bundler",     // Modern Vite/Rollup module resolution algorithm
    "strict": true,                    // Enables all strict type-checking options
    "strictNullChecks": true,          // Distinguishes null/undefined from concrete types
    "noImplicitAny": true,             // Prohibits undeclared dynamic any fallback
    "noUnusedLocals": true,            // Flags dead code and unreferenced variables
    "noUnusedParameters": true,        // Flags unreferenced function parameters
    "skipLibCheck": true,              // Skips type checking of external *.d.ts files for speed
    "isolatedModules": true            // Ensures compatibility with single-file transpilers (esbuild)
  }
}
```

---

## Chapter 22: Synthesis & Architectural Verification: 15-Point Municipal TypeScript Engineering Checklist

Every frontend file across **SmartComplaintHandler** must adhere to these 15 invariants:

1. [x] **Zero `any` Discipline**: Strictly prohibit `any`; use `unknown` with runtime type guards when handling dynamic payloads.
2. [x] **Strict Null Checks**: Keep `strictNullChecks: true` enabled; explicitly model absence with `T | null` or `T | undefined`.
3. [x] **Discriminated Unions for State Machines**: Model complex asynchronous workflows with tagged unions rather than scattered boolean flags (`isLoading`, `isSuccess`, `isError`).
4. [x] **Exhaustiveness Verification**: Implement a `default: enforceExhaustive(state)` branch in all discriminated union `switch` blocks.
5. [x] **Immutable Props with Readonly**: Mark React component props and shared domain entities with `readonly` modifiers.
6. [x] **Prefer Type Inference for Locals**: Omit obvious annotations on local variables (`const x = 5`) to reduce visual noise.
7. [x] **Mandatory Public Interface Annotations**: Explicitly annotate all exported functions, component props, and API client methods.
8. [x] **Utility Types Over Manual Duplication**: Use `Pick`, `Omit`, and `Partial` to derive API contracts from base domain models.
9. [x] **Const Assertions for Literal Sets**: Use `as const` on static configuration arrays to infer precise readonly tuple and literal union types.
10. [x] **Type-Safe Indexed Lookups**: Enforce `K extends keyof T` when writing dynamic property getters.
11. [x] **Generic Constraints**: Avoid unbounded generics `<T>`; constrain them with `<T extends object>` or `<T extends BaseEntity>`.
12. [x] **Parameter Property Shorthand**: Use `constructor(private readonly api: AxiosInstance)` to streamline service class dependencies.
13. [x] **Custom Type Predicates for External Payloads**: Validate all deserialized JSON payloads using `val is ExpectedType` before passing to state.
14. [x] **Declaration Merging Vigilance**: Avoid accidental interface collisions; prefer `type` aliases for local unions and non-extensible contracts.
15. [x] **Compiler Strict Mode Compliance**: Maintain clean builds with zero `@ts-ignore` or `@ts-nocheck` suppression directives.
