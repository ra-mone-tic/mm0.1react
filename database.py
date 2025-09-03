import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'markers.db')

def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''''
            CREATE TABLE IF NOT EXISTS markers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''''')
        conn.commit()

def get_markers():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, latitude, longitude, title, description, created_at FROM markers')
        return [{'id': row[0], 'latitude': row[1], 'longitude': row[2], 'title': row[3], 'description': row[4], 'created_at': row[5]} for row in cursor.fetchall()]

def add_marker(latitude, longitude, title, description=None):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO markers (latitude, longitude, title, description) VALUES (?, ?, ?, ?)',
                       (latitude, longitude, title, description))
        conn.commit()
        return cursor.lastrowid

def delete_marker(marker_id):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM markers WHERE id = ?', (marker_id,))
        conn.commit()
        return cursor.rowcount > 0

# Initialize the database when the module is imported
init_db()


