from flask import Flask, render_template, request, jsonify
import database
import sqlite3
import math

app = Flask(__name__, static_folder=\'../frontend/static\', template_folder=\'../frontend/templates\')

@app.route(\'/\')
def index():
    return render_template(\'index.html\')

@app.route(\'/health\')
def health_check():
    return {\'status\': \'ok\'}

@app.route(\'/api/markers\', methods=[\'GET\', \'POST\'])
def markers():
    if request.method == \'GET\':
        return jsonify(database.get_markers())
    elif request.method == \'POST\':
        data = request.get_json()
        marker_id = database.add_marker(data[\'lat\'], data[\'lng\'], data[\'title\'], data.get(\'description\'))
        return jsonify({\'id\': marker_id, \'message\': \'Marker added successfully\'}), 201

@app.route(\'/api/markers/<int:marker_id>\', methods=[\'DELETE\'])
def delete_marker(marker_id):
    if database.delete_marker(marker_id):
        return jsonify({\'message\': \'Marker deleted successfully\'}), 200
    return jsonify({\'message\': \'Marker not found\'}), 404

@app.route(\'/api/reverse_geocode\')
def reverse_geocode():
    lat = float(request.args.get(\'lat\'))
    lng = float(request.args.get(\'lng\'))

    conn = sqlite3.connect(database.DATABASE)
    cursor = conn.cursor()

    # Haversine formula to calculate distance
    # The query is simplified for SQLite and does not use the Haversine formula directly
    # A bounding box is used to pre-filter results for performance
    lat_range = 0.5 # degrees
    lng_range = 0.5 # degrees

    cursor.execute(\"\"\"
        SELECT name, latitude, longitude
        FROM geonames
        WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
    \"\"\", (lat - lat_range, lat + lat_range, lng - lng_range, lng + lng_range))

    closest_place = None
    min_dist = float(\'inf\')

    for row in cursor.fetchall():
        name, place_lat, place_lng = row
        dist = math.sqrt((lat - place_lat)**2 + (lng - place_lng)**2)
        if dist < min_dist:
            min_dist = dist
            closest_place = name

    conn.close()

    if closest_place:
        return jsonify({\'name\': closest_place})
    return jsonify({\'name\': \'Unknown location\'}), 404

@app.route(\'/api/geocode\')
def geocode():
    query = request.args.get(\'q\', \'\')
    if not query:
        return jsonify([])

    conn = sqlite3.connect(database.DATABASE)
    cursor = conn.cursor()

    # Search for names using LIKE, prioritizing exact matches or starts-with
    # This is a simplified approach; for better performance with large datasets, consider SQLite FTS5
    cursor.execute("""
        SELECT name, latitude, longitude
        FROM geonames
        WHERE name LIKE ? OR alternatenames LIKE ?
        ORDER BY CASE
            WHEN name = ? THEN 1
            WHEN name LIKE ? || \'%\' THEN 2
            ELSE 3
        END
        LIMIT 10
    """, (query + \'%\', \'%\' + query + \'%\', query, query))

    results = []
    for row in cursor.fetchall():
        results.append({\'name\': row[0], \'latitude\': row[1], \'longitude\': row[2]})

    conn.close()
    return jsonify(results)

if __name__ == \'__main__\':
    database.init_db()
    app.run(debug=True, host=\'0.0.0.0\')


