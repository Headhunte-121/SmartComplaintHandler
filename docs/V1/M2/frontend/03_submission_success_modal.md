# Module M2 Frontend: Submission Success Modal & Tracking Code Dialog Specification

Authoritative Engineering Blueprint for `src/components/SubmissionSuccessModal.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In transactional web applications, submitting a form initiates a critical psychological transition for the user: the shift from "authoring an issue" to "expecting a resolution." In enterprise support portals, logistics tracking platforms, and service management suites, users must receive immediate, undeniable confirmation that their submission was accepted, along with a permanent reference identifier.

A modal dialog (an overlay window that renders on top of the primary application viewport, temporarily deactivating the background content and requiring user interaction before returning to the main page) serves as the industry-standard UI pattern for post-transaction confirmation.

A copy-to-clipboard utility (a client-side feature that interfaces with the browser's asynchronous Clipboard API to copy a string directly into the user's operating system clipboard without requiring manual text highlighting) dramatically reduces user friction, ensuring that complex reference codes are captured accurately without human transcription errors.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/components/SubmissionSuccessModal.jsx` provides the vital handoff between complaint creation and ongoing resolution tracking:
1. It is triggered by `SubmitComplaint.jsx` immediately upon receiving a `201 Created` HTTP response from the FastAPI backend.
2. It renders an accessible, high-contrast modal dialog over a blurred backdrop (`fixed inset-0 bg-slate-900/60 backdrop-blur-sm`), displaying:
   - An animated green checkmark confirmation icon (`bg-emerald-100 text-emerald-600`).
   - The unique ticket tracking code (`TICK-XXXX`) displayed in large, prominent monospace typography with generous letter-spacing.
   - A single-click "Copy Code" button that writes `TICK-XXXX` to the student's clipboard and displays a transient "Copied to clipboard!" confirmation toast for 2.5 seconds.
   - A summary of the complaint: Title, Assigned Department, Initial Status (`SUBMITTED`), and estimated resolution deadline.
3. It provides two intuitive action buttons:
   - Primary Action ("Track Your Complaint Now"): Automatically routes the student directly to `/track?code=TICK-XXXX`, passing the tracking code via URL query parameters so the tracking view loads the ticket immediately without requiring manual typing.
   - Secondary Action ("File Another Complaint" / "Done"): Closes the modal and returns the student to the clean, reset complaint form.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven complaint processing and predictive dispatch, this modal provides:
1. AI Triage Summary Card: A dedicated badge inside the modal displaying the Gemini AI classification summary (e.g. "AI Categorized: Plumbing (94% confidence) - Routed to Water Repair Squad 2").
2. Dynamic AI Priority Notice: If the complaint was flagged as a critical physical hazard by AI, the modal renders a high-visibility amber warning box: "Our automated safety scanner identified this as a potential hazard. Facility staff have been alerted immediately."
3. QR Code Pass Generation: Integration with a canvas-based QR code generator allowing students to save a digital QR badge to their mobile phones for physical verification by field maintenance technicians.

### How Other Components Standardly Interact with This File
1. `SubmitComplaint.jsx` imports `SubmissionSuccessModal` and renders it conditionally based on state: `<SubmissionSuccessModal isOpen={isSuccessModalOpen} ticket={createdTicket} onClose={() => setIsSuccessModalOpen(false)} />`.
2. It imports `useNavigate` from `react-router-dom` to execute programmatic navigation when the student clicks "Track Your Complaint Now".

### The Core Problem It Solves & Why It Exists
Without this blueprint:
- Students submit a complaint, see a quick green toast that vanishes after 3 seconds, and fail to write down their tracking code, losing all ability to track their complaint later.
- Students try to highlight the tracking code on mobile screens, accidentally highlighting the entire page or closing the modal.
- Students must manually navigate to the tracking page and manually re-type their code, introducing typos and frustration.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Component Props Contract
* `isOpen`: Boolean prop governing visibility. If `false`, the component returns `null`, preventing unnecessary DOM nodes from remaining mounted.
* `ticket`: An object containing the created ticket data returned by FastAPI:
  - `tracking_code`: String (e.g. `'TICK-8F2D'`). Required.
  - `title`: String.
  - `department_id`: Integer or null.
  - `priority`: String (`'CRITICAL'`, `'HIGH'`, `'MEDIUM'`, `'LOW'`).
  - `status`: String (`'SUBMITTED'`).
  - `sla_deadline`: ISO 8601 string or null.
* `onClose`: Callback function triggered when the student dismisses the modal or clicks "Close".

### 2. Internal State Architecture
* `isCopied`: A boolean state initialized to `false`. When the student clicks the copy button, this state flips to `true` to render a checkmark icon and tooltip text ("Copied!"), resetting to `false` after 2500ms via `setTimeout()`.

### 3. Modal Backdrop & Accessibility Shell
* Backdrop Container: A full-screen fixed overlay: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm`. Clicking the backdrop triggers `onClose()`.
* Keyboard Dismissal: An `useEffect` hook listening for the `Escape` key (`keydown` event). Pressing Escape invokes `onClose()`.
* Modal Card Container: A constrained card: `bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all`. Clicking inside the card calls `event.stopPropagation()` so the modal does not accidentally close when clicked.
* Accessible ARIA Attributes: The modal card has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-headline"`.

### 4. Visual Content Hierarchy
* Confirmation Header:
  - Centered circular badge: `mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600`. Contains an SVG checkmark icon.
  - Title: `<h3 id="modal-headline" className="text-xl font-bold text-slate-900 text-center mt-3">Complaint Lodged Successfully</h3>`.
  - Subtitle: "Your ticket has been recorded and queued for automated dispatch."
* Monospace Tracking Code Box:
  - A dedicated high-contrast callout container: `bg-slate-50 border border-slate-200 rounded-xl p-4 my-6 text-center`.
  - Label: "YOUR UNIQUE TRACKING CODE" in small uppercase bold tracking text (`text-xs font-semibold text-slate-500 uppercase tracking-wider`).
  - Monospace Code: `<div className="text-3xl font-mono font-extrabold text-indigo-600 tracking-widest my-2 select-all">{ticket.tracking_code}</div>`. The `select-all` class ensures that even if manual copying is attempted, clicking once highlights the entire code.
  - Copy Button:
    - Interactive button: `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors`.
    - Normal state: `bg-white border border-slate-300 text-slate-700 hover:bg-slate-100`. Displays an SVG clipboard icon and text "Copy Tracking Code".
    - Copied state: `bg-emerald-50 border border-emerald-300 text-emerald-700`. Displays an SVG checkmark icon and text "Copied to Clipboard!".
* Ticket Summary Details:
  - A clean 2-column key-value grid (`grid grid-cols-2 gap-3 text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100`):
    - Title: Displays truncated title.
    - Category: Displays resolved department name (or "Auto-Classified").
    - Initial Status: Displays a pill badge with text `SUBMITTED` (`bg-blue-50 text-blue-700`).
    - Resolution Notice: Displays a friendly notice: "Save this tracking code to check live updates and repair status."
* Action Button Footer:
  - Primary Button: "Track Complaint Now" with class `w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all`. Clicking calls `handleTrackNow()`.
  - Secondary Button: "Done" with class `w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors`. Clicking calls `onClose()`.

### 5. Action Handlers Logic
* `handleCopy()`:
  - Inspects whether `navigator.clipboard` is supported in the browser.
  - If supported, calls `navigator.clipboard.writeText(ticket.tracking_code)`.
  - If unsupported (e.g. insecure HTTP context), implements fallback using a hidden `<textarea>` element with `document.execCommand('copy')`.
  - Sets `isCopied = true`.
  - Clears any previous timer and schedules `setTimeout(() => setIsCopied(false), 2500)`.
* `handleTrackNow()`:
  - Closes the modal by invoking `onClose()`.
  - Uses `useNavigate()` from `react-router-dom` to transition to `/track?code=` concatenated with `encodeURIComponent(ticket.tracking_code)`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Modal Inactive** | `isOpen = false` | Component returns `null`. | Zero DOM nodes rendered; background page unaffected. |
| **2. Modal Triggered** | `isOpen = true`, `ticket = { tracking_code: 'TICK-8F2D', ... }` | Component mounts backdrop and modal card; registers `keydown` listener for Escape key; renders monospace code. | High-contrast confirmation modal appears smoothly over blurred background. |
| **3. Copy Clicked** | Student clicks "Copy Tracking Code" | `handleCopy()` executes `navigator.clipboard.writeText('TICK-8F2D')`; sets `isCopied = true`; sets 2.5s timer. | Code copied to OS clipboard; button turns green with checkmark icon and text "Copied to Clipboard!". |
| **4. Timer Expiry** | 2500ms elapsed since copy | `setTimeout` callback executes; sets `isCopied = false`. | Button smoothly reverts to original neutral "Copy Tracking Code" state. |
| **5. Track Now Clicked** | Student clicks "Track Complaint Now" | Calls `onClose()`; calls `navigate('/track?code=TICK-8F2D')`. | Modal unmounts; browser navigates instantly to tracking portal with tracking code pre-filled. |
| **6. Escape Dismissal** | Student presses keyboard `Escape` key | Event listener catches `e.key === 'Escape'`; calls `onClose()`. | Modal dismisses smoothly; focus returns to main page. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Copied Feedback Duration**: You may adjust the timeout duration in `handleCopy()` from `2500` ms to `3000` ms if a longer visual confirmation is preferred.
* **Modal Width & Elevation**: You can modify `max-w-lg` to `max-w-md` or `max-w-xl`, or adjust shadow intensity (`shadow-2xl`) without impacting modal functionality.
* **Secondary Button Label**: You can change the secondary button label from "Done" to "Submit Another Complaint" or "Close".

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **`event.stopPropagation()` on Modal Card**: Do NOT remove `onClick={e => e.stopPropagation()}` from the modal card container. If removed, clicking anywhere inside the card (such as clicking the copy button) will bubble up to the backdrop, accidentally closing the modal before the student can copy their code.
* **Monospace Typography on Tracking Code**: Do NOT remove `font-mono` from the tracking code display. Monospace typography ensures unambiguous differentiation between characters like number `0` and uppercase letter `O`, or number `1` and uppercase letter `I`.
* **URL Parameter Encoding**: When navigating to `/track?code=...`, always use `encodeURIComponent()`. Omitting encoding could break the URL structure if tracking code format specifications change.

---

## Section 5: Advanced Concepts Explained

### 1. The Asynchronous Clipboard API & Fallback Architecture
Copying text to the user's operating system clipboard is an asynchronous browser operation:
- Modern Browsers (HTTPS / localhost): Support `navigator.clipboard.writeText(text)`. This returns a JavaScript Promise that resolves when the operating system clipboard buffer has accepted the text.
- Legacy / Insecure HTTP Contexts: In environments without HTTPS or in restricted WebView browsers, `navigator.clipboard` may be `undefined`.

Our modal implements a resilient dual-tier copy strategy:
1. Primary Tier: Checks `if (navigator?.clipboard?.writeText)`. If available, executes `await navigator.clipboard.writeText(code)`.
2. Fallback Tier: If unavailable, dynamically creates an off-screen HTML `<textarea>`, sets its value to the tracking code, appends it to `document.body`, invokes `textarea.select()`, calls `document.execCommand('copy')`, and immediately removes the textarea from the DOM.
This guarantees that regardless of whether a student is using Chrome on Android, Safari on iOS, or an older browser, the 1-click copy functionality works reliably.

### 2. URL Query Parameter Deep Linking
In Single Page Application design, navigation typically swaps components in place. However, users expect deep links (URLs that specify both the destination page and the active data state to load).

Our modal utilizes URL Query Parameter Deep Linking:
- When the student clicks "Track Complaint Now", the modal does not simply navigate to `/track`.
- It appends a search parameter: `/track?code=TICK-8F2D`.
- The `TrackTicket.jsx` page (Module M2) uses React Router's `useSearchParams()` hook on initial mount to inspect `searchParams.get('code')`.
- If a code is present in the URL, `TrackTicket.jsx` immediately triggers the tracking query without waiting for the student to press search.
- Furthermore, students can copy and share this entire URL (`http://campus.edu/track?code=TICK-8F2D`) with classmates or hall wardens, allowing anyone with the link to inspect the live status directly.

### 3. Event Bubbling & Backdrop Click Dismissal
In the browser DOM event model, an event (such as a mouse click) travels through two phases: capture and bubble. During the bubbling phase, the click event fires on the target element and then travels up through all its parent elements until it reaches `window`.

Because our backdrop container renders behind the modal card, a naive click listener on the backdrop:
`<div className="backdrop" onClick={onClose}><div className="modal-card">...</div></div>`
would cause any click inside the modal card to bubble up to the backdrop, triggering `onClose()` and abruptly closing the modal while the user is trying to click the copy button.

By attaching an explicit stop-propagation handler to the inner card:
`onClick={e => e.stopPropagation()}`
we halt the event propagation at the card boundary. Clicks on the dark blurred backdrop close the modal, while clicks on the card or its buttons execute their intended actions safely.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/components/SubmissionSuccessModal.jsx` exists and is exported as default.
* [ ] Returns `null` when `isOpen` is `false`.
* [ ] When `isOpen` is `true`, renders blurred backdrop overlay and centered modal card.
* [ ] Monospace tracking code (`TICK-XXXX`) renders prominently in the center of the dialog.
* [ ] Clicking "Copy Tracking Code" copies the code to the OS clipboard and displays green checkmark icon with text "Copied to Clipboard!".
* [ ] After 2.5 seconds, the copy button reverts to its original neutral state.
* [ ] Clicking "Track Complaint Now" closes the modal and navigates to `/track?code=TICK-XXXX`.
* [ ] Clicking the backdrop or pressing the keyboard `Escape` key closes the modal.
* [ ] Clicking inside the modal card does NOT close the modal.

### Verification Commands & Troubleshooting Matrix

1. **Verify Modal Rendering via Submit Form:**
   Navigate to `http://localhost:5173/`. Submit a valid complaint form.
   Observe the modal appearance: verify backdrop blurs background content, green checkmark icon displays, and `TICK-XXXX` displays in large monospace font.

2. **Verify Clipboard Copy Functionality:**
   Click "Copy Tracking Code".
   Verify the button turns green and displays "Copied to Clipboard!".
   Open a text editor (Notepad) or browser address bar; press Ctrl+V (Paste).
   Verify that the exact tracking code (`TICK-XXXX`) is pasted cleanly.

3. **Verify Deep Link Navigation:**
   Click "Track Complaint Now".
   Verify the modal disappears and the browser URL changes to `http://localhost:5173/track?code=TICK-XXXX`.
   Verify the tracking view loads the ticket details automatically.

4. **Troubleshooting Matrix:**
   * *Problem:* Clicking the copy button immediately closes the modal.
     * *Cause:* `event.stopPropagation()` is missing from the modal card or copy button container.
     * *Fix:* Ensure the inner modal card element has `onClick={e => e.stopPropagation()}`.
   * *Problem:* Console throws error `TypeError: Cannot read properties of null (reading 'tracking_code')`.
     * *Cause:* The modal rendered while `ticket` prop was null.
     * *Fix:* Add a defensive guard at the top of the component: `if (!isOpen || !ticket) return null;`.
   * *Problem:* Copying fails with `DOMException: Document is not focused`.
     * *Cause:* Browser security restriction when window loses focus during automated tests.
     * *Fix:* Ensure the fallback `execCommand('copy')` branch is implemented for non-HTTPS or headless contexts.
