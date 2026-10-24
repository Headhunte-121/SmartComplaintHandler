# Frontend Source Documentation: `frontend/src/components/campusTwin/useMapCamera.js`

> **File Path**: `frontend/src/components/campusTwin/useMapCamera.js`  
> **Role**: High-Precision 60/120 FPS Physics-Based Camera Engine, Invariant Focal-Point Zooming, Kinetic Inertia, and Viewport-Aware Optical Framing.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, Computer Graphics & Physics Engine Specialists, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In web-based interactive map applications (like Google Maps or Mapbox), moving and zooming cannot be implemented using simple CSS transitions (like `transition: transform 0.3s ease`). CSS transitions cause noticeable stuttering, cannot preserve the geographical point directly beneath a moving cursor during rapid mouse-wheel scrolling, and cannot model physical momentum when a user flicks the map on a touchscreen.

`useMapCamera.js` is a dedicated **Physics Camera Engine Hook** for the 2D SVG Digital Twin:
1. **Continuous 60/120 FPS Hardware Render Loop**: Driven by browser `requestAnimationFrame` ticks with microsecond-precision timestamps (`performance.now()`).
2. **Invariant Focal-Point Preserving Zoom**: Derived from the affine transformation equation $P_{\text{world}} = \frac{P_{\text{focal}} - \text{Pan}}{\text{Zoom}}$. When zooming with mouse-wheel or mobile pinch gestures, the exact campus spot under the cursor remains locked in place.
3. **True Screen-to-SVG Matrix Inversion**: Uses native SVG Current Transformation Matrix (`getScreenCTM().inverse()`), making coordinate picking completely immune to CSS letterboxing, window resizing, or aspect-ratio stretching.
4. **Kinetic Inertia with Friction Damping**: Models physical velocity and exponential decay friction ($\mu = 0.92$ per 16.7ms frame) with rubber-band elastic boundary bounce when flicked past campus perimeters.
5. **Quintic Hermite Smoothstep Easing**: Interpolates cinematic fly-to animations with mathematical guarantees of zero initial and final velocity and zero acceleration ($E(t) = 10t^3 - 15t^4 + 6t^5$).
6. **Viewport-Aware Optical Framing**: When the building place card drawer opens on the right side of the screen, the camera automatically shifts its optical center from $X=540$ to $X=390$, ensuring target buildings are framed in clear view rather than hidden beneath the card.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * frontend/src/components/campusTwin/useMapCamera.js
 *
 * High-Precision, Physics-Based Camera Navigation Engine for IIIT Naya Raipur 2D Digital Twin.
 * Features:
 * - 60/120 FPS requestAnimationFrame continuous animation engine (No jarring CSS matrix transitions)
 * - Invariant focal-point-preserving zoom (Exact SVG cursor & touch centroid pinning)
 * - True Screen-to-SVG matrix transform via getScreenCTM().inverse() (Letterbox immune)
 * - Inertial drag-and-flick kinetic momentum with exponential decay friction (mu = 0.92)
 * - Cinematic smooth flyTo camera controller with dynamic distance-based Quintic Hermite easing
 * - Viewport-aware optical framing (Centers targets cleanly away from open Place Cards)
 * - Mobile dual-touch simultaneous pinch-to-zoom & two-finger pan
 * - Center-anchored toolbar zoom (+ / -) and overview reset
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Quintic Hermite Smoothstep: E(t) = 10t^3 - 15t^4 + 6t^5
// Guarantees zero initial & final velocity and acceleration for silky smooth camera transitions.
function easeQuintic(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}
```

### Plain-English Purpose
Imports React hooks and defines the mathematical easing function `easeQuintic(t)`. 
In standard animation, linear interpolation ($y = t$) causes jarring starts and sudden stops. In physics, an object at rest must accelerate gradually, reach maximum velocity, and decelerate smoothly. The **Quintic Hermite polynomial** $10t^3 - 15t^4 + 6t^5$ satisfies the boundary conditions where the first and second derivatives at $t=0$ and $t=1$ are zero ($v=0, a=0$), guaranteeing a smooth camera transition.

### Line-by-Line Breakdown
- `const c = Math.max(0, Math.min(1, t))`: Clamps progress parameter $t$ strictly between $0.0$ and $1.0$.
- `c * c * c * (c * (c * 6 - 15) + 10)`: Horner's method evaluation of $10t^3 - 15t^4 + 6t^5$, reducing 5 multiplication operations to 3 for CPU efficiency.

---

```javascript
// Invariant focal zoom equation: P_world = (P_focal - Pan) / Zoom
// To preserve P_world under P_focal when changing zoom:
function computeFocalPan(focalX, focalY, curPan, curZoom, nextZoom) {
  return {
    x: focalX - (focalX - curPan.x) * (nextZoom / curZoom),
    y: focalY - (focalY - curPan.y) * (nextZoom / curZoom),
  };
}
```

### Plain-English Purpose
The mathematical foundation of cursor-anchored zooming. 
If a user points their mouse at the Canteen and scrolls the wheel, they expect the Canteen to remain directly beneath their cursor. If you merely scale the map, the Canteen flies across the screen. 
`computeFocalPan` calculates the exact new $(X, Y)$ pan offset required to lock the world coordinates under $(focalX, focalY)$ in place during a zoom change.

### Line-by-Line Breakdown
- `focalX - (focalX - curPan.x) * (nextZoom / curZoom)`: Multiplies the distance between the focal anchor and current pan origin by the scale ratio $\frac{Z_{\text{new}}}{Z_{\text{cur}}}$, and subtracts from the focal anchor. In 2D graphics affine transformations, this preserves the focal point invariant.

---

```javascript
export function useMapCamera({
  svgRef,
  isPlaceCardOpen = false,
  onTargetArrival = null,
  minZoom = 0.75,
  maxZoom = 4.0,
}) {
  // Visible state consumed by React render tree
  const [zoom, setZoomState] = useState(1.0);
  const [pan, setPanState] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Synchronous camera ref for 60/120 FPS physics loop (avoids closure staleness)
  const cameraRef = useRef({ zoom: 1.0, pan: { x: 0, y: 0 } });
  const rafIdRef = useRef(null);

  // Panning & drag physics tracking
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerHistoryRef = useRef([]); // Rolling history of [{ x, y, time }] over last 80ms
  const velocityRef = useRef({ vx: 0, vy: 0 }); // px/ms

  // Multi-touch tracking
  const touchStateRef = useRef(null);

  // Active programmatic animation (flyTo, smooth zoom, inertia)
  const activeAnimationRef = useRef(null);
```

### Plain-English Purpose
Declares the hook and sets up a dual-tracking system:
1. **React State (`useState`)**: Stores `zoom`, `pan`, and `isPanning` so React components re-render when camera transformations change.
2. **Mutable References (`useRef`)**: In 60/120 FPS physics loops, relying on React state causes closure staleness (the loop would read outdated state values). Storing values in `cameraRef.current` allows synchronous reads and writes on every animation frame. It also tracks drag start points, rolling cursor velocity history over the last 80ms, and multi-touch centroids.

---

```javascript
  // Synchronize internal ref with state
  const syncCamera = useCallback((newPan, newZoom) => {
    cameraRef.current = { pan: newPan, zoom: newZoom };
    setPanState(newPan);
    setZoomState(newZoom);
  }, []);

  // Calculate dynamic boundaries based on zoom level to ensure campus remains viewable
  const getPanBounds = useCallback((curZoom) => {
    const scaledW = 1080 * curZoom;
    const scaledH = 800 * curZoom;
    const paddingX = 420;
    const paddingY = 320;
    return {
      minX: 1080 - scaledW - paddingX,
      maxX: paddingX,
      minY: 800 - scaledH - paddingY,
      maxY: paddingY,
    };
  }, []);
```

### Plain-English Purpose
- `syncCamera`: Updates both the synchronous physics ref (`cameraRef.current`) and reactive React state (`setPanState`, `setZoomState`) simultaneously.
- `getPanBounds`: Computes allowable translation limits. As zoom increases, the virtual campus boundary expands, allowing wider panning while preventing the user from panning into empty grey void.

---

```javascript
  // Screen/DOM client coordinate to SVG space coordinate transformation
  const getSvgCoordinates = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return { x: 540, y: 400 };

      try {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const svgPt = pt.matrixTransform(ctm.inverse());
          return { x: svgPt.x, y: svgPt.y };
        }
      } catch {
        // Fallback to aspect-ratio letterbox calculation
      }

      const rect = svg.getBoundingClientRect();
      const standardRatio = 1080 / 800;
      const currentRatio = rect.width / (rect.height || 1);
      let renderW = rect.width;
      let renderH = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (currentRatio > standardRatio) {
        renderW = rect.height * standardRatio;
        offsetX = (rect.width - renderW) / 2;
      } else {
        renderH = rect.width / standardRatio;
        offsetY = (rect.height - renderH) / 2;
      }

      return {
        x: ((clientX - rect.left - offsetX) / (renderW || 1)) * 1080,
        y: ((clientY - rect.top - offsetY) / (renderH || 1)) * 800,
      };
    },
    [svgRef]
  );
```

### Plain-English Purpose
Maps physical screen pixels $(clientX, clientY)$ from mouse or touch events to the internal $1080 \times 800$ SVG coordinate space.
- Primary method: Uses `svg.getScreenCTM().inverse()`, multiplying the screen point by the inverse Current Transformation Matrix.
- Fallback method: If the matrix is unavailable, it calculates the CSS letterbox aspect ratio offset manually.

### Deep Term & Concept Expansion
- **Current Transformation Matrix (CTM)**: A $3\times3$ affine transformation matrix used by SVG engines to map coordinates from the local coordinate system to the client viewport. Multiplying a screen coordinate vector by $CTM^{-1}$ (the matrix inverse) inverts all parent CSS scalings, paddings, and page scroll offsets, providing mathematically exact canvas coordinates.

---

```javascript
  // Main 60/120 FPS Physics Tick Loop
  const runPhysicsTick = useCallback(() => {
    const now = performance.now();
    const anim = activeAnimationRef.current;

    if (!anim) {
      rafIdRef.current = null;
      return;
    }

    if (anim.type === 'flyTo') {
      const elapsed = now - anim.startTime;
      const progress = Math.min(1.0, elapsed / anim.duration);
      const ease = easeQuintic(progress);

      const nextPan = {
        x: anim.startPan.x + (anim.targetPan.x - anim.startPan.x) * ease,
        y: anim.startPan.y + (anim.targetPan.y - anim.startPan.y) * ease,
      };
      const nextZoom = anim.startZoom + (anim.targetZoom - anim.startZoom) * ease;

      syncCamera(nextPan, nextZoom);

      if (progress >= 1.0) {
        activeAnimationRef.current = null;
        rafIdRef.current = null;
        if (anim.onArrival) {
          anim.onArrival({ x: anim.targetX, y: anim.targetY, zoom: nextZoom });
        }
        return;
      }

      rafIdRef.current = requestAnimationFrame(runPhysicsTick);
    }
```

### Plain-English Purpose
This is the core physics tick executed by `requestAnimationFrame`. For `flyTo` transitions:
1. Calculates elapsed milliseconds since animation start.
2. Computes normalized progress ($0.0 \le \text{progress} \le 1.0$) and applies `easeQuintic(progress)`.
3. Interpolates `pan.x`, `pan.y`, and `zoom`.
4. Updates camera state.
5. If progress reaches 1.0, fires the `onArrival` callback and terminates the loop; otherwise, requests the next animation frame.

---

```javascript
    else if (anim.type === 'inertia') {
      const dt = Math.min(32, Math.max(4, now - (anim.lastTime || now)));
      anim.lastTime = now;

      // Friction damping (mu = 0.92 per 16.67ms)
      const friction = Math.pow(0.92, dt / 16.67);
      anim.vx *= friction;
      anim.vy *= friction;

      let nextPanX = cameraRef.current.pan.x + anim.vx * dt;
      let nextPanY = cameraRef.current.pan.y + anim.vy * dt;

      // Elastic boundary resistance during inertia
      const bounds = getPanBounds(cameraRef.current.zoom);
      let boundaryRestoring = false;

      if (nextPanX < bounds.minX) {
        nextPanX += (bounds.minX - nextPanX) * 0.15;
        anim.vx *= 0.7;
        boundaryRestoring = true;
      } else if (nextPanX > bounds.maxX) {
        nextPanX += (bounds.maxX - nextPanX) * 0.15;
        anim.vx *= 0.7;
        boundaryRestoring = true;
      }

      if (nextPanY < bounds.minY) {
        nextPanY += (bounds.minY - nextPanY) * 0.15;
        anim.vy *= 0.7;
        boundaryRestoring = true;
      } else if (nextPanY > bounds.maxY) {
        nextPanY += (bounds.maxY - nextPanY) * 0.15;
        anim.vy *= 0.7;
        boundaryRestoring = true;
      }

      syncCamera({ x: nextPanX, y: nextPanY }, cameraRef.current.zoom);

      const speed = Math.hypot(anim.vx, anim.vy);
      if (speed < 0.04 && !boundaryRestoring) {
        activeAnimationRef.current = null;
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(runPhysicsTick);
    }
```

### Plain-English Purpose
The kinetic momentum / inertia simulation:
1. Calculates delta time ($dt$).
2. Applies exponential friction decay: $\mu = 0.92^{\frac{dt}{16.67}}$, reducing velocity naturally over time.
3. If momentum carries the camera beyond map boundary limits, it applies **elastic restorative spring forces** (`(bounds - nextPan) * 0.15`), dampening velocity and gently bouncing the camera back into view.
4. Stops when speed drops below $0.04\text{ px/ms}$.

---

```javascript
    else if (anim.type === 'smoothZoom') {
      const elapsed = now - anim.startTime;
      const progress = Math.min(1.0, elapsed / anim.duration);
      const ease = easeQuintic(progress);

      const nextZoom = anim.startZoom + (anim.targetZoom - anim.startZoom) * ease;
      const nextPan = computeFocalPan(anim.focalX, anim.focalY, anim.startPan, anim.startZoom, nextZoom);

      syncCamera(nextPan, nextZoom);

      if (progress >= 1.0) {
        activeAnimationRef.current = null;
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(runPhysicsTick);
    }
  }, [getPanBounds, syncCamera]);
```

### Plain-English Purpose
Executes smooth zooming triggered by toolbar `+` and `−` buttons, smoothly interpolating zoom while locking the center focal anchor in place.

---

```javascript
  // Smooth Cinematic Fly-To Camera Controller
  const flyTo = useCallback(
    (targetX, targetY, targetZoom = 1.85, options = {}) => {
      const curPan = cameraRef.current.pan;
      const curZoom = cameraRef.current.zoom;

      // Viewport-aware optical center:
      // When place card is open, offset center to left (390 vs 540) so the target building is in clean view!
      const opticalCenterX = options.offsetForCard ?? (isPlaceCardOpen ? 390 : 540);
      const opticalCenterY = 400;

      const targetPanX = opticalCenterX - targetX * targetZoom;
      const targetPanY = opticalCenterY - targetY * targetZoom;

      const dist = Math.hypot(targetPanX - curPan.x, targetPanY - curPan.y);
      const duration = Math.min(880, Math.max(380, 320 + dist * 0.35));

      startAnimation({
        type: 'flyTo',
        startTime: performance.now(),
        duration,
        startPan: { ...curPan },
        targetPan: { x: targetPanX, y: targetPanY },
        startZoom: curZoom,
        targetZoom,
        targetX,
        targetY,
        onArrival: options.onArrival || onTargetArrival,
      });
    },
    [isPlaceCardOpen, onTargetArrival, startAnimation]
  );
```

### Plain-English Purpose
The public `flyTo` controller. Crucially, it inspects `isPlaceCardOpen`:
- When the place card is closed, the optical center is $X=540$ (dead center of the $1080$-wide canvas).
- When the place card is open (taking up ~350px on the right), it shifts the optical center to $X=390$. This guarantees that the targeted building lands squarely in the visible viewport area rather than hidden behind the drawer.
- Computes Euclidean distance ($\sqrt{\Delta X^2 + \Delta Y^2}$) to scale duration dynamically between 380ms and 880ms.

---

```javascript
  // Cursor-Centered Mouse Wheel Zoom
  const handleWheel = useCallback(
    (e) => {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      stopAnimation();

      const focal = getSvgCoordinates(e.clientX, e.clientY);
      const curZoom = cameraRef.current.zoom;
      const curPan = cameraRef.current.pan;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, Number((curZoom * zoomFactor).toFixed(3))));

      if (nextZoom === curZoom) return;

      const nextPan = computeFocalPan(focal.x, focal.y, curPan, curZoom, nextZoom);
      syncCamera(nextPan, nextZoom);
    },
    [getSvgCoordinates, maxZoom, minZoom, stopAnimation, syncCamera]
  );
```

### Plain-English Purpose
Handles mouse-wheel scrolling. It extracts the SVG coordinate under the mouse cursor (`focal`), scales zoom up ($1.15\times$) or down ($0.87\times$), clamps between `minZoom` ($0.75\times$) and `maxZoom` ($4.0\times$), calculates the new focal pan offset, and updates the camera.

---

```javascript
  // Mouse Drag Panning with Velocity & Inertia
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      stopAnimation();

      isDraggingRef.current = true;
      setIsPanning(true);
      dragStartRef.current = {
        x: e.clientX - cameraRef.current.pan.x,
        y: e.clientY - cameraRef.current.pan.y,
      };

      const now = performance.now();
      pointerHistoryRef.current = [{ x: e.clientX, y: e.clientY, time: now }];
    },
    [stopAnimation]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;

      const rawNextX = e.clientX - dragStartRef.current.x;
      const rawNextY = e.clientY - dragStartRef.current.y;

      const bounds = getPanBounds(cameraRef.current.zoom);

      // Rubber-band resistance if dragged past boundaries
      let nextX = rawNextX;
      let nextY = rawNextY;

      if (rawNextX < bounds.minX) {
        const overflow = bounds.minX - rawNextX;
        nextX = bounds.minX - Math.sqrt(overflow) * 4.5;
      } else if (rawNextX > bounds.maxX) {
        const overflow = rawNextX - bounds.maxX;
        nextX = bounds.maxX + Math.sqrt(overflow) * 4.5;
      }

      if (rawNextY < bounds.minY) {
        const overflow = bounds.minY - rawNextY;
        nextY = bounds.minY - Math.sqrt(overflow) * 4.5;
      } else if (rawNextY > bounds.maxY) {
        const overflow = rawNextY - bounds.maxY;
        nextY = bounds.maxY + Math.sqrt(overflow) * 4.5;
      }

      syncCamera({ x: nextX, y: nextY }, cameraRef.current.zoom);

      const now = performance.now();
      pointerHistoryRef.current.push({ x: e.clientX, y: e.clientY, time: now });
      while (pointerHistoryRef.current.length > 2 && now - pointerHistoryRef.current[0].time > 80) {
        pointerHistoryRef.current.shift();
      }
    },
    [getPanBounds, syncCamera]
  );
```

### Plain-English Purpose
Mouse drag handlers:
- `handleMouseDown`: Initiates drag tracking on left click (`e.button === 0`).
- `handleMouseMove`: Computes new pan positions. If dragged past boundary limits, it applies **rubber-band square-root dampening** ($\sqrt{\text{overflow}} \times 4.5$), creating resistance like pulling an elastic band. It records cursor positions in a rolling 80ms buffer.

---

```javascript
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPanning(false);

    // Compute release velocity from history
    const history = pointerHistoryRef.current;
    if (history.length >= 2) {
      const oldest = history[0];
      const latest = history[history.length - 1];
      const dt = latest.time - oldest.time;

      if (dt > 12 && dt < 120) {
        const vx = (latest.x - oldest.x) / dt;
        const vy = (latest.y - oldest.y) / dt;
        const speed = Math.hypot(vx, vy);

        if (speed > 0.12) {
          velocityRef.current = { vx, vy };
          startAnimation({
            type: 'inertia',
            vx,
            vy,
            lastTime: performance.now(),
          });
          return;
        }
      }
    }

    // Boundary snap back if dropped outside
    const bounds = getPanBounds(cameraRef.current.zoom);
    const curPan = cameraRef.current.pan;
    const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, curPan.x));
    const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, curPan.y));

    if (clampedX !== curPan.x || clampedY !== curPan.y) {
      startAnimation({
        type: 'flyTo',
        startTime: performance.now(),
        duration: 250,
        startPan: { ...curPan },
        targetPan: { x: clampedX, y: clampedY },
        startZoom: cameraRef.current.zoom,
        targetZoom: cameraRef.current.zoom,
      });
    }
  }, [getPanBounds, startAnimation]);
```

### Plain-English Purpose
On mouse release:
1. Calculates release velocity ($v_x = \frac{\Delta x}{\Delta t}, v_y = \frac{\Delta y}{\Delta t}$) over the last 80ms.
2. If velocity exceeds the flick threshold ($0.12\text{ px/ms}$), it launches the `inertia` physics animation, letting the map glide to a stop.
3. If dropped while stretched beyond boundary limits, it triggers a 250ms snap-back animation returning the map to legal bounds.

---

```javascript
  // Mobile Multi-Touch Gesture System (1-finger pan with inertia, 2-finger pinch-zoom & pan)
  const handleTouchStart = useCallback( ... );
  const handleTouchMove = useCallback( ... );
  const handleTouchEnd = useCallback( ... );
  const handleKeyDown = useCallback( ... );

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return {
    zoom,
    pan,
    isPanning,
    flyTo,
    resetView,
    zoomBy,
    handleWheel,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  };
}
```

### Plain-English Purpose
Handles mobile touch interactions:
- 1-finger touch: Functions as inertial pan.
- 2-finger touch: Measures the Euclidean distance between touch points (`dist = Math.hypot(...)`) and tracks the midpoint centroid, enabling simultaneous two-finger pinch-to-zoom and panning.
- Returns all camera vectors and event listeners.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is "focal-point-preserving zoom", and why is it mathematically superior to simple scaling?
**Model Answer:**  
Simple scaling multiplies coordinates by a scale factor, which expands the canvas away from the top-left origin `(0, 0)`. When zooming with a mouse cursor, the user expects the specific building beneath the cursor to stay pinned under the cursor. 
Focal-point preserving zoom solves this with the equation:
$\text{Pan}_{\text{next}} = P_{\text{focal}} - (P_{\text{focal}} - \text{Pan}_{\text{cur}}) \times \frac{Z_{\text{next}}}{Z_{\text{cur}}}$.
Adjusting the pan translation inversely to the zoom delta ensures that the world point directly under the mouse remains invariant throughout the zoom gesture.

### Q2: What is the purpose of the Quintic Hermite easing function ($10t^3 - 15t^4 + 6t^5$)?
**Model Answer:**  
Standard linear or cubic ease functions still exhibit sudden acceleration changes at the start and end of animations. The Quintic Hermite polynomial has first and second derivatives equal to zero at both $t=0$ and $t=1$:
$E'(0) = E'(1) = 0$ (Zero velocity start and stop).
$E''(0) = E''(1) = 0$ (Zero acceleration / zero jerk).
This produces a smooth cinematic camera glide without any abrupt jarring movements.

### Q3: What is "Viewport-Aware Optical Framing" in `flyTo`?
**Model Answer:**  
When a user selects a building, the Building Place Card slides open on the right third of the screen (occupying ~350px). If the camera centered the building at $X=540$ (the geometric canvas center), the right half of the building would be obscured beneath the place card. `flyTo` checks `isPlaceCardOpen`; if true, it shifts the optical center to $X=390$, framing the building in the open space on the left.

### Q4: How does kinetic inertia work upon mouse/touch release?
**Model Answer:**  
During dragging, `useMapCamera` logs cursor positions in a rolling 80ms buffer. Upon release, it calculates release velocity:
$v_x = \frac{\Delta x}{\Delta t}, v_y = \frac{\Delta y}{\Delta t}$.
If velocity exceeds $0.12\text{ px/ms}$, it launches an `inertia` loop on `requestAnimationFrame`. On each frame, velocity is decayed by friction:
$v_{\text{next}} = v \times \mu^{\frac{dt}{16.67}}$ (where $\mu = 0.92$).
The map glides smoothly and halts once velocity drops below $0.04\text{ px/ms}$.

### Q5: Why is `cameraRef` used alongside React state `[zoom, setZoomState]`?
**Model Answer:**  
React state updates are asynchronous and batched. If an animation loop running at 120 FPS reads from `zoom` state inside its closure, it will read stale data from the previous render. Storing the live camera transform in a mutable `cameraRef.current` allows the 120 FPS physics loop to read and mutate coordinates synchronously, while `setZoomState` and `setPanState` are called to keep the React UI in sync.

---

## 4. Quick Reference Summary Table

| Feature / Physics Model | Mathematical Formula | Physical Effect |
| :--- | :--- | :--- |
| **Quintic Hermite Easing** | $E(t) = 10t^3 - 15t^4 + 6t^5$ | Smooth cinematic camera glide ($v=0, a=0$ at bounds) |
| **Invariant Focal Zoom** | $\text{Pan}' = P_f - (P_f - \text{Pan}) \times \frac{Z'}{Z}$ | Keeps cursor anchor point locked during zoom |
| **Inertial Friction Decay** | $v' = v \times 0.92^{\frac{dt}{16.67}}$ | Realistic kinetic gliding upon flick release |
| **Rubber-Band Resistance** | $X' = \text{Bounds} \pm \sqrt{\text{Overflow}} \times 4.5$ | Elastic tension when dragged past map boundaries |
| **Screen-to-SVG Matrix** | $\text{Point}_{\text{svg}} = \text{Point}_{\text{screen}} \times CTM^{-1}$ | Exact coordinate picking immune to CSS letterboxing |
| **Optical Center Offset** | $X_{\text{center}} = 390\text{px}$ (Card Open) vs $540\text{px}$ (Closed) | Prevents buildings from hiding under the place card |
