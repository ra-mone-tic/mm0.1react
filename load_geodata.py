'''
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, '..', 'backend', 'markers.db')
GEONAMES_FILE = os.path.join(BASE_DIR, '..', 'data', 'RU.txt')

def load_geodata():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS geonames")
    cursor.execute("""
        CREATE TABLE geonames (
            geonameid INTEGER PRIMARY KEY,
            name TEXT,
            asciiname TEXT,
            alternatenames TEXT,
            latitude REAL,
            longitude REAL,
            feature_class TEXT,
            feature_code TEXT,
            country_code TEXT,
            cc2 TEXT,
            admin1_code TEXT,
            admin2_code TEXT,
            admin3_code TEXT,
            admin4_code TEXT,
            population INTEGER,
            elevation INTEGER,
            dem INTEGER,
            timezone TEXT,
            modification_date TEXT
        )
    """)
    conn.commit()

    kaliningrad_oblast_admin1_code = 'KGD' # This is based on ISO 3166-2:RU for Kaliningrad Oblast

    with open(GEONAMES_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 19:
                # Check if the entry is within Kaliningrad Oblast (admin1_code 'KGD')
                # and is a populated place (P) or an administrative division (A)
                if parts[8] == 'RU' and parts[10] == kaliningrad_oblast_admin1_code and (parts[6] == 'P' or parts[6] == 'A'):
                    try:
                        geonameid = int(parts[0])
                        name = parts[1]
                        asciiname = parts[2]
                        alternatenames = parts[3]
                        latitude = float(parts[4])
                        longitude = float(parts[5])
                        feature_class = parts[6]
                        feature_code = parts[7]
                        country_code = parts[8]
                        cc2 = parts[9]
                        admin1_code = parts[10]
                        admin2_code = parts[11]
                        admin3_code = parts[12]
                        admin4_code = parts[13]
                        population = int(parts[14]) if parts[14] else 0
                        elevation = int(parts[15]) if parts[15] else 0
                        dem = int(parts[16]) if parts[16] else 0
                        timezone = parts[17]
                        modification_date = parts[18]

                        cursor.execute("""
                            INSERT INTO geonames VALUES (
                                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                            )
                        """, (
                            geonameid, name, asciiname, alternatenames, latitude, longitude,
                            feature_class, feature_code, country_code, cc2, admin1_code,
                            admin2_code, admin3_code, admin4_code, population, elevation,
                            dem, timezone, modification_date
                        ))
                    except ValueError as e:
                        print(f"Skipping line due to data conversion error: {e} - {line.strip()}")
    conn.commit()
    conn.close()
    print("Geonames data loaded successfully.")

if __name__ == '__main__':
    load_geodata()
'''

