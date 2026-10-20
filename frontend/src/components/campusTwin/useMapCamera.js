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

// Invariant focal zoom equation: P_world = (P_focal - Pan) / Zoom
// To preserve P_world under P_focal when changing zoom:
function computeFocalPan(focalX, focalY, curPan, curZoom, nextZoom) {
  return {
    x: focalX - (focalX - curPan.x) * (nextZoom / curZoom),
    y: focalY - (focalY - curPan.y) * (nextZoom / curZoom),
  };
}

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
  const touchStateRef = useRef(null); // { touches: [{ x, y }], dist: number, centroid: { x, y } }

  // Active programmatic animation (flyTo, smooth zoom, inertia)
  const activeAnimationRef = useRef(null);

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

  // Stop any active animation loop
  const stopAnimation = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    activeAnimationRef.current = null;
  }, []);

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
    } else if (anim.type === 'inertia') {
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

      // Stop inertia when velocity falls below threshold and within bounds
      const speed = Math.hypot(anim.vx, anim.vy);
      if (speed < 0.04 && !boundaryRestoring) {
        activeAnimationRef.current = null;
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(runPhysicsTick);
    } else if (anim.type === 'smoothZoom') {
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

  const startAnimation = useCallback(
    (animConfig) => {
      stopAnimation();
      activeAnimationRef.current = animConfig;
      rafIdRef.current = requestAnimationFrame(runPhysicsTick);
    },
    [stopAnimation, runPhysicsTick]
  );

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

  // Smooth Reset to 100% Overview
  const resetView = useCallback(() => {
    const curPan = cameraRef.current.pan;
    const curZoom = cameraRef.current.zoom;
    const targetPan = { x: 0, y: 0 };
    const targetZoom = 1.0;

    const dist = Math.hypot(targetPan.x - curPan.x, targetPan.y - curPan.y);
    const duration = Math.min(680, Math.max(360, 260 + dist * 0.25));

    startAnimation({
      type: 'flyTo',
      startTime: performance.now(),
      duration,
      startPan: { ...curPan },
      targetPan,
      startZoom: curZoom,
      targetZoom,
      targetX: 540,
      targetY: 400,
      onArrival: null,
    });
  }, [startAnimation]);

  // Center-Anchored Incremental Zoom (+ / - buttons)
  const zoomBy = useCallback(
    (deltaZoom) => {
      const curZoom = cameraRef.current.zoom;
      const curPan = cameraRef.current.pan;
      const targetZoom = Math.min(maxZoom, Math.max(minZoom, Number((curZoom + deltaZoom).toFixed(2))));

      if (targetZoom === curZoom) return;

      const focalX = isPlaceCardOpen ? 390 : 540;
      const focalY = 400;

      startAnimation({
        type: 'smoothZoom',
        startTime: performance.now(),
        duration: 260,
        startPan: { ...curPan },
        startZoom: curZoom,
        targetZoom,
        focalX,
        focalY,
      });
    },
    [isPlaceCardOpen, maxZoom, minZoom, startAnimation]
  );

  // Cursor-Centered Mouse Wheel Zoom
  const handleWheel = useCallback(
    (e) => {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      stopAnimation();

      const focal = getSvgCoordinates(e.clientX, e.clientY);
      const curZoom = cameraRef.current.zoom;
      const curPan = cameraRef.current.pan;

      // Exponential continuous scale factor
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, Number((curZoom * zoomFactor).toFixed(3))));

      if (nextZoom === curZoom) return;

      const nextPan = computeFocalPan(focal.x, focal.y, curPan, curZoom, nextZoom);
      syncCamera(nextPan, nextZoom);
    },
    [getSvgCoordinates, maxZoom, minZoom, stopAnimation, syncCamera]
  );

  // Double Click Smooth Zoom to Point
  const handleDoubleClick = useCallback(
    (e) => {
      const focal = getSvgCoordinates(e.clientX, e.clientY);
      const curZoom = cameraRef.current.zoom;
      const targetZoom = Math.min(3.5, curZoom * 1.6);
      flyTo(focal.x, focal.y, targetZoom);
    },
    [getSvgCoordinates, flyTo]
  );

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

      // Append to rolling pointer history (keep last 80ms)
      const now = performance.now();
      pointerHistoryRef.current.push({ x: e.clientX, y: e.clientY, time: now });
      while (pointerHistoryRef.current.length > 2 && now - pointerHistoryRef.current[0].time > 80) {
        pointerHistoryRef.current.shift();
      }
    },
    [getPanBounds, syncCamera]
  );

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

  // Mobile Multi-Touch Gesture System (1-finger pan with inertia, 2-finger pinch-zoom & pan)
  const handleTouchStart = useCallback(
    (e) => {
      stopAnimation();

      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        setIsPanning(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - cameraRef.current.pan.x,
          y: e.touches[0].clientY - cameraRef.current.pan.y,
        };
        pointerHistoryRef.current = [{ x: e.touches[0].clientX, y: e.touches[0].clientY, time: performance.now() }];
        touchStateRef.current = null;
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        setIsPanning(false);

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const centroidClient = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };
        const centroidSvg = getSvgCoordinates(centroidClient.x, centroidClient.y);

        touchStateRef.current = {
          dist,
          centroidClient,
          centroidSvg,
          startZoom: cameraRef.current.zoom,
          startPan: { ...cameraRef.current.pan },
        };
      }
    },
    [getSvgCoordinates, stopAnimation]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (e.cancelable && e.preventDefault) {
        e.preventDefault();
      }
      if (e.touches.length === 1 && isDraggingRef.current) {
        const t = e.touches[0];
        const rawNextX = t.clientX - dragStartRef.current.x;
        const rawNextY = t.clientY - dragStartRef.current.y;

        const bounds = getPanBounds(cameraRef.current.zoom);
        let nextX = Math.max(bounds.minX - 80, Math.min(bounds.maxX + 80, rawNextX));
        let nextY = Math.max(bounds.minY - 80, Math.min(bounds.maxY + 80, rawNextY));

        syncCamera({ x: nextX, y: nextY }, cameraRef.current.zoom);

        const now = performance.now();
        pointerHistoryRef.current.push({ x: t.clientX, y: t.clientY, time: now });
        while (pointerHistoryRef.current.length > 2 && now - pointerHistoryRef.current[0].time > 80) {
          pointerHistoryRef.current.shift();
        }
      } else if (e.touches.length === 2 && touchStateRef.current) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const ratio = dist / (touchStateRef.current.dist || 1);

        const nextZoom = Math.min(maxZoom, Math.max(minZoom, Number((touchStateRef.current.startZoom * ratio).toFixed(3))));

        const currentCentroidClient = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };
        const panDeltaX = currentCentroidClient.x - touchStateRef.current.centroidClient.x;
        const panDeltaY = currentCentroidClient.y - touchStateRef.current.centroidClient.y;

        const focal = touchStateRef.current.centroidSvg;
        const focalPan = computeFocalPan(
          focal.x,
          focal.y,
          touchStateRef.current.startPan,
          touchStateRef.current.startZoom,
          nextZoom
        );

        syncCamera({ x: focalPan.x + panDeltaX, y: focalPan.y + panDeltaY }, nextZoom);
      }
    },
    [getPanBounds, maxZoom, minZoom, syncCamera]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (e.touches.length === 0) {
        touchStateRef.current = null;
        handleMouseUp();
      } else if (e.touches.length === 1) {
        // Transition from 2-finger pinch back to 1-finger pan smoothly
        touchStateRef.current = null;
        isDraggingRef.current = true;
        setIsPanning(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - cameraRef.current.pan.x,
          y: e.touches[0].clientY - cameraRef.current.pan.y,
        };
        pointerHistoryRef.current = [{ x: e.touches[0].clientX, y: e.touches[0].clientY, time: performance.now() }];
      }
    },
    [handleMouseUp]
  );

  // Keyboard navigation support (+ / - to zoom, arrow keys to pan, R / Escape to reset)
  const handleKeyDown = useCallback(
    (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomBy(0.25);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomBy(-0.25);
      } else if (e.key === 'r' || e.key === 'R' || e.key === '0') {
        e.preventDefault();
        resetView();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        syncCamera({ x: cameraRef.current.pan.x + 80, y: cameraRef.current.pan.y }, cameraRef.current.zoom);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        syncCamera({ x: cameraRef.current.pan.x - 80, y: cameraRef.current.pan.y }, cameraRef.current.zoom);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        syncCamera({ x: cameraRef.current.pan.x, y: cameraRef.current.pan.y + 80 }, cameraRef.current.zoom);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        syncCamera({ x: cameraRef.current.pan.x, y: cameraRef.current.pan.y - 80 }, cameraRef.current.zoom);
      }
    },
    [resetView, syncCamera, zoomBy]
  );

  // Clean up RAF loop on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
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
