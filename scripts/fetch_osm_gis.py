import urllib.request
import urllib.parse
import json
import os

# IIIT Naya Raipur Bounding Box (S, W, N, E)
# Lat: 21.123 to 21.135, Lon: 81.760 to 81.772
BBOX = "21.123,81.760,21.135,81.772"

query = f"""
[out:json][timeout:30];
(
  way["highway"]({BBOX});
  way["building"]({BBOX});
  way["leisure"]({BBOX});
  way["amenity"]({BBOX});
  relation["building"]({BBOX});
  relation["amenity"]({BBOX});
);
out body;
>;
out skel qt;
"""

url = "https://overpass-api.de/api/interpreter"
data = urllib.parse.urlencode({'data': query}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'User-Agent': 'CampusGIS-IIITNR/1.0'})

print("Fetching OSM GIS data for IIIT Naya Raipur...")
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        osm_json = json.loads(resp.read().decode('utf-8'))
        
    out_dir = os.path.join(os.path.dirname(__file__), "..", "gis_data")
    os.makedirs(out_dir, exist_ok=True)
    
    raw_path = os.path.join(out_dir, "iiitnr_osm_raw.json")
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(osm_json, f, indent=2)
    print(f"Raw OSM elements: {len(osm_json.get('elements', []))} saved to {raw_path}")

    # Convert nodes to a lookup dict
    nodes = {}
    for el in osm_json.get("elements", []):
        if el["type"] == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])

    # Build GeoJSON Features
    features = []
    for el in osm_json.get("elements", []):
        if el["type"] == "way" and "nodes" in el:
            coords = [nodes[nid] for nid in el["nodes"] if nid in nodes]
            if len(coords) < 2:
                continue
            tags = el.get("tags", {})
            
            # Check if polygon (closed way and either building/leisure/amenity or area=yes)
            is_poly = (coords[0] == coords[-1]) and (
                "building" in tags or "leisure" in tags or "amenity" in tags or tags.get("area") == "yes"
            )
            
            geom_type = "Polygon" if is_poly else "LineString"
            geometry = {
                "type": geom_type,
                "coordinates": [coords] if is_poly else coords
            }
            
            features.append({
                "type": "Feature",
                "id": f"way/{el['id']}",
                "properties": {
                    "osm_id": el["id"],
                    **tags
                },
                "geometry": geometry
            })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    geojson_path = os.path.join(out_dir, "iiitnr_campus.geojson")
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)
    print(f"GeoJSON created: {len(features)} features saved to {geojson_path}")

except Exception as e:
    print(f"Error fetching OSM: {e}")
