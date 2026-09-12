# Guide 20: Form State Machines and Optimistic UI: Resilient Client-Side Mutation Architecture

Welcome to the systems engineering manual for client-side state transitions and optimistic mutations within the **SmartComplaintHandler** platform. In municipal service systems, citizens file complex reports involving geolocation, category selection, and photographic evidence, while municipal agents frequently update complaint priorities and statuses.

Naive state management relying on independent boolean flags (`isLoading`, `isError`, `isSuccess`) produces brittle user interfaces that fall victim to impossible UI states and race conditions. This guide constructs formal Finite State Machines (FSMs) for forms and details resilient optimistic mutation architectures with automatic rollback capabilities.

---

## Prerequisites and Cross-Document Reference Map

Before exploring client-side mutation machines, verify familiarity with the following foundational manuals:
* [Guide 02: FastAPI ASGI Web Architecture](02_FASTAPI_ASGI_WEB_ARCHITECTURE.md) - HTTP POST endpoints, ASGI request handling, and response status codes.
* [Guide 03: Pydantic V2 Data Validation and Schemas](03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md) - Server-side validation models mirrored on the frontend to prevent schema drift.
* [Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md) - Component lifecycle, `useReducer`, `useTransition`, and fiber reconciliations.
* [Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md) - Mutation requests, custom headers, and network failure handling.
* [Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md) - Multi-part file attachments submitted alongside complaint metadata.
* [Guide 15: Browser Storage and Session Persistence](15_BROWSER_STORAGE_AND_SESSION_PERSISTENCE.md) - Draft state recovery across unexpected browser refreshes via `sessionStorage`.
* [Guide 18: Real-Time Communication: WebSockets, SSE, and Resilient Polling Architecture](18_REALTIME_COMMUNICATION_WEBSOCKETS_SSE.md) - Real-time reconciliation of optimistic client mutations against canonical server state.

---

## Table of Contents
1. [Chapter 1: The Perils of Boolean Soup: Why `isLoading` and `isError` Fail](#chapter-1-the-perils-of-boolean-soup-why-isloading-and-iserror-fail)
2. [Chapter 2: Finite State Machine (FSM) Foundations for User Interfaces](#chapter-2-finite-state-machine-fsm-foundations-for-user-interfaces)
3. [Chapter 3: Designing the Complaint Submission State Machine](#chapter-3-designing-the-complaint-submission-state-machine)
4. [Chapter 4: Implementing an FSM with React `useReducer` and TypeScript Types](#chapter-4-implementing-an-fsm-with-react-usereducer-and-typescript-types)
5. [Chapter 5: Synchronous Schema Validation & Field-Level Error Contracts](#chapter-5-synchronous-schema-validation-field-level-error-contracts)
6. [Chapter 6: Debounced Asynchronous Validation (Duplicate Complaint Detection & Address Geocoding)](#chapter-6-debounced-asynchronous-validation-duplicate-complaint-detection-address-geocoding)
7. [Chapter 7: Touch, Dirty, and Visited States: Designing Ergonomic Validation UX](#chapter-7-touch-dirty-and-visited-states-designing-ergonomic-validation-ux)
8. [Chapter 8: Multi-Step Wizard Architecture (State Partitioning & Step Progressions)](#chapter-8-multi-step-wizard-architecture-state-partitioning-step-progressions)
9. [Chapter 9: Session Recovery: Persisting In-Progress Form State to `sessionStorage`](#chapter-9-session-recovery-persisting-in-progress-form-state-to-sessionstorage)
10. [Chapter 10: Accessible Form Controls (WAI-ARIA, `aria-invalid`, and Error Focus Management)](#chapter-10-accessible-form-controls-wai-aria-aria-invalid-and-error-focus-management)
11. [Chapter 11: The Optimistic UI Paradigm: Eliminating Perceived Latency](#chapter-11-the-optimistic-ui-paradigm-eliminating-perceived-latency)
12. [Chapter 12: Snapshot & Rollback Mechanics: Preserving State Integrity on Network Faults](#chapter-12-snapshot-rollback-mechanics-preserving-state-integrity-on-network-faults)
13. [Chapter 13: Implementing Optimistic Complaint Upvoting and Escalation Status](#chapter-13-implementing-optimistic-complaint-upvoting-and-escalation-status)
14. [Chapter 14: Conflict Resolution: Version Vectors, ETags, and Server Reconciliation](#chapter-14-conflict-resolution-version-vectors-etags-and-server-reconciliation)
15. [Chapter 15: Concurrency Defense: Idempotency Keys (`Idempotency-Key`) in Form POSTs](#chapter-15-concurrency-defense-idempotency-keys-idempotency-key-in-form-posts)
16. [Chapter 16: React 18 Transitions (`useTransition`) for Non-Blocking Validation Renders](#chapter-16-react-18-transitions-usetransition-for-non-blocking-validation-renders)
17. [Chapter 17: Backend Idempotency Store Implementation in FastAPI](#chapter-17-backend-idempotency-store-implementation-in-fastapi)
18. [Chapter 18: Testing State Machines: Deterministic Transition Tests with Vitest](#chapter-18-testing-state-machines-deterministic-transition-tests-with-vitest)
19. [Chapter 19: Testing Optimistic UI Rollbacks with Mock Service Worker (MSW)](#chapter-19-testing-optimistic-ui-rollbacks-with-mock-service-worker-msw)
20. [Chapter 20: Diagnostic Telemetry: Tracking Form Abandonment and Validation Churn](#chapter-20-diagnostic-telemetry-tracking-form-abandonment-and-validation-churn)
21. [Chapter 21: Error Boundary Containment for Form Submission Failures](#chapter-21-error-boundary-containment-for-form-submission-failures)
22. [Chapter 22: Production Form & Optimistic UI Readiness Checklist](#chapter-22-production-form-optimistic-ui-readiness-checklist)

---

## Chapter 1: The Perils of Boolean Soup: Why `isLoading` and `isError` Fail

When frontend developers implement form submissions using disconnected `useState` hooks, they create an architectural anti-pattern known as **Boolean Soup**:

```javascript
// ANTIPATTERN: Disconnected boolean state variables
const [isSubmitting, setIsSubmitting] = useState(false); // Flag tracking submission network request
const [isSuccess, setIsSuccess] = useState(false); // Flag marking successful server acknowledgment
const [isError, setIsError] = useState(false); // Flag marking network or validation failure
const [errorMessage, setErrorMessage] = useState(''); // Text description of server rejection
```

### The Impossible States Problem
With three independent boolean variables, the component possesses $2^3 = 8$ potential state combinations:
* `isSubmitting = true` AND `isSuccess = true`: The UI simultaneously renders a loading spinner and a success modal.
* `isSubmitting = true` AND `isError = true`: The UI renders both an error banner and a disabled loading button.
* `isSuccess = true` AND `isError = true`: The system is in an unrecoverable contradiction.

Managing these flags requires manual clearing inside every `try / catch / finally` block. A single missed `setIsSubmitting(false)` in an asynchronous catch branch leaves the submit button permanently disabled, forcing the citizen to reload the page and re-type their complaint.

---

## Chapter 2: Finite State Machine (FSM) Foundations for User Interfaces

A **Finite State Machine (FSM)** mathematically models a system that can exist in exactly **one** of a finite number of states at any given moment. State transitions occur strictly in response to explicit **Events** (or Actions).

```
                      +-------------------+
                      |       IDLE        |
                      +-------------------+
                                |  START_EDIT
                                v
                      +-------------------+
            +-------->|      EDITING      |<---------+
            |         +-------------------+          |
            |                   |  SUBMIT_CLICK      |
            |                   v                    |
            |         +-------------------+          |
            |         |    VALIDATING     |          |
            |         +-------------------+          |
            |            /             \             |
VALIDATION_FAILED       /               \ VALID_OK   |
            |          v                 v           |
            |   +-------------+   +--------------+   |
            +---| INVALID_ERR |   |  SUBMITTING  |   |
                +-------------+   +--------------+   |
                                    /          \     |
                    SERVER_REJECT  /            \    |
                                  v              v   |
                         +---------------+  +---------+
                         | NETWORK_ERROR |  | SUCCESS |
                         +---------------+  +---------+
                                  |              |
                                  +-- RETRY -----+
```

### Formal FSM Tuple
An FSM is defined as a 5-tuple: $(S, S_0, \Sigma, \delta, F)$:
* $S$: Finite set of valid states (`{IDLE, EDITING, VALIDATING, SUBMITTING, SUCCESS, ERROR}`).
* $S_0$: Initial state (`IDLE`).
* $\Sigma$: Finite set of input events (`{CHANGE_FIELD, SUBMIT, VALIDATION_PASS, VALIDATION_FAIL, SERVER_SUCCESS, SERVER_FAIL}`).
* $\delta$: State transition function: $\delta: S \times \Sigma \rightarrow S$.
* $F$: Set of final/terminal states (`{SUCCESS}`).

By enforcing this contract, impossible combinations are mathematically eliminated: the system cannot be in `SUBMITTING` and `ERROR` concurrently.

---

## Chapter 3: Designing the Complaint Submission State Machine

For the **SmartComplaintHandler** citizen portal, the form lifecycle must accommodate field entry, dynamic file attachments ([Guide 14: Python-Multipart and Streaming Uploads](14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md)), validation, and server dispatch.

### State and Event Matrix
```
+----------------+---------------------+-------------------+-----------------------------------+
| Current State  | Inbound Event       | Next State        | Transition Side Effects           |
+----------------+---------------------+-------------------+-----------------------------------+
| IDLE           | USER_TYPE           | EDITING           | Update field value in context     |
| EDITING        | CHANGE_FIELD        | EDITING           | Clear target field validation err |
| EDITING        | ATTACH_FILE         | EDITING           | Append file to attachments list   |
| EDITING        | SUBMIT_START        | VALIDATING        | Run schema validation engine      |
| VALIDATING     | VALIDATION_PASSED   | SUBMITTING        | Dispatch HTTP POST mutation       |
| VALIDATING     | VALIDATION_FAILED   | EDITING           | Populate field errors & focus 1st |
| SUBMITTING     | SERVER_SUCCESS      | SUCCESS           | Display confirmation ticket ID    |
| SUBMITTING     | SERVER_ERROR        | SUBMISSION_ERROR  | Capture error payload & enable retry|
| SUBMISSION_ERROR| RETRY_SUBMISSION   | SUBMITTING        | Re-execute network dispatch       |
| SUCCESS        | RESET_FORM          | IDLE              | Flush form memory & attachments   |
+----------------+---------------------+-------------------+-----------------------------------+
```

---

## Chapter 4: Implementing an FSM with React `useReducer` and TypeScript Types

Using React's standard `useReducer` hook ([Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)), we implement a strictly typed state machine that governs complaint filing:

```javascript
// State discriminator constants defining mutually exclusive form phases
export const FORM_STATES = { // Object grouping valid finite states
  IDLE: 'IDLE', // Initial unpopulated form state
  EDITING: 'EDITING', // Active citizen input state
  VALIDATING: 'VALIDATING', // Evaluating field schemas
  SUBMITTING: 'SUBMITTING', // Awaiting backend HTTP POST response
  SUCCESS: 'SUCCESS', // Complaint successfully accepted by server
  SUBMISSION_ERROR: 'SUBMISSION_ERROR', // Network or backend rejection state
}; // Conclude form states definition

export const initialComplaintContext = { // Baseline form data context
  status: FORM_STATES.IDLE, // Set initial state to IDLE
  values: { title: '', department: 'WATER', description: '', location: '' }, // Field data
  errors: {}, // Map of field names to validation error strings
  serverErrorMessage: null, // Error message returned from API
  generatedTicketId: null, // Assigned complaint ticket identifier
}; // Conclude initial context definition

export function complaintFormReducer(state, action) { // Pure state transition reducer function
  switch (state.status) { // Match against current finite state
    case FORM_STATES.IDLE: // Transitions originating from IDLE
    case FORM_STATES.EDITING: // Transitions originating from EDITING
      if (action.type === 'CHANGE_FIELD') { // Citizen modifying input field
        return { // Transition to updated editing state
          ...state, // Retain existing context properties
          status: FORM_STATES.EDITING, // Ensure status is set to EDITING
          values: { ...state.values, [action.field]: action.value }, // Update field value
          errors: { ...state.errors, [action.field]: null }, // Clear field error on edit
        }; // Conclude state update
      } // Conclude action check
      if (action.type === 'SUBMIT_START') { // Citizen initiated form submission
        return { ...state, status: FORM_STATES.VALIDATING, errors: {} }; // Move to VALIDATING
      } // Conclude action check
      return state; // Ignore invalid actions in editing state

    case FORM_STATES.VALIDATING: // Transitions originating from VALIDATING
      if (action.type === 'VALIDATION_FAILED') { // Validation engine identified errors
        return { ...state, status: FORM_STATES.EDITING, errors: action.errors }; // Return to EDITING
      } // Conclude action check
      if (action.type === 'VALIDATION_PASSED') { // All field schemas valid
        return { ...state, status: FORM_STATES.SUBMITTING, serverErrorMessage: null }; // Move to SUBMITTING
      } // Conclude action check
      return state; // Retain current state on unhandled event

    case FORM_STATES.SUBMITTING: // Transitions originating from SUBMITTING
      if (action.type === 'SERVER_SUCCESS') { // Backend acknowledged complaint creation
        return { ...state, status: FORM_STATES.SUCCESS, generatedTicketId: action.ticketId }; // To SUCCESS
      } // Conclude action check
      if (action.type === 'SERVER_ERROR') { // Network dropped or server returned 5xx
        return { ...state, status: FORM_STATES.SUBMISSION_ERROR, serverErrorMessage: action.message }; // To ERROR
      } // Conclude action check
      return state; // Retain state during in-flight network request

    case FORM_STATES.SUBMISSION_ERROR: // Transitions originating from SUBMISSION_ERROR
      if (action.type === 'RETRY_SUBMISSION') { // Citizen clicked Retry button
        return { ...state, status: FORM_STATES.SUBMITTING, serverErrorMessage: null }; // Return to SUBMITTING
      } // Conclude action check
      if (action.type === 'CHANGE_FIELD') { // Citizen modifying fields after error
        return { // Transition back to EDITING
          ...state, // Retain state properties
          status: FORM_STATES.EDITING, // Move back to EDITING
          values: { ...state.values, [action.field]: action.value }, // Update modified field
        }; // Conclude state update
      } // Conclude action check
      return state; // Retain error state

    case FORM_STATES.SUCCESS: // Terminal state
      if (action.type === 'RESET_FORM') { // Citizen clicks "File Another Complaint"
        return initialComplaintContext; // Reset context back to pristine IDLE state
      } // Conclude reset check
      return state; // Prevent edits once in terminal success state

    default: // Handle unrecognized status
      return state; // Return existing state
  } // Conclude status switch block
} // Conclude reducer definition
```

---

## Chapter 5: Synchronous Schema Validation & Field-Level Error Contracts

To deliver immediate user feedback without incurring network latency, client-side validation must execute synchronously on form submission and field blur. Crucially, client validation rules must **strictly match the Pydantic schemas** defined in the backend ([Guide 03: Pydantic V2 Data Validation and Schemas](03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md)):

```javascript
// Synchronous validation engine mirroring backend Pydantic ComplaintCreate schema
export function validateComplaintValues(values) { // Validate form data against business constraints
  const errors = {}; // Initialize empty errors map

  if (!values.title || values.title.trim().length < 5) { // Verify title presence and minimum length
    errors.title = 'Title must contain at least 5 characters'; // Record title error message
  } else if (values.title.length > 100) { // Verify title maximum length constraint
    errors.title = 'Title cannot exceed 100 characters'; // Record title error message
  } // Conclude title check

  const validDepartments = ['WATER', 'SANITATION', 'ROADS', 'ELECTRICITY']; // Allowed departments
  if (!validDepartments.includes(values.department)) { // Check department against whitelist
    errors.department = 'Please select a valid municipal department'; // Record department error
  } // Conclude department check

  if (!values.description || values.description.trim().length < 20) { // Check description length
    errors.description = 'Description must provide at least 20 characters of detail'; // Record error
  } // Conclude description check

  if (!values.location || values.location.trim().length < 3) { // Check location presence
    errors.location = 'Specific civic location or landmark is required'; // Record location error
  } // Conclude location check

  const isValid = Object.keys(errors).length === 0; // Check if errors map is empty
  return { isValid, errors }; // Deliver validation outcome and error dictionary
} // Conclude validation engine
```

---

## Chapter 6: Debounced Asynchronous Validation (Duplicate Complaint Detection & Address Geocoding)

While synchronous schema checks validate text lengths and formats instantly ([Chapter 5: Synchronous Schema Validation & Field-Level Error Contracts](#chapter-5-synchronous-schema-validation-field-level-error-contracts)), certain business rules require server-side queries. For example, detecting whether a water main leak has already been reported at the same street address requires querying the database.

Firing an HTTP request on every keystroke floods the backend and causes out-of-order response race conditions. To prevent this, asynchronous checks must be **debounced** and cancelled via `AbortController` ([Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)):

```javascript
import { useState, useEffect, useRef } from 'react'; // Import standard React hooks

export function useDebouncedDuplicateCheck(location, debounceMs = 400) { // Check duplicates asynchronously
  const [duplicateWarning, setDuplicateWarning] = useState(null); // Store potential duplicate ticket ID
  const [isChecking, setIsChecking] = useState(false); // Flag tracking active background verification
  const abortControllerRef = useRef(null); // Retain active request abort controller

  useEffect(() => { // Manage debounced query lifecycle
    if (!location || location.trim().length < 5) { // Skip verification for short strings
      setDuplicateWarning(null); // Reset duplicate warnings
      return; // Exit effect
    } // Conclude length check

    if (abortControllerRef.current) { // Check if previous query is in flight
      abortControllerRef.current.abort(); // Cancel previous HTTP request to prevent race conditions
    } // Conclude abort check

    const controller = new AbortController(); // Allocate new AbortController instance
    abortControllerRef.current = controller; // Cache controller reference for subsequent cleanup

    const timerId = setTimeout(async () => { // Schedule query after debounce delay
      setIsChecking(true); // Indicate background check is executing
      try { // Guard fetch operation
        const response = await fetch( // Query backend duplicate detection endpoint
          `/api/v1/complaints/check-duplicate?location=${encodeURIComponent(location)}`, // Build URL
          { signal: controller.signal } // Pass abort signal to HTTP fetch client
        ); // Conclude fetch invocation
        const result = await response.json(); // Parse JSON payload
        if (result.exists) { // Check if server identified existing ticket
          setDuplicateWarning(`Active complaint #${result.existing_ticket_id} already exists at this location`); // Warn
        } else { // No duplicate found
          setDuplicateWarning(null); // Clear warnings
        } // Conclude existence check
      } catch (err) { // Catch fetch errors or aborts
        if (err.name !== 'AbortError') { // Ignore expected abort cancellations
          console.error('Duplicate check failed:', err); // Log genuine network errors
        } // Conclude error filter
      } finally { // Conclude query lifecycle
        setIsChecking(false); // Reset checking status indicator
      } // Conclude finally block
    }, debounceMs); // Set timer duration

    return () => { // Cleanup function invoked on location change or component unmount
      clearTimeout(timerId); // Clear pending timeout timer
      if (abortControllerRef.current) { // Check if controller exists
        abortControllerRef.current.abort(); // Cancel active HTTP request
      } // Conclude controller abort
    }; // Conclude teardown closure
  }, [location, debounceMs]); // Re-execute when location input or debounce duration changes

  return { duplicateWarning, isChecking }; // Return state variables to consumer component
} // Conclude custom hook
```

---

## Chapter 7: Touch, Dirty, and Visited States: Designing Ergonomic Validation UX

Displaying validation error messages immediately when a citizen loads a blank form creates poor user experience. The interface should only present error messages for fields that the user has interacted with:
* **Pristine**: The field has not been modified from its initial value.
* **Dirty**: The user has modified the value of the field.
* **Touched**: The field has received and lost focus (`onBlur` event fired).

### The "Reward Early, Punish Late" Validation UX Pattern
1. While typing a valid value, show affirmative feedback immediately ("Reward Early").
2. Only show field-level error messages after the user blurs the input or attempts to submit the form ("Punish Late").

```javascript
import { useState } from 'react'; // Import state hook

export function useFieldInteractions(initialValues) { // Manage field interaction metadata
  const [touched, setTouched] = useState({}); // Record which fields have lost focus
  const [dirty, setDirty] = useState({}); // Record which fields differ from initial values

  const handleBlur = (fieldName) => { // Event handler capturing input blur
    setTouched((prev) => ({ ...prev, [fieldName]: true })); // Mark field as touched
  }; // Conclude blur handler

  const handleChange = (fieldName, newValue) => { // Event handler capturing value changes
    setDirty((prev) => ({ // Update dirty flags
      ...prev, // Retain existing flags
      [fieldName]: newValue !== initialValues[fieldName], // Mark dirty if value differs from initial
    })); // Conclude state update
  }; // Conclude change handler

  return { touched, dirty, handleBlur, handleChange }; // Expose interaction trackers
} // Conclude interaction hook
```

---

## Chapter 8: Multi-Step Wizard Architecture (State Partitioning & Step Progressions)

Complex complaints (such as road repair or property damage) span multiple steps:
1. **Step 1: Category & Details** (Department, Title, Description)
2. **Step 2: Location & Evidence** (Civic Address, Photo Attachments)
3. **Step 3: Review & Citizen Contact** (Phone, Name, Final Confirmation)

A multi-step wizard state machine maintains an active `stepIndex`, partitions validation per step, and prevents jumping forward to subsequent steps until preceding validation passes:

```javascript
export const WIZARD_STEPS = ['DETAILS', 'LOCATION_EVIDENCE', 'REVIEW']; // Step identifiers

export function wizardReducer(state, action) { // State machine governing multi-step progression
  switch (action.type) { // Evaluate incoming progression action
    case 'NEXT_STEP': // Citizen requesting progression to next step
      if (state.currentStepIndex < WIZARD_STEPS.length - 1) { // Guard against boundary overflow
        return { ...state, currentStepIndex: state.currentStepIndex + 1 }; // Increment step pointer
      } // Conclude boundary check
      return state; // Retain state if at final step

    case 'PREVIOUS_STEP': // Citizen navigating backwards to review or edit
      if (state.currentStepIndex > 0) { // Guard against underflow
        return { ...state, currentStepIndex: state.currentStepIndex - 1 }; // Decrement step pointer
      } // Conclude underflow check
      return state; // Retain state if at initial step

    case 'GO_TO_STEP': // Direct navigation to previously completed step
      if (action.targetStep <= state.maxCompletedStep) { // Permit jumping only to validated steps
        return { ...state, currentStepIndex: action.targetStep }; // Update active step index
      } // Conclude validation guard
      return state; // Deny navigation to unvalidated future steps

    default: // Unrecognized action
      return state; // Return existing state
  } // Conclude action switch
} // Conclude wizard reducer
```

---

## Chapter 9: Session Recovery: Persisting In-Progress Form State to `sessionStorage`

If a citizen accidentally refreshes the browser, navigates away to check a document, or experiences an OS browser crash, unsubmitted draft text should not be lost. We serialize in-progress form values to `sessionStorage` ([Guide 15: Browser Storage and Session Persistence](15_BROWSER_STORAGE_AND_SESSION_PERSISTENCE.md)):

```javascript
import { useEffect } from 'react'; // Import React effect hook

const STORAGE_KEY = 'draft_complaint_form'; // Unique session storage key

export function useFormDraftPersistence(values, status) { // Persist draft form state
  useEffect(() => { // Synchronize form state to browser session storage
    if (status === 'EDITING') { // Only persist while user is actively editing
      try { // Guard storage write against quota limits
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values)); // Serialize and store draft
      } catch (err) { // Handle quota exceeded exceptions
        console.warn('Session storage quota exceeded while persisting draft:', err); // Log warning
      } // Conclude try/catch
    } else if (status === 'SUCCESS') { // Clear draft once successfully submitted
      sessionStorage.removeItem(STORAGE_KEY); // Purge saved draft from session storage
    } // Conclude status check
  }, [values, status]); // Run effect whenever form values or lifecycle status changes
} // Conclude draft persistence hook

export function loadSavedDraft(defaultValues) { // Retrieve cached draft upon component mount
  try { // Guard storage read against corruption
    const cachedString = sessionStorage.getItem(STORAGE_KEY); // Read stored draft from session storage
    return cachedString ? JSON.parse(cachedString) : defaultValues; // Parse or return default fallback
  } catch (err) { // Handle parsing failures
    return defaultValues; // Deliver default initial values on error
  } // Conclude recovery
} // Conclude load draft function
```

---

## Chapter 10: Accessible Form Controls (WAI-ARIA, `aria-invalid`, and Error Focus Management)

A municipal complaint portal must be accessible to all citizens, including those utilizing screen readers or keyboard navigation.

### Essential WAI-ARIA Form Attributes
1. **`aria-invalid="true"`**: Announces to assistive technology that the entered value violates business validation rules.
2. **`aria-describedby="error-id"`**: Links the input directly to the error message text container, ensuring screen readers announce the exact validation failure when the field receives focus.
3. **Error Focus Management**: When the citizen clicks Submit and validation fails, JavaScript must automatically move DOM keyboard focus (`inputRef.current.focus()`) to the **first invalid field** in document order.

```jsx
import React from 'react'; // Import React for component rendering

export function AccessibleTextInput({ id, label, value, error, touched, onChange, onBlur }) { // Accessible input
  const hasError = Boolean(touched && error); // Determine if field is in active error state
  const errorElementId = `${id}-error-desc`; // Generate deterministic error container ID

  return ( // Render accessible field group
    <div className="flex flex-col gap-1 mb-4"> // Container styling wrapper
      <label htmlFor={id} className="text-sm font-semibold text-gray-700"> // Accessible label
        {label} // Label display text
      </label> // Conclude label
      <input // Form input element
        id={id} // Bind HTML input ID matching label htmlFor
        name={id} // Standard input name
        type="text" // Standard text input type
        value={value} // Controlled input value
        onChange={(e) => onChange(e.target.value)} // Forward change event value
        onBlur={() => onBlur()} // Forward blur event
        aria-invalid={hasError ? 'true' : 'false'} // Signal error state to screen readers
        aria-describedby={hasError ? errorElementId : undefined} // Link to error message container
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${ // Dynamic Tailwind classes
          hasError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400' // Ring colors
        }`} // Conclude template class string
      /> // Conclude input element
      {hasError && ( // Conditionally render error message container
        <p id={errorElementId} role="alert" className="text-xs text-red-600 mt-1"> // Alert role announces error
          {error} // Error message text
        </p> // Conclude error container
      )} // Conclude conditional render
    </div> // Conclude container
  ); // Conclude return
} // Conclude AccessibleTextInput component
```

---

## Chapter 11: The Optimistic UI Paradigm: Eliminating Perceived Latency

In standard web applications, when a municipal officer clicks "Mark as In Progress" or a citizen upvotes an urgent water outage, the browser shows a loading spinner for 200 to 800 milliseconds while the HTTP request round-trips to the server. This introduces perceived sluggishness.

**Optimistic UI** inverts this interaction:
1. The client assumes the network mutation will succeed.
2. The UI immediately mutates local React state to the predicted final state ($t = 0\text{ ms}$).
3. The mutation request is dispatched asynchronously in the background.
4. If the server confirms success, the optimistic state is finalized.
5. If the server rejects or the network drops, the UI automatically rolls back to the pre-mutation snapshot and displays an unobtrusive warning toast.

---

## Chapter 12: Snapshot & Rollback Mechanics: Preserving State Integrity on Network Faults

The core invariant of optimistic architecture is **lossless rollback**. Before any optimistic mutation occurs, the client must capture an immutable snapshot of the existing state.

```
Citizen clicks Upvote (+1)
       |
1. Snapshot current state: { upvotes: 14, userUpvoted: false }
       |
2. Apply Optimistic State: { upvotes: 15, userUpvoted: true } ---> Instant UI Render!
       |
3. Dispatch POST /api/v1/complaints/42/upvote
      /                                  \
     / Success                            \ Network Drop / 500 Error
    v                                      v
Confirm mutation; discard snapshot.      Rollback to Snapshot: { upvotes: 14, userUpvoted: false }
                                         Show Toast: "Upvote failed. Restored previous count."
```

```javascript
import { useState, useRef, useCallback } from 'react'; // Import React state and ref hooks

export function useOptimisticMutation(initialData, mutationEndpoint) { // Resilient optimistic mutation hook
  const [data, setData] = useState(initialData); // Store current active data state
  const [isMutating, setIsMutating] = useState(false); // Track in-flight network activity
  const snapshotRef = useRef(null); // Retain pre-mutation snapshot for potential rollbacks

  const executeOptimisticUpdate = useCallback(async (optimisticData, requestPayload) => { // Run mutation
    snapshotRef.current = data; // 1. Capture immutable pre-mutation snapshot
    setData(optimisticData); // 2. Optimistically apply predicted state immediately to UI
    setIsMutating(true); // Indicate background mutation is running

    try { // Guard network request
      const response = await fetch(mutationEndpoint, { // 3. Dispatch asynchronous mutation request
        method: 'POST', // Use POST method for state mutation
        headers: { 'Content-Type': 'application/json' }, // Declare JSON content type
        body: JSON.stringify(requestPayload), // Transmit mutation payload
      }); // Conclude fetch invocation

      if (!response.ok) { // Check for server error status (4xx or 5xx)
        throw new Error(`Server rejected mutation with HTTP ${response.status}`); // Trigger rollback
      } // Conclude status check

      const confirmedServerData = await response.json(); // Read authoritative server response
      setData(confirmedServerData); // Reconcile local state with authoritative server state
    } catch (err) { // Handle network drop or server rejection
      console.warn('Optimistic mutation failed; rolling back to snapshot:', err); // Log diagnostic
      setData(snapshotRef.current); // 4. Rollback to pre-mutation snapshot to restore UI integrity
    } finally { // Conclude mutation lifecycle
      setIsMutating(false); // Reset mutation tracking indicator
      snapshotRef.current = null; // Clear snapshot reference from memory
    } // Conclude finally block
  }, [data, mutationEndpoint]); // Re-bind when data or endpoint changes

  return { data, isMutating, executeOptimisticUpdate }; // Return reactive state and mutation function
} // Conclude optimistic mutation hook
```

---

## Chapter 13: Implementing Optimistic Complaint Upvoting and Escalation Status

In **SmartComplaintHandler**, citizens can upvote existing neighborhood issues to highlight urgency without filing duplicate reports. This interaction requires instant feedback:

```javascript
import React from 'react'; // Import React library
import { useOptimisticMutation } from './useOptimisticMutation'; // Import custom optimistic mutation hook

export function ComplaintUpvoteButton({ complaintId, initialUpvoteCount, initiallyUpvoted }) { // Upvote component
  const endpoint = `/api/v1/complaints/${complaintId}/upvote`; // Construct endpoint URL
  const { data, isMutating, executeOptimisticUpdate } = useOptimisticMutation( // Instantiate mutation hook
    { upvotes: initialUpvoteCount, hasUpvoted: initiallyUpvoted }, // Set initial component state
    endpoint // Provide target endpoint URL
  ); // Conclude hook invocation

  const handleToggleUpvote = () => { // Handle click event
    if (isMutating) return; // Prevent double-clicks during active dispatch

    const nextHasUpvoted = !data.hasUpvoted; // Compute optimistic upvoted toggle state
    const nextCount = nextHasUpvoted ? data.upvotes + 1 : data.upvotes - 1; // Compute optimistic count

    executeOptimisticUpdate( // Trigger immediate optimistic update and background request
      { upvotes: nextCount, hasUpvoted: nextHasUpvoted }, // Optimistic state payload
      { complaintId, action: nextHasUpvoted ? 'UPVOTE' : 'REMOVE_UPVOTE' } // Network payload
    ); // Conclude execution call
  }; // Conclude click handler

  return ( // Render interactive upvote button
    <button // Interactive button element
      onClick={handleToggleUpvote} // Bind click handler
      disabled={isMutating} // Disable button while in-flight
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${ // Styling classes
        data.hasUpvoted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' // Colors
      }`} // Conclude class template
    > // Conclude button tag opening
      ▲ Upvote ({data.upvotes}) // Button label displaying count
    </button> // Conclude button element
  ); // Conclude return
} // Conclude ComplaintUpvoteButton component
```

---

## Chapter 14: Conflict Resolution: Version Vectors, ETags, and Server Reconciliation

When two municipal officers simultaneously edit the status of a complaint (e.g., Officer A marks it "IN_PROGRESS" while Officer B marks it "REJECTED_DUPLICATE"), applying optimistic updates without conflict resolution creates state desynchronization.

### The ETag & If-Match Protocol
We enforce optimistic concurrency control using HTTP `ETag` headers:
1. When loading a complaint, the server includes `ETag: "v4"`.
2. When mutating the complaint, the client attaches `If-Match: "v4"`.
3. If another officer incremented the server version to `"v5"` in the interim, the server rejects the mutation with `HTTP 412 Precondition Failed`.
4. Upon receiving 412, the client rolls back the optimistic update and presents a conflict resolution modal.

```javascript
export async function updateComplaintWithConcurrencyCheck(complaintId, patchData, currentETag) { // Safe update
  const response = await fetch(`/api/v1/complaints/${complaintId}`, { // Issue conditional PATCH request
    method: 'PATCH', // Use PATCH verb for partial resource updates
    headers: { // Configure request headers
      'Content-Type': 'application/json', // Specify JSON content type
      'If-Match': currentETag, // Send current ETag to enforce version matching
    }, // Conclude headers configuration
    body: JSON.stringify(patchData), // Transmit mutated fields
  }); // Conclude fetch invocation

  if (response.status === 412) { // Detect optimistic concurrency collision
    const freshServerResource = await fetch(`/api/v1/complaints/${complaintId}`).then((res) => res.json()); // Fetch latest
    return { conflict: true, freshData: freshServerResource }; // Return conflict signal with latest server data
  } // Conclude conflict check

  const updatedResource = await response.json(); // Read successfully updated resource
  const newETag = response.headers.get('ETag'); // Extract new version ETag from response header
  return { conflict: false, data: updatedResource, eTag: newETag }; // Return successful outcome
} // Conclude conditional update function
```

---

## Chapter 15: Concurrency Defense: Idempotency Keys (`Idempotency-Key`) in Form POSTs

Citizens frequently double-click submit buttons on touchscreens or experience transient network timeouts that trigger automated Axios retries ([Guide 09: Axios, Fetch and REST Protocols](09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)). Without idempotency controls, a citizen inadvertently files two identical complaints, wasting municipal inspection resources.

### The Idempotency Key Handshake
Every mutation form submission generates a unique UUIDv4 `Idempotency-Key` attached to the request headers:

```http
POST /api/v1/complaints HTTP/1.1
Host: localhost:8000
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json
```

If the client retries the request with the identical `Idempotency-Key`, the backend returns the cached original HTTP 201 response without re-executing database insertions!

```javascript
export function generateClientRequestIdempotencyKey() { // Generate UUIDv4 for mutation idempotency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => { // Replace placeholders
    const randomHex = (Math.random() * 16) | 0; // Generate random nibble between 0 and 15
    const value = character === 'x' ? randomHex : (randomHex & 0x3) | 0x8; // Enforce RFC 4122 variant bits
    return value.toString(16); // Convert nibble to hexadecimal character
  }); // Conclude replace transformation
} // Conclude UUID generator
```

---

## Chapter 16: React 18 Transitions (`useTransition`) for Non-Blocking Validation Renders

When a citizen types into an extensive complaint form with multiple dynamic fields, executing complex schema validations and recalculating derived summary statistics synchronously blocks the main UI thread, causing sluggish typing animations and input lag.

In React 18 ([Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)), **Concurrent Mode Transitions** decouple urgent user interactions (updating the raw input value) from non-urgent secondary computations (evaluating complex form validation rules):

```javascript
import { useState, useTransition } from 'react'; // Import React state and transition hooks
import { validateComplaintValues } from './validationEngine'; // Import synchronous validation engine

export function useConcurrentFormValidation(initialValues) { // Concurrent validation hook
  const [formValues, setFormValues] = useState(initialValues); // Urgent state: raw input values
  const [formErrors, setFormErrors] = useState({}); // Non-urgent state: computed validation errors
  const [isPending, startTransition] = useTransition(); // Initialize concurrent transition tracker

  const updateFieldConcurrently = (fieldName, newValue) => { // Concurrent field update handler
    // 1. Urgent update: update input value immediately so user experiences zero typing latency
    const updatedValues = { ...formValues, [fieldName]: newValue }; // Clone and mutate target field
    setFormValues(updatedValues); // Immediately trigger input re-render

    // 2. Non-urgent update: schedule schema validation inside concurrent transition
    startTransition(() => { // Wrap expensive validation computation in transition
      const { errors } = validateComplaintValues(updatedValues); // Evaluate validation rules
      setFormErrors(errors); // Update error state concurrently without blocking keystrokes
    }); // Conclude transition wrapper
  }; // Conclude concurrent update handler

  return { formValues, formErrors, isPending, updateFieldConcurrently }; // Expose state and handler
} // Conclude concurrent hook
```

---

## Chapter 17: Backend Idempotency Store Implementation in FastAPI

To honor the client-generated `Idempotency-Key` ([Chapter 15: Concurrency Defense: Idempotency Keys in Form POSTs](#chapter-15-concurrency-defense-idempotency-keys-idempotency-key-in-form-posts)), the FastAPI backend must store and check mutation responses before executing database insertions:

```python
import time  # Import time module for TTL expiration calculations
from typing import Dict, Any, Optional  # Import typing primitives
from fastapi import FastAPI, Request, Header, HTTPException, status  # Import FastAPI components
from fastapi.responses import JSONResponse  # Import JSONResponse for returning cached payloads

app = FastAPI(title="IdempotencyDemoApp")  # Initialize FastAPI application instance

class InMemoryIdempotencyStore:  # Cache mutation outcomes keyed by client idempotency UUID
    def __init__(self, ttl_seconds: float = 86400.0):  # Default 24-hour response caching window
        self.ttl_seconds = ttl_seconds  # Store TTL threshold in seconds
        # Map idempotency_key -> (cached_response_dict, creation_timestamp)
        self._cache: Dict[str, Tuple[Dict[str, Any], float]] = {}  # In-memory response cache

    def get_cached_response(self, idempotency_key: str) -> Optional[Dict[str, Any]]:  # Retrieve cached outcome
        if idempotency_key not in self._cache:  # Check if key exists in cache
            return None  # Key not found
        payload, created_at = self._cache[idempotency_key]  # Unpack cached response and timestamp
        if time.time() - created_at > self.ttl_seconds:  # Check if cached response has expired
            del self._cache[idempotency_key]  # Prune expired response from memory
            return None  # Return None for expired response
        return payload  # Return valid cached payload

    def store_response(self, idempotency_key: str, payload: Dict[str, Any]) -> None:  # Cache outcome
        self._cache[idempotency_key] = (payload, time.time())  # Store payload paired with current epoch time

idempotency_store = InMemoryIdempotencyStore()  # Instantiate global idempotency store instance
```

---

## Chapter 18: Testing State Machines: Deterministic Transition Tests with Vitest

Because a Finite State Machine is structured around a pure reducer function ([Chapter 4: Implementing an FSM with React useReducer and TypeScript Types](#chapter-4-implementing-an-fsm-with-react-usereducer-and-typescript-types)), the entire form lifecycle can be tested deterministically in Vitest ([Guide 12: Pytest and Automated Test Systems](12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)) without mocking the DOM or mounting components:

```javascript
import { describe, it, expect } from 'vitest'; // Import Vitest test runner utilities
import { complaintFormReducer, initialComplaintContext, FORM_STATES } from './complaintFormReducer'; // Reducer

describe('Complaint Form State Machine Transitions', () => { // Test suite validating pure FSM transitions
  it('transitions from IDLE to EDITING upon field change', () => { // Verify initial edit transition
    const action = { type: 'CHANGE_FIELD', field: 'title', value: 'Pothole on Main St' }; // Action payload
    const nextState = complaintFormReducer(initialComplaintContext, action); // Execute pure transition
    expect(nextState.status).toBe(FORM_STATES.EDITING); // Assert status transitioned to EDITING
    expect(nextState.values.title).toBe('Pothole on Main St'); // Assert context updated with entered value
  }); // Conclude test

  it('transitions to VALIDATING on submit and rejects invalid data', () => { // Verify validation failure
    const editingState = { ...initialComplaintContext, status: FORM_STATES.EDITING }; // Setup editing state
    const submitAction = { type: 'SUBMIT_START' }; // Action initiating submission
    const validatingState = complaintFormReducer(editingState, submitAction); // Transition to validating
    expect(validatingState.status).toBe(FORM_STATES.VALIDATING); // Assert state is VALIDATING

    const failAction = { type: 'VALIDATION_FAILED', errors: { title: 'Title too short' } }; // Fail action
    const invalidState = complaintFormReducer(validatingState, failAction); // Transition to error
    expect(invalidState.status).toBe(FORM_STATES.EDITING); // Assert returns to EDITING to allow corrections
    expect(invalidState.errors.title).toBe('Title too short'); // Assert error message populated in context
  }); // Conclude test

  it('transitions from SUBMITTING to SUCCESS upon server acknowledgment', () => { // Verify success transition
    const submittingState = { ...initialComplaintContext, status: FORM_STATES.SUBMITTING }; // Setup submitting
    const ackAction = { type: 'SERVER_SUCCESS', ticketId: 'CMP-2026-8801' }; // Success acknowledgment action
    const successState = complaintFormReducer(submittingState, ackAction); // Execute transition
    expect(successState.status).toBe(FORM_STATES.SUCCESS); // Assert status transitioned to SUCCESS
    expect(successState.generatedTicketId).toBe('CMP-2026-8801'); // Assert assigned ticket ID recorded
  }); // Conclude test
}); // Conclude describe block
```

---

## Chapter 19: Testing Optimistic UI Rollbacks with Mock Service Worker (MSW)

Testing optimistic mutations requires verifying that the user interface immediately reflects the optimistic prediction and subsequently reverts when the network request fails:

```javascript
import { describe, it, expect, vi } from 'vitest'; // Import test utilities
import { renderHook, act } from '@testing-library/react'; // Import React hook testing utilities
import { useOptimisticMutation } from './useOptimisticMutation'; // Import custom optimistic mutation hook

describe('Optimistic UI Mutation Rollback', () => { // Test suite validating optimistic mutations
  it('applies optimistic update immediately then rolls back on server 500 error', async () => { // Test case
    const mockEndpoint = '/api/v1/complaints/42/upvote'; // Test endpoint URL
    const initialData = { upvotes: 10 }; // Baseline data payload

    // Mock global fetch to simulate a 500 Internal Server Error
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ // Stub fetch implementation
      ok: false, // Simulate HTTP error status
      status: 500, // Return HTTP 500
    })); // Conclude fetch mock

    const { result } = renderHook(() => useOptimisticMutation(initialData, mockEndpoint)); // Render hook

    // Trigger optimistic update
    await act(async () => { // Wrap state mutations in act
      result.current.executeOptimisticUpdate({ upvotes: 11 }, { complaintId: 42 }); // Trigger mutation
    }); // Conclude act wrapper

    // Verify that data safely rolled back to original baseline count of 10 after 500 failure
    expect(result.current.data.upvotes).toBe(10); // Assert data reverted to pre-mutation snapshot
  }); // Conclude test
}); // Conclude describe block
```

---

## Chapter 20: Diagnostic Telemetry: Tracking Form Abandonment and Validation Churn

Understanding user friction points in citizen complaint submission requires collecting client-side form telemetry:
1. **Field Churn Rate**: The ratio of validation errors triggered per field before final submission.
2. **Form Abandonment Velocity**: Time spent on each step before closing or navigating away without filing.

```javascript
export class FormTelemetryTracker { // Track citizen form interaction friction points
  constructor(formName) { // Initialize tracker with form identifier
    this.formName = formName; // Store form identifier string
    this.fieldErrorCounts = {}; // Histogram tracking validation errors per field
    this.startTime = Date.now(); // Record form initialization timestamp
  } // Conclude constructor

  recordFieldError(fieldName) { // Record validation failure event
    this.fieldErrorCounts[fieldName] = (this.fieldErrorCounts[fieldName] || 0) + 1; // Increment counter
  } // Conclude error record method

  exportMetrics() { // Export interaction summary for analytics ingestion
    return { // Construct telemetry summary payload
      form: this.formName, // Form name
      duration_seconds: Math.round((Date.now() - this.startTime) / 1000), // Total active duration
      field_error_churn: { ...this.fieldErrorCounts }, // Copy error distribution map
    }; // Conclude payload
  } // Conclude export method
} // Conclude telemetry tracker class
```

---

## Chapter 21: Error Boundary Containment for Form Submission Failures

Even with comprehensive state machines, unhandled rendering exceptions or corrupted form schemas can crash the React fiber tree ([Guide 07: React 18 and Virtual DOM Architecture](07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)). 

A dedicated **Form Error Boundary** isolates component failures to the form card, preserving navigation headers and allowing citizens to recover their draft without a full browser reload:

```jsx
import React from 'react'; // Import React library

export class FormErrorBoundary extends React.Component { // Isolate form rendering exceptions
  constructor(props) { // Initialize error boundary state
    super(props); // Pass props to parent Component
    this.state = { hasError: false, error: null }; // Set default error state
  } // Conclude constructor

  static getDerivedStateFromError(error) { // Update state upon caught render error
    return { hasError: true, error }; // Transition state to error mode
  } // Conclude static error handler

  componentDidCatch(error, errorInfo) { // Log error details to monitoring service
    console.error('Form component crash caught by error boundary:', error, errorInfo); // Log diagnostics
  } // Conclude componentDidCatch

  handleReset = () => { // Reset error boundary state to allow retry
    this.setState({ hasError: false, error: null }); // Restore clean state
  }; // Conclude reset handler

  render() { // Render children or fallback error UI
    if (this.state.hasError) { // Check if boundary caught an unhandled exception
      return ( // Render fallback UI container
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center"> // Styling classes
          <h3 className="text-lg font-bold text-red-800 mb-2">Form Encountered an Unexpected Error</h3> // Title
          <p className="text-sm text-red-600 mb-4">Your entered draft has been preserved in session storage.</p> // Note
          <button // Recovery action button
            onClick={this.handleReset} // Bind reset action
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium" // Button classes
          > // Conclude button tag opening
            Reload Form // Button display text
          </button> // Conclude button
        </div> // Conclude fallback container
      ); // Conclude fallback render
    } // Conclude error condition

    return this.props.children; // Render normal child form elements when error-free
  } // Conclude render method
} // Conclude FormErrorBoundary class
```

---

## Chapter 22: Production Form & Optimistic UI Readiness Checklist

Before publishing municipal forms or optimistic interactions to production, verify compliance against this 15-point checklist:

| Check # | Architectural Area | Verification Requirement |
|:---|:---|:---|
| 1 | **FSM Isolation** | Form lifecycles modeled via formal state machines eliminating impossible boolean combinations. |
| 2 | **Schema Alignment** | Client synchronous validation rules precisely match backend Pydantic models. |
| 3 | **Debounced Queries** | Asynchronous duplicate checks and geocoding queries debounced with `AbortController` cancellation. |
| 4 | **Interaction States** | Field errors hidden until inputs are marked `touched` or the form is submitted ("Reward Early, Punish Late"). |
| 5 | **Draft Recovery** | In-progress form state continuously synchronized to `sessionStorage` and purged upon submission. |
| 6 | **WAI-ARIA** | All form controls declare `aria-invalid` and link to error text containers via `aria-describedby`. |
| 7 | **Focus Management** | Submitting an invalid form automatically directs DOM focus to the first failing input element. |
| 8 | **Immutable Snapshot** | Pre-mutation state captured prior to every optimistic update to guarantee lossless rollback. |
| 9 | **Network Reversion** | Network drops (5xx or offline) cleanly restore pre-mutation state with an informative toast alert. |
| 10 | **Concurrency Check** | Optimistic mutations include `If-Match` ETags to prevent overwriting concurrent officer edits. |
| 11 | **Idempotency Keys** | All state-mutating HTTP POST submissions carry a client-generated UUIDv4 `Idempotency-Key`. |
| 12 | **Backend Cache** | Backend idempotency store caches responses for 24 hours to prevent duplicate database writes. |
| 13 | **Non-Blocking UI** | Heavy schema calculations wrapped in React 18 `useTransition` to prevent keystroke latency. |
| 14 | **Deterministic Tests**| State machine reducers covered by 100% deterministic unit tests in Vitest without DOM dependencies. |
| 15 | **Error Containment**| Dedicated `FormErrorBoundary` wraps form components to isolate crashes from page navigation. |
