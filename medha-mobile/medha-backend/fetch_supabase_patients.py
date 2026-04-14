import requests

SUPABASE_URL = 'https://mnwhjlgjncmdcjewktuo.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2hqbGdqbmNtZGNqZXdrdHVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMwMTI5MCwiZXhwIjoyMDkwODc3MjkwfQ.K-XZs9RRGju-It-ojruLO2uPw5GEH5-IbXZ5ueTTnW8'

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

# List all tables in Supabase
print('=== Available Tables in Supabase ===')
response = requests.get(f'{SUPABASE_URL}/rest/v1/?apikey={SUPABASE_SERVICE_KEY}', headers=headers)
if response.status_code == 200:
    tables = response.json()
    for t in tables:
        print(f'  - {t}')
else:
    print(f'Error listing tables: {response.status_code}')
    print(response.text)

print()

# Try common table names for patients
possible_tables = ['patients', 'patient', 'medha_patients', 'users', 'auth_users']
for table in possible_tables:
    response = requests.get(f'{SUPABASE_URL}/rest/v1/{table}?select=*&limit=5', headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f'=== Table: {table} ({len(data)} rows) ===')
        for row in data:
            print(f'  {row}')
        print()
    else:
        print(f'Table {table}: Not found ({response.status_code})')
