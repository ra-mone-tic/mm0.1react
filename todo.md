## Todo List

### Step 1: Architecture design and base environment
- [x] Create folders: /backend, /frontend, /data, /utils.
- [x] Initialize a simple HTTP server with FastAPI/Flask.
- [x] Implement base endpoints:
  - [x] GET / → serves the HTML page (map UI, in Russian),
  - [x] GET /health → API status check.
- [x] Comment on framework selection and project structure decisions.
- [x] Ensure single-command run (e.g., python app.py or uvicorn main:app --reload).

### Step 2: Map module (Tile Server client)
- [x] Create an HTML page with a container <div id="map"></div>.
- [x] Load Leaflet.js via CDN.
- [x] Initialize the map centered on Kaliningrad: [54.7104, 20.4522], reasonable zoom (e.g., 12).
- [x] Add a tile layer using a public OSM server: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png.
- [x] Keep the frontend minimal and independent.
- [x] Comment how the tile system works (z/x/y), note public tile usage limits/rate-limits, and outline a future tile caching/self-hosting plan.

### Step 3: Marker module
- [x] Backend:
  - [x] Create a SQLite model/table for markers: (id, latitude, longitude, title, description, created_at).
  - [x] Endpoints:
    - [x] GET /api/markers → return all markers as JSON.
    - [x] POST /api/markers → accept JSON { lat, lng, title, description? }, insert into DB.
    - [x] DELETE /api/markers/{id} → delete marker by id.
- [x] Frontend:
  - [x] Load markers from /api/markers and render with L.marker.
  - [x] Add a map.on(\'click\', ...) handler that POSTs to /api/markers to create a new marker and renders it immediately.
  - [x] Show a simple popup or form (in Russian) to input title (and optional description) when creating a marker.
- [x] Put DB logic into a separate module (e.g., database.py).
- [x] Comment SQL and the schema. All UI strings are Russian.

### Step 4: Reverse geocoding module
- [x] Data prep (Kaliningrad focus): Provide a script /utils/load_geodata.py that ingests a preprocessed dataset into SQLite. Prefer OSM extract for Kaliningrad Oblast (.osm.pbf → filtered to places/streets/POIs and exported to CSV/GeoJSON with Russian names). As a lightweight fallback, allow GeoNames RU-focused CSV (e.g., cities/towns), acknowledging coarser granularity.
- [x] Backend: Implement GET /api/reverse_geocode?lat=...&lng=....
- [x] Algorithm: Given (lat, lng), find the nearest relevant feature within ~50 km. Use Haversine distance or a bounding-box prefilter + distance sort.
- [x] Frontend: After creating a marker, call /api/reverse_geocode and update the marker popup with the Russian place name plus coordinates.
- [x] Thoroughly comment the search logic, accuracy, and limitations. Document data sources and preparation steps, including Russian naming.

### Step 5: Forward geocoding module
- [x] Backend: Implement GET /api/geocode?q=....
- [x] Algorithm: Query the places table for matches on Russian names (name_ru) using LIKE or SQLite FTS5 if available. Return JSON array of candidates with coordinates. Consider simple ranking (prefix match > substring, shorter distance to current map center, etc.).
- [x] Frontend: Add <input type="text" id="search" placeholder="Поиск по карте"> and a button. On click, call /api/geocode, render suggestions (autocomplete in Russian), and on selection, set map view + drop/flash a marker.
- [x] Comment search limitations (case, Cyrillic specifics, need for exact forms). Suggest future improvements (stemming, synonyms, typo tolerance; migration to PostGIS + Elasticsearch later).

### Final deliverable requirements:
- [ ] Fully working prototype: Provide ready-to-run files.
- [ ] Comments: Every significant block (functions, non-trivial logic, SQL) explains WHAT/WHY/HOW.
- [ ] Modularity: Split code into logical files/modules (e.g., app.py, database.py, geocoder.py, index.html, /utils scripts).
- [ ] Educational README.md: Explain architecture and trade-offs, current limitations (geocoding precision for Russian addresses, performance with larger datasets), and scaling paths (PostGIS migration, Elasticsearch for search, tile caching/self-hosted tiles, spatial indexes, bounding-box indices).
- [ ] Kaliningrad defaults & Russian UI: Default map view is Kaliningrad, Russia; all UI strings, examples, and data handling prioritize Russian language content.

