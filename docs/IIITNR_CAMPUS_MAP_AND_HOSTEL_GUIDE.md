# IIIT Naya Raipur Campus Map, Hostels, Room Numbers & Student Residence System

**Institute:** Dr. SPM International Institute of Information Technology, Naya Raipur ([iiitnr.ac.in](https://www.iiitnr.ac.in/))  
**Location:** Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661 (`21.1284° N, 81.7661° E`)  
**Verification Status:** `56 / 56 pytest passed (100%)`

---

## 1. Overview of What Was Built & Upgraded

To replace generic placeholder data with **authentic IIIT Naya Raipur campus infrastructure**, the system now provides:

1. **Interactive IIIT Naya Raipur Campus Map (`frontend/src/components/CampusMapSelector.jsx`)**:
   - **Interactive SVG Master Plan** of the 50-acre Sector 24 campus showing clickable footprints for all 6 Residential Hostels (`BH-1`, `BH-2`, `BH-3`, `GH-1`, `GH-2`, `TH-1`) and 5 Academic/Amenity zones (`ACAD`, `KRC`, `SAC`, `MESS`, `SPORTS`), internal campus roads, and **Main Gate No. 1**.
   - **Live GPS Street & Satellite Map View** powered by OpenStreetMap centered on `21.1284° N, 81.7661° E` with direct Google Maps launch (`Plot No. 7, Sector 24, Atal Nagar`).
   - Clicking any building on the map selects it immediately and loads its specific wings, floors, rooms, and labs.

2. **Authentic IIIT Naya Raipur Hostels, Wings, Floors & Room Numbers (`frontend/src/data/iiitnrCampusData.js`)**:
   - **Ramanujan House (Boys Hostel 1 — `BH-1`)**: Wings A & B, Floors `G`, `1`, `2`, `3` (`Room G-01` to `G-24`, `Room 101` to `124`, `Room 201` to `224`, `Room 301` to `324`, plus `Corridor RO Water Cooler`, `Washroom & Shower Block`, `Common Room & TV Lounge`, `Indoor Badminton Court`, `Wi-Fi Ceiling Access Point`).
   - **Bhabha House (Boys Hostel 2 — `BH-2`)**: Wings A & B, Floors `G`, `1`, `2`, `3` (`Room G-01` to `324`, plus corridor utilities & TT Lounge).
   - **Bose House (Boys Hostel 3 — `BH-3`)**: Wings A & B, Floors `G`, `1`, `2`, `3` (`Room G-01` to `324`, plus Study Hall & common utilities).
   - **Raman House (Girls Hostel 1 — `GH-1`)**: Wings A & B, Floors `G`, `1`, `2`, `3` (`Room G-01` to `324`, dedicated Girls Mess & Badminton Court).
   - **Shabhari House (Girls Hostel 2 — `GH-2`)**: Wings A & B, Floors `G`, `1`, `2`, `3` (`Room G-01` to `324` & common utilities).
   - **Transit Hostel & Faculty Residences (`TH-1`)**: Visiting faculty suites (`Transit Suite G-01` to `206`, `Faculty Quarter Block A & B`).

3. **Authentic Academic Block, Labs, Library (KRC) & SAC/MPH Rooms**:
   - **Academic & Administrative Block (`ACAD`)**:
     - *Ground Floor*: `Smart E-Classroom E-101 (120-Seat AC)`, `Lecture Hall LH-1`, `Lecture Hall LH-2`, `AICTE IDEA Lab`, `Estate & Facilities Office (Room G-04)`, `Registrar Office`, `Directorate Secretariat`.
     - *1st Floor*: `Room 131C — Data Centre & Server NOC`, `Room 131E — Network Operations Center`, `Smart E-Classroom E-102 (120-Seat AC)`, `CSE Programming & Systems Lab 1 (Room 104)`, `Data Science & AI Research Lab (Room 108)`, `Cybersecurity Lab (Room 112)`, `Lecture Hall LH-3 & LH-4`.
     - *2nd Floor*: `VLSI & Microelectronics Lab (Room 202)`, `IoT, Robotics & Autonomous Systems Lab (Room 205)`, `Embedded Systems Lab (Room 208)`, `RF, Microwave & 5G Comm. Lab (Room 211)`, `Signal Processing Lab (Room 214)`, `Lecture Hall LH-5 & LH-6`.
     - *3rd Floor*: `Main Seminar & Conference Hall (Room 301)`, `PhD & M.Tech Research Scholars Bay (Room 305)`, `Incubation & Startup Cell (TIH)`, `Terrace Central HVAC & Solar Plant`.
   - **Knowledge Resource Centre (`KRC / Central Library`)**: Main Reading Hall, RFID Issue/Return Desk, Digital Library, Group Discussion Rooms `GD-1` & `GD-2`.
   - **Student Activity Centre (`SAC`) & Multi-Purpose Hall (`MPH`)**: Main Auditorium, Indoor Wooden Badminton Courts 1 & 2, Central Student Gymnasium, Table Tennis/Carrom/Chess Arena, Music & Coding Club Rooms.
   - **Central Mess Block, Night Canteen & Medical Dispensary (`MESS`)**.
   - **Sports Complex, Open-Air Amphitheater & 33/11kV Substation (`SPORTS`)**.

4. **End-to-End Student Hostel & Room Persistence (Supabase + Frontend)**:
   - **During Registration (`Register.jsx`)**: Students select their IIIT-NR Hostel (`Ramanujan`, `Bhabha`, `Bose`, `Raman`, `Shabhari`, `Transit`, or `Day Scholar`), Floor (`G`–`3`), Wing (`Wing A` / `Wing B`), and Room Number (`Room 101`–`324`), persisted directly to Supabase (`users.hostel_name` and `users.room_number`).
   - **On Student Dashboard (`StudentDashboard.jsx`)**: Students see their active Hostel & Room badge in the header (`🏠 Ramanujan House • Wing A, Room 204`), can click **`✏️ Change Hostel / Room`** to update their residence in Supabase via `PATCH /api/v1/auth/profile`, and can toggle **`🗺️ Explore IIIT-NR Map`** to view the interactive campus map and Estate/Engineering contacts (`Rakesh Kumar Mishra — Estate Officer`, `Ranjeet Singh Thakur — JE Electrical`, `Abir Bhattacharya — Sr. Network Engineer`, `Parvinder Singh — Network Engineer`).
   - **On Complaint Submission (`SubmitComplaint.jsx`)**:
     - Embeds the interactive `<CampusMapSelector />` at the top of the page.
     - Automatically pre-fills the student's saved Hostel & Room Number with a 1-click **`🏠 My Room`** button and a **`💾 Save as My Hostel Room`** action.
     - Provides structured dropdowns for **Building/Hostel**, **Floor Level**, **Hostel Wing**, and **Room Number / Lab / Corridor Utility** plus a custom spot input.

---

## 2. Summary of Changed & Added Files in the Archive

| File Path | Summary of Changes |
| :--- | :--- |
| `backend/app/models/user.py` | Added `hostel_name` (`VARCHAR(120)`) and `room_number` (`VARCHAR(60)`) columns to `User` ORM model. |
| `backend/app/schemas/user.py` | Added `hostel_name` and `room_number` to `RegisterRequest` and `UserResponse`; added `UserProfileUpdateRequest` schema. |
| `backend/app/services/user_service.py` | Added idempotent `ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel_name / room_number` migrations, updated `register_user` and `to_user_response`, added `update_user_profile()`, and seeded official IIIT-NR staff (`rakesh@iiitnr.edu.in`, `ranjeet@iiitnr.edu.in`, `abir@iiitnr.edu.in`, `parvinder@iiitnr.edu.in`). |
| `backend/app/api/v1/endpoints/auth.py` | Added `PATCH /api/v1/auth/profile` endpoint allowing authenticated students to update their hostel, room number, and phone number. |
| `backend/app/db/seed.py` | Added `hostel_name` and `room_number` schema migrations and authentic IIIT-NR staff records. |
| `backend/app/services/dispatch_engine.py` | Expanded `ZONE_AFFINITY_MAP` with authentic IIIT-NR hostel keywords (`ramanujan`, `bhabha`, `bose`, `raman`, `shabhari`, `transit`, `wing a`, `wing b`) and academic/lab keywords (`krc`, `idealab`, `vlsi`, `iot`, `131c`, `131e`, `e-101`, `e-102`, `sac`, `mph`). |
| `backend/tests/test_auth.py` | Added `test_iiitnr_hostel_room_persistence_and_zone_dispatch` (`56/56 passed`). |
| `frontend/src/data/iiitnrCampusData.js` | **NEW:** Complete dataset of IIIT Naya Raipur hostels, wings, floors, rooms (`G-01` to `324`), labs (`131C`, `131E`, `E-101`, `E-102`, `VLSI Lab`, `IDEA Lab`), GPS coordinates, and official Estate/Network contacts. |
| `frontend/src/components/CampusMapSelector.jsx` | **NEW:** Interactive SVG Master Plan of IIIT Naya Raipur + Live OpenStreetMap GPS view (`21.1284° N, 81.7661° E`) + quick hostel/building pills. |
| `frontend/src/api/auth.js` | Added `hostel_name` and `room_number` to `registerUser` and added `updateUserProfile(profileData)` calling `PATCH /api/v1/auth/profile`. |
| `frontend/src/context/AuthContext.jsx` | Added `updateProfile` method and automatic persistence of `hostel_name` and `room_number` across sessions. |
| `frontend/src/pages/Register.jsx` | Added IIIT-NR Hostel House, Floor, Wing, and Room Number selector to student registration. |
| `frontend/src/pages/StudentDashboard.jsx` | Added Hostel & Room badge in header, `Change Hostel / Room` modal, and expandable IIIT-NR Campus Map & Estate Contacts panel. |
| `frontend/src/pages/SubmitComplaint.jsx` | Integrated `<CampusMapSelector />`, structured Building/Floor/Wing/Room Number pickers, 1-click `My Room` auto-fill, and authentic IIIT-NR quick scenario templates. |
| `frontend/src/pages/Home.jsx` | Added interactive IIIT Naya Raipur Campus Map section, clickable Hostel Houses directory, and official IIIT-NR Estate/Electrical/IT authority contact cards. |
| `iiitnr_interactive_map_labeler.html` | **NEW:** Standalone visual campus map studio with Leaflet satellite view, drag-and-drop pins, room manager, blueprint upload, and 1-click JSON export. |
| `frontend/public/iiitnr_interactive_map_labeler.html` | Served publicly at `/iiitnr_interactive_map_labeler.html` for instant browser access during local dev or production. |

---

## 3. How to Update, Edit & Label the Campus Map

You have **three simple ways** to update or customize the campus map, hostel rooms, and building locations:

### Method 1: Directly In-App (No Coding Required)
1. Open the Complaint Submission page (`/submit`) or Student Dashboard (`/student-dashboard`).
2. On the campus map card, click the **`✏️ Edit Map Pins & Rooms`** button in the top right.
3. **Move existing buildings:** Click and drag any building marker to its exact physical position on the campus master plan.
4. **Add a new building or hostel:** Click anywhere on the map grid. A new pin appears instantly!
5. **Customize building details:** Click on any building in the editor panel to modify:
   - Full Building Name (e.g. *Ramanujan House*, *Bhabha House*, *New Girls Hostel*)
   - Short Map Label & Badge Code (e.g. *BH-1*, *GH-3*, *E-LAB*)
   - Category: `HOSTEL`, `ACADEMIC`, `AMENITY`, or `INFRASTRUCTURE`
   - Wings (comma-separated, e.g. `Wing A, Wing B, Wing C`)
   - Floors (comma-separated, e.g. `G, 1, 2, 3, 4`)
   - Rooms per Floor (auto-generates all room numbers e.g. `Room 101` to `Room 124`)
   - Custom Rooms / Labs override (e.g. `Room 131C, Robotics Lab, Server Room`)
6. **Upload Custom Map Image:** Click **`Upload Custom Image`** to load a custom CAD blueprint or aerial satellite photo as the canvas background.
7. Click **`💾 Save Changes`**. The updated map is persisted in `localStorage` and automatically updates all hostel selectors and room dropdowns across the entire application in real time!
8. **Export / Import JSON:** Click **`📋 Export / Import JSON`** to copy the complete layout JSON to share with teammates or paste an existing layout.

---

### Method 2: Standalone Visual Studio (`iiitnr_interactive_map_labeler.html`)
For detailed visual calibration against real GPS satellite imagery:
1. Open [`iiitnr_interactive_map_labeler.html`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/iiitnr_interactive_map_labeler.html) in your browser:
   - Double-click `iiitnr_interactive_map_labeler.html` in the project root, or
   - Visit `http://localhost:5173/iiitnr_interactive_map_labeler.html` while running the frontend dev server.
2. Choose between:
   - **`🛰️ Satellite View`** (Esri World Imagery satellite view of the IIIT-NR Atal Nagar campus).
   - **`🗺️ Street Map`** (OpenStreetMap street lines & boundaries).
   - **`📐 Custom Blueprint`** / **`🖼️ Upload Campus Map Image`**.
3. Click anywhere on the campus grounds to drop pins, drag pins to exact blocks, and configure hostel wings and room numbers.
4. Click **`📋 Copy Labeled JSON`** at the top right.
5. In the app's map, click **`📋 Export / Import JSON`**, paste the copied JSON, and click **`Apply & Save JSON`**.

---

### Method 3: Permanent Code Configuration (`iiitnrCampusData.js`)
If you want the changes to be permanent in the Git repository for all users without relying on browser storage:
1. Open [`frontend/src/data/iiitnrCampusData.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/data/iiitnrCampusData.js).
2. Locate `export const DEFAULT_IIITNR_BUILDINGS = [ ... ]`.
3. Add, edit, or adjust any building object. Each building has:
   ```javascript
   {
     id: 'ramanujan_bh1',
     name: 'Ramanujan House (Boys Hostel 1)',
     shortName: 'Ramanujan',
     code: 'BH-1',
     category: 'HOSTEL',
     type: 'Boys Residence Hall',
     floors: ['G', '1', '2', '3'],
     wings: ['Wing A', 'Wing B'],
     roomsPerFloor: 24,
     mapPin: { xPct: 22, yPct: 42, lat: 21.1298, lng: 81.7645, color: '#4f46e5', badge: 'BH-1' },
     gps: '21.1298° N, 81.7645° E',
     description: 'B.Tech Boys Hostel 1 with Wings A & B, TV lounge, and sports arena.',
   }
   ```
4. Run `npm run build` in `frontend/` to verify and deploy!
