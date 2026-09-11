# Module M3 - Frontend File 03: Live Triage Preview Card
## Target File: `frontend/src/components/LiveTriageCard.jsx`
### Execution Track: Phase 2 (Can be built in parallel with Files 01 and 02)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern responsive web development and intelligent form architectures, `components/LiveTriageCard.jsx` defines the **Real-Time Predictive Form Feedback & Triage Preview Component**. It inspects user input as it is typed into form fields, executes asynchronous debounced machine classification requests, and renders real-time visual feedback—including predicted categories, calculated priority tiers, confidence meters, hazard alerts, and explainable keyword tags—before the user submits the form.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as GitHub automated issue labeling, Google smart compose hints, and TurboTax calculation cards), live preview components standardly fulfill four core architectural duties:

1. **Eliminating the "Submission Black Box":**
   * Traditional web forms act as black holes: users type text, click submit, and have no idea how the system interpreted their input.
   * A live triage card provides instant transparency: showing students which department will receive their complaint and what urgency level was computed while they are still drafting their text.
2. **Debounced Network Optimization:**
   * High-frequency keystrokes must never trigger raw network calls on every character.
   * The component implements debouncing: waiting until the user pauses typing for 500 milliseconds before firing a single, optimized preview request, protecting server CPU and network bandwidth.
3. **Early Warning Life-Safety Hazard Interception:**
   * If a student reports an active electrical fire or gas leak, the component immediately renders a prominent red hazard warning banner (`hazard_detected = True`), reassuring the student that their complaint has triggered immediate emergency protocols.
4. **Explainable AI & Machine Decision Transparency:**
   * Displays the exact keywords detected and the diagnostic reason formulated by the backend, fostering institutional trust and allowing the user to correct misinterpretations before final submission.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/components/LiveTriageCard.jsx` for four concrete operational functions:

1. **Providing Real-Time Feedback on the Student Submission Form:**
   * Embedded inside `SubmitTicket.jsx` directly adjacent to or below the Title and Description input fields.
   * Listens to the draft text and renders live predictions once the user enters at least 5 characters for Title and 10 characters for Description.
2. **Displaying Predicted Department Categories:**
   * Renders the predicted campus facility department (Electrical, Plumbing, IT Support, Carpentry, Sanitation, or General Administration) with colored badge styling.
3. **Displaying Calculated Urgency Priority & Confidence:**
   * Embeds `<PriorityBadge priority={triageData.priority} size="lg" />`, displaying `CRITICAL` (pulsing red), `HIGH` (amber), `MEDIUM` (blue), or `LOW` (slate).
   * Renders a normalized confidence progress bar (e.g. `"92% Confidence"`).
4. **Warning Students of Active Hazard Escalations:**
   * If `hazard_detected == True`, renders a flashing red hazard alert box: `"⚠️ Active Safety Hazard Detected! This complaint will be escalated immediately under our 4-Hour Emergency Protocol."`

### Future AI Integration & Preview Card Stability (V2 Roadmap)
While Version 1 displays deterministic rule output, this component is designed as the permanent presentation shell for future AI triage:
* **Seamless AI Narrative Output:** In V2, when an AI model (such as Gemini API) evaluates complaint narratives, it will return the exact same `TriageResult` schema. This component will render AI-generated semantic explanations and contextual keywords with zero code changes.
* **Stable Interface:** Upgrading backend classification to AI requires zero modifications to this component's DOM structure or prop interfaces.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this component is consumed cleanly:
* **The Student Submission Page (`frontend/src/pages/SubmitTicket.jsx`):** Renders this component, passing `title={formData.title}` and `description={formData.description}`.
* **The Triage API Client (`frontend/src/api/triage.js`):** Invoked inside this component's debounced effect to execute `fetchTriagePreview()`.
* **The Priority Badge (`frontend/src/components/PriorityBadge.jsx`):** Rendered inside this card to visualize the computed priority tier.

### The Core Problem It Solves & Why It Exists
* **The Misclassification Guessing Game:** Without live preview, a student filing an issue about a leaking pipe might write an ambiguous title and get routed to Carpentry by mistake. The live preview allows them to see the misclassification and clarify their description before submitting.
* **Keystroke Flooding (Denial of Service):** Without debouncing, a student typing a 200-character description fires 200 concurrent HTTP requests. Debouncing compresses this into 1 or 2 requests.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, responsive, and production-grade, `frontend/src/components/LiveTriageCard.jsx` must define and render the following six structural components:

---

### Item 1: Component Props Specification
* **What it is:** Accepted properties passed from `SubmitTicket.jsx`.
* **Props:**
  * `title: string` (Current value of the complaint title input).
  * `description: string` (Current value of the complaint description textarea).
* **Why it is needed:**
  * Allows the component to observe parent form keystrokes passively without managing form submission logic.

---

### Item 2: Internal State Hooks
* **What it is:** React state hooks managing triage results, loading status, and error states.
* **Required State Variables:**
  * `triageData: Object | null` (Holds the `TriageResult` object returned by the backend, or `null` when inputs are short).
  * `loading: boolean` (True while the debounced network call is in flight).
  * `error: string | null` (Holds error message if the preview request fails).
* **Why it is needed:**
  * Encapsulates the complete asynchronous triage lifecycle.

---

### Item 3: Debounced Effect Hook (`useEffect`)
* **What it is:** A React `useEffect` hook with a 500-millisecond timer and cleanup function.
* **Execution Logic:**
  1. Check input lengths: If `title.trim().length < 5` or `description.trim().length < 10`:
     * Reset `triageData = null`, `loading = false`, and return.
  2. Set `loading = true`.
  3. Start a timer: `const timer = setTimeout(async () => { ... }, 500);`
  4. Inside timer: Call `fetchTriagePreview(title, description)` from `frontend/src/api/triage.js`.
  5. On success: Set `triageData = result`, `loading = false`.
  6. On failure: Set `error = err.message`, `loading = false`.
  7. Return cleanup function: `return () => clearTimeout(timer);` to cancel obsolete timers on new keystrokes.
* **Why it is needed:**
  * Enforces the 500ms debounce window and cancels stale timers, mathematically eliminating network race conditions.

---

### Item 4: Idle & Loading Skeleton States
* **What it is:** Visual states displayed before data arrives.
* **Elements:**
  * **Idle Placeholder (Inputs too short):** Displays a subtle dashed border card with an informational message: `"Type at least 5 characters in Title and 10 in Description for live department and priority detection."`
  * **Loading Skeleton (While pending):** Displays animated pulse bars (`animate-pulse bg-slate-200 h-4 rounded`) simulating the badge and text layout.
* **Why it is needed:**
  * Prevents layout shifts and provides clear feedback to the user that processing is occurring.

---

### Item 5: Hazard Alert Warning Banner
* **What it is:** A conditional alert banner rendered when `triageData.hazard_detected === true`.
* **Tailwind Classes:** `bg-rose-50 border-l-4 border-rose-500 p-4 mb-4 rounded-r-lg shadow-sm animate-pulse`
* **Elements:**
  * Alert icon: Warning triangle.
  * Headline: `"Immediate Safety Hazard Detected"`.
  * Message: `"Your report contains terms indicating an active life-safety hazard. Upon submission, this ticket will be locked into our CRITICAL priority tier with an expedited 4-hour resolution window."`
* **Why it is needed:**
  * Provides critical reassurance to students in life-safety emergency situations.

---

### Item 6: Triage Diagnostic Grid & Matched Keyword Tags
* **What it is:** The visual layout displaying the computed triage attributes.
* **Elements:**
  * **Department Prediction:** Category pill badge (e.g. `"Electrical"` in blue, `"Plumbing"` in cyan).
  * **Priority Tier Badge:** Embeds `<PriorityBadge priority={triageData.priority} size="md" />`.
  * **Normalized Confidence Progress Bar:** Visual bar with percentage text: `Math.round(triageData.confidence * 100) + "% Confidence"`.
  * **Diagnostic Explanation:** Human-readable text displaying `triageData.reason`.
  * **Matched Keywords Pills:** Flexbox wrap container rendering individual detected keyword tags (`bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded`).
* **Why it is needed:**
  * Packages all automated diagnostic metadata into an attractive, explainable visual card.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the component life-cycle for `frontend/src/components/LiveTriageCard.jsx`:

| Stage | User Action | Internal Processing | Rendered Visual Output |
| :--- | :--- | :--- | :--- |
| **Initial / Short Text** | User types `"Fan"` (3 chars) | Length guards fail (`title.length < 5`). Timer not started. | Subtle dashed placeholder card with typing guidance message. |
| **Keystroke Burst** | User types rapidly | New keystrokes clear previous `setTimeout` timers. | Keeps current state; resets debounce clock. |
| **Typing Pause (500ms)**| User stops typing for 500ms | Timer fires: Sets `loading = true`; calls `fetchTriagePreview()`. | Displays animated pulse skeleton loader inside card. |
| **Triage Result Arrival**| Server responds with 200 OK | Sets `triageData = result`, `loading = false`. Evaluates hazard flag. | Card transitions to full diagnostic display: department pill, priority badge, confidence bar, matched keywords. |
| **Hazard Trigger** | Narrative includes `"sparking"` | Server returns `hazard_detected = true`. | Flashing red emergency hazard alert banner appears at top of card. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve UI harmony and functional reliability, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Debounce Delay Duration:** You can adjust the debounce timer window (e.g. lowering to `300ms` for ultra-fast local servers or raising to `600ms` for high-latency mobile connections).
* **Card Border & Background Colors:** You can customize Tailwind classes for borders, shadows, and padding.
* **Confidence Bar Color Thresholds:** You can adjust color break points for the confidence bar (e.g. green for $>80\%$, blue for $50-80\%$, yellow for $<50\%$).
* **Matched Keyword Tag Styling:** You can change badge shapes, border radii, or icon prefixes.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Remove the `clearTimeout` Cleanup Function:** Failing to clear the timeout in `useEffect`'s return function causes memory leaks and fires obsolete requests out of order.
* **DO NOT Remove Minimum Length Guards:** Bypassing length checks fires requests for 1-character strings, causing backend validation rejections (HTTP 422) and wasting network bandwidth.
* **DO NOT Make This Component Block Form Submission:** This component is purely an informative preview. A network failure in this preview card must NEVER disable the student's final form submit button.

---

# 5. Advanced Frontend Concepts Explained: State & React Architecture

### 1. Debouncing Mechanics & JavaScript Timer Microtasks
* **The Concept:** Debouncing is a programming pattern that limits the rate at which a function gets invoked.
* **How It Works Behind the Scenes:**
  * When a user types `"F"`, a timer is registered for $+500\text{ms}$.
  * When the user types `"a"` 100ms later, React cleans up the previous effect, calling `clearTimeout(timer)`. The first timer is permanently cancelled before it ever fires!
  * A new timer is registered for $+500\text{ms}$.
  * Only when the user ceases typing for a full 500ms does the timer callback execute and dispatch the network request. This transforms 50 keystrokes into 1 single network call.

### 2. Derived Rendering vs. Unnecessary State Mutations
* **The Concept:** In React, components should derive visual elements from existing data rather than storing intermediate visual flags in separate state variables.
* **How We Apply It:**
  * We do not store `isHazardous` as a separate state variable.
  * Inside the render body, we evaluate: `const isHazardous = triageData?.hazard_detected === true;`.
  * If `isHazardous` is true, JSX conditionally renders the emergency alert banner. This eliminates state desynchronization bugs.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/components/LiveTriageCard.jsx` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/components/LiveTriageCard.jsx`.
- [ ] Accepts props: `title` and `description`.
- [ ] Implements 500ms debounce with `clearTimeout` cleanup.
- [ ] Displays placeholder guidance when text is shorter than 5 chars for title or 10 for description.
- [ ] Displays animated skeleton loader while the network request is pending.
- [ ] Renders flashing red hazard warning banner when `hazard_detected === true`.
- [ ] Renders department category pill, priority badge, and normalized confidence bar.
- [ ] Displays human-readable reason text and individual matched keyword pill tags.
- [ ] Contains zero triple-backtick code blocks.

### Browser Verification Procedure

1. **Verify Idle State:**
   * Open `http://localhost:5173/submit`.
   * Observe that the live preview card displays the guidance placeholder: `"Type at least 5 characters in Title..."`.
2. **Verify Debounced Network Request:**
   * Type Title: `"Ceiling fan sparking"` and Description: `"Fan motor is smoking and emitting loud sparks"`.
   * Pause typing for 500ms.
   * Check Browser Network Tab: Observe a single `POST /api/v1/tickets/triage-preview` request.
3. **Verify Triage Card Rendering:**
   * Observe that the card renders:
     * Red flashing emergency hazard alert banner.
     * Category pill: `"Electrical"`.
     * Priority badge: Pulsing red `CRITICAL`.
     * Confidence bar: High percentage (e.g. 85-95%).
     * Matched keywords pills: `["spark", "wire", "smoking"]`.
