import re

def update_gis_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add CSS for drawing-active-bar if not present
    if '.drawing-active-bar' not in content:
        css_insert = '''
    /* Floating Active Drawing Action Bar */
    .drawing-active-bar {
      position: absolute;
      top: 68px;
      left: 65px;
      z-index: 600;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1.5px solid #38bdf8;
      border-radius: 12px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.25);
      animation: barFadeSlide 0.2s ease-out;
    }
    @keyframes barFadeSlide {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .drawing-pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: pulseDot 1.2s infinite;
      display: inline-block;
      flex-shrink: 0;
    }
    @keyframes pulseDot {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
'''
        # Insert after .hud-bar block
        target = '.hud-item {'
        if target in content:
            content = content.replace(target, css_insert + '\n    ' + target, 1)
        else:
            content = content.replace('</style>', css_insert + '\n  </style>', 1)

    # 2. Add HTML for #drawing-active-bar if not present
    if 'id="drawing-active-bar"' not in content:
        html_insert = '''
      <!-- Floating Active Drawing Action Bar -->
      <div id="drawing-active-bar" class="drawing-active-bar" style="display: none;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="drawing-pulse-dot"></span>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span id="drawing-active-title" style="font-weight: 700; color: #f8fafc; font-size: 13px;">🛣️ Tracing Road</span>
              <span id="drawing-active-points" style="background: rgba(255,255,255,0.15); color: #94a3b8; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; font-family: monospace;">0 dots placed</span>
            </div>
            <div id="drawing-active-subtitle" style="font-size: 10px; color: #94a3b8; margin-top: 1px;">Click points on satellite map</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; margin-left: 6px;">
          <button type="button" class="btn warning" id="btn-undo-vertex" onclick="undoLastDrawingVertex()" title="Undo last placed dot (Backspace or Ctrl+Z)" style="font-size: 11px; padding: 5px 11px; background: #d97706; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
            ↩️ Undo Dot
          </button>
          <button type="button" class="btn success" id="btn-finish-shape" onclick="finishCurrentDrawing()" title="Finish & save shape (Enter or Double-click)" style="font-size: 11px; padding: 5px 11px; background: #059669; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
            ✅ Finish
          </button>
          <button type="button" class="btn danger" id="btn-cancel-drawing" onclick="cancelCurrentDrawing(true)" title="Cancel drawing without saving (Escape or Right-Click)" style="font-size: 11px; padding: 5px 12px; background: #dc2626; color: #fff; font-weight: 800; border: 1px solid #f87171; border-radius: 6px; cursor: pointer;">
            ❌ Cancel (Esc)
          </button>
        </div>
        <div style="font-size: 10px; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.18); padding-left: 10px; line-height: 1.3;">
          <div><b style="color: #f87171;">Esc / Right-Click</b>: Cancel &bull; <b style="color: #fbbf24;">Backspace</b>: Undo</div>
          <div><b style="color: #34d399;">Double-Click / Enter</b>: Finish</div>
        </div>
      </div>
'''
        # Insert inside #map-container after .hud-bar
        pattern = r'(<div class="hud-bar">[\s\S]*?</div>\s*</div>)'
        # Let's match the hud-bar closing tag
        hud_end = '<!-- Sidebar with 3 Modular GIS Tabs -->'
        if hud_end in content:
            # find </div> right before hud_end
            idx = content.find(hud_end)
            prev_div_close = content.rfind('</div>', 0, idx)
            # prev_div_close closes #map-container! We want inside #map-container, so before prev_div_close
            content = content[:prev_div_close] + html_insert + '\n    ' + content[prev_div_close:]

    # 3. Add JS helper functions: cancelCurrentDrawing, undoLastDrawingVertex, finishCurrentDrawing, etc.
    js_helpers = '''
    // ==========================================
    // --- GIS Drawing Controls: Cancel, Undo & Finish ---
    // ==========================================
    function isDrawingActive() {
      const pmActive = map && map.pm && (
        (typeof map.pm.globalDrawModeEnabled === 'function' && map.pm.globalDrawModeEnabled()) ||
        (typeof map.pm.Draw?.getActiveShape === 'function' && Boolean(map.pm.Draw.getActiveShape()))
      );
      return Boolean(pmActive || isAddingPin || isAddingEntrance || isDrawingWing || isDrawingCourtyard || window.activeLineType);
    }

    function getActiveDrawingVertexCount() {
      if (!map || !map.pm) return 0;
      try {
        const shape = map.pm.Draw?.getActiveShape?.();
        if (shape && map.pm.Draw[shape]) {
          const drawInstance = map.pm.Draw[shape];
          if (Array.isArray(drawInstance._markers)) {
            return drawInstance._markers.length;
          }
          if (drawInstance._layer && typeof drawInstance._layer.getLatLngs === 'function') {
            const pts = drawInstance._layer.getLatLngs();
            const flat = Array.isArray(pts[0]) ? pts[0] : pts;
            return flat.length;
          }
        }
      } catch (err) {
        console.warn('getActiveDrawingVertexCount error:', err);
      }
      return 0;
    }

    function showDrawingHUD(title, subtitle) {
      const bar = document.getElementById('drawing-active-bar');
      if (!bar) return;
      const t = document.getElementById('drawing-active-title');
      const s = document.getElementById('drawing-active-subtitle');
      if (t) t.textContent = title || 'Drawing Active';
      if (s) s.textContent = subtitle || '';
      updateDrawingHUD(0);
      bar.style.display = 'flex';
    }

    function updateDrawingHUD(count) {
      const ptsBadge = document.getElementById('drawing-active-points');
      const undoBtn = document.getElementById('btn-undo-vertex');
      const finishBtn = document.getElementById('btn-finish-shape');
      if (ptsBadge) {
        ptsBadge.textContent = `${count} dot${count === 1 ? '' : 's'} placed`;
        if (count > 0) {
          ptsBadge.style.background = '#0284c7';
          ptsBadge.style.color = '#ffffff';
        } else {
          ptsBadge.style.background = 'rgba(255,255,255,0.15)';
          ptsBadge.style.color = '#94a3b8';
        }
      }
      if (undoBtn) {
        undoBtn.style.opacity = count > 0 ? '1' : '0.4';
        undoBtn.style.pointerEvents = count > 0 ? 'auto' : 'none';
      }
      if (finishBtn) {
        const isPoly = isDrawingWing || isDrawingCourtyard;
        const minNeeded = isPoly ? 3 : 2;
        const canFinish = count >= minNeeded;
        finishBtn.style.opacity = canFinish ? '1' : '0.4';
        finishBtn.style.pointerEvents = canFinish ? 'auto' : 'none';
      }
    }

    function hideDrawingHUD() {
      const bar = document.getElementById('drawing-active-bar');
      if (bar) bar.style.display = 'none';
    }

    function cancelCurrentDrawing(showNotice = true) {
      let wasActive = false;

      // 1. Cancel Geoman active drawing mode
      if (map && map.pm) {
        try {
          const activeShape = map.pm.Draw?.getActiveShape?.();
          if (activeShape || (typeof map.pm.globalDrawModeEnabled === 'function' && map.pm.globalDrawModeEnabled())) {
            map.pm.disableDraw();
            wasActive = true;
          }
        } catch (e) {
          console.warn('Error in map.pm.disableDraw:', e);
        }
      }

      // 2. Clear state flags
      if (window.activeLineType) {
        wasActive = true;
        window.activeLineType = null;
      }
      if (isDrawingWing) {
        wasActive = true;
        isDrawingWing = false;
      }
      if (isDrawingCourtyard) {
        wasActive = true;
        isDrawingCourtyard = false;
      }
      if (isAddingPin) {
        wasActive = true;
        isAddingPin = false;
      }
      if (isAddingEntrance) {
        wasActive = true;
        isAddingEntrance = false;
      }

      // 3. Reset button UI active highlights
      document.getElementById('btn-add-pin')?.classList.remove('active');
      document.getElementById('btn-add-entrance')?.classList.remove('active');
      document.getElementById('btn-draw-road')?.classList.remove('active');
      document.getElementById('btn-draw-path')?.classList.remove('active');

      // 4. Hide Action Bar
      hideDrawingHUD();

      if (wasActive && showNotice) {
        showToast('❌ Drawing cancelled');
      }
    }

    function undoLastDrawingVertex() {
      if (!map || !map.pm) return;
      try {
        const shape = map.pm.Draw?.getActiveShape?.();
        if (shape && map.pm.Draw[shape]) {
          const drawInstance = map.pm.Draw[shape];
          const count = drawInstance._markers?.length || 0;
          if (count <= 1) {
            cancelCurrentDrawing(true);
            return;
          }
          if (typeof drawInstance._removeLastVertex === 'function') {
            drawInstance._removeLastVertex();
            const newCount = drawInstance._markers?.length || 0;
            updateDrawingHUD(newCount);
            showToast(`↩️ Removed last dot (${newCount} remaining)`);
            return;
          }
        }
      } catch (e) {
        console.warn('undoLastDrawingVertex error:', e);
      }
      cancelCurrentDrawing(true);
    }

    function finishCurrentDrawing() {
      if (!map || !map.pm) return;
      try {
        const shape = map.pm.Draw?.getActiveShape?.();
        if (shape && map.pm.Draw[shape]) {
          const drawInstance = map.pm.Draw[shape];
          const count = drawInstance._markers?.length || 0;
          const isPoly = shape === 'Polygon' || shape === 'Cut' || isDrawingWing || isDrawingCourtyard;
          const minNeeded = isPoly ? 3 : 2;
          if (count < minNeeded) {
            showToast(`⚠️ Need at least ${minNeeded} dots to finish (currently ${count})`);
            return;
          }
          if (typeof drawInstance._finishShape === 'function') {
            drawInstance._finishShape();
            return;
          }
        }
      } catch (e) {
        console.warn('finishCurrentDrawing error:', e);
      }
    }
'''

    if 'function cancelCurrentDrawing' not in content:
        # Insert before startDrawRoad
        if 'function startDrawRoad()' in content:
            content = content.replace('function startDrawRoad()', js_helpers + '\n    function startDrawRoad()', 1)
        else:
            content = content.replace('function initMap()', js_helpers + '\n    function initMap()', 1)

    # 4. Update startDrawRoad, startDrawFootpath, etc. to use showDrawingHUD
    old_draw_road = '''    function startDrawRoad() {
      window.activeLineType = 'road';
      setSidebarTab('roads');
      map.pm.enableDraw('Line', { snappable: true, snapDistance: 15, cursorMarker: true });
      showToast('🛣️ Tracing Vehicular Road. Click points along asphalt, double-click to finish!');
    }'''

    new_draw_road = '''    function startDrawRoad() {
      cancelCurrentDrawing(false);
      window.activeLineType = 'road';
      setSidebarTab('roads');
      document.getElementById('btn-draw-road')?.classList.add('active');
      map.pm.enableDraw('Line', { snappable: true, snapDistance: 15, cursorMarker: true });
      showDrawingHUD('🛣️ Tracing Vehicular Road', 'Click points along asphalt center or curb. Double-click or click Finish when done.');
      showToast('🛣️ Tracing Vehicular Road. Click points, double-click to finish!');
    }'''

    if old_draw_road in content:
        content = content.replace(old_draw_road, new_draw_road, 1)

    old_draw_path = '''    function startDrawFootpath() {
      window.activeLineType = 'footpath';
      setSidebarTab('roads');
      map.pm.enableDraw('Line', { snappable: true, snapDistance: 15, cursorMarker: true });
      showToast('🚶 Tracing Pedestrian Footpath. Click points, double-click to finish!');
    }'''

    new_draw_path = '''    function startDrawFootpath() {
      cancelCurrentDrawing(false);
      window.activeLineType = 'footpath';
      setSidebarTab('roads');
      document.getElementById('btn-draw-path')?.classList.add('active');
      map.pm.enableDraw('Line', { snappable: true, snapDistance: 15, cursorMarker: true });
      showDrawingHUD('🚶 Tracing Pedestrian Footpath', 'Click points along walkway. Double-click or click Finish when done.');
      showToast('🚶 Tracing Pedestrian Footpath. Click points, double-click to finish!');
    }'''

    if old_draw_path in content:
        content = content.replace(old_draw_path, new_draw_path, 1)

    # Update startDrawWingForSelectedBuilding
    old_draw_wing_prefix = '''    function startDrawWingForSelectedBuilding() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      isDrawingWing = true;
      map.pm.enableDraw('Polygon','''
    new_draw_wing_prefix = '''    function startDrawWingForSelectedBuilding() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      cancelCurrentDrawing(false);
      isDrawingWing = true;
      showDrawingHUD(`✏️ Tracing Wing for "${b.shortName || b.name}"`, 'Click corners around building footprint. Double-click to close polygon.');
      map.pm.enableDraw('Polygon','''
    if old_draw_wing_prefix in content:
        content = content.replace(old_draw_wing_prefix, new_draw_wing_prefix, 1)

    # Update startDrawCourtyardForSelectedBuilding
    old_draw_court_prefix = '''    function startDrawCourtyardForSelectedBuilding() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      isDrawingCourtyard = true;
      map.pm.enableDraw('Polygon','''
    new_draw_court_prefix = '''    function startDrawCourtyardForSelectedBuilding() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      cancelCurrentDrawing(false);
      isDrawingCourtyard = true;
      showDrawingHUD(`🌿 Tracing Courtyard for "${b.shortName || b.name}"`, 'Click corners around courtyard boundary. Double-click to close.');
      map.pm.enableDraw('Polygon','''
    if old_draw_court_prefix in content:
        content = content.replace(old_draw_court_prefix, new_draw_court_prefix, 1)

    # Update startCutCourtyardHole
    old_cut_court_prefix = '''    function startCutCourtyardHole() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      map.pm.enableDraw('Cut','''
    new_cut_court_prefix = '''    function startCutCourtyardHole() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      cancelCurrentDrawing(false);
      showDrawingHUD(`✂️ Cutting Courtyard Hole for "${b.shortName || b.name}"`, 'Click points inside polygon to cut a hole. Double-click to punch hole.');
      map.pm.enableDraw('Cut','''
    if old_cut_court_prefix in content:
        content = content.replace(old_cut_court_prefix, new_cut_court_prefix, 1)

    # Update enableAddPinMode
    old_add_pin = '''    function enableAddPinMode() {
      isAddingPin = true;
      document.getElementById('btn-add-pin').classList.add('active');
      showToast('👆 Click anywhere on Google Satellite to place your new building pin!');
    }'''
    new_add_pin = '''    function enableAddPinMode() {
      cancelCurrentDrawing(false);
      isAddingPin = true;
      document.getElementById('btn-add-pin')?.classList.add('active');
      showDrawingHUD('📍 Placing New Building Pin', 'Click anywhere on satellite map to drop pin, or click Cancel.');
      showToast('👆 Click anywhere on Google Satellite to place your new building pin!');
    }'''
    if old_add_pin in content:
        content = content.replace(old_add_pin, new_add_pin, 1)

    # Update enableAddEntranceMode
    old_add_ent = '''    function enableAddEntranceMode() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      isAddingEntrance = true;
      const btn = document.getElementById('btn-add-entrance');
      if (btn) btn.classList.add('active');
      showToast(`🚪 Click on Google Satellite to place entrance door for "${b.shortName}"!`);
    }'''
    new_add_ent = '''    function enableAddEntranceMode() {
      const b = buildings.find(x => x.id === selectedBuildingId);
      if (!b) return;
      cancelCurrentDrawing(false);
      isAddingEntrance = true;
      const btn = document.getElementById('btn-add-entrance');
      if (btn) btn.classList.add('active');
      showDrawingHUD(`🚪 Placing Entrance for "${b.shortName || b.name}"`, 'Click on satellite map where entrance door is located.');
      showToast(`🚪 Click on Google Satellite to place entrance door for "${b.shortName}"!`);
    }'''
    if old_add_ent in content:
        content = content.replace(old_add_ent, new_add_ent, 1)

    # 5. Wire pm:drawstart, pm:vertexadded, pm:drawend, contextmenu in initMap()
    old_map_listeners = '''      map.on('mousemove', onMapMouseMove);
      map.on('click', onMapClick);
      map.on('pm:create', onGeomanVectorCreated);
      map.on('pm:remove', onGeomanVectorRemoved);'''

    new_map_listeners = '''      map.on('mousemove', onMapMouseMove);
      map.on('click', onMapClick);
      map.on('pm:create', onGeomanVectorCreated);
      map.on('pm:remove', onGeomanVectorRemoved);

      // Real-time drawing HUD & vertex tracking
      map.on('pm:drawstart', (e) => {
        let title = 'Drawing Mode';
        if (window.activeLineType === 'road') title = '🛣️ Tracing Vehicular Road';
        else if (window.activeLineType === 'footpath') title = '🚶 Tracing Pedestrian Footpath';
        else if (isDrawingWing) {
          const b = buildings.find(x => x.id === selectedBuildingId);
          title = `✏️ Tracing Wing for ${b?.shortName || 'Building'}`;
        } else if (isDrawingCourtyard) {
          const b = buildings.find(x => x.id === selectedBuildingId);
          title = `🌿 Tracing Courtyard for ${b?.shortName || 'Building'}`;
        }
        showDrawingHUD(title, 'Click map to place dots. Double-click or click Finish when done.');
      });

      map.on('pm:vertexadded', (e) => {
        const count = getActiveDrawingVertexCount();
        updateDrawingHUD(count);
      });

      map.on('pm:drawend', (e) => {
        hideDrawingHUD();
        document.getElementById('btn-draw-road')?.classList.remove('active');
        document.getElementById('btn-draw-path')?.classList.remove('active');
      });

      // Right-click on map cancels drawing immediately
      map.on('contextmenu', (e) => {
        if (isDrawingActive()) {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          cancelCurrentDrawing(true);
        }
      });'''

    if old_map_listeners in content:
        content = content.replace(old_map_listeners, new_map_listeners, 1)

    # 6. Update global keydown handler for Escape, Backspace, Delete, Ctrl+Z, Enter
    old_keydown_block = '''        const k = e.key.toLowerCase();
        if (e.key === 'Escape') {
          if (isAddingPin) {
            isAddingPin = false;
            document.getElementById('btn-add-pin')?.classList.remove('active');
            showToast('Cancelled building placement');
          }
          if (isAddingEntrance) {
            isAddingEntrance = false;
            document.getElementById('btn-add-entrance')?.classList.remove('active');
            showToast('Cancelled entrance placement');
          }
          if (isDrawingCourtyard) {
            isDrawingCourtyard = false;
            map.pm.disableDraw();
            showToast('Cancelled courtyard drawing');
          }
          if (isDrawingWing) {
            isDrawingWing = false;
            map.pm.disableDraw();
            showToast('Cancelled wing drawing');
          }
        }'''

    new_keydown_block = '''        const k = e.key.toLowerCase();
        if (e.key === 'Escape') {
          if (isDrawingActive()) {
            e.preventDefault();
            e.stopPropagation();
            cancelCurrentDrawing(true);
            return;
          }
          if (globalEditMode) {
            toggleGlobalEditMode();
            showToast('Exited vertex edit mode');
            return;
          }
        }

        // Backspace, Delete, or Ctrl+Z: Undo last placed dot
        if (e.key === 'Backspace' || e.key === 'Delete' || (e.ctrlKey && k === 'z')) {
          if (isDrawingActive() && map?.pm && map.pm.Draw?.getActiveShape?.()) {
            e.preventDefault();
            e.stopPropagation();
            undoLastDrawingVertex();
            return;
          }
        }

        // Enter: Finish shape
        if (e.key === 'Enter') {
          if (isDrawingActive() && map?.pm && map.pm.Draw?.getActiveShape?.()) {
            e.preventDefault();
            e.stopPropagation();
            finishCurrentDrawing();
            return;
          }
        }'''

    if old_keydown_block in content:
        content = content.replace(old_keydown_block, new_keydown_block, 1)

    # 7. Update onGeomanVectorCreated to hideDrawingHUD and clean buttons
    old_vector_created_road_finish = '''      saveRoadsToStorage();
      renderRoadsList();
      loadSelectedRoadIntoForm();
      updateGeometryCodeOutput();
      window.activeLineType = null;
      showToast(`✓ Traced ${layer.roadData.name}`);'''

    new_vector_created_road_finish = '''      saveRoadsToStorage();
      renderRoadsList();
      loadSelectedRoadIntoForm();
      updateGeometryCodeOutput();
      window.activeLineType = null;
      hideDrawingHUD();
      document.getElementById('btn-draw-road')?.classList.remove('active');
      document.getElementById('btn-draw-path')?.classList.remove('active');
      showToast(`✓ Traced ${layer.roadData.name}`);'''

    if old_vector_created_road_finish in content:
        content = content.replace(old_vector_created_road_finish, new_vector_created_road_finish, 1)

    # Also wing finish
    old_wing_finish = '''          saveBuildingsToStorage();
          updateJsonOutput();
          updateGeometryCodeOutput();
          showToast(`✓ Attached "${newPoly.name}" to ${b.shortName}!`);
        }
        isDrawingWing = false;
        return;'''

    new_wing_finish = '''          saveBuildingsToStorage();
          updateJsonOutput();
          updateGeometryCodeOutput();
          hideDrawingHUD();
          showToast(`✓ Attached "${newPoly.name}" to ${b.shortName}!`);
        }
        isDrawingWing = false;
        hideDrawingHUD();
        return;'''

    if old_wing_finish in content:
        content = content.replace(old_wing_finish, new_wing_finish, 1)

    # Also courtyard finish
    old_court_finish = '''          saveBuildingsToStorage();
          updateJsonOutput();
          updateGeometryCodeOutput();
          showToast(`🌿 Added "${newCourt.name}" to ${b.shortName}!`);
        }
        isDrawingCourtyard = false;
        return;'''

    new_court_finish = '''          saveBuildingsToStorage();
          updateJsonOutput();
          updateGeometryCodeOutput();
          hideDrawingHUD();
          showToast(`🌿 Added "${newCourt.name}" to ${b.shortName}!`);
        }
        isDrawingCourtyard = false;
        hideDrawingHUD();
        return;'''

    if old_court_finish in content:
        content = content.replace(old_court_finish, new_court_finish, 1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Successfully updated {file_path}")

for p in ['frontend/public/iiitnr_gis_studio.html', 'frontend/public/iiitnr_interactive_map_labeler.html']:
    update_gis_file(p)
