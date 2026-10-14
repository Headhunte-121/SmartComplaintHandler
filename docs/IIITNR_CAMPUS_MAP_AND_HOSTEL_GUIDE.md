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
